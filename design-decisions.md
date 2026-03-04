# Design Decisions

## 1) Problem framing and goals
I treated this assessment as two related problems:
- Give users a **short-term (weekly)** answer for "what should I do this week?"
- Give users a **structural (yearly/profile)** answer for "what is this city generally good for?"

That split drove most design choices.

## 2) Architecture and boundaries
I used a layered TypeScript architecture:
- `frontend` for user interaction
- GraphQL API as a stable contract (`backend/src/schema.ts`)
- thin resolvers (`backend/src/resolvers.ts`)
- service layer for scoring, feature computation, coastal logic, and external integrations
- repository layer for SQLite persistence
- Redis cache and background jobs for performance

Why:
- keep business logic out of resolvers
- isolate external APIs behind services
- make scoring and feature logic testable/reasonable to evolve by module

## 3) Weekly vs yearly scoring split
I intentionally separated scoring paths:
- **Weekly scoring** in `backend/src/services/scoring/*` uses forecast/marine data for near-term recommendations.
- **Yearly/profile scoring** in `backend/src/services/features/*` uses historical climate + POI + coast signals.

Why:
- these are different decision horizons
- prevents one model from being overfit to both real-time and long-horizon use cases
- improves explainability in UI ("this week" vs "city profile")

## 4) Activity-specific scorer design
I used a scorer-per-activity strategy (`skiingScorer`, `surfingScorer`, etc.) with a small factory (`scoring/factory.ts`).

Why:
- each activity has different domain signals and thresholds
- adding a new activity becomes additive instead of invasive
- easier to reason about weighting/gates by domain

## 5) Explainability as a product requirement
Scores return factors/reasons, not just a number (`Factor`, `ScoreDetail` in schema).

Why:
- improves trust during ranking disagreements
- helps debug data quality issues quickly
- lets UI present "why" and not only "what"

## 6) Persistence strategy: SQLite + Redis
I used:
- **SQLite** for durable city metadata, summaries, and computed feature evidence
- **Redis** for request/result caching, lock flags, and fast invalidation

Why:
- SQLite is simple and reliable for assessment scope
- Redis gives low-latency cache behavior without complicating the core model
- this hybrid setup keeps cold-start recomputation manageable

## 7) Cache and resilience behavior
Key choices in cache behavior (`cacheService.ts`):
- cache-aside reads/writes
- operation timeout with safe fallback
- pattern invalidation for top-city caches
- lock flags to avoid stale reads during background recompute

Why:
- fail soft when Redis is degraded
- avoid hard dependency on cache for correctness
- preserve responsiveness

## 8) Precompute and background jobs
I added two scheduled jobs:
- `featureComputeJob` for yearly feature refresh
- `precomputeTopCitiesJob` for ranked list warmup

Why:
- moves expensive work off hot request paths
- makes top-city responses fast and stable
- keeps annual profiles fresh with algorithm/version checks

Tradeoff:
- schedulers are in-process, so this is not yet a distributed job system.

## 9) Coastline orientation for surf scoring
I used a local coastline GeoJSON index (`coastlineDatasetService.ts`) and orientation logic (`coastOrientationService.ts`) to score wind relative to coastline orientation.

Why:
- surf quality depends on offshore/onshore geometry, not raw wind alone
- local indexed data avoids repeated external geospatial calls
- confidence scoring + inland fallback improves reliability

## 10) External data strategy and fallbacks
I used multiple external data paths with fallback logic:
- climate summary: historical archive -> seasonal sample -> forecast approximation
- POI summary: Overpass counts -> population-proxy fallback

Why:
- external data can be incomplete or rate-limited
- graceful degradation is better than failing the user request

## 11) Frontend interaction choices
Important UX decisions:
- direct geocoding from frontend for low-latency autocomplete (`geoService.ts`)
- stale-request guard (`useLatestRequestGuard.ts`) for map-click surf diagnostics
- parallel spot diagnostics queries with partial-result handling (`Details.tsx`)

Why:
- reduce perceived latency in search
- prevent race conditions from rapid map clicks
- keep UI useful even when one of several spot calls fails

## 12) Data modeling choices
I persisted both compact feature profile and normalized per-feature assignment/evidence tables.

Why:
- compact JSON simplifies read paths
- normalized tables support filtering, migration checks, and future analytics
- algorithm version fields support safe recompute on model changes

## 13) Main tradeoffs I accepted
- No automated tests in this submission (risk: regression detection).
- In-process scheduling instead of distributed workers.
- No auth/personalization layer.
- Heavy scoring quality depends on third-party data quality.

Given assessment scope, I prioritized clean boundaries, explainability, and operational resilience over platform-scale concerns.

## 14) How I would explain this in the interview
1. Start with the two-horizon model (weekly vs yearly) as the core design choice.
2. Walk request flow: UI -> GraphQL -> services -> repositories/cache/jobs -> external APIs.
3. Show one concrete deep dive: surf scoring (coast orientation + marine + reasons/factors).
4. Explain resilience/fallbacks and where degradation is intentional.
5. Close with tradeoffs and next improvements (tests, distributed scheduling, stronger observability).
