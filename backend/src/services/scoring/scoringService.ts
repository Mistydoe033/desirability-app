import { env } from '../../config/env';
import { cityRepository } from '../../repositories/cityRepository';
import { cityRankCacheRepository } from '../../repositories/cityRankCacheRepository';
import { cacheService } from '../cache/cacheService';
import { redisKeys } from '../cache/redisKeys';
import { coastOrientationService } from '../coastOrientationService';
import { featureComputationService } from '../features/featureComputationService';
import { weatherService } from '../external/weatherService';
import { topCitiesService } from '../topCitiesService';
import {
  ActivityName,
  ActivityScoreResult,
  Coordinates,
  RankResult,
  ScoringContext,
  CityRecord
} from '../../types/types';
import { createEmptyFeatureProfile } from '../features/featureProfile';
import { scoringFactory } from './factory';
import { logger } from '../../utils/logger';
import { buildScoringDays } from './scoringDays';

class ScoringService {
  private readonly context = 'ScoringService';

  private findSurfActivity(result: RankResult): ActivityScoreResult | null {
    return result.activities.find((activity) => activity.activity === 'Surfing') ?? null;
  }

  private hasZeroMarineSurfPattern(surfing: ActivityScoreResult): boolean {
    const toNumber = (value: string | number): number | null =>
      typeof value === 'number' && Number.isFinite(value) ? value : null;

    const swell = surfing.week.factors.find((factor) => factor.name.startsWith('Swell height'));
    const wave = surfing.week.factors.find((factor) => factor.name.startsWith('Wave height'));
    const period = surfing.week.factors.find((factor) => factor.name.startsWith('Swell period'));

    const swellValue = swell ? toNumber(swell.value) : null;
    const waveValue = wave ? toNumber(wave.value) : null;
    const periodValue = period ? toNumber(period.value) : null;

    return Boolean(
      swell &&
      wave &&
      period &&
      swellValue !== null &&
      waveValue !== null &&
      periodValue !== null &&
      swellValue <= 0 &&
      waveValue <= 0 &&
      periodValue <= 0 &&
      surfing.week.score0to100 > 0
    );
  }

  private hasFlatSurfMismatch(surfing: ActivityScoreResult): boolean {
    const toNumber = (value: string | number): number | null =>
      typeof value === 'number' && Number.isFinite(value) ? value : null;

    const swell = surfing.week.factors.find((factor) => factor.name.startsWith('Swell height'));
    const wave = surfing.week.factors.find((factor) => factor.name.startsWith('Wave height'));
    const period = surfing.week.factors.find((factor) => factor.name.startsWith('Swell period'));

    const swellValue = swell ? toNumber(swell.value) : null;
    const waveValue = wave ? toNumber(wave.value) : null;
    const periodValue = period ? toNumber(period.value) : null;

    if (swellValue === null || waveValue === null || periodValue === null) {
      return false;
    }

    const nearFlat = Math.max(swellValue, waveValue) < 0.35 && periodValue < 5;
    return nearFlat && surfing.week.score0to100 > 0;
  }

  private hasInvalidInlandSurfScore(result: RankResult): boolean {
    const isInland = !result.coast || result.coast.source === 'inland' || result.coast.faceDeg === null;
    const surfing = this.findSurfActivity(result);
    if (!surfing) {
      return false;
    }

    if (this.hasZeroMarineSurfPattern(surfing)) {
      return true;
    }

    if (this.hasFlatSurfMismatch(surfing)) {
      return true;
    }

    if (!isInland) {
      return false;
    }

    if (surfing.week.score0to100 > 0) {
      return true;
    }

    return surfing.dayScores.some((day) => day.detail.score0to100 > 0);
  }

