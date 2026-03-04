File: [`backend/src/services/scoring/factory.ts`](../../../../../backend/src/services/scoring/factory.ts)

**What It Does**
- Maps activity names to scorer implementations.
- Provides list and validation of supported activities.

**Why This Structure**
- Central place to add new activities without touching callers.
- Prevents stringly-typed references to scorers.

**Principles**
- Factory pattern.
- Open/closed extension.


**Principles Explained**
- `Factory pattern`: Centralize object creation based on type so callers don’t need branching logic.
- `Open/closed extension`: Make it easy to add new behaviors without modifying existing call sites.
