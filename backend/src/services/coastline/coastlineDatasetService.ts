import fs from 'fs';
import path from 'path';
import geojsonRbush from 'geojson-rbush';
import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  LineString,
  MultiLineString
} from 'geojson';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { env } from '../../config/env';
import {
  CoastlineFeature,
  CoastlineFeatureCollection,
  CoastlineSegmentCandidate,
  Coordinates,
  GeoJsonPoint
} from '../../types/types';
import { bearingDeg, haversineKm } from '../scoring/geo';
import { logger } from '../../utils/logger';

type IndexedGeometry = LineString | MultiLineString;
type IndexedFeature = Feature<IndexedGeometry, GeoJsonProperties>;

interface Bbox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

interface StreamFeatureChunk {
  key: number;
  value: {
    type?: unknown;
    geometry?: {
      type?: unknown;
      coordinates?: unknown;
    };
    properties?: unknown;
  };
}

function toBbox(center: Coordinates, radiusKm: number): Bbox {
  const latDelta = radiusKm / 111.32;
  const lonDenominator = Math.max(0.2, Math.cos((center.latitude * Math.PI) / 180));
  const lonDelta = radiusKm / (111.32 * lonDenominator);

  return {
    minLon: center.longitude - lonDelta,
    minLat: center.latitude - latDelta,
    maxLon: center.longitude + lonDelta,
    maxLat: center.latitude + latDelta
  };
}

function isGeoJsonPoint(value: unknown): value is GeoJsonPoint {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1])
  );
}

function simplifyLineCoordinates(line: GeoJsonPoint[]): GeoJsonPoint[] {
  const maxPoints = Math.max(2, Math.floor(env.COASTLINE_MAX_POINTS_PER_LINE));

  if (line.length <= maxPoints) {
    return line;
  }

  const reduced: GeoJsonPoint[] = [line[0]];
  const step = (line.length - 1) / (maxPoints - 1);

  for (let pointIndex = 1; pointIndex < maxPoints - 1; pointIndex += 1) {
    const sourceIndex = Math.round(pointIndex * step);
    const clampedIndex = Math.max(1, Math.min(line.length - 2, sourceIndex));
    const candidate = line[clampedIndex];

    if (!samePoint(reduced[reduced.length - 1], candidate)) {
      reduced.push(candidate);
    }
  }

  if (!samePoint(reduced[reduced.length - 1], line[line.length - 1])) {
    reduced.push(line[line.length - 1]);
  }

  return reduced.length >= 2 ? reduced : line.slice(0, 2);
}

function toIndexedFeature(value: StreamFeatureChunk['value']): IndexedFeature | null {
  if (value.type !== 'Feature' || !value.geometry || typeof value.geometry !== 'object') {
    return null;
  }

  if (value.geometry.type === 'LineString') {
    if (!Array.isArray(value.geometry.coordinates) || !value.geometry.coordinates.every(isGeoJsonPoint)) {
      return null;
    }

    const simplified = simplifyLineCoordinates(value.geometry.coordinates);
    if (simplified.length < 2) {
      return null;
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: simplified
      },
      properties: null
    };
  }

  if (value.geometry.type === 'MultiLineString') {
    if (
      !Array.isArray(value.geometry.coordinates) ||
      !value.geometry.coordinates.every((line) => Array.isArray(line) && line.every(isGeoJsonPoint))
    ) {
      return null;
    }

    const simplified = value.geometry.coordinates
      .map((line) => simplifyLineCoordinates(line))
      .filter((line) => line.length >= 2);

    if (simplified.length === 0) {
      return null;
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'MultiLineString',
        coordinates: simplified
      },
      properties: null
    };
  }

  return null;
}

function flattenGeometry(feature: CoastlineFeature): GeoJsonPoint[][] {
  if (feature.geometry.type === 'LineString') {
    return [feature.geometry.coordinates];
  }

  return feature.geometry.coordinates;
}

function pointDistanceKm(center: Coordinates, point: GeoJsonPoint): number {
  return haversineKm(center.latitude, center.longitude, point[1], point[0]);
}

