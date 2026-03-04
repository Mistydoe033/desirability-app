File: [`backend/src/services/scoring/base.ts`](../../../../../backend/src/services/scoring/base.ts)

**What It Does**
- Provides shared scoring utilities and `BaseScorer` abstraction.
- Implements factor creation, weighted averages, and weekly aggregation.

**Why This Structure**
- Ensures all activity scorers produce consistent outputs.
- Encapsulates scoring math so individual scorers stay focused.

**Principles**
- Reuse through abstraction.
- Explainable scoring with consistent factor structure.


**Principles Explained**
- `Reuse through abstraction`: Use shared base classes/helpers to avoid duplicating similar logic.
- `Explainable scoring with consistent factor structure`: Use the same factor shape across scorers so outputs are comparable and easier to debug.
