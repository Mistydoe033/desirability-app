File: [`backend/src/services/cache/redisKeys.ts`](../../../../../backend/src/services/cache/redisKeys.ts)

**What It Does**
- Generates consistent Redis key names for all cached entities.
- Normalizes tokens and coordinates for predictable cache lookups.

**Why This Structure**
- Prevents key collisions and scattered naming conventions.
- Makes cache invalidation patterns explicit.

**Principles**
- Consistency and maintainability.
- Single source of cache key truth.


**Principles Explained**
- `Consistency and maintainability`: Standardize patterns to reduce cognitive load during changes.
- `Single source of cache key truth`: All cache keys are generated in one module to avoid collisions.
