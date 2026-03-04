File: [`backend/src/services/scoring/scoringDays.ts`](../../../../../backend/src/services/scoring/scoringDays.ts)

**What It Does**
- Combines daily forecast data with marine summaries into scoring inputs.
- Aligns marine metrics by date for consistent scoring.

**Why This Structure**
- Separates data shaping from scoring algorithms.
- Keeps input normalization in one place.

**Principles**
- Separation of transformation and evaluation.
- Deterministic data shaping.


**Principles Explained**
- `Separation of transformation and evaluation`: Shape inputs first, then score them, so logic is easier to audit.
- `Deterministic data shaping`: Transform data into a consistent shape so scoring logic is stable and predictable.
