File: [`backend/src/db/seed.ts`](../../../../backend/src/db/seed.ts)

**What It Does**
- Seeds curated city records and bootstrap feature profiles.
- Idempotently inserts missing cities and normalizes profiles.

**Why This Structure**
- Provides a stable baseline dataset for demos and testing.
- Keeps seed logic isolated from runtime services.

**Principles**
- Idempotent data seeding.
- Separation of bootstrap data from runtime logic.


**Principles Explained**
- `Idempotent data seeding`: Seed scripts can be run repeatedly without creating duplicates.
- `Separation of bootstrap data from runtime logic`: Keep bootstrap data from runtime logic in separate modules so each part stays focused and changes don’t ripple.
