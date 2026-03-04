File: [`backend/src/services/features/featureProfile.ts`](../../../../../backend/src/services/features/featureProfile.ts)

**What It Does**
- Creates, parses, and sanitizes yearly feature profiles.
- Ensures selected features and evidence are normalized.

**Why This Structure**
- Guards against malformed persisted profiles and old formats.
- Keeps validation logic out of repositories and scorers.

**Principles**
- Data validation.
- Backward compatibility.


**Principles Explained**
- `Data validation`: Check data shapes and ranges before processing.
- `Backward compatibility`: Evolve behavior without breaking existing data formats or API consumers.
