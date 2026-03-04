File: [`backend/src/services/external/httpClient.ts`](../../../../../backend/src/services/external/httpClient.ts)

**What It Does**
- Wrapper for HTTP requests with timeout, retry, and backoff.
- Normalizes error handling for external service calls.

**Why This Structure**
- Centralizes retry policy so external integrations behave consistently.
- Keeps network error logic out of domain services.

**Principles**
- Resilience and fault tolerance.
- Single responsibility.


**Principles Explained**
- `Resilience and fault tolerance`: Keep the system usable when dependencies fail or degrade.
- `Single responsibility`: Each module does one thing well, making changes safer and testing simpler.
