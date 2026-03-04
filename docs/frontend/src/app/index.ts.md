File: [`frontend/src/app/index.ts`](../../../../frontend/src/app/index.ts)

**What It Does**
- Barrel file exporting App and ThemeProvider.
- Simplifies imports from the app layer.

**Why This Structure**
- Keeps module boundaries explicit and tidy.
- Reduces import path churn when files move.

**Principles**
- Encapsulation.
- Stable public API for modules.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Stable public API for modules`: Exports stay stable so callers don’t break when internals change.
