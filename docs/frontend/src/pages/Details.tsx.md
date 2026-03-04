File: [`frontend/src/pages/Details.tsx`](../../../../frontend/src/pages/Details.tsx)

**What It Does**
- Activity details page with weekly factors, daily breakdown, and surf spot tools.
- Orchestrates multiple queries (rank, features, POI, marine).

**Why This Structure**
- Keeps complex data orchestration in one route-level component.
- Separates surf spot logic into feature components and hooks.

**Principles**
- Progressive enhancement of data.
- Concurrency safety with request guards.


**Principles Explained**
- `Progressive enhancement of data`: Render with baseline data first and fill in extra details as they load.
- `Concurrency safety with request guards`: Track the latest request and ignore out-of-order responses to prevent stale UI updates.
