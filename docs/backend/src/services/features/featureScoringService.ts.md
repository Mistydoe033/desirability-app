File: [`backend/src/services/features/featureScoringService.ts`](../../../../../backend/src/services/features/featureScoringService.ts)

**What It Does**
- Computes yearly feature scores for each activity using climate, POI, and coastline signals.
- Produces evidence and gating explanations for explainability.

**Why This Structure**
- Separates yearly/profile scoring from weekly forecast scoring.
- Keeps feature gating rules centralized and versioned.

**Principles**
- Explainable scoring.
- Rule-based feature gating.


**Principles Explained**
- `Explainable scoring`: Expose factors and reasons so users can understand how scores were produced.
- `Rule-based feature gating`: Apply thresholds so a feature only activates when minimum conditions are met.
