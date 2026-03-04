File: [`backend/scripts/dev/ensure-redis.js`](../../../../backend/scripts/dev/ensure-redis.js)

**What It Does**
- Checks `REDIS_URL` and starts local Redis if needed.
- Skips auto-start for non-local or TLS (`rediss://`) endpoints.

**Why This Structure**
- Improves developer experience by removing manual Redis setup.
- Avoids unsafe auto-start when using managed Redis instances.

**Principles**
- Developer ergonomics.
- Safety through explicit checks.


**Principles Explained**
- `Developer ergonomics`: Optimize workflows to reduce setup friction and improve iteration speed.
- `Safety through explicit checks`: Validate assumptions before acting to avoid bad states.