function pointInRadius(center: Coordinates, point: GeoJsonPoint, radiusKm: number): boolean {
  return pointDistanceKm(center, point) <= radiusKm;
}

function lineHasPointInRadius(center: Coordinates, line: GeoJsonPoint[], radiusKm: number): boolean {
  return line.some((point) => pointInRadius(center, point, radiusKm));
}

function samePoint(a: GeoJsonPoint, b: GeoJsonPoint, epsilon = 1e-9): boolean {
  return Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon;
}

function clipSegmentToBbox(start: GeoJsonPoint, end: GeoJsonPoint, bbox: Bbox): [GeoJsonPoint, GeoJsonPoint] | null {
  const [x0, y0] = start;
  const [x1, y1] = end;
  const dx = x1 - x0;
  const dy = y1 - y0;

  let t0 = 0;
  let t1 = 1;

  const p = [-dx, dx, -dy, dy];
  const q = [
    x0 - bbox.minLon,
    bbox.maxLon - x0,
    y0 - bbox.minLat,
    bbox.maxLat - y0
  ];

  for (let index = 0; index < 4; index += 1) {
    if (p[index] === 0) {
      if (q[index] < 0) {
        return null;
      }
      continue;
    }

    const ratio = q[index] / p[index];

    if (p[index] < 0) {
      if (ratio > t1) {
        return null;
      }
      if (ratio > t0) {
        t0 = ratio;
      }
    } else {
      if (ratio < t0) {
        return null;
      }
      if (ratio < t1) {
        t1 = ratio;
      }
    }
  }

  const clippedStart: GeoJsonPoint = [x0 + t0 * dx, y0 + t0 * dy];
  const clippedEnd: GeoJsonPoint = [x0 + t1 * dx, y0 + t1 * dy];

  return [clippedStart, clippedEnd];
}

function clipLineToBbox(line: GeoJsonPoint[], bbox: Bbox): GeoJsonPoint[][] {
  if (line.length < 2) {
    return [];
  }

  const segments: Array<[GeoJsonPoint, GeoJsonPoint]> = [];

  for (let index = 0; index < line.length - 1; index += 1) {
    const clipped = clipSegmentToBbox(line[index], line[index + 1], bbox);
    if (clipped) {
      segments.push(clipped);
    }
  }

  const merged: GeoJsonPoint[][] = [];

  segments.forEach((segment) => {
    const [start, end] = segment;
    const last = merged[merged.length - 1];

    if (!last) {
      merged.push([start, end]);
      return;
    }

    const tail = last[last.length - 1];
    if (samePoint(tail, start)) {
      last.push(end);
      return;
    }

    merged.push([start, end]);
  });

  return merged;
}

class CoastlineDatasetService {
  private readonly context = 'CoastlineDatasetService';
  private index = geojsonRbush<IndexedGeometry, GeoJsonProperties>();
  private loaded = false;
  private featureCount = 0;
  private dataPath: string | null = null;
  private datasetSizeBytes = 0;
  private indexBuildDurationMs = 0;

