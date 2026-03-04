File: [`backend/src/config/env.ts`](../../../../backend/src/config/env.ts)

**What It Does**
- Loads environment variables via dotenv and validates types.
- Provides a typed `env` object with defaults and sanity checks.

**Why This Structure**
- Avoids scattered `process.env` usage across the codebase.
- Fails fast on invalid or missing configuration.

**Principles**
- Defensive configuration validation.
- Single source of truth for settings.


**Principles Explained**
- `Defensive configuration validation`: Validate config early and fail fast on invalid values.
- `Single source of truth for settings`: Keep settings defined in one authoritative place to prevent drift.
