File: [`backend/scripts/coastline/download-world-coastline.sh`](../../../../backend/scripts/coastline/download-world-coastline.sh)

**What It Does**
- Downloads global coastline shapefile archive from OSM.
- Writes output to backend `data/` directory.

**Why This Structure**
- Keeps dataset acquisition scripted and repeatable.
- Allows overrides via environment variables and CLI arguments.

**Principles**
- Reproducible data pipelines.
- Automation for manual steps.


**Principles Explained**
- `Reproducible data pipelines`: Data build steps produce the same output when rerun.
- `Automation for manual steps`: Script manual steps so the process is repeatable and consistent.
