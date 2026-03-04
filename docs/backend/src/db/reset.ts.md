File: [`backend/src/db/reset.ts`](../../../../backend/src/db/reset.ts)

**What It Does**
- Deletes SQLite database and WAL/SHM files for a clean reset.
- Logs outcomes for visibility.

**Why This Structure**
- Provides a deterministic way to wipe state during development.
- Keeps reset behavior explicit and safe.

**Principles**
- Operational simplicity.
- Explicit side-effect handling.


**Principles Explained**
- `Operational simplicity`: Prefer simple operations over complex orchestration when possible.
- `Explicit side-effect handling`: Make decisions and configuration visible so behavior is predictable.
