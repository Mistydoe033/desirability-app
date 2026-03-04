File: [`backend/src/services/scoring/scoringService.ts`](../../../../../backend/src/services/scoring/scoringService.ts)

**What It Does**
- Orchestrates end-to-end ranking for cities and coordinates.
- Handles caching, geocoding, coastline lookup, and activity scoring.
- Creates candidate cities and triggers background feature refresh.

**Why This Structure**
- Centralizes the request-time scoring pipeline in one service.
- Keeps resolvers thin and focused on API wiring.

**Principles**
- Orchestration layer pattern.
- Cache-aside with data freshness checks.


**Principles Explained**
- `Orchestration layer pattern`: Use a dedicated service to coordinate multiple dependencies instead of mixing logic in controllers/resolvers.
- `Cache-aside with data freshness checks`: Cache responses but revalidate or refresh when data is stale.
