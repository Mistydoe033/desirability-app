File: [`backend/src/jobs/runPrecompute.ts`](../../../../backend/src/jobs/runPrecompute.ts)

**What It Does**
- One-off CLI runner to compute features and top cities.
- Initializes DB, seeds data, warms coastline dataset, and shuts down cleanly.

**Why This Structure**
- Provides a deterministic batch pipeline for deployments or manual runs.
- Keeps the orchestration logic separate from the server runtime.

**Principles**
- Repeatable batch processing.
- Clear lifecycle boundaries.


**Principles Explained**
- `Repeatable batch processing`: Batch jobs can be rerun with predictable results.
- `Clear lifecycle boundaries`: Define where setup ends and runtime behavior begins.
