File: [`backend/src/services/cache/cacheService.ts`](../../../../../backend/src/services/cache/cacheService.ts)

**What It Does**
- Wraps Redis with JSON helpers, timeouts, and scan utilities.
- Provides resilience by falling back on timeouts instead of throwing.

**Why This Structure**
- Centralizes Redis logic to avoid duplication and misuse.
- Timeout wrapper keeps API calls responsive even if Redis stalls.

**Principles**
- Cache-aside strategy.
- Resilience to partial outages.


**Principles Explained**
- `Cache-aside strategy`: Read from cache first; on miss, compute/fetch from source and populate the cache.
- `Resilience to partial outages`: Keep the system usable when dependencies fail or degrade.
