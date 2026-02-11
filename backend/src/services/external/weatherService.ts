import pLimit from 'p-limit';
import { env } from '../../config/env';
import { cacheService } from '../cache/cacheService';
import { redisKeys } from '../cache/redisKeys';
import { getJson } from './httpClient';
import {
  normalizeDegree,
  normalizeNonNegative,
  normalizePercent,
  normalizeSnowDepthCmFromMeters,
  normalizeTemperatureC,
  normalizeVisibilityKm,
  normalizeWindMps
} from './units';
import {
  Coordinates,
  DailyMarineSummary,
  ForecastDay,
  GeocodingResult,
  MarineData,
  MarineHourly,
  WeatherBundle
} from '../../types/types';
import { ExternalServiceError } from '../../utils/errors';

interface OpenMeteoGeocodeResponse {
  results?: Array<{
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    population?: number;
  }>;
}

interface OpenMeteoForecastResponse {
  timezone?: string;
  elevation?: number;
  daily?: Record<string, unknown[]> & { time?: string[] };
}

interface OpenMeteoMarineResponse {
  timezone?: string;
  hourly?: Record<string, unknown[]> & { time?: string[] };
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

class WeatherService {
  private readonly limiter = pLimit(env.API_CONCURRENCY_LIMIT);

  async geocodeCity(city: string): Promise<GeocodingResult> {
    const key = redisKeys.geocoding(city);
    const cached = await cacheService.getJSON<GeocodingResult>(key);
    if (cached) {
      return cached;
    }

    return this.limiter(async () => {
      const params = new URLSearchParams({
        name: city,
        count: '1',
        language: 'en',
        format: 'json'
      });

      const url = `${env.GEOCODING_API_BASE_URL}/search?${params.toString()}`;
      const response = await getJson<OpenMeteoGeocodeResponse>(url, 'Geocoding');
      const first = response.results?.[0];

      if (!first) {
        throw new ExternalServiceError('Geocoding', `City not found: ${city}`);
      }

      const result: GeocodingResult = {
        name: first.name,
        country: first.country,
        latitude: first.latitude,
        longitude: first.longitude,
        elevationM: first.elevation ?? null,
        population: first.population ?? null
      };

      await cacheService.setJSON(key, result, env.CACHE_TTL_MINUTES);
      return result;
    });
  }

  async getWeatherByCity(city: string): Promise<WeatherBundle> {
    const geocoded = await this.geocodeCity(city);
    return this.getWeatherByCoordinates(
      {
        latitude: geocoded.latitude,
        longitude: geocoded.longitude
      },
      geocoded.name,
      geocoded.elevationM ?? null
    );
  }

  async getWeatherByCoordinates(
    coordinates: Coordinates,
    locationName?: string,
    fallbackElevation?: number | null
  ): Promise<WeatherBundle> {
    const [forecastDays, marineDaily] = await Promise.all([
      this.fetchForecastByCoordinates(coordinates),
      this.fetchMarineDailySummary(coordinates)
    ]);

    return {
      location: locationName ?? `${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}`,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      elevationM: fallbackElevation ?? null,
      timezone: null,
      forecastDays,
      marineDaily
    };
  }

  async fetchForecastByCoordinates(coordinates: Coordinates): Promise<ForecastDay[]> {
    const key = redisKeys.forecastByCoordinates(coordinates.latitude, coordinates.longitude);
    const cached = await cacheService.getJSON<ForecastDay[]>(key);
    if (cached) {
      return cached;
    }

    return this.fetchDailyForecast(
      coordinates,
      {
        timezone: 'auto',
        forecast_days: String(env.FORECAST_DAYS)
      },
      key
    );
  }

  async fetchHistoricalForecastByDateRange(
    coordinates: Coordinates,
    startDate: string,
    endDate: string,
    cacheSuffix: string
  ): Promise<ForecastDay[]> {
    const cacheKey = redisKeys.archiveWeather(coordinates.latitude, coordinates.longitude, cacheSuffix);
    const cached = await cacheService.getJSON<ForecastDay[]>(cacheKey);
    if (cached) {
      return cached;
    }

    return this.limiter(async () => {
      const params = new URLSearchParams({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        start_date: startDate,
        end_date: endDate,
        daily:
          'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,relative_humidity_2m_mean,uv_index_max,visibility_mean,snowfall_sum,snow_depth_mean',
        temperature_unit: 'celsius',
        wind_speed_unit: 'ms',
        precipitation_unit: 'mm',
        timezone: 'UTC'
      });

      const url = `${env.WEATHER_ARCHIVE_API_BASE_URL}/archive?${params.toString()}`;
      const response = await getJson<OpenMeteoForecastResponse>(url, 'WeatherArchive');
      const parsed = this.parseForecastResponse(response, url);
      await cacheService.setJSON(cacheKey, parsed, env.PRECOMPUTE_CACHE_TTL_MINUTES);
      return parsed;
    });
  }

  private async fetchDailyForecast(
    coordinates: Coordinates,
    extraParams: Record<string, string>,
    cacheKey?: string
  ): Promise<ForecastDay[]> {
    return this.limiter(async () => {
      const params = new URLSearchParams({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        daily:
          'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,relative_humidity_2m_mean,uv_index_max,visibility_mean,snowfall_sum,snow_depth_mean',
        temperature_unit: 'celsius',
        wind_speed_unit: 'ms',
        precipitation_unit: 'mm',
        ...extraParams
      });

      const url = `${env.WEATHER_API_BASE_URL}/forecast?${params.toString()}`;
      const response = await getJson<OpenMeteoForecastResponse>(url, 'Weather');
      const parsed = this.parseForecastResponse(response, url);

      if (cacheKey) {
        await cacheService.setJSON(cacheKey, parsed, env.CACHE_TTL_MINUTES);
      }

      return parsed;
    });
  }

