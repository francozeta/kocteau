# Music

## Entry Points

- Catalog pages: `catalog-entity-page.tsx`, `track-page-hero.tsx`.
- Reused across Feed/Profile: `track-tile.tsx`, `track-carousel.tsx`, `starter-route-card.tsx`.
- Covers/actions: `entity-cover-image.tsx`, `entity-library-actions.tsx`.
- Identity and canonical routes: `lib/catalog`, `lib/seo-routes.ts`.

## Preserve

Use `(provider, provider_id, type)` for provider identity and Kocteau IDs for
product identity. Known cover dimensions keep layout stable. Catalog decisions
live in [catalog research](../../../../docs/knowledge-layer.md).

## Check

Run catalog tests, lint, and the web build. Check canonical links, unresolved
provider routes, missing covers, long titles, rating-only discussion, and mobile tiles.
