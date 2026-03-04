File: [`frontend/src/index.ts`](../../../frontend/src/index.ts)

**What It Does**
- Top-level barrel exports for app, components, hooks, and services.
- Defines the public surface of the frontend module tree.

**Why This Structure**
- Simplifies import paths and improves discoverability.
- Encourages a layered mental model for the codebase.

**Principles**
- Encapsulation.
- Clear module boundaries.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Clear module boundaries`: Define explicit module APIs to reduce cross-module coupling.
