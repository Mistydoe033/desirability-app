File: [`frontend/src/services/index.ts`](../../../../frontend/src/services/index.ts)

**What It Does**
- Barrel export for frontend service functions.
- Currently exposes geocoding search.

**Why This Structure**
- Provides a stable entrypoint for future services.
- Keeps import paths short.

**Principles**
- Encapsulation.
- Scalable module organization.


**Principles Explained**
- `Encapsulation`: Expose a small public API while hiding implementation details to reduce coupling.
- `Scalable module organization`: Folder structure supports growth without creating tangled dependencies.
