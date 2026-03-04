File: [`frontend/src/features/surf/components/SurfSpotPanel.tsx`](../../../../../../frontend/src/features/surf/components/SurfSpotPanel.tsx)

**What It Does**
- Surf spot diagnostics panel with map picker and marine readouts.
- Shows baseline city score vs selected spot score and reasons.

**Why This Structure**
- Isolates surf-specific UI from the broader Details page.
- Keeps map and diagnostics logic cohesive and testable.

**Principles**
- Feature isolation.
- Explainable UI for domain-specific data.


**Principles Explained**
- `Feature isolation`: Keep feature-specific code grouped to minimize cross-feature coupling.
- `Explainable UI for domain-specific data`: Show domain drivers (e.g., swell, snow) so the user understands why a score is high or low.
