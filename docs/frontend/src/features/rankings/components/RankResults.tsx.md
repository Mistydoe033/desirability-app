File: [`frontend/src/features/rankings/components/RankResults.tsx`](../../../../../../frontend/src/features/rankings/components/RankResults.tsx)

**What It Does**
- Layout component that sorts and renders ActivityCard grid.
- Displays location metadata for the ranked city.

**Why This Structure**
- Keeps list rendering separate from data fetching.
- Encourages reuse across search and other views.

**Principles**
- Composition.
- Separation of data and presentation.


**Principles Explained**
- `Composition`: Assemble complex behavior from small, focused pieces.
- `Separation of data and presentation`: Keep data fetching/transform logic separate from rendering components.
