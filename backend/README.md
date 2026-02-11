# Desirability Backend

GraphQL backend for city desirability scoring with SQLite persistence, Redis caching, external weather/marine services, POI enrichment, and coastline-orientation analysis.

## Stack
- Node.js + TypeScript
- Express + Apollo Server (GraphQL)
- SQLite (`better-sqlite3`)
- Redis (`ioredis`)
- Open-Meteo + Overpass + local coastline dataset

## Run locally

1. Install dependencies:
```bash
npm install
```

2. Configure env:
```bash
cp .env.example .env
```

3. Seed initial city data:
```bash
npm run seed
```

4. Start API (schedulers run on intervals, not immediately):
```bash
npm run dev
```

Endpoints:
- GraphQL: `http://localhost:4000/`
- Health: `http://localhost:4000/health`

`npm run dev` runs `scripts/dev/ensure-redis.js` first:
- For local `REDIS_URL` (`redis://localhost:...`), it starts local Redis if needed.
- For remote/managed `REDIS_URL`, it skips local startup.

5. Build:
```bash
npm run build
```

6. Run one-off precompute pipeline:
```bash
npm run precompute
```

## Key behavior notes

### Weekly vs yearly scoring
- Weekly scores: `src/services/scoring/*`
- Yearly/profile feature scores: `src/services/features/featureScoringService.ts`
- Indoor sightseeing:
  - weekly scorer is weather-based
  - yearly/profile scorer is POI-heavy

### City vs spot surf scoring
- City surf ranking uses city coordinates + local coastline dataset orientation service.
- Spot surf scoring uses selected coordinates and computes coast orientation for that point.
- Wind quality is scored relative to coast orientation (offshore/onshore geometry).

### Persistence model
Current SQLite tables are initialized in `src/db/database.ts`:
- `cities`
- `city_weather_summary`
- `city_poi_summary`
- `city_rank_cache`
- `city_feature_assignments`
- `city_feature_evidence`

Note: legacy `city_coast` is explicitly dropped by schema initialization.

## Additional docs
See `backend/docs/`:
- `README.md`
- `external-services.md`
- `data-model.md`
- `feature-scoring.md`
- `job-system.md`
- `caching-strategy.md`
- `backend-file-reference.md`
