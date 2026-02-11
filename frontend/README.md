# Frontend

React + TypeScript + Vite frontend for Desirability.

## Commands
```bash
npm install
npm run dev
npm run build
```

## Env
Create `.env.local` (optional):
```env
VITE_API_URL=http://localhost:4000/
```

## Flow
- City search -> `rank(city)` GraphQL query.
- Results show activity week/day scores with reasons/factors.
- Surf details page supports map-click spot analysis:
  - click map -> coordinates
  - fetch `marineData(latitude, longitude)`
  - fetch `surfSpotScore(coordinates)`
  - race-safe updates: only latest click result is rendered.
