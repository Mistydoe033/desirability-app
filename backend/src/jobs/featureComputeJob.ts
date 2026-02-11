import { env } from '../config/env';
import { featureComputationService } from '../services/features/featureComputationService';
import { cacheService } from '../services/cache/cacheService';
import { redisKeys } from '../services/cache/redisKeys';
import { topCitiesService } from '../services/topCitiesService';
import { logger } from '../utils/logger';

const context = 'FeatureComputeJob';

export async function featureComputeJob(): Promise<void> {
  const startedAt = Date.now();
  const lockTtlSeconds = Math.max(300, env.FEATURE_COMPUTE_INTERVAL_MINUTES * 60);
  await cacheService.setFlag(redisKeys.featureComputeLock(), true, lockTtlSeconds);
  logger.info(context, 'Feature compute job started');

  try {
    const summary = await featureComputationService.computeForCandidates();
    await topCitiesService.invalidateTopCitiesCache();

    logger.info(context, 'Feature compute job finished', {
      ...summary,
      durationMs: Date.now() - startedAt
    });
  } finally {
    await cacheService.delete(redisKeys.featureComputeLock());
  }
}

export function startFeatureComputeScheduler(): NodeJS.Timeout {
  logger.info(context, 'Feature compute scheduler armed', {
    intervalMinutes: env.FEATURE_COMPUTE_INTERVAL_MINUTES,
    immediateRun: false
  });
  return setInterval(() => {
    featureComputeJob().catch((error) => {
      logger.error(context, 'Scheduled feature compute failed', error);
    });
  }, env.FEATURE_COMPUTE_INTERVAL_MINUTES * 60 * 1000);
}
