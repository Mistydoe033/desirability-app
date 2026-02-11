import dotenv from 'dotenv';
import { ParsedEnv } from '../types/types';

dotenv.config();

function readString(name: keyof ParsedEnv, fallback?: string): string {
  const raw = process.env[name as string];
  if (raw && raw.trim().length > 0) {
    return raw.trim();
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required env var: ${name as string}`);
}

function readNumber(name: keyof ParsedEnv, fallback?: number): number {
  const raw = process.env[name as string];
  if (raw === undefined || raw.trim() === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing required env var: ${name as string}`);
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric env var ${name as string}: ${raw}`);
  }

  return value;
}

export const env: ParsedEnv = {
  LOG_LEVEL: readString('LOG_LEVEL', 'INFO'),
  WEATHER_API_BASE_URL: readString('WEATHER_API_BASE_URL', 'https://api.open-meteo.com/v1'),
  WEATHER_ARCHIVE_API_BASE_URL: readString('WEATHER_ARCHIVE_API_BASE_URL', 'https://archive-api.open-meteo.com/v1'),
  MARINE_API_BASE_URL: readString('MARINE_API_BASE_URL', 'https://marine-api.open-meteo.com/v1'),
  GEOCODING_API_BASE_URL: readString('GEOCODING_API_BASE_URL', 'https://geocoding-api.open-meteo.com/v1'),
  OVERPASS_API_INTERPRETER_URL: readString('OVERPASS_API_INTERPRETER_URL', 'https://overpass-api.de/api/interpreter'),
  COASTLINE_GEOJSON_PATH: readString('COASTLINE_GEOJSON_PATH', './data/coastline.geojson'),
  COASTLINE_MAX_POINTS_PER_LINE: readNumber('COASTLINE_MAX_POINTS_PER_LINE', 256),
  FORECAST_DAYS: readNumber('FORECAST_DAYS', 7),
  API_REQUEST_TIMEOUT_MS: readNumber('API_REQUEST_TIMEOUT_MS', 10000),
  API_MAX_RETRIES: readNumber('API_MAX_RETRIES', 3),
  API_RETRY_DELAY_MS: readNumber('API_RETRY_DELAY_MS', 1000),
  REDIS_URL: readString('REDIS_URL', 'redis://localhost:6379'),
  REDIS_OP_TIMEOUT_MS: readNumber('REDIS_OP_TIMEOUT_MS', 250),
  CACHE_TTL_MINUTES: readNumber('CACHE_TTL_MINUTES', 60),
  PRECOMPUTE_CACHE_TTL_MINUTES: readNumber('PRECOMPUTE_CACHE_TTL_MINUTES', 120),
  DB_PATH: readString('DB_PATH', './data/activities.db'),
  API_CONCURRENCY_LIMIT: readNumber('API_CONCURRENCY_LIMIT', 5),
  PRECOMPUTE_CONCURRENCY_LIMIT: readNumber('PRECOMPUTE_CONCURRENCY_LIMIT', 3),
  PRECOMPUTE_INTERVAL_MINUTES: readNumber('PRECOMPUTE_INTERVAL_MINUTES', 360),
  PRECOMPUTE_TOP_CITIES_LIMIT: readNumber('PRECOMPUTE_TOP_CITIES_LIMIT', 20),
  PRECOMPUTE_CANDIDATE_LIMIT: readNumber('PRECOMPUTE_CANDIDATE_LIMIT', 100),
  FEATURE_COMPUTE_INTERVAL_MINUTES: readNumber('FEATURE_COMPUTE_INTERVAL_MINUTES', 720),
  GRAPHQL_PORT: readNumber('GRAPHQL_PORT', 4000),
  GRAPHQL_HOST: readString('GRAPHQL_HOST', '0.0.0.0')
};

function assertPositive(name: keyof ParsedEnv, value: number): void {
  if (value <= 0) {
    throw new Error(`${name as string} must be > 0, received ${value}`);
  }
}

assertPositive('FORECAST_DAYS', env.FORECAST_DAYS);
assertPositive('COASTLINE_MAX_POINTS_PER_LINE', env.COASTLINE_MAX_POINTS_PER_LINE);
assertPositive('API_REQUEST_TIMEOUT_MS', env.API_REQUEST_TIMEOUT_MS);
assertPositive('API_MAX_RETRIES', env.API_MAX_RETRIES);
assertPositive('API_RETRY_DELAY_MS', env.API_RETRY_DELAY_MS);
assertPositive('REDIS_OP_TIMEOUT_MS', env.REDIS_OP_TIMEOUT_MS);
assertPositive('CACHE_TTL_MINUTES', env.CACHE_TTL_MINUTES);
assertPositive('PRECOMPUTE_CACHE_TTL_MINUTES', env.PRECOMPUTE_CACHE_TTL_MINUTES);
assertPositive('API_CONCURRENCY_LIMIT', env.API_CONCURRENCY_LIMIT);
assertPositive('PRECOMPUTE_CONCURRENCY_LIMIT', env.PRECOMPUTE_CONCURRENCY_LIMIT);
assertPositive('PRECOMPUTE_INTERVAL_MINUTES', env.PRECOMPUTE_INTERVAL_MINUTES);
assertPositive('PRECOMPUTE_TOP_CITIES_LIMIT', env.PRECOMPUTE_TOP_CITIES_LIMIT);
assertPositive('PRECOMPUTE_CANDIDATE_LIMIT', env.PRECOMPUTE_CANDIDATE_LIMIT);
assertPositive('FEATURE_COMPUTE_INTERVAL_MINUTES', env.FEATURE_COMPUTE_INTERVAL_MINUTES);
assertPositive('GRAPHQL_PORT', env.GRAPHQL_PORT);
