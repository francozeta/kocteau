# Feed

## Entry Points

- Route: `app/(main)/feed/page.tsx`; composition: `authenticated-feed-surface.tsx`.
- Views and lists: `feed-view-tabs.tsx`, `feed-review-list.tsx`.
- Discovery: `feed-starter-layer.tsx`, `feed-starter-shelf.tsx`, `feed-in-rotation-shelf.tsx`.
- Reads: `lib/queries/feed.ts`; client state: `queries/feed.ts`.

## Preserve

Reviews carry the hierarchy. Keep viewer-specific data outside public caches.
Starter picks are editorial prompts. Ranking and signal contracts live in
[discovery and curation](../../../../docs/discovery-curation.md).

## Check

Run tests, lint, and the web build. Check For You/Following/Trending, pagination,
empty and sparse feeds, optimistic review actions, and mobile rail placement.
Record an aggregate baseline before changing ranking.

Public list reads and HTTP failure handling follow the
[review recovery contract](../reviews/README.md#public-read-recovery). Route-level
read errors offer manual retry; a cached successful list survives failed refreshes.
