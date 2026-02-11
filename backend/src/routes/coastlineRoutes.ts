import { Express, Request, Response } from 'express';
import { coastlineDatasetService } from '../services/coastline/coastlineDatasetService';

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

export function registerCoastlineRoutes(app: Express): void {
  app.get('/api/coastline/near', (request: Request, response: Response) => {
    const latitude = parseNumber(request.query.lat);
    const longitude = parseNumber(request.query.lon);
    const radiusKm = parseNumber(request.query.radiusKm) ?? 50;

    if (latitude === null || longitude === null) {
      response.status(400).json({
        error: 'lat and lon query parameters are required numbers'
      });
      return;
    }

    if (radiusKm <= 0 || radiusKm > 200) {
      response.status(400).json({
        error: 'radiusKm must be between 0 and 200'
      });
      return;
    }

    const nearby = coastlineDatasetService.getNearbyFeatures(
      { latitude, longitude },
      radiusKm
    );

    response.json(nearby);
  });
}
