File: [`backend/src/services/scoring/surfingScorer.ts`](../../../../../backend/src/services/scoring/surfingScorer.ts)

**What It Does**
- Computes daily surfing scores using swell, wave, period, wind, and water temp.
- Handles missing marine data and inland/coastline uncertainty.

**Why This Structure**
- Surfing has unique dependence on coast orientation, so logic is isolated.
- Defensive checks prevent false positives on inland locations.

**Principles**
- Defensive programming.
- Domain-specific scoring logic.


**Principles Explained**
- `Defensive programming`: Guard against nulls/outliers so computations stay safe.
- `Domain-specific scoring logic`: Each activity’s rules live in its own scorer.
