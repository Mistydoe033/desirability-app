File: [`backend/src/repositories/cityPoiSummaryRepository.ts`](../../../../backend/src/repositories/cityPoiSummaryRepository.ts)

**What It Does**
- Persists and retrieves POI summaries per city.
- Normalizes JSON storage with typed mapping on read.

**Why This Structure**
- Keeps POI data durable and cacheable.
- Abstracts SQL access for easier evolution.

**Principles**
- Separation of concerns.
- Durable caching.


**Principles Explained**
- `Separation of concerns`: Keep each module focused on a single responsibility (UI, data, domain logic) so changes stay localized.
- `Durable caching`: Persist cached results so they survive restarts.
