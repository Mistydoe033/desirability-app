File: `docs/frontend/README.md`

**What It Does**
- High-level frontend architecture overview and study guide.
- Summarizes routing, GraphQL data flow, and UI component structure.

**Why This Structure**
- Frontend is organized by pages, features, and shared components for clarity.
- Separates view logic from data fetching and utilities.

**Principles**
- Component composition and reuse.
- Clear separation of concerns between routes, features, and UI atoms.



**Principles Explained**
- `Component composition and reuse`: Build UI by composing small components so behavior is shared and consistent.
- `Clear separation of concerns between routes, features, and UI atoms`: Routes own flow, features own domain UI, and atoms are reusable primitives.

**Study Order**
- [src/index.ts.md](src/index.ts.md)
- [src/main.tsx.md](src/main.tsx.md)
- [src/app/ThemeProvider.tsx.md](src/app/ThemeProvider.tsx.md)
- [src/app/App.tsx.md](src/app/App.tsx.md)
- [src/app/index.ts.md](src/app/index.ts.md)
- [src/components/layout/MainLayout.tsx.md](src/components/layout/MainLayout.tsx.md)
- [src/components/common/LoadingState.tsx.md](src/components/common/LoadingState.tsx.md)
- [src/components/common/ErrorState.tsx.md](src/components/common/ErrorState.tsx.md)
- [src/components/common/index.ts.md](src/components/common/index.ts.md)
- [src/components/map/MapPicker.tsx.md](src/components/map/MapPicker.tsx.md)
- [src/components/index.ts.md](src/components/index.ts.md)
- [src/pages/Home.tsx.md](src/pages/Home.tsx.md)
- [src/pages/Search.tsx.md](src/pages/Search.tsx.md)
- [src/pages/Browse.tsx.md](src/pages/Browse.tsx.md)
- [src/pages/Details.tsx.md](src/pages/Details.tsx.md)
- [src/api/index.ts.md](src/api/index.ts.md)
- [src/api/graphql/client.ts.md](src/api/graphql/client.ts.md)
- [src/api/graphql/queries.ts.md](src/api/graphql/queries.ts.md)
- [src/features/search/components/CitySearchInput.tsx.md](src/features/search/components/CitySearchInput.tsx.md)
- [src/features/search/index.ts.md](src/features/search/index.ts.md)
- [src/features/rankings/components/RankResults.tsx.md](src/features/rankings/components/RankResults.tsx.md)
- [src/features/rankings/components/ActivityCard.tsx.md](src/features/rankings/components/ActivityCard.tsx.md)
- [src/features/rankings/index.ts.md](src/features/rankings/index.ts.md)
- [src/features/surf/components/SurfSpotPanel.tsx.md](src/features/surf/components/SurfSpotPanel.tsx.md)
- [src/features/surf/index.ts.md](src/features/surf/index.ts.md)
- [src/hooks/useLocationSearch.ts.md](src/hooks/useLocationSearch.ts.md)
- [src/hooks/useLatestRequestGuard.ts.md](src/hooks/useLatestRequestGuard.ts.md)
- [src/hooks/useDebouncedValue.ts.md](src/hooks/useDebouncedValue.ts.md)
- [src/hooks/index.ts.md](src/hooks/index.ts.md)
- [src/services/geo/geoService.ts.md](src/services/geo/geoService.ts.md)
- [src/services/index.ts.md](src/services/index.ts.md)
- [src/types/types.ts.md](src/types/types.ts.md)
- [src/types/index.ts.md](src/types/index.ts.md)
- [src/utils/format.ts.md](src/utils/format.ts.md)
- [src/config/env.ts.md](src/config/env.ts.md)
- [src/styles.css.md](src/styles.css.md)
- [index.html.md](index.html.md)
