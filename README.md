# Desirability App

Full-stack TypeScript app that ranks city desirability for:
- Skiing
- Surfing
- Outdoor sightseeing
- Indoor sightseeing

## Run Locally (End-to-End)

## 1) Backend install + env
```bash
cd backend
npm install
cp .env.example .env
```

## 2) Start Redis
Option A (recommended in this repo): do nothing manually.
- `npm run dev` runs `npm run ensure:redis` first and auto-starts local Redis for local `REDIS_URL`.

Option B (manual local Redis):
```bash
redis-server --daemonize yes
```

Option C (Docker Redis):
```bash
docker run --name desirability-redis -p 6379:6379 -d redis:7-alpine
```

## 3) Coastline dataset (`coastline.geojson`)
Required by coast-orientation scoring.

If `backend/data/coastline.geojson` is missing, build it:
```bash
cd backend
npm run coastline:download:world
npm run coastline:build:world
```

Notes:
- Requires `unzip` and `ogr2ogr` (GDAL).
- Backend can still start without the file, but coastline-dependent scoring will degrade while unavailable.

## 4) Seed database
```bash
cd backend
npm run seed
```

(Optional full reset)
```bash
cd backend
npm run db:reset
npm run seed
```

## 5) Start backend
```bash
cd backend
npm run dev
```

Default GraphQL endpoint:
- `http://localhost:4000/`
Health endpoint:
- `http://localhost:4000/health`

## 6) Start frontend
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` if needed (default expected backend URL is `http://localhost:4000/`).

## 7) Optional precompute
```bash
cd backend
npm run precompute
```

---

## APIs Used (+ coastline.geojson)
- Open-Meteo Geocoding API
- Open-Meteo Forecast API
- Open-Meteo Marine API
- Open-Meteo Archive API
- Overpass API (POI summary queries)
- Local coastline dataset (`backend/data/coastline.geojson`) for coast orientation/confidence

## Architecture
Main path:
- UI -> GraphQL -> services -> repositories/cache/jobs -> SQLite/Redis/external APIs

Layers:
- Frontend: `frontend/src` (React + Apollo)
- GraphQL contract: `backend/src/schema.ts`, `backend/src/resolvers.ts`
- Weekly scoring: `backend/src/services/scoring/*`
- Yearly/profile scoring: `backend/src/services/features/*`
- Persistence: `backend/src/repositories/*`, `backend/src/db/*`
- Caching and jobs: `backend/src/services/cache/*`, `backend/src/jobs/*`

Exception by design:
- Frontend city autocomplete calls geocoding directly from `frontend/src/services/geo/geoService.ts`.

## Technical Choices
- Thin resolvers; logic isolated in services.
- Activity scorers are separated per activity with shared base aggregation.
- SQLite used for durable state; Redis used for performance caches and lock flags.
- Historical climate + POI + coastline signals feed yearly/profile scoring.
- Scheduled recompute/precompute reduce heavy request-time computation.
- Explainable score payloads (factors/reasons) improve debuggability and trust.

## Weekly vs Yearly Scoring
- Weekly scoring:
  - near-term forecast/marine pipeline (`backend/src/services/scoring/*`)
- Yearly/profile scoring:
  - persisted feature model pipeline (`backend/src/services/features/*`)
- Indoor distinction:
  - weekly indoor scorer: weather-based
  - yearly/profile indoor scorer: POI-heavy

## What I Implemented (Reviewer Quick List)
- Layered TypeScript architecture across frontend/backend
- GraphQL query surface for rank, top-cities, marine, POI, features, health
- Weekly scoring engine with per-activity scorers + explainable outputs
- Yearly/profile scoring model with gates and persisted evidence
- Browse rankings by activity with yearly + weekly metrics and tags
- Details page with activity tabs, weekly factors, daily breakdown
- Surf spot map picker with coordinate-based scoring and stale-request guard
- Open-Meteo integration for geocode/forecast/marine/archive
- Overpass POI integration with fallback behavior
- Coastline orientation/confidence from local coastline dataset
- SQLite persistence for city/rank/summary/feature tables
- Redis caching with timeout fallback, scan invalidation, and lock flags
- Scheduled feature compute + top-cities precompute + one-off precompute runner
- Health reporting query and structured logging/error mapping

## Omissions & Trade-offs
- No automated tests in visible source.
- No auth/user accounts/personalization.
- In-process interval schedulers (single-process model) vs distributed orchestration.
- Frontend autocomplete bypasses backend for responsiveness.

## How AI Was Used

- AI tools used: ChatGPT
- AI contribution scope:
  - rapid scaffolding for non-domain boilerplate
  - documentation drafting and structure refinement
  - option generation for implementation approaches
- Engineering decisions kept human-owned:
  - final module boundaries and folder structure
  - scoring semantics and weekly vs yearly behavior
  - multi-API integration strategy (Open-Meteo + Overpass + coastline dataset)
  - surf coastline/orientation implementation details
- Quality gate:
  - AI output was treated as draft input and only accepted after source-level and runtime validation
