File: [`frontend/src/main.tsx`](../../../frontend/src/main.tsx)

**What It Does**
- React entrypoint: validates env, mounts root, and wires providers.
- Sets up Apollo client, MUI theme, and React Router.

**Why This Structure**
- Centralizes app bootstrapping in a single file.
- Ensures providers are consistent across all pages.

**Principles**
- Explicit initialization.
- Composition of providers.


**Principles Explained**
- `Explicit initialization`: Make initialization steps obvious to avoid hidden dependencies.
- `Composition of providers`: Layer app providers once at the root to keep context wiring consistent.
