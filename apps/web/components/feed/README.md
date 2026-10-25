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

## Primary Rendering

The route starts its private starter promise alongside the feed read, but waits
only for reviews, viewer profile and viewer flags before returning the surface.
Only the editorial shelf/layer consumes that promise, inside Suspense. All slots
share the same promise; none starts another starter request. Review impressions
retain their resolved starter count without blocking review rendering.

Shelf skeletons reserve the same responsive card and heading geometry. Empty or
unavailable picks may remove the optional section; they must not remove reviews.
The initial primary read still uses the route's explicit recovery boundary.

Run `node tests/load/verify-primary-render.mjs` from `apps/web` for isolated
Next/WebKit checks. Supply `KOCTEAU_PLAYWRIGHT_MODULE` when Playwright is installed
outside the workspace. The [verification record](../../../../.plan/primary-render.md)
owns the pinned comparison and the distinction from production latency.
