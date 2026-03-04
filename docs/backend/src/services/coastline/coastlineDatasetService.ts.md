File: [`backend/src/services/coastline/coastlineDatasetService.ts`](../../../../../backend/src/services/coastline/coastlineDatasetService.ts)

**What It Does**
- Streams and indexes coastline GeoJSON into a spatial R-tree.
- Provides nearby feature queries and segment candidates.

**Why This Structure**
- Streaming avoids loading entire GeoJSON into memory at once.
- Spatial index makes proximity queries fast enough for runtime scoring.

**Principles**
- Performance-oriented preprocessing.
- Separation of data loading from scoring.


**Principles Explained**
- `Performance-oriented preprocessing`: Transform large datasets ahead of time so runtime queries stay fast.
- `Separation of data loading from scoring`: Keep data loading from scoring in separate modules so each part stays focused and changes don’t ripple.