  private buildCityId(name: string, country?: string): string {
    const base = `${name}-${country ?? 'unknown'}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return base.length > 0 ? base : `city-${Date.now()}`;
  }

  private ensureCandidateCityRecord(
    geocoded: {
      name: string;
      country?: string;
      latitude: number;
      longitude: number;
      elevationM?: number | null;
    },
    existing: CityRecord | null
  ): CityRecord {
    const candidate: CityRecord = {
      id: existing?.id ?? this.buildCityId(geocoded.name, geocoded.country),
      name: geocoded.name,
      country: geocoded.country ?? existing?.country ?? 'Unknown',
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      elevationM: geocoded.elevationM ?? existing?.elevationM ?? null,
      features: existing?.features ?? createEmptyFeatureProfile(),
      isCandidate: true
    };

    cityRepository.upsertCity(candidate);
    return candidate;
  }

  private enqueueProfileRefresh(city: CityRecord, options?: { invalidateTopCities?: boolean }): void {
    void featureComputationService.computeAndPersistForCity(city)
      .then(async () => {
        if (options?.invalidateTopCities) {
          await topCitiesService.invalidateTopCitiesCache();
        }
      })
      .catch((error) => {
        logger.warn(this.context, 'Background city feature refresh failed', {
          city: city.name,
          cityId: city.id,
          error
        });
      });
  }

  async rankCity(city: string): Promise<RankResult> {
    const requestCacheKey = redisKeys.cityRank(city);
    const cached = await cacheService.getJSON<RankResult>(requestCacheKey);
    if (cached && !this.hasInvalidInlandSurfScore(cached)) {
      return cached;
    }
    if (cached) {
      await cacheService.delete(requestCacheKey);
    }

    const geocoded = await weatherService.geocodeCity(city);
    const canonicalCacheKey = redisKeys.cityRank(geocoded.name);
    if (canonicalCacheKey !== requestCacheKey) {
      const canonicalCached = await cacheService.getJSON<RankResult>(canonicalCacheKey);
      if (canonicalCached && !this.hasInvalidInlandSurfScore(canonicalCached)) {
        await cacheService.setJSON(requestCacheKey, canonicalCached, env.CACHE_TTL_MINUTES);
        return canonicalCached;
      }
      if (canonicalCached) {
        await cacheService.delete(canonicalCacheKey);
      }
    }

    const existingCity = cityRepository.findByName(geocoded.name) ?? cityRepository.findByName(city);
    const isNewCity = existingCity === null;
    const cityRecord = this.ensureCandidateCityRecord(geocoded, existingCity);

    const dbCached = cityRankCacheRepository.findByCityId(cityRecord.id);
    if (dbCached && !this.hasInvalidInlandSurfScore(dbCached.result)) {
      await cacheService.setJSON(requestCacheKey, dbCached.result, env.CACHE_TTL_MINUTES);
      if (canonicalCacheKey !== requestCacheKey) {
        await cacheService.setJSON(canonicalCacheKey, dbCached.result, env.CACHE_TTL_MINUTES);
      }
      return dbCached.result;
    }

    const coast = await coastOrientationService.getCityOrientation(cityRecord);

    const weather = await weatherService.getWeatherByCoordinates(
      {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude
      },
      geocoded.name,
      cityRecord?.elevationM ?? geocoded.elevationM ?? null
    );

    const scoringDays = buildScoringDays(
      weather.forecastDays,
      weather.marineDaily,
      cityRecord?.elevationM ?? geocoded.elevationM ?? weather.elevationM ?? null
    );

    const activities: ActivityScoreResult[] = scoringFactory.listActivities().map((activity) => {
      const scorer = scoringFactory.getScorer(activity);
      const context: ScoringContext = {
        coastFaceDeg: activity === 'Surfing' ? coast?.faceDeg ?? null : null
      };
      return scorer.scoreWeek(scoringDays, context);
    });

    const result: RankResult = {
      location: weather.location,
      latitude: weather.latitude,
      longitude: weather.longitude,
      forecast: weather.forecastDays,
      coast,
      activities
    };

    if (coast?.source === 'coastline-loading') {
      logger.info(this.context, 'Skipping rank cache write while coastline dataset is warming up', {
        city: cityRecord.name,
        cityId: cityRecord.id
      });
      return result;
    }

    cityRankCacheRepository.upsert(cityRecord.id, result, new Date().toISOString());

    await cacheService.setJSON(requestCacheKey, result, env.CACHE_TTL_MINUTES);
    if (canonicalCacheKey !== requestCacheKey) {
      await cacheService.setJSON(canonicalCacheKey, result, env.CACHE_TTL_MINUTES);
    }
    if (isNewCity) {
      this.enqueueProfileRefresh(cityRecord, { invalidateTopCities: true });
    }
    return result;
  }

  async rankByCoordinates(coordinates: Coordinates, locationName?: string): Promise<RankResult> {
    const coast = await coastOrientationService.getOrientationForPoint(coordinates);
    const weather = await weatherService.getWeatherByCoordinates(coordinates, locationName);
    const scoringDays = buildScoringDays(weather.forecastDays, weather.marineDaily, weather.elevationM ?? null);

    const activities: ActivityScoreResult[] = scoringFactory.listActivities().map((activity) => {
      const scorer = scoringFactory.getScorer(activity);
      const context: ScoringContext = {
        coastFaceDeg: activity === 'Surfing' ? coast?.faceDeg ?? null : null
      };
      return scorer.scoreWeek(scoringDays, context);
    });

    return {
      location: weather.location,
      latitude: weather.latitude,
      longitude: weather.longitude,
      forecast: weather.forecastDays,
      coast,
      activities
    };
  }

  async scoreSurfSpot(
    coordinates: Coordinates,
    locationName?: string,
    coastFaceDegOverride?: number | null
  ): Promise<ActivityScoreResult> {
    return this.scoreActivityAtCoordinates('Surfing', coordinates, locationName, coastFaceDegOverride);
  }

  async scoreActivityAtCoordinates(
    activity: ActivityName,
    coordinates: Coordinates,
    locationName?: string,
    coastFaceDegOverride?: number | null
  ): Promise<ActivityScoreResult> {
    const weather = await weatherService.getWeatherByCoordinates(coordinates, locationName);
    const coast = coastFaceDegOverride === undefined || coastFaceDegOverride === null
      ? await coastOrientationService.getOrientationForPoint(coordinates)
      : null;
    const scoringDays = buildScoringDays(weather.forecastDays, weather.marineDaily, weather.elevationM ?? null);

    const scorer = scoringFactory.getScorer(activity);
    const context: ScoringContext = {
      coastFaceDeg: activity === 'Surfing'
        ? coastFaceDegOverride ?? coast?.faceDeg ?? null
        : null
    };

    return scorer.scoreWeek(scoringDays, context);
  }

  async scoreActivityForCity(activity: ActivityName, city: CityRecord): Promise<ActivityScoreResult> {
    const weather = await weatherService.getWeatherByCoordinates(
      { latitude: city.latitude, longitude: city.longitude },
      city.name,
      city.elevationM
    );

    const coast = activity === 'Surfing'
      ? await coastOrientationService.getCityOrientation(city)
      : null;

    const scoringDays = buildScoringDays(weather.forecastDays, weather.marineDaily, city.elevationM);
    const scorer = scoringFactory.getScorer(activity);

    return scorer.scoreWeek(scoringDays, {
      coastFaceDeg: activity === 'Surfing' ? coast?.faceDeg ?? null : null
    });
  }
}

export const scoringService = new ScoringService();
