File: [`backend/src/services/features/featureComputationService.ts`](../../../../../backend/src/services/features/featureComputationService.ts)

**What It Does**
- Orchestrates feature computation for cities and batches.
- Manages cache invalidation and persistence.

**Why This Structure**
- Separates long-running feature computation from request-time scoring.
- Provides concurrency control for batch processing.

**Principles**
- Orchestration and batching.
- Cache consistency.


**Principles Explained**
- `Orchestration and batching`: Coordinate multi-step workflows and process items in batches for efficiency.
- `Cache consistency`: Invalidate or refresh cached data when the underlying source changes.
