File: [`backend/src/services/features/poiSummaryService.ts`](../../../../../backend/src/services/features/poiSummaryService.ts)

**What It Does**
- Fetches POI counts via Overpass API and computes density/confidence.
- Falls back to population proxy when Overpass fails.

**Why This Structure**
- Keeps external POI integration isolated and resilient.
- Ensures the indoor scoring model always has usable signals.

**Principles**
- Graceful degradation.
- IO boundary encapsulation.


**Principles Explained**
- `Graceful degradation`: Provide fallbacks when dependencies fail instead of hard failing the app.
- `IO boundary encapsulation`: Keep external API calls in dedicated modules to isolate failures and retries.
