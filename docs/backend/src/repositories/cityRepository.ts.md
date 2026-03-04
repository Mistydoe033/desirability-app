File: [`backend/src/repositories/cityRepository.ts`](../../../../backend/src/repositories/cityRepository.ts)

**What It Does**
- Encapsulates CRUD for cities and feature profiles in SQLite.
- Splits feature assignments and evidence into normalized tables.

**Why This Structure**
- Repository pattern isolates SQL from business logic.
- Feature data normalization supports queryability and backfills.

**Principles**
- Separation of concerns.
- Data normalization.


**Principles Explained**
- `Separation of concerns`: Keep each module focused on a single responsibility (UI, data, domain logic) so changes stay localized.
- `Data normalization`: Convert inputs to consistent units/ranges before use.