  private parseForecastResponse(response: OpenMeteoForecastResponse, url: string): ForecastDay[] {
    const daily = response.daily;

    if (!daily || !Array.isArray(daily.time)) {
      throw new ExternalServiceError('Weather', 'Forecast response missing daily data', { url });
    }

    return daily.time.map((date, index) => ({
      date,
      tempCMax: normalizeTemperatureC(daily.temperature_2m_max?.[index]),
      tempCMin: normalizeTemperatureC(daily.temperature_2m_min?.[index]),
      precipitationMm: normalizeNonNegative(daily.precipitation_sum?.[index]),
      precipitationProbabilityPct: normalizePercent(daily.precipitation_probability_max?.[index]),
      windSpeedMps: normalizeWindMps(daily.wind_speed_10m_max?.[index]),
      windFromDeg: normalizeDegree(daily.wind_direction_10m_dominant?.[index]),
      humidityPct:
        typeof daily.relative_humidity_2m_mean?.[index] === 'number'
          ? normalizePercent(daily.relative_humidity_2m_mean[index])
          : null,
      uvIndex:
        typeof daily.uv_index_max?.[index] === 'number'
          ? normalizeNonNegative(daily.uv_index_max[index])
          : null,
      visibilityKm: normalizeVisibilityKm(daily.visibility_mean?.[index]),
      snowfallCm: normalizeNonNegative(daily.snowfall_sum?.[index]),
      snowDepthCm: normalizeSnowDepthCmFromMeters(daily.snow_depth_mean?.[index])
    }));
  }

  async fetchMarineData(coordinates: Coordinates): Promise<MarineData> {
    const key = redisKeys.marineByCoordinates(coordinates.latitude, coordinates.longitude);
    const cached = await cacheService.getJSON<MarineData>(key);
    if (cached) {
      return cached;
    }

    return this.limiter(async () => {
      const params = new URLSearchParams({
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        hourly:
          'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_surface_temperature',
        timezone: 'auto'
      });

      const url = `${env.MARINE_API_BASE_URL}/marine?${params.toString()}`;
      const response = await getJson<OpenMeteoMarineResponse>(url, 'Marine');
      const hourly = response.hourly;

      if (!hourly || !Array.isArray(hourly.time)) {
        throw new ExternalServiceError('Marine', 'Marine response missing hourly data', { url });
      }

      const normalizedHourly: MarineHourly = {
        time: hourly.time,
        waveHeightM: hourly.wave_height?.map(normalizeNonNegative) ?? [],
        waveDirectionDeg: hourly.wave_direction?.map((value) => normalizeDegree(value) ?? 0) ?? [],
        wavePeriodS: hourly.wave_period?.map(normalizeNonNegative) ?? [],
        swellWaveHeightM: hourly.swell_wave_height?.map(normalizeNonNegative) ?? [],
        swellWaveDirectionDeg: hourly.swell_wave_direction?.map((value) => normalizeDegree(value) ?? 0) ?? [],
        swellWavePeriodS: hourly.swell_wave_period?.map(normalizeNonNegative) ?? [],
        seaSurfaceTemperatureC: hourly.sea_surface_temperature?.map(normalizeTemperatureC) ?? []
      };

      const marineData: MarineData = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timezone: response.timezone ?? null,
        hourly: normalizedHourly
      };

      await cacheService.setJSON(key, marineData, env.CACHE_TTL_MINUTES);
      return marineData;
    });
  }

  async fetchMarineDailySummary(coordinates: Coordinates): Promise<DailyMarineSummary[]> {
    const marine = await this.fetchMarineData(coordinates);
    const byDate = new Map<
      string,
      {
        swellHeightM: number[];
        swellPeriodS: number[];
        swellDirectionDeg: number[];
        waveHeightM: number[];
        seaSurfaceTempC: number[];
      }
    >();

    marine.hourly.time.forEach((time, index) => {
      const date = time.slice(0, 10);
      const bucket = byDate.get(date) ?? {
        swellHeightM: [],
        swellPeriodS: [],
        swellDirectionDeg: [],
        waveHeightM: [],
        seaSurfaceTempC: []
      };

      const swellHeight = marine.hourly.swellWaveHeightM[index];
      const swellPeriod = marine.hourly.swellWavePeriodS[index];
      const swellDirection = marine.hourly.swellWaveDirectionDeg[index];
      const waveHeight = marine.hourly.waveHeightM[index];
      const seaSurfaceTemp = marine.hourly.seaSurfaceTemperatureC[index];

      if (Number.isFinite(swellHeight)) bucket.swellHeightM.push(swellHeight);
      if (Number.isFinite(swellPeriod)) bucket.swellPeriodS.push(swellPeriod);
      if (Number.isFinite(swellDirection)) bucket.swellDirectionDeg.push(swellDirection);
      if (Number.isFinite(waveHeight)) bucket.waveHeightM.push(waveHeight);
      if (Number.isFinite(seaSurfaceTemp)) bucket.seaSurfaceTempC.push(seaSurfaceTemp);

      byDate.set(date, bucket);
    });

    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, env.FORECAST_DAYS)
      .map(([date, values]) => ({
        date,
        swellHeightM: average(values.swellHeightM),
        swellPeriodS: average(values.swellPeriodS),
        swellDirectionDeg: average(values.swellDirectionDeg),
        waveHeightM: average(values.waveHeightM),
        seaSurfaceTempC: average(values.seaSurfaceTempC)
      }));
  }
}

export const weatherService = new WeatherService();
