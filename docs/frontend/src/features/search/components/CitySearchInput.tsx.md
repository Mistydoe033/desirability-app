File: [`frontend/src/features/search/components/CitySearchInput.tsx`](../../../../../../frontend/src/features/search/components/CitySearchInput.tsx)

**What It Does**
- Autocomplete input for city search with loading and error states.
- Uses `useLocationSearch` to fetch suggestions.

**Why This Structure**
- Separates UI input from search logic.
- Keeps the search field reusable across pages.

**Principles**
- Component encapsulation.
- Reusability.


**Principles Explained**
- `Component encapsulation`: Keep component internals private so they can evolve safely.
- `Reusability`: Design modules so they can be reused in other features or screens.
