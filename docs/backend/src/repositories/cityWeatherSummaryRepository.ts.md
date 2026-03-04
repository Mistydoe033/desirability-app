File: [`backend/src/repositories/cityWeatherSummaryRepository.ts`](../../../../backend/src/repositories/cityWeatherSummaryRepository.ts)

**What It Does**
- Persists and retrieves annual climate summaries for cities.
- Maps DB rows to typed domain objects.

**Why This Structure**
- Separates storage format from business logic.
- Ensures summaries are reusable across services.

**Principles**
- Repository pattern.
- Data mapping isolation.


**Principles Explained**
- `Repository pattern`: Abstract database access behind a repository so SQL details stay out of business logic.
- `Data mapping isolation`: Convert DB rows to domain types in one place to avoid scattered mapping logic.
