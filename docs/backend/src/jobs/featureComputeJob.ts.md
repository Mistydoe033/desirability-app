File: [`backend/src/jobs/featureComputeJob.ts`](../../../../backend/src/jobs/featureComputeJob.ts)

**What It Does**
- Scheduled job that recomputes feature profiles for candidate cities.
- Uses Redis lock flags and invalidates top-cities cache.

**Why This Structure**
- Prevents overlapping runs via lock keys.
- Keeps slow computations off request paths.

**Principles**
- Idempotent background processing.
- Operational safety.


**Principles Explained**
- `Idempotent background processing`: Jobs can run multiple times without corrupting state or duplicating results.
- `Operational safety`: Use locks and guarded jobs to avoid overlapping or destructive runs.
