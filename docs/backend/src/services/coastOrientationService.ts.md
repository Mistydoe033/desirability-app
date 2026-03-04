File: [`backend/src/services/coastOrientationService.ts`](../../../../backend/src/services/coastOrientationService.ts)

**What It Does**
- Computes coast-facing orientation and confidence near a point or city.
- Uses cached results and falls back to "inland" when too far from coast.

**Why This Structure**
- Keeps coastal geometry logic isolated from scoring rules.
- Caching reduces repeated geospatial computation.

**Principles**
- Domain logic isolation.
- Cache-aside performance.


**Principles Explained**
- `Domain logic isolation`: Keep business rules separate from IO and UI code.
- `Cache-aside performance`: Use cache-aside to reduce repeated expensive computations.
