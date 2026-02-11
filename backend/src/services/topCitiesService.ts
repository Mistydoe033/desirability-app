import { env } from '../config/env';
import { CLIMATE, FEATURE_ALGORITHM } from '../constants/constants';
import pLimit from 'p-limit';
import { cityRepository } from '../repositories/cityRepository';
import { cacheService } from './cache/cacheService';
import { redisKeys } from './cache/redisKeys';
import { scoringFactory } from './scoring/factory';
import { featureComputationService } from './features/featureComputationService';
import { weatherService } from './external/weatherService';
import { coastOrientationService } from './coastOrientationService';
import { buildScoringDays } from './scoring/scoringDays';
import { cityWeatherSummaryRepository } from '../repositories/cityWeatherSummaryRepository';
import { cityRankCacheRepository } from '../repositories/cityRankCacheRepository';
import { ActivityName, TopCityActivityScore, TopCityResult } from '../types/types';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

class TopCitiesService {
  private readonly context = 'TopCitiesService';

  private clampScore(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  }

  private isSkiingEligible(
    climateSignals?: {
      winterMeanTempC: number;
      snowfallDayPct: number;
      freezingDayPct: number;
      skiViableDayPct: number;
    }
  ): boolean {
    if (!climateSignals) {
      return false;
    }

    const { winterMeanTempC, snowfallDayPct, freezingDayPct, skiViableDayPct } = climateSignals;
    const hasSignalSet = [winterMeanTempC, snowfallDayPct, freezingDayPct, skiViableDayPct].every(Number.isFinite);
    if (!hasSignalSet) {
      return false;
    }

    const hasSnowSignal = snowfallDayPct > 0 || skiViableDayPct > 0;
    if (!hasSnowSignal) {
      return false;
    }

    return snowfallDayPct >= 6 || freezingDayPct >= 20 || skiViableDayPct >= 8;
  }

  private isOlderThanDays(iso: string | undefined, days: number): boolean {
    if (!iso) {
      return true;
    }

    const parsed = Date.parse(iso);
    if (!Number.isFinite(parsed)) {
      return true;
    }

    const ageDays = (Date.now() - parsed) / (1000 * 60 * 60 * 24);
    return ageDays > days;
  }

  private needsAnnualFeatureRefresh(candidates: ReturnType<typeof cityRepository.listAllCandidateCities>): boolean {
    return candidates.some((city) => {
      const weatherSummary = cityWeatherSummaryRepository.findByCityId(city.id);
      if (!weatherSummary) {
        return true;
      }

      if (this.isOlderThanDays(weatherSummary.computedAt, CLIMATE.SUMMARY_STALE_AFTER_DAYS)) {
        return true;
      }

      if (city.features.algorithm_version !== FEATURE_ALGORITHM.VERSION) {
        return true;
      }

      if (this.isOlderThanDays(city.features.computed_at, CLIMATE.SUMMARY_STALE_AFTER_DAYS)) {
        return true;
      }

      return false;
    });
  }

  private async ensureAnnualFeatureProfiles(): Promise<void> {
    const candidates = cityRepository.listAllCandidateCities();
    if (!this.needsAnnualFeatureRefresh(candidates)) {
      return;
    }

    logger.info(this.context, 'Refreshing annual feature profiles from historical-backed summaries', {
      candidates: candidates.length
    });
    await featureComputationService.computeForCandidates();
  }

  private deriveWeeklyScore(cityId: string, activity: ActivityName): number | null {
    const cachedRank = cityRankCacheRepository.findByCityId(cityId);
    if (!cachedRank) {
      return null;
    }

    const activityResult = cachedRank.result.activities.find((item) => item.activity === activity);
    if (!activityResult) {
      return null;
    }

    return Number(activityResult.week.score0to100.toFixed(1));
  }

  private sortByYearlyScore(cities: TopCityResult[]): TopCityResult[] {
    return [...cities].sort((left, right) => right.yearlyScore - left.yearlyScore);
  }

