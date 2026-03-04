File: [`frontend/src/pages/Search.tsx`](../../../../frontend/src/pages/Search.tsx)

**What It Does**
- City search page that runs the `rank` query.
- Synchronizes search state with URL parameters and renders results.

**Why This Structure**
- Page owns its query and URL state to make results shareable.
- Delegates input and rendering to feature components.

**Principles**
- State synchronization.
- Composition over monolith components.


**Principles Explained**
- `State synchronization`: Keep UI state aligned with URL or data sources to avoid drift.
- `Composition over monolith components`: Build complex behavior by composing small, focused parts.
