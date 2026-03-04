File: [`backend/src/routes/healthRoutes.ts`](../../../../backend/src/routes/healthRoutes.ts)

**What It Does**
- Provides REST `/health` endpoint reporting Redis/DB status.
- Returns degraded/unhealthy when dependencies fail.

**Why This Structure**
- Operational monitoring needs a simple health endpoint outside GraphQL.
- Isolates health logic from core resolvers.

**Principles**
- Observability.
- Fail-fast status reporting.


**Principles Explained**
- `Observability`: Structured logs and health signals make production behavior debuggable.
- `Fail-fast status reporting`: Validate early and stop on invalid conditions to avoid corrupt state.
