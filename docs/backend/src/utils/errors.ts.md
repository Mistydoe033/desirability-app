File: [`backend/src/utils/errors.ts`](../../../../backend/src/utils/errors.ts)

**What It Does**
- Defines app-specific error classes with codes and status codes.
- Provides helper to normalize unknown errors into AppError.

**Why This Structure**
- Standardizes error handling across resolvers and services.
- Makes API error responses consistent and debuggable.

**Principles**
- Consistency in error semantics.
- Clear contracts for failure modes.


**Principles Explained**
- `Consistency in error semantics`: Map errors to consistent codes and statuses across the API.
- `Clear contracts for failure modes`: Define how errors are shaped so clients can handle them predictably.