  async initialize(dataPath = env.COASTLINE_GEOJSON_PATH): Promise<void> {
    const absolutePath = path.resolve(process.cwd(), dataPath);
    const startedAt = Date.now();

    this.index.clear();
    this.loaded = false;
    this.featureCount = 0;
    this.dataPath = absolutePath;
    this.datasetSizeBytes = 0;
    this.indexBuildDurationMs = 0;

    if (!fs.existsSync(absolutePath)) {
      logger.warn(this.context, 'Coastline GeoJSON not found; coastline API will return empty results', {
        path: absolutePath
      });
      return;
    }

    const stats = fs.statSync(absolutePath);
    this.datasetSizeBytes = stats.size;

    if (this.datasetSizeBytes > 1_500_000_000) {
      logger.warn(this.context, 'Large coastline dataset detected; startup may require additional memory', {
        path: absolutePath,
        sizeBytes: this.datasetSizeBytes,
        recommendation: 'Rebuild with higher COASTLINE_SIMPLIFY_DEGREES and/or lower COASTLINE_MAX_POINTS_PER_LINE'
      });
    }

    await this.loadFromGeoJsonFeatureStream(absolutePath);

    this.loaded = this.featureCount > 0;
    this.indexBuildDurationMs = Date.now() - startedAt;
    logger.info(this.context, 'Loaded coastline dataset', {
      path: absolutePath,
      sizeBytes: this.datasetSizeBytes,
      featuresIndexed: this.featureCount,
      indexBuildDurationMs: this.indexBuildDurationMs,
      maxPointsPerLine: env.COASTLINE_MAX_POINTS_PER_LINE
    });
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getStats(): {
    path: string | null;
    loaded: boolean;
    sizeBytes: number;
    featuresIndexed: number;
    indexBuildDurationMs: number;
    maxPointsPerLine: number;
  } {
    return {
      path: this.dataPath,
      loaded: this.loaded,
      sizeBytes: this.datasetSizeBytes,
      featuresIndexed: this.featureCount,
      indexBuildDurationMs: this.indexBuildDurationMs,
      maxPointsPerLine: env.COASTLINE_MAX_POINTS_PER_LINE
    };
  }

  getNearbyFeatures(center: Coordinates, radiusKm: number): CoastlineFeatureCollection {
    if (!this.loaded) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    const bbox = toBbox(center, radiusKm);
    const searched = this.index.search([bbox.minLon, bbox.minLat, bbox.maxLon, bbox.maxLat]);

    const clipped: CoastlineFeature[] = [];

    searched.features.forEach((feature) => {
      const candidate: CoastlineFeature = {
        type: 'Feature',
        geometry: feature.geometry.type === 'LineString'
          ? { type: 'LineString', coordinates: feature.geometry.coordinates as GeoJsonPoint[] }
          : { type: 'MultiLineString', coordinates: feature.geometry.coordinates as GeoJsonPoint[][] },
        properties: feature.properties as Record<string, unknown> | null
      };

      flattenGeometry(candidate).forEach((line) => {
        clipLineToBbox(line, bbox)
          .filter((segment) => segment.length >= 2)
          .filter((segment) => lineHasPointInRadius(center, segment, radiusKm))
          .forEach((segment) => {
            clipped.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: segment
              },
              properties: candidate.properties
            });
          });
      });
    });

    return {
      type: 'FeatureCollection',
      features: clipped
    };
  }

  getSegmentCandidates(center: Coordinates, radiusKm: number): CoastlineSegmentCandidate[] {
    const nearby = this.getNearbyFeatures(center, radiusKm);
    const segments: CoastlineSegmentCandidate[] = [];

    nearby.features.forEach((feature) => {
      if (feature.geometry.type !== 'LineString') {
        return;
      }

      const coordinates = feature.geometry.coordinates;
      for (let index = 0; index < coordinates.length - 1; index += 1) {
        const fromNode = coordinates[index];
        const toNode = coordinates[index + 1];

        const midpoint: GeoJsonPoint = [
          (fromNode[0] + toNode[0]) / 2,
          (fromNode[1] + toNode[1]) / 2
        ];

        const distanceKm = pointDistanceKm(center, midpoint);
        const lengthKm = haversineKm(fromNode[1], fromNode[0], toNode[1], toNode[0]);

        if (distanceKm > radiusKm * 1.1 || lengthKm === 0) {
          continue;
        }

        const tangentDeg = bearingDeg(fromNode[1], fromNode[0], toNode[1], toNode[0]);
        segments.push({ distanceKm, tangentDeg, lengthKm });
      }
    });

    return segments;
  }

  private async loadFromGeoJsonFeatureStream(filePath: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const pipeline = chain([
        fs.createReadStream(filePath, { encoding: 'utf8' }),
        parser(),
        pick({ filter: 'features' }),
        streamArray()
      ]);

      pipeline.on('data', (chunk: StreamFeatureChunk) => {
        const feature = toIndexedFeature(chunk.value);
        if (!feature) {
          return;
        }

        this.index.insert(feature);
        this.featureCount += 1;
      });

      pipeline.on('end', () => {
        resolve();
      });

      pipeline.on('error', (error: Error) => {
        reject(error);
      });
    });
  }
}

export const coastlineDatasetService = new CoastlineDatasetService();
