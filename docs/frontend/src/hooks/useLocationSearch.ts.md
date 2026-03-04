File: [`frontend/src/hooks/useLocationSearch.ts`](../../../../frontend/src/hooks/useLocationSearch.ts)

**What It Does**
- Manages autocomplete state, loading, and errors for city search.
- Uses debounced input and abortable fetches.

**Why This Structure**
- Encapsulates search logic away from the UI input component.
- Improves readability and testability of the search flow.

**Principles**
- Separation of concerns.
- Resilient async handling.


**Principles Explained**
- `Separation of concerns`: Keep each module focused on a single responsibility (UI, data, domain logic) so changes stay localized.
- `Resilient async handling`: Keep the system usable when dependencies fail or degrade.