  private async deriveWeeklyScoreFromForecast(city: TopCityResult, activity: ActivityName): Promise<number> {
    const cachedWeeklyScore = this.deriveWeeklyScore(city.id, activity);
    if (cachedWeeklyScore !== null) {
      return cachedWeeklyScore;
    }

    try {
      const weather = await weatherService.getWeatherByCoordinates(
        {
          latitude: city.latitude,
          longitude: city.longitude
        },
        city.name,
        city.elevationM
      );
      const scoringDays = buildScoringDays(weather.forecastDays, weather.marineDaily, city.elevationM);
      const scorer = scoringFactory.getScorer(activity);
      const coast = activity === 'Surfing'
        ? await coastOrientationService.getOrientationForPoint({
            latitude: city.latitude,
            longitude: city.longitude
          })
        : null;

      const weeklyActivityScore = scorer.scoreWeek(scoringDays, {
        coastFaceDeg: activity === 'Surfing' ? coast?.faceDeg ?? null : null
      });

      return Number(weeklyActivityScore.week.score0to100.toFixed(1));
    } catch (error) {
      logger.warn(this.context, 'Failed to derive weekly top-city score from forecast data', {
        activity,
        cityId: city.id,
        city: city.name,
        error
      });
      return city.yearlyScore;
    }
  }

  private async hydrateWeeklyScores(activity: ActivityName, cities: TopCityResult[]): Promise<TopCityResult[]> {
    const limit = pLimit(Math.max(1, Math.min(env.API_CONCURRENCY_LIMIT, 4)));
    const hydrated = await Promise.all(
      cities.map((city) => limit(async () => {
        const weeklyScore = await this.deriveWeeklyScoreFromForecast(city, activity);
        return {
          ...city,
          weeklyScore
        };
      }))
    );

    return this.sortByYearlyScore(hydrated);
  }

  private deriveActivityScore(
    city: ReturnType<typeof cityRepository.listAllCandidateCities>[number],
    activity: ActivityName,
    climateSignals?: {
      winterMeanTempC: number;
      snowfallDayPct: number;
      freezingDayPct: number;
      skiViableDayPct: number;
    }
  ): number {
    const rawScore = city.features.scoresByFeature[activity];
    let score = this.clampScore(Number.isFinite(rawScore) ? rawScore : 0);

    if (activity !== 'Skiing') {
      return Number(score.toFixed(1));
    }

    const winterMeanTempC = climateSignals?.winterMeanTempC ?? Number.NaN;
    const snowfallDayPct = climateSignals?.snowfallDayPct ?? Number.NaN;
    const freezingDayPct = climateSignals?.freezingDayPct ?? Number.NaN;
    const skiViableDayPct = climateSignals?.skiViableDayPct ?? Number.NaN;
    const elevationM = city.elevationM ?? 0;

    const hasSignalSet = [winterMeanTempC, snowfallDayPct, freezingDayPct, skiViableDayPct].every(Number.isFinite);
    const climateGate = this.isSkiingEligible(climateSignals);

    if (!climateGate) {
      return 0;
    }

    if (hasSignalSet && elevationM >= 450 && elevationM < 900 && winterMeanTempC <= 4 && climateGate) {
      const climateSupport = this.clampScore(snowfallDayPct * 1.8 + freezingDayPct * 0.9 + skiViableDayPct * 1.2);
      const gatewayLift = Math.max(6, Math.min(14, (900 - elevationM) / 35));
      const gatewayAdjustedScore = score * 0.55 + climateSupport * 0.35 + gatewayLift;
      score = Math.max(score, gatewayAdjustedScore);
    }

    return Number(score.toFixed(1));
  }

  private buildActivityScores(
    city: ReturnType<typeof cityRepository.listAllCandidateCities>[number],
    climateSignals?: {
      winterMeanTempC: number;
      snowfallDayPct: number;
      freezingDayPct: number;
      skiViableDayPct: number;
    }
  ): TopCityActivityScore[] {
    return scoringFactory
      .listActivities()
      .map((activity) => ({
        activity,
        score0to100: this.deriveActivityScore(city, activity, climateSignals)
      }))
      .filter((item) => item.score0to100 > 0)
      .sort((left, right) => right.score0to100 - left.score0to100);
  }

  private buildDisplayTags(activity: ActivityName, scores: TopCityActivityScore[]): TopCityActivityScore[] {
    const selected = scores.find((item) => item.activity === activity) ?? {
      activity,
      score0to100: 0
    };

    const strongMatches = scores.filter((item) => item.score0to100 >= 60);

    if (!strongMatches.some((item) => item.activity === activity) && selected.score0to100 > 0) {
      strongMatches.unshift(selected);
    }

    if (strongMatches.length === 0 && selected.score0to100 > 0) {
      return [selected];
    }

    return Array.from(new Map(strongMatches.map((item) => [item.activity, item])).values()).slice(0, 4);
  }

