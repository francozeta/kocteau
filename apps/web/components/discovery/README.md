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
- Anonymous local catalog lookups are cached for 60 seconds,
  tagged with `entities`, `artists`, and `starter-tracks`. Review mutations
  invalidate `entities`; artist and starter updates currently refresh through
  the 60-second TTL. Private data never
  enters this cache; transient lookup failures return partial data without caching it.
  Entity links use a separate `entities`-tagged cache keyed by sorted provider IDs,
  covering both phases and the combined API. Errors are caught outside the cache.
  `lib/search/entity-links.ts` reuses canonical identities already present in a
  response before looking up only unresolved provider IDs. Failed lookups retain
  those known identities and available candidates.
  The live region announces partial results as soon as they become available.
- Provider transport: `lib/deezer/request.ts`; external budget:
  `lib/search/deadline.ts`. One three-second budget covers requests, retries,
  backoff, and artist enrichment. Completed providers remain usable when another
  reaches the deadline. This bounds provider work, not total HTTP time; local
  catalog and entity-link lookups are measured separately.
- Client cancellation reaches external requests and retry waits. Shared public
  cache fills stay independent of a caller's signal. A cancelled caller receives
  an empty 499 response without a server-failure log.
- `Server-Timing` reports `local`, `catalog`, `links`, `rank`, and `total`
  processing durations. Local and catalog work overlap, so durations are not
  additive. Existing sampled performance logs use scope/source fields without
  search text, identity, or credentials.

## Preserve

Browsing works signed out; publishing requires auth. Keep the Kocteau ranking
boost, provider identity stable, and URL navigation recoverable. The music catalog and
source boundaries live in [catalog research](../../../../docs/knowledge-layer.md).

## Check

Run discovery/search tests, lint, and the web build. Check selection, browser Back,
refresh, empty results, long titles, keyboard use, and touch navigation.

Check stalled providers, total provider failure, client cancellation, cache reuse,
and timing headers with isolated upstream fixtures.
