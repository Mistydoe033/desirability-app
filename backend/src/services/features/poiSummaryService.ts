import { FEATURE_ALGORITHM, POI } from '../../constants/constants';
import { env } from '../../config/env';
import { cityRepository } from '../../repositories/cityRepository';
import { cityPoiSummaryRepository } from '../../repositories/cityPoiSummaryRepository';
import { CityPoiSummary, CityRecord } from '../../types/types';
import { cacheService } from '../cache/cacheService';
import { redisKeys } from '../cache/redisKeys';
import { postJson } from '../external/httpClient';
import { weatherService } from '../external/weatherService';
import { createEmptyFeatureProfile } from './featureProfile';
import { logger } from '../../utils/logger';

interface OverpassResponse {
  elements?: Array<{
    type: string;
    tags?: Record<string, string>;
  }>;
  remark?: string;
}

function circleAreaKm2(radiusMeters: number): number {
  const radiusKm = radiusMeters / 1000;
  return Math.PI * radiusKm * radiusKm;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

class PoiSummaryService {
  private readonly context = 'PoiSummaryService';

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

  async getCityPoiSummaryByName(
    cityName: string,
    options?: { forceRefresh?: boolean }
  ): Promise<{ city: CityRecord; summary: CityPoiSummary }> {
    const city = await this.resolveOrCreateCityByName(cityName);
    const summary = await this.getCityPoiSummary(city, options);

    return {
      city,
      summary
    };
  }

  async getCityPoiSummary(city: CityRecord, options?: { forceRefresh?: boolean }): Promise<CityPoiSummary> {
    const cacheKey = redisKeys.cityPoiSummary(city.id);

    if (!options?.forceRefresh) {
      const cached = await cacheService.getJSON<CityPoiSummary>(cacheKey);
      if (cached) {
        return cached;
      }

      const stored = cityPoiSummaryRepository.findByCityId(city.id);
      if (stored) {
        await cacheService.setJSON(cacheKey, stored, env.PRECOMPUTE_CACHE_TTL_MINUTES);
        return stored;
      }
    }

    const computed = await this.computeCityPoiSummary(city);

    cityPoiSummaryRepository.upsert({
      cityId: city.id,
      museumsCount: computed.museumsCount,
      galleriesCount: computed.galleriesCount,
      attractionsCount: computed.attractionsCount,
      poiCount: computed.poiCount,
      densityPer100Km2: computed.densityPer100Km2,
      populationProxy: computed.populationProxy,
      source: computed.source,
      confidence: computed.confidence,
      summaryJson: JSON.stringify(computed.summary),
      algorithmVersion: computed.algorithmVersion,
      computedAt: computed.computedAt
    });

    await cacheService.setJSON(cacheKey, computed, env.PRECOMPUTE_CACHE_TTL_MINUTES);
    return computed;
  }

  private parseOverpassCount(response: OverpassResponse): number {
    const countElement = response.elements?.find((element) => element.type === 'count');
    const total = Number(countElement?.tags?.total ?? 0);
    return Number.isFinite(total) && total > 0 ? total : 0;
  }

  private overpassEndpoints(): string[] {
    const configured = env.OVERPASS_API_INTERPRETER_URL
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return configured.length > 0 ? configured : ['https://overpass-api.de/api/interpreter'];
  }

  private async runOverpassCountQuery(endpoint: string, query: string): Promise<number> {
    const body = new URLSearchParams({ data: query }).toString();
    const response = await postJson<OverpassResponse>(
      endpoint,
      body,
      'OverpassPoi',
      { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    );

    return this.parseOverpassCount(response);
  }

  private async fetchOverpassPoiSummary(city: CityRecord): Promise<CityPoiSummary> {
    const areaKm2 = circleAreaKm2(POI.SEARCH_RADIUS_METERS);
    const radius = Math.min(POI.SEARCH_RADIUS_METERS, 12_000);

    const museumQuery = `
[out:json][timeout:25];
(
  nwr["tourism"="museum"](around:${radius},${city.latitude},${city.longitude});
  nwr["amenity"="museum"](around:${radius},${city.latitude},${city.longitude});
);
out count;
    `.trim();

    const galleryQuery = `
[out:json][timeout:25];
(
  nwr["tourism"="gallery"](around:${radius},${city.latitude},${city.longitude});
  nwr["amenity"="arts_centre"](around:${radius},${city.latitude},${city.longitude});
);
out count;
    `.trim();

    const attractionQuery = `
[out:json][timeout:25];
(
  nwr["tourism"~"attraction|viewpoint|zoo|theme_park|aquarium"](around:${radius},${city.latitude},${city.longitude});
);
out count;
    `.trim();

    const endpoints = this.overpassEndpoints();
    let museumsCount = 0;
    let galleriesCount = 0;
    let attractionsCount = 0;
    let usedEndpoint = endpoints[0];
    let lastError: unknown = null;

    for (const endpoint of endpoints) {
      try {
        usedEndpoint = endpoint;
        const [museumCount, galleryCount, attractionCount] = await Promise.all([
          this.runOverpassCountQuery(endpoint, museumQuery),
          this.runOverpassCountQuery(endpoint, galleryQuery),
          this.runOverpassCountQuery(endpoint, attractionQuery)
        ]);

        museumsCount = museumCount;
        galleriesCount = galleryCount;
        attractionsCount = attractionCount;
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        logger.warn(this.context, 'Overpass endpoint failed, trying next endpoint if available', {
          endpoint,
          cityId: city.id,
          cityName: city.name,
          error: error instanceof Error ? error.message : error
        });
      }
    }

    if (lastError) {
      throw lastError;
    }

    const poiCount = museumsCount + galleriesCount + attractionsCount;
    const densityPer100Km2 = Number(((poiCount / areaKm2) * 100).toFixed(2));
    const confidence = Math.min(0.95, Number((0.65 + Math.min(0.3, poiCount / 300)).toFixed(2)));

    return {
      cityId: city.id,
      museumsCount,
      galleriesCount,
      attractionsCount,
      poiCount,
      densityPer100Km2,
      populationProxy: null,
      source: 'overpass-openstreetmap',
      confidence,
      summary: {
        areaKm2,
        estimated: false,
        model: 'overpass-poi-v1',
        endpoint: usedEndpoint,
        queryRadiusMeters: radius
      },
      algorithmVersion: FEATURE_ALGORITHM.VERSION,
      computedAt: new Date().toISOString()
    };
  }

  private async computePopulationProxySummary(city: CityRecord, fallbackReason?: string): Promise<CityPoiSummary> {
    const areaKm2 = circleAreaKm2(POI.SEARCH_RADIUS_METERS);
    const computedAt = new Date().toISOString();

    const geocoded = await weatherService.geocodeCity(city.name).catch(() => null);
    const populationProxy = geocoded?.population ?? null;

    const estimatedPoiCount = populationProxy
      ? Math.round(clamp(populationProxy / 40000, 0, 400))
      : 0;

    const museumsCount = Math.round(estimatedPoiCount * 0.3);
    const galleriesCount = Math.round(estimatedPoiCount * 0.25);
    const attractionsCount = Math.max(0, estimatedPoiCount - museumsCount - galleriesCount);
    const poiCount = museumsCount + galleriesCount + attractionsCount;
    const densityPer100Km2 = Number(((poiCount / areaKm2) * 100).toFixed(2));

    const source = populationProxy ? 'population-proxy-fallback' : 'unavailable';
    const confidence = populationProxy ? 0.35 : 0.2;

    return {
      cityId: city.id,
      museumsCount,
      galleriesCount,
      attractionsCount,
      poiCount,
      densityPer100Km2,
      populationProxy,
      source,
      confidence,
      summary: {
        areaKm2,
        estimated: true,
        model: 'population-proxy-v1',
        populationProxy,
        fallbackReason: fallbackReason ?? null
      },
      algorithmVersion: FEATURE_ALGORITHM.VERSION,
      computedAt
    };
  }

  private async computeCityPoiSummary(city: CityRecord): Promise<CityPoiSummary> {
    try {
      return await this.fetchOverpassPoiSummary(city);
    } catch (error) {
      logger.warn(this.context, 'Overpass POI fetch failed; falling back to population proxy', {
        cityId: city.id,
        cityName: city.name,
        error: error instanceof Error ? error.message : error
      });
      return this.computePopulationProxySummary(city, error instanceof Error ? error.message : 'unknown');
    }
  }
}

export const poiSummaryService = new PoiSummaryService();
