File: [`frontend/src/services/geo/geoService.ts`](../../../../../frontend/src/services/geo/geoService.ts)

**What It Does**
- Calls Open-Meteo geocoding to fetch city suggestions.
- Transforms API results into `GeoLocation` objects.

**Why This Structure**
- Keeps external API calls outside UI components.
- Supports abort signals to avoid stale updates.

**Principles**
- IO boundary isolation.
- Resilient async handling.


**Principles Explained**
- `IO boundary isolation`: Separate network IO from UI or domain logic to keep testing and reasoning simple.
- `Resilient async handling`: Keep the system usable when dependencies fail or degrade.
