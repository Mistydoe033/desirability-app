File: [`backend/src/services/topCitiesService.ts`](../../../../backend/src/services/topCitiesService.ts)

**What It Does**
- Computes top cities per activity using yearly scores and weekly forecast hydration.
- Ensures annual feature profiles are fresh and caches results.

**Why This Structure**
- Separates ranking logic from GraphQL resolvers and jobs.
- Uses caching and precompute for performance and responsiveness.

**Principles**
- Cache-first ranking.
- Data freshness and resilience.


**Principles Explained**
- `Cache-first ranking`: Prefer cached rankings for speed and only recompute when missing or stale.
- `Data freshness and resilience`: Keep data up to date while handling outages gracefully.
