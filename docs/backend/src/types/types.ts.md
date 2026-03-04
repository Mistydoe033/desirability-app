File: [`backend/src/types/types.ts`](../../../../backend/src/types/types.ts)

**What It Does**
- Shared domain and API types for coordinates, scoring, features, and persistence.
- Defines DB row shapes and GraphQL result models.

**Why This Structure**
- Type sharing reduces duplication between layers.
- Improves compile-time guarantees and refactoring safety.

**Principles**
- Type safety.
- Explicit domain modeling.


**Principles Explained**
- `Type safety`: Use TypeScript types to catch errors early and keep contracts explicit.
- `Explicit domain modeling`: Model domain entities explicitly to avoid implicit business rules.
