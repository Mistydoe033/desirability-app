File: [`frontend/src/api/graphql/queries.ts`](../../../../../frontend/src/api/graphql/queries.ts)

**What It Does**
- Defines GraphQL queries for rankings, marine data, and feature/POI info.
- Exports query documents used by pages and hooks.

**Why This Structure**
- Keeps query definitions co-located and reusable.
- Allows consistent query shapes across the app.

**Principles**
- Separation of data definitions from UI.
- Single source of truth for GraphQL documents.


**Principles Explained**
- `Separation of data definitions from UI`: Define GraphQL documents separately so UI components focus on rendering.
- `Single source of truth for GraphQL documents`: Keep graphql documents defined in one authoritative place to prevent drift.
