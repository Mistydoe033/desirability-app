File: [`backend/src/services/external/units.ts`](../../../../../backend/src/services/external/units.ts)

**What It Does**
- Normalizes raw API values into internal units and bounds.
- Handles null/invalid data defensively.

**Why This Structure**
- Keeps parsing rules centralized and testable.
- Prevents normalization logic from scattering across services.

**Principles**
- Defensive programming.
- Data normalization.


**Principles Explained**
- `Defensive programming`: Guard against nulls/outliers so computations stay safe.
- `Data normalization`: Convert inputs to consistent units/ranges before use.
