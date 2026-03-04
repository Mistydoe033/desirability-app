File: [`backend/src/constants/constants.ts`](../../../../backend/src/constants/constants.ts)

**What It Does**
- Centralizes scoring thresholds, weights, activity lists, and algorithm versions.
- Defines shared constants for caching keys and climate/POI parameters.

**Why This Structure**
- Keeps business rules consistent across services.
- Reduces magic numbers scattered through scoring logic.

**Principles**
- DRY and consistency.
- Explicit configuration of domain rules.


**Principles Explained**
- `DRY and consistency`: Avoid duplicate logic by reusing shared helpers and modules.
- `Explicit configuration of domain rules`: Keep business rules in named constants for clarity and change control.
