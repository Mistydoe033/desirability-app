import { COAST_ORIENTATION } from '../constants/constants';
import { env } from '../config/env';
import { CityRecord, CoastOrientationResult, Coordinates } from '../types/types';
import { logger } from '../utils/logger';
import { cacheService } from './cache/cacheService';
import { redisKeys } from './cache/redisKeys';
import { coastlineDatasetService } from './coastline/coastlineDatasetService';
import { normalizeDeg } from './scoring/geo';

interface CoastConfidenceSignals {
  nearestDistanceKm: number;
  segmentCount: number;
  averageSegmentLengthKm: number;
  directionalAgreement: number;
  freshnessScore: number;
}

class CoastOrientationService {
  private readonly context = 'CoastOrientationService';

  private toLoadingResult(): CoastOrientationResult {
    return {
      faceDeg: null,
      source: 'coastline-loading',
      confidence: 0
    };
  }

  private circularMean(
    segments: Array<{ distanceKm: number; tangentDeg: number; lengthKm: number }>
  ): { meanDeg: number; agreement: number } {
    const weighted = segments.map((segment) => {
      const distanceWeight = 1 / (1 + segment.distanceKm);
      const lengthWeight = Math.max(0.1, Math.min(segment.lengthKm, 5));
      return {
        ...segment,
        weight: distanceWeight * lengthWeight
      };
    });

    const sumWeight = weighted.reduce((sum, segment) => sum + segment.weight, 0);
    if (sumWeight === 0) {
      return { meanDeg: 0, agreement: 0 };
    }

    const x = weighted.reduce((sum, segment) => {
      const radians = (segment.tangentDeg * Math.PI) / 180;
      return sum + Math.cos(radians) * segment.weight;
    }, 0);

    const y = weighted.reduce((sum, segment) => {
      const radians = (segment.tangentDeg * Math.PI) / 180;
      return sum + Math.sin(radians) * segment.weight;
    }, 0);

    const meanDeg = normalizeDeg((Math.atan2(y, x) * 180) / Math.PI);
    const resultantLength = Math.sqrt(x * x + y * y) / sumWeight;

    return {
      meanDeg,
      agreement: Math.max(0, Math.min(1, resultantLength))
    };
  }

  private computeConfidence(signals: CoastConfidenceSignals): number {
    const maxDistanceKm = COAST_ORIENTATION.SEARCH_RADIUS_METERS / 1000;

    const distanceScore = Math.max(0, 1 - signals.nearestDistanceKm / maxDistanceKm);
    const segmentCountScore = Math.min(1, signals.segmentCount / 20);
    const lengthScore = Math.min(1, signals.averageSegmentLengthKm / 2.5);
    const agreementScore = signals.directionalAgreement;
    const freshnessScore = signals.freshnessScore;

    const confidence =
      0.45 * distanceScore +
      0.2 * segmentCountScore +
      0.15 * lengthScore +
      0.15 * agreementScore +
      0.05 * freshnessScore;

    return Number(Math.max(0, Math.min(1, confidence)).toFixed(4));
  }

  private toInlandResult(segmentCount = 0): CoastOrientationResult {
    return {
      faceDeg: null,
      source: 'inland',
      confidence: 0,
      segmentCount
    };
  }

  private toOrientation(
    segments: Array<{ distanceKm: number; tangentDeg: number; lengthKm: number }>
  ): CoastOrientationResult {
    const sortedByDistance = [...segments].sort((a, b) => a.distanceKm - b.distanceKm);
    const nearestDistanceKm = sortedByDistance[0].distanceKm;

    if (nearestDistanceKm > COAST_ORIENTATION.INLAND_DISTANCE_KM) {
      return this.toInlandResult(segments.length);
    }

    const sampled = sortedByDistance.slice(0, 16);
    const { meanDeg, agreement } = this.circularMean(sampled);
    const faceDeg = normalizeDeg(meanDeg + 90);
    const averageSegmentLengthKm =
      sampled.reduce((sum, segment) => sum + segment.lengthKm, 0) / Math.max(1, sampled.length);

    const confidence = this.computeConfidence({
      nearestDistanceKm,
      segmentCount: segments.length,
      averageSegmentLengthKm,
      directionalAgreement: agreement,
      freshnessScore: 1
    });

    return {
      faceDeg,
      source: 'local-coastline',
      confidence,
      segmentCount: segments.length,
      nearestDistanceKm: Number(nearestDistanceKm.toFixed(3))
    };
  }

  async getOrientationForPoint(coordinates: Coordinates): Promise<CoastOrientationResult | null> {
    const key = redisKeys.coastOrientation(coordinates.latitude, coordinates.longitude);
    const cached = await cacheService.getJSON<CoastOrientationResult>(key);
    if (cached) {
      return cached;
    }

    if (!coastlineDatasetService.isLoaded()) {
      return this.toLoadingResult();
    }

    try {
      const segments = coastlineDatasetService.getSegmentCandidates(
        coordinates,
        COAST_ORIENTATION.SEARCH_RADIUS_METERS / 1000
      );

      const orientation =
        segments.length > 0 ? this.toOrientation(segments) : this.toInlandResult();

      await cacheService.setJSON(key, orientation, env.CACHE_TTL_MINUTES);
      return orientation;
    } catch (error) {
      logger.warn(this.context, 'Failed to compute coast orientation from local dataset', {
        coordinates,
        error
      });
      return null;
    }
  }

  async getCityOrientation(city: CityRecord): Promise<CoastOrientationResult | null> {
    const cacheKey = redisKeys.cityCoast(city.id);
    const cached = await cacheService.getJSON<CoastOrientationResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const computed = await this.getOrientationForPoint({
      latitude: city.latitude,
      longitude: city.longitude
    });

    if (!computed) {
      return null;
    }

    if (computed.source === 'coastline-loading') {
      return computed;
    }

    await cacheService.setJSON(cacheKey, computed, env.CACHE_TTL_MINUTES);
    return computed;
  }
}

export const coastOrientationService = new CoastOrientationService();
