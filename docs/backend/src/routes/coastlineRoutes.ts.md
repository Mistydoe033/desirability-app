File: [`backend/src/routes/coastlineRoutes.ts`](../../../../backend/src/routes/coastlineRoutes.ts)

**What It Does**
- Provides REST endpoint to query nearby coastline features.
- Validates coordinates and radius before returning GeoJSON.

**Why This Structure**
- Keeps map-specific data separate from GraphQL ranking APIs.
- Validation protects the dataset and server from misuse.

**Principles**
- Input validation.
- Single-purpose API surface.


**Principles Explained**
- `Input validation`: Validate external inputs at the boundary to avoid invalid states and unsafe operations.
- `Single-purpose API surface`: Endpoints do one thing clearly to avoid ambiguous behavior.
