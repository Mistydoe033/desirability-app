import { CLIMATE, FEATURE_ALGORITHM } from '../../constants/constants';
import { env } from '../../config/env';
import { cityWeatherSummaryRepository } from '../../repositories/cityWeatherSummaryRepository';
import { CityRecord, CityWeatherSummary, ClimateSummary, ForecastDay } from '../../types/types';
import { cacheService } from '../cache/cacheService';
import { redisKeys } from '../cache/redisKeys';
import { weatherService } from '../external/weatherService';

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function monthByHemisphere(latitude: number): {
  winter: number[];
  spring: number[];
  summer: number[];
  autumn: number[];
} {
  const northern = {
    winter: [12, 1, 2],
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    autumn: [9, 10, 11]
  };

  if (latitude >= 0) {
    return northern;
  }

  return {
    winter: northern.summer,
    spring: northern.autumn,
    summer: northern.winter,
    autumn: northern.spring
  };
}

function pct(days: ForecastDay[], predicate: (day: ForecastDay) => boolean): number {
  if (days.length === 0) {
    return 0;
  }

  const matched = days.filter(predicate).length;
  return Number(((matched / days.length) * 100).toFixed(2));
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeSeason(days: ForecastDay[]): {
  meanTempC: number;
  precipitationDayPct: number;
  highWindDayPct: number;
  pleasantDayPct: number;
} {
  const meanTempC = mean(days.map((day) => (day.tempCMax + day.tempCMin) / 2));

  return {
    meanTempC: Number(meanTempC.toFixed(2)),
    precipitationDayPct: pct(days, (day) => day.precipitationMm >= 1),
    highWindDayPct: pct(days, (day) => day.windSpeedMps >= 10),
    pleasantDayPct: pct(
      days,
      (day) =>
        day.tempCMax >= 12 &&
        day.tempCMax <= 27 &&
        day.precipitationMm < 3 &&
        day.windSpeedMps < 8 &&
        (day.visibilityKm ?? 10) >= 8 &&
        (day.humidityPct ?? 55) >= 30 &&
        (day.humidityPct ?? 55) <= 80
    )
  };
}

function summarizeClimate(days: ForecastDay[], latitude: number): ClimateSummary {
  const seasons = monthByHemisphere(latitude);

  const winterDays = days.filter((day) => seasons.winter.includes(Number(day.date.slice(5, 7))));
  const springDays = days.filter((day) => seasons.spring.includes(Number(day.date.slice(5, 7))));
  const summerDays = days.filter((day) => seasons.summer.includes(Number(day.date.slice(5, 7))));
  const autumnDays = days.filter((day) => seasons.autumn.includes(Number(day.date.slice(5, 7))));

  const annualMeanTempC = mean(days.map((day) => (day.tempCMax + day.tempCMin) / 2));
  const estimatedAnnualSnowfallCm = mean(days.map((day) => day.snowfallCm)) * 365;
  const annualTempRangeC =
    Math.max(...days.map((day) => day.tempCMax), -100) -
    Math.min(...days.map((day) => day.tempCMin), 100);

  return {
    annualMeanTempC: Number(annualMeanTempC.toFixed(2)),
    annualTempRangeC: Number(annualTempRangeC.toFixed(2)),
    winterMeanTempC: Number(mean(winterDays.map((day) => (day.tempCMax + day.tempCMin) / 2)).toFixed(2)),
    summerMeanTempC: Number(mean(summerDays.map((day) => (day.tempCMax + day.tempCMin) / 2)).toFixed(2)),
    precipitationDayPct: pct(days, (day) => day.precipitationMm >= 1),
    heavyPrecipDayPct: pct(days, (day) => day.precipitationMm >= 10),
    highWindDayPct: pct(days, (day) => day.windSpeedMps >= 10),
    pleasantDayPct: pct(
      days,
      (day) =>
        day.tempCMax >= 12 &&
        day.tempCMax <= 27 &&
        day.precipitationMm < 3 &&
        day.windSpeedMps < 8 &&
        (day.visibilityKm ?? 10) >= 8 &&
        (day.humidityPct ?? 55) >= 30 &&
        (day.humidityPct ?? 55) <= 80
    ),
    badOutdoorDayPct: pct(
      days,
      (day) =>
        day.precipitationMm >= 6 ||
        day.windSpeedMps >= 12 ||
        day.tempCMax >= 33 ||
        day.tempCMin <= 2
    ),
    snowfallDayPct: pct(days, (day) => day.snowfallCm >= 1),
    annualSnowfallCm: Number(estimatedAnnualSnowfallCm.toFixed(2)),
    freezingDayPct: pct(days, (day) => day.tempCMin <= 0),
    humidityComfortDayPct: pct(
      days,
      (day) => (day.humidityPct ?? 55) >= 35 && (day.humidityPct ?? 55) <= 70
    ),
    visibilityGoodDayPct: pct(days, (day) => (day.visibilityKm ?? 10) >= 8),
    extremeHeatDayPct: pct(days, (day) => day.tempCMax >= 35),
    extremeColdDayPct: pct(days, (day) => day.tempCMin <= -5),
    skiViableDayPct: pct(
      days,
      (day) =>
        day.tempCMax <= 2 &&
        (day.snowfallCm >= 1 || day.snowDepthCm >= 20)
    ),
    seasonalBuckets: [
      { season: 'winter', ...summarizeSeason(winterDays) },
      { season: 'spring', ...summarizeSeason(springDays) },
      { season: 'summer', ...summarizeSeason(summerDays) },
      { season: 'autumn', ...summarizeSeason(autumnDays) }
    ]
  };
}

function isStale(isoDate: string): boolean {
  const computed = new Date(isoDate).getTime();
  const now = Date.now();
  const ageDays = (now - computed) / (1000 * 60 * 60 * 24);
  return ageDays > CLIMATE.SUMMARY_STALE_AFTER_DAYS;
}

class ClimateSummaryService {
  private async fetchSeasonalApproximation(city: CityRecord): Promise<{ days: ForecastDay[]; strategy: string; source: string }> {
    const forecast = await weatherService.fetchForecastByCoordinates({ latitude: city.latitude, longitude: city.longitude });

    const nowYear = new Date().getUTCFullYear();
    const synthetic: ForecastDay[] = [];

    CLIMATE.SAMPLE_MONTHS.forEach((month) => {
      forecast.forEach((day, index) => {
        const syntheticDate = formatDate(nowYear - 1, month, Math.min(index + 1, CLIMATE.SAMPLE_WINDOW_DAYS));
        synthetic.push({ ...day, date: syntheticDate });
      });
    });

    return {
      days: synthetic,
      strategy: 'forecast-seasonal-approximation',
      source: 'forecast'
    };
  }

  private async fetchRepresentativeDays(city: CityRecord): Promise<{ days: ForecastDay[]; strategy: string; source: string }> {
    const year = new Date().getUTCFullYear() - 1;

    try {
      const fullYearDays = await weatherService.fetchHistoricalForecastByDateRange(
        { latitude: city.latitude, longitude: city.longitude },
        formatDate(year, 1, 1),
        formatDate(year, 12, 31),
        `full-${year}`
      );

      if (fullYearDays.length >= 300) {
        return {
          days: fullYearDays,
          strategy: 'archive-full-year',
          source: 'archive'
        };
      }
    } catch {
      // fallback below
    }

    try {
      const seasonalDays = await Promise.all(
        CLIMATE.SAMPLE_MONTHS.map((month) =>
          weatherService.fetchHistoricalForecastByDateRange(
            { latitude: city.latitude, longitude: city.longitude },
            formatDate(year, month, 1),
            formatDate(year, month, CLIMATE.SAMPLE_WINDOW_DAYS),
            `sample-${year}-${month}`
          )
        )
      );

      const flattened = seasonalDays.flat();
      if (flattened.length > 0) {
        return {
          days: flattened,
          strategy: 'archive-seasonal-sample',
          source: 'archive'
        };
      }
    } catch {
      // final fallback below
    }

    return this.fetchSeasonalApproximation(city);
  }

  async getCityWeatherSummary(city: CityRecord, options?: { forceRefresh?: boolean }): Promise<CityWeatherSummary> {
    const cacheKey = redisKeys.cityWeatherSummary(city.id);

    if (!options?.forceRefresh) {
      const cached = await cacheService.getJSON<CityWeatherSummary>(cacheKey);
      if (cached && !isStale(cached.computedAt)) {
        return cached;
      }

      const stored = cityWeatherSummaryRepository.findByCityId(city.id);
      if (stored && !isStale(stored.computedAt)) {
        await cacheService.setJSON(cacheKey, stored, env.PRECOMPUTE_CACHE_TTL_MINUTES);
        return stored;
      }
    }

    const representative = await this.fetchRepresentativeDays(city);
    const summary = summarizeClimate(representative.days, city.latitude);

    const sampleStart = representative.days.length > 0 ? representative.days[0].date : formatDate(new Date().getUTCFullYear() - 1, 1, 1);
    const sampleEnd = representative.days.length > 0 ? representative.days[representative.days.length - 1].date : formatDate(new Date().getUTCFullYear() - 1, 12, 31);

    const computedAt = new Date().toISOString();

    const result: CityWeatherSummary = {
      cityId: city.id,
      sampleStart,
      sampleEnd,
      sampleStrategy: representative.strategy,
      source: representative.source,
      summary,
      algorithmVersion: FEATURE_ALGORITHM.VERSION,
      computedAt
    };

    cityWeatherSummaryRepository.upsert({
      cityId: city.id,
      sampleStart,
      sampleEnd,
      sampleStrategy: representative.strategy,
      source: representative.source,
      summaryJson: JSON.stringify(summary),
      algorithmVersion: FEATURE_ALGORITHM.VERSION,
      computedAt
    });

    await cacheService.setJSON(cacheKey, result, env.PRECOMPUTE_CACHE_TTL_MINUTES);
    return result;
  }
}

export const climateSummaryService = new ClimateSummaryService();
