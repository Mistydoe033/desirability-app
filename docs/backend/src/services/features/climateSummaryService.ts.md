File: [`backend/src/services/features/climateSummaryService.ts`](../../../../../backend/src/services/features/climateSummaryService.ts)

**What It Does**
- Builds annual climate summaries from historical or sampled forecast data.
- Caches and persists summaries with staleness checks.

**Why This Structure**
- Abstracts historical weather sampling from feature scoring logic.
- Fallback strategy keeps the system functional when archive data fails.

**Principles**
- Resilient data sourcing.
- Cache-aside persistence.


**Principles Explained**
- `Resilient data sourcing`: Keep the system usable when dependencies fail or degrade.
- `Cache-aside persistence`: Combine cache-aside with durable storage so computed results survive restarts.
