import pLimit from 'p-limit';
import { env } from '../config/env';
import { cityRepository } from '../repositories/cityRepository';
import { topCitiesService } from '../services/topCitiesService';
import { coastOrientationService } from '../services/coastOrientationService';
import { cacheService } from '../services/cache/cacheService';
import { redisKeys } from '../services/cache/redisKeys';
import { logger } from '../utils/logger';

const context = 'PrecomputeJob';

export async function precomputeTopCitiesJob(): Promise<void> {
  const startedAt = Date.now();
  const lockTtlSeconds = Math.max(300, env.PRECOMPUTE_INTERVAL_MINUTES * 60);
  await cacheService.setFlag(redisKeys.precomputeLock(), true, lockTtlSeconds);
  logger.info(context, 'Precompute job started');

  try {
    const candidates = cityRepository.listAllCandidateCities();
    const limiter = pLimit(env.PRECOMPUTE_CONCURRENCY_LIMIT);

    await Promise.all(
      candidates.map((city) =>
        limiter(async () => {
          await coastOrientationService.getCityOrientation(city);
        })
      )
    );

    const result = await topCitiesService.precomputeAllActivities(env.PRECOMPUTE_TOP_CITIES_LIMIT);
    logger.info(context, 'Precompute job finished', {
      activities: Object.keys(result),
      cityCount: candidates.length,
      durationMs: Date.now() - startedAt
    });
  } finally {
    await cacheService.delete(redisKeys.precomputeLock());
  }
}

export function startPrecomputeScheduler(): NodeJS.Timeout {
  logger.info(context, 'Precompute scheduler armed', {
    intervalMinutes: env.PRECOMPUTE_INTERVAL_MINUTES,
    immediateRun: false
  });
  return setInterval(() => {
    precomputeTopCitiesJob().catch((error) => {
      logger.error(context, 'Scheduled precompute failed', error);
    });
  }, env.PRECOMPUTE_INTERVAL_MINUTES * 60 * 1000);
}
