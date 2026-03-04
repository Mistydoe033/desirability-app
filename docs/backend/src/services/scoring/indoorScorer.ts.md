File: [`backend/src/services/scoring/indoorScorer.ts`](../../../../../backend/src/services/scoring/indoorScorer.ts)

**What It Does**
- Scores indoor sightseeing based on weather discomfort signals.
- Rewards rainy or uncomfortable outdoor conditions.

**Why This Structure**
- Indoor scoring differs from outdoor logic and stays isolated.
- Uses shared factor formatting for consistent output.

**Principles**
- Single responsibility.
- Consistent scoring output.


**Principles Explained**
- `Single responsibility`: Each module does one thing well, making changes safer and testing simpler.
- `Consistent scoring output`: All scorers return the same shape to simplify UI and debugging.
