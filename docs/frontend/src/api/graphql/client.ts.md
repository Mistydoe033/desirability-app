File: [`frontend/src/api/graphql/client.ts`](../../../../../frontend/src/api/graphql/client.ts)

**What It Does**
- Creates ApolloClient with error logging and cache policies.
- Configures GraphQL HTTP link using `VITE_API_URL`.

**Why This Structure**
- Keeps API transport and caching in one place.
- Avoids GraphQL setup duplication across pages.

**Principles**
- Centralized data layer.
- Observability for GraphQL errors.


**Principles Explained**
- `Centralized data layer`: Keep data fetching/caching logic in one place to avoid duplication.
- `Observability for GraphQL errors`: Log GraphQL and network errors consistently to aid debugging.