  async getTopCities(activity: string, limit = 12): Promise<TopCityResult[]> {
    if (!scoringFactory.isSupportedActivity(activity)) {
      throw new ValidationError(`Unsupported activity: ${activity}`);
    }

    const [precomputeBusy, featureComputeBusy] = await Promise.all([
      cacheService.getFlag(redisKeys.precomputeLock()),
      cacheService.getFlag(redisKeys.featureComputeLock())
    ]);
    const bypassCache = precomputeBusy === true || featureComputeBusy === true;

    const cacheKey = redisKeys.topCities(activity);
    const cached = bypassCache ? null : await cacheService.getJSON<TopCityResult[]>(cacheKey);
    if (!bypassCache && cached && cached.length > 0) {
      return this.sortByYearlyScore(cached).slice(0, limit);
    }

    if (!precomputeBusy && !featureComputeBusy) {
      try {
        await this.ensureAnnualFeatureProfiles();
      } catch (error) {
        logger.warn(this.context, 'Failed to refresh annual feature profiles before top-cities ranking', {
          activity,
          error
        });
      }
    }

    let computed = this.computeTopCities(activity, env.PRECOMPUTE_TOP_CITIES_LIMIT);

    if (computed.length === 0) {
      try {
        await featureComputationService.computeForCandidates();
        computed = this.computeTopCities(activity, env.PRECOMPUTE_TOP_CITIES_LIMIT);
      } catch (error) {
        logger.warn(this.context, 'Failed to backfill top-cities from feature computation', {
          activity,
          error
        });
      }
    }

    computed = await this.hydrateWeeklyScores(activity, computed);

    await cacheService.setJSON(cacheKey, computed, env.PRECOMPUTE_CACHE_TTL_MINUTES);
    return this.sortByYearlyScore(computed).slice(0, limit);
  }

  async precomputeAllActivities(limit = env.PRECOMPUTE_TOP_CITIES_LIMIT): Promise<Record<ActivityName, TopCityResult[]>> {
    const result = {} as Record<ActivityName, TopCityResult[]>;

    try {
      await this.ensureAnnualFeatureProfiles();
    } catch (error) {
      logger.warn(this.context, 'Failed to refresh annual feature profiles before precompute run', { error });
    }

    for (const activity of scoringFactory.listActivities()) {
      const cities = await this.hydrateWeeklyScores(activity, this.computeTopCities(activity, limit));
      await cacheService.setJSON(redisKeys.topCities(activity), cities, env.PRECOMPUTE_CACHE_TTL_MINUTES);
      result[activity] = cities;
    }

    return result;
  }

  async invalidateTopCitiesCache(activity?: ActivityName): Promise<void> {
    if (activity) {
      await cacheService.delete(redisKeys.topCities(activity));
      return;
    }

    await cacheService.scanDelete(redisKeys.topCitiesPattern());
  }

  private computeTopCities(activity: ActivityName, limit: number): TopCityResult[] {
    const candidates = cityRepository.listAllCandidateCities();
    const scored = candidates
      .map((city) => {
        const climateSummary = cityWeatherSummaryRepository.findByCityId(city.id)?.summary;
        const climateSignals = climateSummary
          ? {
              winterMeanTempC: climateSummary.winterMeanTempC,
              snowfallDayPct: climateSummary.snowfallDayPct,
              freezingDayPct: climateSummary.freezingDayPct,
              skiViableDayPct: climateSummary.skiViableDayPct
            }
          : undefined;
        const activityScores = this.buildActivityScores(city, climateSignals);
        const selectedScore = activityScores.find((item) => item.activity === activity)?.score0to100 ?? 0;
        const yearlyScore = Number(selectedScore.toFixed(1));
        const weeklyScore = this.deriveWeeklyScore(city.id, activity) ?? yearlyScore;

        return {
          selectedScore,
          city: {
            id: city.id,
            name: city.name,
            country: city.country,
            latitude: city.latitude,
            longitude: city.longitude,
            elevationM: city.elevationM,
            features: city.features.selectedFeatures,
            rating: Number(((selectedScore / 100) * 5).toFixed(2)),
            weeklyScore,
            yearlyScore,
            activities: this.buildDisplayTags(activity, activityScores)
          } as TopCityResult
        };
      })
      .filter((item) => item.selectedScore > 0)
      .sort((left, right) => right.selectedScore - left.selectedScore);

    return scored
      .slice(0, limit)
      .map((item) => item.city);
  }
}

export const topCitiesService = new TopCitiesService();
