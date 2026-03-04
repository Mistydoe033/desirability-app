File: [`frontend/src/components/common/index.ts`](../../../../../frontend/src/components/common/index.ts)

**What It Does**
- Barrel export for common components.
- Centralizes exports for ErrorState and LoadingState.

**Why This Structure**
- Encapsulates shared UI primitives in one import path.
- Reduces deep import paths in pages.

**Principles**
- Encapsulation.
- Maintainable imports.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Maintainable imports`: Use stable barrel exports to keep imports consistent.
