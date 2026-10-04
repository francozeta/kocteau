# Feed

## Entry Points

- Route: `app/(main)/feed/page.tsx`; composition: `authenticated-feed-surface.tsx`.
- Views and lists: `feed-view-tabs.tsx`, `feed-review-list.tsx`.
- Starter shelves and `editorial-discovery-rail.tsx` support discovery.
- Reads: `lib/queries/feed.ts`; client state: `queries/feed.ts`.

## Preserve

Reviews carry the hierarchy. Keep viewer-specific data outside public caches.
Starter picks are editorial prompts. Ranking and signal contracts live in
[discovery and curation](../../../../docs/discovery-curation.md).

## Check

Run tests, lint, and the web build. Check For You/Following/Top, pagination,
empty and sparse feeds, optimistic review actions, and mobile rail placement.
Record an aggregate baseline before changing ranking.
