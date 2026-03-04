File: [`frontend/src/hooks/useLatestRequestGuard.ts`](../../../../frontend/src/hooks/useLatestRequestGuard.ts)

**What It Does**
- Tracks the latest async request ID to prevent stale updates.
- Used in surf spot tools to ignore out-of-order responses.

**Why This Structure**
- Encapsulates concurrency guard logic in a reusable hook.
- Keeps component code simpler and safer.

**Principles**
- Concurrency safety.
- Separation of concerns.


**Principles Explained**
- `Concurrency safety`: Control or guard parallel work to avoid races and overload.
- `Separation of concerns`: Keep each module focused on a single responsibility (UI, data, domain logic) so changes stay localized.
