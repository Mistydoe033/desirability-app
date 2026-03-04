File: [`backend/src/services/scoring/geo.ts`](../../../../../backend/src/services/scoring/geo.ts)

**What It Does**
- Utility functions for bearings, distances, and angular differences.
- Used by surf scoring and coastline orientation logic.

**Why This Structure**
- Keeps math utilities separate from domain logic.
- Promotes reuse and testability.

**Principles**
- Pure functions.
- Single-purpose utilities.


**Principles Explained**
- `Pure functions`: Avoid side effects so functions are predictable and testable.
- `Single-purpose utilities`: Helpers do one job to stay predictable.
