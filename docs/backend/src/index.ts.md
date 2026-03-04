File: [`backend/src/index.ts`](../../../backend/src/index.ts)

**What It Does**
- Bootstraps the server: initializes DB, seeds data, warms coastline dataset.
- Starts Express + Apollo GraphQL server and scheduled jobs.
- Handles graceful shutdown and error logging.

**Why This Structure**
- Centralized startup sequence ensures dependencies are ready before serving traffic.
- Lifecycle handling reduces resource leaks and supports clean shutdown.

**Principles**
- Explicit lifecycle management.
- Separation between setup and runtime execution.


**Principles Explained**
- `Explicit lifecycle management`: Handle startup/shutdown explicitly to avoid leaks and undefined runtime behavior.
- `Separation between setup and runtime execution`: Split bootstrapping from request handling to keep runtime lean.
