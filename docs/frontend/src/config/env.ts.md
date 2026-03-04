File: [`frontend/src/config/env.ts`](../../../../frontend/src/config/env.ts)

**What It Does**
- Build-time config for API and geocoding URLs.
- Validates `VITE_API_URL` for safety.

**Why This Structure**
- Centralizes environment handling in one module.
- Avoids repeated env checks throughout components.

**Principles**
- Configuration validation.
- Single source of truth.


**Principles Explained**
- `Configuration validation`: Fail fast if required config is missing or invalid.
- `Single source of truth`: Keep this concept defined in one authoritative place to prevent drift.
