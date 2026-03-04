File: [`frontend/src/features/rankings/components/ActivityCard.tsx`](../../../../../../frontend/src/features/rankings/components/ActivityCard.tsx)

**What It Does**
- Visual summary card for an activity’s weekly score and drivers.
- Renders factors, reasons, and a 4-day trend.

**Why This Structure**
- Encapsulates complex UI rendering and formatting.
- Keeps ranking presentation reusable in different pages.

**Principles**
- Presentational component design.
- Explainable UI.


**Principles Explained**
- `Presentational component design`: Component focuses on rendering props and avoids data fetching or side effects.
- `Explainable UI`: Make computed results interpretable by showing the key drivers in the UI.
