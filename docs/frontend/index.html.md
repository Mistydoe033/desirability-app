File: [`frontend/index.html`](../../frontend/index.html)

**What It Does**
- HTML shell for the Vite app.
- Loads Leaflet CSS/JS and mounts the React root.

**Why This Structure**
- Minimal shell keeps app runtime inside React.
- Leaflet is loaded globally to keep MapPicker simple.

**Principles**
- Minimal entrypoint.
- Explicit external dependency loading.


**Principles Explained**
- `Minimal entrypoint`: The entry file only bootstraps the app; logic lives elsewhere.
- `Explicit external dependency loading`: Load third-party resources intentionally to avoid surprises at runtime.
