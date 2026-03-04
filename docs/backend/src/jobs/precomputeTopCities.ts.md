File: [`backend/src/jobs/precomputeTopCities.ts`](../../../../backend/src/jobs/precomputeTopCities.ts)

**What It Does**
- Scheduled job that precomputes top city rankings and warms coastline cache.
- Uses Redis lock flags and concurrency limits.

**Why This Structure**
- Precompute keeps UI queries fast and stable.
- Locking avoids contention and duplicated work.

**Principles**
- Precomputation for performance.
- Concurrency control.


**Principles Explained**
- `Precomputation for performance`: Compute heavy results ahead of time to keep requests fast.
- `Concurrency control`: Control or guard parallel work to avoid races and overload.
