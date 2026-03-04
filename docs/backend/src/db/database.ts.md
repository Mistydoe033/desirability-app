File: [`backend/src/db/database.ts`](../../../../backend/src/db/database.ts)

**What It Does**
- Creates SQLite connection and initializes schema/tables.
- Ensures feature tables are current and drops legacy tables.

**Why This Structure**
- Keeps schema bootstrap in code to avoid external migration tooling for this project.
- Ensures the DB is ready for immediate use on startup.

**Principles**
- Schema ownership inside the service.
- Fail-fast initialization.


**Principles Explained**
- `Schema ownership inside the service`: The service owns and initializes its schema instead of relying on external migrations.
- `Fail-fast initialization`: Validate early and stop on invalid conditions to avoid corrupt state.
