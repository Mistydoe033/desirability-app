File: `docs/backend/README.md`

**What It Does**
- High-level backend architecture overview and study guide.
- Summarizes data flow: GraphQL -> services -> repositories -> SQLite/Redis/external APIs.

**Why This Structure**
- Backend has many subsystems (scoring, features, jobs, cache) that benefit from a single narrative.
- Separates backend understanding from frontend behavior for interview focus.

**Principles**
- Layered architecture with thin resolvers.
- Cache-aside and defensive IO boundaries.



**Principles Explained**
- `Layered architecture with thin resolvers`: Separate API, services, and data layers to reduce coupling.
- `Cache-aside and defensive IO boundaries`: Read from cache first; on miss compute/fetch from source and populate the cache.

**Study Order**
- [src/index.ts.md](src/index.ts.md)
- [src/schema.ts.md](src/schema.ts.md)
- [src/resolvers.ts.md](src/resolvers.ts.md)
- [src/config/env.ts.md](src/config/env.ts.md)
- [src/constants/constants.ts.md](src/constants/constants.ts.md)
- [src/types/types.ts.md](src/types/types.ts.md)
- [src/db/database.ts.md](src/db/database.ts.md)
- [src/db/seed.ts.md](src/db/seed.ts.md)
- [src/repositories/cityRepository.ts.md](src/repositories/cityRepository.ts.md)
- [src/repositories/cityRankCacheRepository.ts.md](src/repositories/cityRankCacheRepository.ts.md)
- [src/repositories/cityWeatherSummaryRepository.ts.md](src/repositories/cityWeatherSummaryRepository.ts.md)
- [src/repositories/cityPoiSummaryRepository.ts.md](src/repositories/cityPoiSummaryRepository.ts.md)
- [src/services/cache/cacheService.ts.md](src/services/cache/cacheService.ts.md)
- [src/services/cache/redisKeys.ts.md](src/services/cache/redisKeys.ts.md)
- [src/services/external/httpClient.ts.md](src/services/external/httpClient.ts.md)
- [src/services/external/weatherService.ts.md](src/services/external/weatherService.ts.md)
- [src/services/external/units.ts.md](src/services/external/units.ts.md)
- [src/services/coastline/coastlineDatasetService.ts.md](src/services/coastline/coastlineDatasetService.ts.md)
- [src/services/coastOrientationService.ts.md](src/services/coastOrientationService.ts.md)
- [src/services/scoring/base.ts.md](src/services/scoring/base.ts.md)
- [src/services/scoring/scoringDays.ts.md](src/services/scoring/scoringDays.ts.md)
- [src/services/scoring/factory.ts.md](src/services/scoring/factory.ts.md)
- [src/services/scoring/skiingScorer.ts.md](src/services/scoring/skiingScorer.ts.md)
- [src/services/scoring/surfingScorer.ts.md](src/services/scoring/surfingScorer.ts.md)
- [src/services/scoring/outdoorSightseeingScorer.ts.md](src/services/scoring/outdoorSightseeingScorer.ts.md)
- [src/services/scoring/indoorScorer.ts.md](src/services/scoring/indoorScorer.ts.md)
- [src/services/scoring/scoringService.ts.md](src/services/scoring/scoringService.ts.md)
- [src/services/features/featureProfile.ts.md](src/services/features/featureProfile.ts.md)
- [src/services/features/featureScoringService.ts.md](src/services/features/featureScoringService.ts.md)
- [src/services/features/climateSummaryService.ts.md](src/services/features/climateSummaryService.ts.md)
- [src/services/features/poiSummaryService.ts.md](src/services/features/poiSummaryService.ts.md)
- [src/services/features/featureComputationService.ts.md](src/services/features/featureComputationService.ts.md)
- [src/services/topCitiesService.ts.md](src/services/topCitiesService.ts.md)
- [src/jobs/featureComputeJob.ts.md](src/jobs/featureComputeJob.ts.md)
- [src/jobs/precomputeTopCities.ts.md](src/jobs/precomputeTopCities.ts.md)
- [src/jobs/runPrecompute.ts.md](src/jobs/runPrecompute.ts.md)
- [src/routes/healthRoutes.ts.md](src/routes/healthRoutes.ts.md)
- [src/routes/coastlineRoutes.ts.md](src/routes/coastlineRoutes.ts.md)
- [src/utils/errors.ts.md](src/utils/errors.ts.md)
- [src/utils/graphql.ts.md](src/utils/graphql.ts.md)
- [src/utils/logger.ts.md](src/utils/logger.ts.md)
