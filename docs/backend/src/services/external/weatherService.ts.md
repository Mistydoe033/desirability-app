File: [`backend/src/services/external/weatherService.ts`](../../../../../backend/src/services/external/weatherService.ts)

**What It Does**
- Integrates Open-Meteo geocoding, forecast, archive, and marine APIs.
- Caches responses and normalizes raw data for scoring.

**Why This Structure**
- Encapsulates all external weather IO in one module.
- Concurrency limiting protects rate limits and stabilizes load.

**Principles**
- IO boundary encapsulation.
- Cache-aside with rate limiting.


**Principles Explained**
- `IO boundary encapsulation`: Keep external API calls in dedicated modules to isolate failures and retries.
- `Cache-aside with rate limiting`: Cache external calls and throttle concurrency to protect upstream APIs.
