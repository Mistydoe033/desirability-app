File: [`frontend/src/components/index.ts`](../../../../frontend/src/components/index.ts)

**What It Does**
- Barrel export for shared components (layout, map, common).
- Simplifies imports for pages and features.

**Why This Structure**
- Keeps a clean and stable component API surface.
- Avoids deep relative paths across the app.

**Principles**
- Encapsulation.
- Consistent module boundaries.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Consistent module boundaries`: Keep each module’s responsibilities stable so imports stay predictable.
