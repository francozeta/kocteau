# Discovery

## Entry Points

- Route: `app/(main)/search/page.tsx`; surface: `discovery-map.tsx`.
- Interaction: `hooks/use-discovery-canvas.ts`, `hooks/use-kocteau-search.ts`.
- State/navigation: `lib/discovery`; search ordering: `lib/search/kocteau-first.ts`.
- APIs: `app/api/search`, `app/api/discovery/map`.
- Server catalog lookups and provider orchestration: `lib/search/catalog.ts`.
  `/api/search` accepts `source=local|remote|all` (default `all` retains the
  combined response). The hook requests local and remote phases in parallel;
  available matches stay visible and selectable while the other phase loads.
- Phase responses retain ranking metadata and all candidates; the client applies
  the same grouping, quotas, identity merging, and Kocteau boost as the combined API.
  Changing the input hides matches from the previous debounced query immediately.
- Anonymous local catalog lookups and entity links are cached for 60 seconds,
  tagged with `entities`, `artists`, and `starter-tracks`. Review mutations
  invalidate `entities`; artist and starter updates currently refresh through
  the 60-second TTL. Private data never
  enters this cache; transient lookup failures return partial data without caching it.
  Entity links use a separate `entities`-tagged cache keyed by sorted provider IDs,
  covering both phases and the combined API. Errors are caught outside the cache.
  The live region announces partial results as soon as they become available.

## Preserve

Browsing works signed out; publishing requires auth. Keep the Kocteau ranking
boost, provider identity stable, and URL navigation recoverable. The music catalog and
source boundaries live in [catalog research](../../../../docs/knowledge-layer.md).

## Check

Run discovery/search tests, lint, and the web build. Check selection, browser Back,
refresh, empty results, long titles, keyboard use, and touch navigation.
