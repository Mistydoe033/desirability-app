File: [`backend/src/repositories/cityRankCacheRepository.ts`](../../../../backend/src/repositories/cityRankCacheRepository.ts)

**What It Does**
- Reads and writes cached rank results in SQLite.
- Provides persistence when Redis cache is cold or unavailable.

**Why This Structure**
- Keeps a durable cache separate from Redis for resilience.
- Encapsulates SQL details behind a small interface.

**Principles**
- Cache layering.
- Single responsibility.


**Principles Explained**
- `Cache layering`: Use more than one cache tier (e.g., Redis + SQLite) to improve resilience and speed.
- `Single responsibility`: Each module does one thing well, making changes safer and testing simpler.
