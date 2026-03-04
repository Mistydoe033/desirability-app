File: [`frontend/src/pages/Browse.tsx`](../../../../frontend/src/pages/Browse.tsx)

**What It Does**
- Browse page for top cities by activity.
- Uses tabs, loading skeletons, and detail navigation.

**Why This Structure**
- Keeps browsing logic and ranking UI at the route level.
- Derives state from URL to support shareable filters.

**Principles**
- Derived state from URL.
- User-centric loading feedback.


**Principles Explained**
- `Derived state from URL`: Use the URL as a source of truth so state is shareable and bookmarkable.
- `User-centric loading feedback`: Loading states describe what’s happening from the user’s perspective. Examples in this file:
  - The label `Building annual rankings from historical data...` tells the user what the system is doing, not just that it is loading.
  - `BrowseLoadingGrid` renders skeleton cards so the layout stays stable while results are fetched.
  - `showInitialLoading` only shows the loading UI when there are no cached cities yet, avoiding unnecessary spinners when data is already on screen.
