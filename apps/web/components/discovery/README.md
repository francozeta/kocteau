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
  ASCII query casing shares the same local cache key; original text still controls
  ranking. Concurrent fills for one key share a promise within a process. Fills
  retain their own three-second deadline for local results and canonical links, independent
  of one caller cancelling. A failed key has a one-second retry cooldown; pending
  refresh and failure maps are bounded. Cache tags and the 60-second TTL remain
  authoritative across instances. Observed failures remain degraded until a successful
  refresh; the cooldown controls retry timing only.
  `lib/search/entity-links.ts` reuses canonical identities already present in a
  response before looking up only unresolved provider IDs. Failed lookups retain
  those known identities and available candidates.
  The live region announces partial results as soon as they become available.
- Provider transport: `lib/deezer/request.ts`; external budget:
  `lib/search/deadline.ts`. One three-second budget covers requests, retries,
  backoff, and artist enrichment. Completed providers remain usable when another
  reaches the deadline. Local catalog and entity-link lookups have separate finite budgets, so the
  external phase plus canonical links occupies at most about six seconds of
  dependency work, excluding runtime scheduling and response serialization.
  The legacy `/api/deezer/search` route uses the same provider deadline and
  canonical-link resolver.
- Client cancellation reaches external requests and retry waits. Shared public
  cache fills stay independent of a caller's signal. A cancelled caller receives
  an empty 499 response without waiting for the shared fill or logging a server failure.
- `Server-Timing` reports `local`, `catalog`, `links`, `rank`, and `total`
  processing durations. Local and catalog work overlap, so durations are not
  additive. Existing sampled performance logs use scope/source fields without
  search text, identity, or credentials.

- Public Data API reads use a dedicated anonymous PostgREST client. Authenticated
  and administrative clients retain their existing boundaries. The pinned
  `supabase-js` constructor does not forward `db.retry` to PostgREST; the dedicated
  client explicitly disables automatic retries. Its transport allows eight active
  reads and 32 waiting reads per process, with a three-second deadline covering
  queue time, headers, and the complete response body. This is a process-local
  guard, not a deployment-wide quota.
  `public_data_read` diagnostics split queue, response-header and body time;
  timeout records identify the unfinished phase. Successful/cancelled reads follow
  performance sampling; failures are recorded subject to the process cap. Records
  contain logical table/RPC names, outcome, phase, status, size, timings and the
  suppression count. The existing performance controls apply, with at most ten
  diagnostic records per second per process. Header time includes transport/framework waits and is
  not a measurement of SQL execution.
- Search responses preserve their result-array contract and expose
  `X-Kocteau-Search-Status` (`fresh`, `stale`, `degraded`) plus `Local`, `Links`,
  and `Provider` headers under the same prefix. Stale cached data and detected
  background refresh failures are observable even with HTTP 200. Missing local
  data during an outage returns 502; partial sources remain usable. These responses
  use `Cache-Control: no-store`; server-side local data and provider fetch caches
  may still be reused. Empty-query responses use the same no-store policy.

Public starter picks use a separate 15-minute tagged cache in
`lib/queries/starter.ts`. Successful empty catalogs are cacheable. Failed origin
reads escape the cached callback; the optional empty fallback is returned outside
it, so a failed fill remains retryable and a failed refresh cannot replace valid
picks with an empty result. This does not change personalized starter ranking.

## Preserve

Browsing works signed out; publishing requires auth. Keep the Kocteau ranking
boost, provider identity stable, and URL navigation recoverable. The music catalog and
source boundaries live in [catalog research](../../../../docs/knowledge-layer.md).

## Check

Run discovery/search tests, lint, and the web build. Check selection, browser Back,
refresh, empty results, long titles, keyboard use, and touch navigation.

Check stalled providers, total provider failure, client cancellation, cache reuse,
and timing headers with isolated upstream fixtures.

## Search recovery regression

The shared hook waits 300 ms after typing settles. Query observers follow the
current input immediately, so both old HTTP requests are cancelled while the next
query waits. Catalog search does not retry failed requests automatically or refetch
on window focus. Partial results and the cache for the same query remain usable;
a complete failure offers **Retry search** without replacing the canvas.

The input and scope have separate, validated history/session snapshots, scoped by
account or guest, bounded to 80 characters and eight hours. Each history entry
keeps its draft so Back restores the previous query; selecting a result clears only
the new entry after the canvas accepts it. Storage remains optional. Explicitly
closing search, restarting, or clearing memory clears the current input.

For browser regression checks, use an isolated local Supabase stack and its local
environment values, following [local setup](../../../../docs/setup/local-development.md).
Build and start the app with
`NODE_OPTIONS="--import=$PWD/apps/web/tests/load/fixtures/search-recovery-upstreams.mjs"`
on both commands. This preload blocks external fetches and provides the disposable
artist used by the browser fixture. The baseline may use the normal isolated
upstream preload. Never point these fixtures at a linked cloud database.

Install Playwright 1.64.1 outside the repository and its Chromium/WebKit browsers.
Set `KOCTEAU_PLAYWRIGHT_MODULE` to that installation's absolute
`node_modules/playwright` path, then run from the repository root:

```bash
SEARCH_RECOVERY_URL=http://127.0.0.1:3002 \
  node apps/web/tests/load/verify-search-recovery.mjs
SEARCH_RECOVERY_BROWSER=webkit SEARCH_RECOVERY_URL=http://127.0.0.1:3002 \
  node apps/web/tests/load/verify-search-recovery.mjs
```

`SEARCH_RECOVERY_DESKTOP=1` checks the desktop surface.
`SEARCH_RECOVERY_BASELINE=1` reports the old build without asserting the new
behavior. The fixture requires IPv4 loopback and blocks outbound browser requests.
It checks typing request counts, immediate cancellation, no automatic failure
retry, manual recovery, Back/reload, selected-canvas survival, and disabled storage.
For an existing disposable authenticated session,
`SEARCH_RECOVERY_COOKIE_FILE` accepts a private JSON file containing its `cookie`
header. Keep it out of Git; the fixture creates no accounts or activity.
This is a browser regression check with simulated API failures, not a load test or
a test on a physical iPhone/TikTok browser.
