File: [`backend/src/services/scoring/skiingScorer.ts`](../../../../../backend/src/services/scoring/skiingScorer.ts)

**What It Does**
- Computes daily skiing scores from snow, temperature, wind, and elevation.
- Produces explainable factors and reasons.

**Why This Structure**
- Encapsulates skiing-specific thresholds and weights in one module.
- Keeps base scoring logic reusable across activities.

**Principles**
- Single responsibility.
- Explainable rule-based scoring.


**Principles Explained**
- `Single responsibility`: Each module does one thing well, making changes safer and testing simpler.
- `Explainable rule-based scoring`: Use explicit thresholds and rules so scores are traceable.
