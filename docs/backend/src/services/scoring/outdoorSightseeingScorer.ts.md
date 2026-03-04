File: [`backend/src/services/scoring/outdoorSightseeingScorer.ts`](../../../../../backend/src/services/scoring/outdoorSightseeingScorer.ts)

**What It Does**
- Scores outdoor sightseeing based on temperature, rain, visibility, wind, and UV.
- Outputs weighted factors and reasons.

**Why This Structure**
- Keeps outdoor-specific thresholds separate from other activities.
- Relies on shared `BaseScorer` for consistency.

**Principles**
- Explainable scoring.
- Separation of activity logic.


**Principles Explained**
- `Explainable scoring`: Expose factors and reasons so users can understand how scores were produced.
- `Separation of activity logic`: Keep activity logic in separate modules so each part stays focused and changes don’t ripple.
