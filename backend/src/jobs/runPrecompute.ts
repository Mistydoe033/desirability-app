import { precomputeTopCitiesJob } from './precomputeTopCities';
import { featureComputeJob } from './featureComputeJob';
import { databaseClient } from '../db/database';
import { seedDatabase } from '../db/seed';
import { cacheService } from '../services/cache/cacheService';
import { coastlineDatasetService } from '../services/coastline/coastlineDatasetService';
import { logger } from '../utils/logger';

async function runPrecompute(): Promise<void> {
  const context = 'RunPrecompute';
  const startedAt = Date.now();

  try {
    databaseClient.initialize();
    seedDatabase();
    await coastlineDatasetService.initialize();
    logger.info(context, 'Coastline dataset ready', coastlineDatasetService.getStats());

    await featureComputeJob();
    await precomputeTopCitiesJob();

    logger.info(context, 'Precompute run completed successfully', {
      durationMs: Date.now() - startedAt
    });
    process.exit(0);
  } catch (error) {
    logger.error(context, 'Precompute run failed', error);
    process.exit(1);
  } finally {
    await cacheService.close().catch(() => undefined);
    databaseClient.close();
  }
}

runPrecompute().catch((error) => {
  console.error(error);
  process.exit(1);
});
