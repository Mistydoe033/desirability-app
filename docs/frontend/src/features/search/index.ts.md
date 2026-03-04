File: [`frontend/src/features/search/index.ts`](../../../../../frontend/src/features/search/index.ts)

**What It Does**
- Barrel export for search feature components.
- Provides a clean import surface for the Search page.

**Why This Structure**
- Keeps feature boundaries explicit.
- Simplifies imports at call sites.

**Principles**
- Encapsulation.
- Clear feature boundaries.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Clear feature boundaries`: Keep feature logic grouped so responsibilities are easy to find.
