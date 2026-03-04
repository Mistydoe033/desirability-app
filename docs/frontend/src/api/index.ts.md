File: [`frontend/src/api/index.ts`](../../../../frontend/src/api/index.ts)

**What It Does**
- Barrel exports for GraphQL client and query documents.
- Simplifies imports from the API layer.

**Why This Structure**
- Encapsulates API surface to reduce import churn.
- Maintains a clean layering boundary.

**Principles**
- Encapsulation.
- Maintainable import paths.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Maintainable import paths`: Barrel files avoid deep relative paths that are brittle to refactors.
