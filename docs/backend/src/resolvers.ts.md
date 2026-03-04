File: [`backend/src/resolvers.ts`](../../../backend/src/resolvers.ts)

**What It Does**
- Implements GraphQL resolvers and JSON scalar parsing.
- Delegates work to services with logging and error normalization.

**Why This Structure**
- Thin resolvers keep business logic in services.
- Centralized error mapping ensures consistent API responses.

**Principles**
- Separation of concerns.
- Consistent error handling.


**Principles Explained**
- `Separation of concerns`: Keep each module focused on a single responsibility (UI, data, domain logic) so changes stay localized.
- `Consistent error handling`: Handle errors the same way across modules so callers know what to expect.
