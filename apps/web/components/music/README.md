# Music

## Entry Points

- Catalog pages: `catalog-entity-page.tsx`, `track-page-hero.tsx`.
- Reused across Feed/Profile: `track-tile.tsx`, `track-carousel.tsx`, `starter-route-card.tsx`.
- Covers/actions: `entity-cover-image.tsx`, `entity-library-actions.tsx`.
- Identity and canonical routes: `lib/catalog`, `lib/seo-routes.ts`.

## Preserve

Use `(provider, provider_id, type)` for provider identity and Kocteau IDs for
product identity. Track bundles accept the already resolved public entity so the
route and metadata do not repeat its database lookup. ID-only image/bundle callers
still resolve it internally. Viewer state stays outside public caches.

Recommendation sources run in independent local/catalog lanes and join before the
existing ranking and canonical-link resolution. Passing `tags: []` means tags were
already resolved; omit `tags` to request a lookup. Source failures keep the existing
partial fallback behavior.

Known cover dimensions keep layout stable. Catalog decisions
live in [catalog research](../../../../docs/knowledge-layer.md).

## Check

Run catalog tests, lint, and the web build. Check canonical links, unresolved
provider routes, missing covers, long titles, rating-only discussion, and mobile tiles.
