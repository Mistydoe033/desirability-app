import { REDIS_KEY_PREFIX } from '../../constants/constants';

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function roundedCoordinate(value: number, precision: number): string {
  return value.toFixed(precision);
}

export const redisKeys = {
  forecastByCoordinates(latitude: number, longitude: number): string {
    return `${REDIS_KEY_PREFIX}:forecast:${roundedCoordinate(latitude, 3)}:${roundedCoordinate(longitude, 3)}`;
  },

  marineByCoordinates(latitude: number, longitude: number): string {
    return `${REDIS_KEY_PREFIX}:marine:${roundedCoordinate(latitude, 3)}:${roundedCoordinate(longitude, 3)}`;
  },

  geocoding(city: string): string {
    return `${REDIS_KEY_PREFIX}:geocode:${normalizeToken(city)}`;
  },

  archiveWeather(latitude: number, longitude: number, key: string): string {
    return `${REDIS_KEY_PREFIX}:archive:${roundedCoordinate(latitude, 3)}:${roundedCoordinate(longitude, 3)}:${key}`;
  },

  cityRank(city: string): string {
    return `${REDIS_KEY_PREFIX}:city-rank:${normalizeToken(city)}`;
  },

  topCities(activity: string): string {
    return `${REDIS_KEY_PREFIX}:top-cities:v8:${normalizeToken(activity)}`;
  },

  topCitiesPattern(): string {
    return `${REDIS_KEY_PREFIX}:top-cities:v8:*`;
  },

  coastOrientation(latitude: number, longitude: number): string {
    return `${REDIS_KEY_PREFIX}:coast:${roundedCoordinate(latitude, 3)}:${roundedCoordinate(longitude, 3)}`;
  },

  cityCoast(cityId: string): string {
    return `${REDIS_KEY_PREFIX}:city-coast:${normalizeToken(cityId)}`;
  },

  cityWeatherSummary(cityId: string): string {
    return `${REDIS_KEY_PREFIX}:weather-summary:${normalizeToken(cityId)}`;
  },

  cityPoiSummary(cityId: string): string {
    return `${REDIS_KEY_PREFIX}:poi-summary:${normalizeToken(cityId)}`;
  },

  cityFeatures(cityId: string): string {
    return `${REDIS_KEY_PREFIX}:city-features:${normalizeToken(cityId)}`;
  },

  precomputeLock(): string {
    return `${REDIS_KEY_PREFIX}:precompute:in-progress`;
  },

  featureComputeLock(): string {
    return `${REDIS_KEY_PREFIX}:feature-compute:in-progress`;
  }
};
