export const ACTIVITIES = ['Skiing', 'Surfing', 'Outdoor sightseeing', 'Indoor sightseeing'] as const;

export const FEATURE_CATEGORIES = [
  'Skiing',
  'Surfing',
  'Outdoor sightseeing',
  'Indoor sightseeing'
] as const;

export const SCORE_RATINGS = {
  EXCELLENT_MIN: 85,
  GOOD_MIN: 70,
  FAIR_MIN: 50,
  POOR_MIN: 30
} as const;

export const SCORING_WEIGHTS = {
  SKIING: {
    SNOW_DEPTH: 0.35,
    SNOWFALL: 0.3,
    TEMPERATURE: 0.2,
    WIND: 0.15
  },
  SURFING: {
    SWELL_HEIGHT: 0.34,
    WAVE_HEIGHT: 0.28,
    SWELL_PERIOD: 0.16,
    WIND_ALIGNMENT: 0.14,
    WATER_TEMPERATURE: 0.08
  },
  OUTDOOR_SIGHTSEEING: {
    TEMPERATURE: 0.25,
    RAIN: 0.25,
    VISIBILITY: 0.2,
    WIND: 0.15,
    UV: 0.15
  },
  INDOOR_SIGHTSEEING: {
    RAIN: 0.35,
    TEMPERATURE: 0.25,
    WIND: 0.2,
    HUMIDITY: 0.2
  }
} as const;

export const THRESHOLDS = {
  SKIING: {
    MIN_ELEVATION_M: 800,
    OPTIMAL_TEMP_MIN_C: -15,
    OPTIMAL_TEMP_MAX_C: -5,
    MIN_SNOW_DEPTH_CM: 20
  },
  SURFING: {
    OPTIMAL_SWELL_HEIGHT_MIN_M: 1,
    OPTIMAL_SWELL_HEIGHT_MAX_M: 2.5,
    OPTIMAL_SWELL_PERIOD_MIN_S: 9,
    OPTIMAL_WATER_TEMP_MIN_C: 16,
    OPTIMAL_WATER_TEMP_MAX_C: 26
  },
  OUTDOOR_SIGHTSEEING: {
    OPTIMAL_TEMP_MIN_C: 12,
    OPTIMAL_TEMP_MAX_C: 24,
    MAX_WIND_MPS: 10,
    MIN_VISIBILITY_KM: 5,
    MAX_UV_INDEX: 9
  },
  INDOOR_SIGHTSEEING: {
    COMFORT_TEMP_MIN_C: 16,
    COMFORT_TEMP_MAX_C: 27,
    COMFORT_HUMIDITY_MIN: 30,
    COMFORT_HUMIDITY_MAX: 65
  }
} as const;

export const FEATURE_ALGORITHM = {
  VERSION: 'feature-v1.0.2',
  MIN_ASSIGNMENT_SCORE: 60,
  SURF_MIN_COAST_CONFIDENCE: 0.55,
  POI_DENSITY_GATE_PER_100KM2: 1.5,
  POI_COUNT_GATE: 12,
  POPULATION_PROXY_GATE: 150000
} as const;

export const REDIS_KEY_PREFIX = 'desirability';

export const COAST_ORIENTATION = {
  SEARCH_RADIUS_METERS: 60000,
  INLAND_DISTANCE_KM: 45,
  CACHE_COORDINATE_PRECISION: 3
} as const;

export const POI = {
  SEARCH_RADIUS_METERS: 20000
} as const;

export const CLIMATE = {
  SAMPLE_MONTHS: [1, 4, 7, 10] as const,
  SAMPLE_WINDOW_DAYS: 28,
  SUMMARY_STALE_AFTER_DAYS: 45
} as const;
