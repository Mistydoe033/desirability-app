File: [`frontend/src/hooks/index.ts`](../../../../frontend/src/hooks/index.ts)

**What It Does**
- Barrel export for custom hooks.
- Keeps import paths concise across the app.

**Why This Structure**
- Defines a clean public API for hooks.
- Avoids deep import paths in components.

**Principles**
- Encapsulation.
- Maintainable module boundaries.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Maintainable module boundaries`: Keep module APIs stable so internal changes don’t break callers.
