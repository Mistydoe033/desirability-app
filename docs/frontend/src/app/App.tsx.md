File: [`frontend/src/app/App.tsx`](../../../../frontend/src/app/App.tsx)

**What It Does**
- Defines route structure for Home, Search, Browse, and Details pages.
- Wraps routes in the shared `MainLayout`.

**Why This Structure**
- Keeps routing separate from layout and page logic.
- Makes navigation behavior easy to audit in interviews.

**Principles**
- Separation of concerns.
- Declarative routing.


**Principles Explained**
- `Separation of concerns`: Keep each module focused on a single responsibility (UI, data, domain logic) so changes stay localized.
- `Declarative routing`: Describe routes as a static map from paths to components; the router handles navigation and state transitions.
