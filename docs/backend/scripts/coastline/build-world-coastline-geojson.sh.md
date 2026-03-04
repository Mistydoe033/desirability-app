File: [`backend/scripts/coastline/build-world-coastline-geojson.sh`](../../../../backend/scripts/coastline/build-world-coastline-geojson.sh)

**What It Does**
- Converts the downloaded coastline shapefile to a simplified GeoJSON.
- Uses GDAL (`ogr2ogr`) and optional simplification tolerance.

**Why This Structure**
- Preprocesses heavy data into a format optimized for runtime lookup.
- Keeps the data build step deterministic and scriptable.

**Principles**
- Precomputation for runtime performance.
- Automation and reproducibility.


**Principles Explained**
- `Precomputation for runtime performance`: Move expensive work out of request time into scheduled jobs.
- `Automation and reproducibility`: Script manual steps so the process is repeatable and consistent.
