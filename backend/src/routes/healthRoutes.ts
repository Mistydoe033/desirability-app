import { Express, Request, Response } from 'express';
import { cityRepository } from '../repositories/cityRepository';
import { cacheService } from '../services/cache/cacheService';
import { logger } from '../utils/logger';

const context = 'HealthRoutes';

export function registerHealthRoutes(app: Express): void {
  app.get('/health', (_request: Request, response: Response) => {
    try {
      const redis = cacheService.isConnected() ? 'connected' : 'disconnected';
      const database = cityRepository.count() > 0 ? 'available' : 'unavailable';
      const status = redis === 'connected' && database === 'available' ? 'healthy' : 'degraded';

      response.json({
        status,
        redis,
        database,
        message: 'Service is running'
      });
    } catch (error) {
      logger.error(context, 'REST health endpoint failed', { error });
      response.status(500).json({
        status: 'unhealthy',
        redis: 'error',
        database: 'error',
        message: 'Health check failed'
      });
    }
  });
}
