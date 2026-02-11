import pLimit from 'p-limit';
import { FEATURE_ALGORITHM } from '../../constants/constants';
import { env } from '../../config/env';
import { cityRepository } from '../../repositories/cityRepository';
import { CityFeatureProfile, CityRecord } from '../../types/types';
import { ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { cacheService } from '../cache/cacheService';
import { redisKeys } from '../cache/redisKeys';
import { coastOrientationService } from '../coastOrientationService';
import { climateSummaryService } from './climateSummaryService';
import { featureScoringService } from './featureScoringService';
import { createEmptyFeatureProfile, sanitizeCityFeatureProfile } from './featureProfile';
import { poiSummaryService } from './poiSummaryService';
import { weatherService } from '../external/weatherService';

const context = 'FeatureComputationService';

class FeatureComputationService {
  private buildCityId(name: string, country?: string): string {
    const base = `${name}-${country ?? 'unknown'}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return base.length > 0 ? base : `city-${Date.now()}`;
  }

  private async resolveOrCreateCityByName(cityName: string): Promise<CityRecord> {
    const existing = cityRepository.findByName(cityName);
    if (existing) {
      return existing;
    }

    const geocoded = await weatherService.geocodeCity(cityName);
    const candidate: CityRecord = {
      id: this.buildCityId(geocoded.name, geocoded.country),
      name: geocoded.name,
      country: geocoded.country ?? 'Unknown',
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      elevationM: geocoded.elevationM ?? null,
      features: createEmptyFeatureProfile(),
      isCandidate: true
    };

    cityRepository.upsertCity(candidate);
    return candidate;
  }

  async getCityFeatureProfileByName(cityName: string, options?: { recompute?: boolean }): Promise<{ city: CityRecord; features: CityFeatureProfile }> {
    const city = await this.resolveOrCreateCityByName(cityName).catch(() => null);
    if (!city) {
      throw new ValidationError(`City not found in SQLite or geocoder: ${cityName}`);
    }

    if (options?.recompute) {
      const recomputed = await this.computeAndPersistForCity(city);
      return {
        city,
        features: recomputed.profile
      };
    }

    const cacheKey = redisKeys.cityFeatures(city.id);
    const cached = await cacheService.getJSON<CityFeatureProfile>(cacheKey);
    if (cached?.algorithm_version === FEATURE_ALGORITHM.VERSION) {
      return {
        city,
        features: cached
      };
    }

    if (cached && cached.algorithm_version !== FEATURE_ALGORITHM.VERSION) {
      await cacheService.delete(cacheKey);
    }

    if (city.features.algorithm_version !== FEATURE_ALGORITHM.VERSION) {
      const recomputed = await this.computeAndPersistForCity(city);
      return {
        city,
        features: recomputed.profile
      };
    }

    await cacheService.setJSON(cacheKey, city.features, env.PRECOMPUTE_CACHE_TTL_MINUTES);

    return {
      city,
      features: city.features
    };
  }

  async listCandidateCityFeatures(limit = 50): Promise<Array<{ city: CityRecord; features: CityFeatureProfile }>> {
    const cities = cityRepository.listCandidateCities(limit);

    return cities.map((city) => ({
      city,
      features: city.features
    }));
  }

  async computeAndPersistForCity(city: CityRecord): Promise<{ profile: CityFeatureProfile; coast: { faceDeg: number | null; nearestDistanceKm?: number; segmentCount?: number; source: string } | null }> {
    const coast = await coastOrientationService.getCityOrientation(city);
    const weatherSummary = await climateSummaryService.getCityWeatherSummary(city);
    const poiSummary = await poiSummaryService.getCityPoiSummary(city);

    const profile = sanitizeCityFeatureProfile(featureScoringService.computeCityFeatureProfile({
      city,
      coast,
      weatherSummary,
      poiSummary
    }));

    cityRepository.updateFeatureProfile(city.id, profile);
    await cacheService.delete(redisKeys.cityFeatures(city.id));

    return {
      profile,
      coast: coast
        ? {
            faceDeg: coast.faceDeg,
            nearestDistanceKm: coast.nearestDistanceKm,
            segmentCount: coast.segmentCount,
            source: coast.source
          }
        : null
    };
  }

  async computeForCandidates(limit?: number): Promise<{
    totalRows: number;
    processedRows: number;
    failedRows: number;
    durationMs: number;
    surfCoastlineHits: number;
    surfCoastlineFallbacks: number;
  }> {
    const startedAt = Date.now();
    const cities = typeof limit === 'number'
      ? cityRepository.listCandidateCities(limit)
      : cityRepository.listAllCandidateCities();
    const limiter = pLimit(env.PRECOMPUTE_CONCURRENCY_LIMIT);

    const results = await Promise.all(
      cities.map((city) =>
        limiter(async () => {
          try {
            const computed = await this.computeAndPersistForCity(city);
            logger.info(context, 'City feature profile computed', {
              cityId: city.id,
              cityName: city.name,
              selectedFeatures: computed.profile.selectedFeatures,
              scoresByFeature: computed.profile.scoresByFeature,
              surfing: {
                score0to100: computed.profile.scoresByFeature.Surfing,
                nearestDistanceKm: computed.coast?.nearestDistanceKm ?? null,
                coastlineBearingDeg: computed.coast?.faceDeg !== null && computed.coast?.faceDeg !== undefined
                  ? Number((((computed.coast.faceDeg - 90) + 360) % 360).toFixed(2))
                  : null,
                coastlineNormalDeg: computed.coast?.faceDeg ?? null,
                candidateCount: computed.coast?.segmentCount ?? 0,
                source: computed.coast?.source ?? 'missing'
              }
            });

            return {
              ok: true as const,
              coast: computed.coast
            };
          } catch (error) {
            const normalizedError = error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  code: (error as { code?: string }).code
                }
              : error;

            logger.warn(context, 'Failed to compute features for city', {
              cityId: city.id,
              cityName: city.name,
              error: normalizedError
            });

            return {
              ok: false as const
            };
          }
        })
      )
    );

    const processedRows = results.filter((result) => result.ok).length;
    const failedRows = results.length - processedRows;
    const surfCoastlineHits = results.filter(
      (result) =>
        result.ok &&
        result.coast !== null &&
        result.coast.source !== 'inland' &&
        result.coast.faceDeg !== null
    ).length;
    const surfCoastlineFallbacks = processedRows - surfCoastlineHits;

    return {
      totalRows: cities.length,
      processedRows,
      failedRows,
      durationMs: Date.now() - startedAt,
      surfCoastlineHits,
      surfCoastlineFallbacks
    };
  }
}

export const featureComputationService = new FeatureComputationService();
