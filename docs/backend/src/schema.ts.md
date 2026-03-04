File: [`backend/src/schema.ts`](../../../backend/src/schema.ts)

**What It Does**
- Defines GraphQL schema for queries and response shapes.
- Establishes shared contract for frontend consumption.

**Why This Structure**
- Separates API contract from resolver logic.
- Keeps schema readable and auditable for interview discussion.

**Principles**
- Contract-first API design.
- Explicit data modeling.


**Principles Explained**
- `Contract-first API design`: Define the schema first so client/server agree on shapes before implementation.
- `Explicit data modeling`: Define data shapes clearly so the API contract is unambiguous.
