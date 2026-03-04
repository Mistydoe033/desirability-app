File: [`frontend/src/app/ThemeProvider.tsx`](../../../../frontend/src/app/ThemeProvider.tsx)

**What It Does**
- Defines the MUI theme (palette, typography, component overrides).
- Wraps children with `CssBaseline` and `ThemeProvider`.

**Why This Structure**
- Centralizes visual design tokens for consistent UI.
- Keeps theme settings out of individual components.

**Principles**
- Design consistency.
- Single source of truth for styling.


**Principles Explained**
- `Design consistency`: Theme and style rules keep the UI visually coherent.
- `Single source of truth for styling`: Keep styling defined in one authoritative place to prevent drift.
