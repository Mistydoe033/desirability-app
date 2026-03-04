File: [`frontend/src/components/map/MapPicker.tsx`](../../../../../frontend/src/components/map/MapPicker.tsx)

**What It Does**
- Leaflet-based map that lets users click to select coordinates.
- Manages map lifecycle and marker updates.

**Why This Structure**
- Isolates imperative map logic from React pages.
- Encapsulates Leaflet globals behind a stable component API.

**Principles**
- Side-effect isolation.
- Lifecycle management.


**Principles Explained**
- `Side-effect isolation`: Keep IO and mutations in dedicated modules to contain side effects.
- `Lifecycle management`: Define setup/teardown and resource cleanup so the service behaves predictably.
