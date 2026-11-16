# Canonical URLs and discovery reliability

Baseline: main `37138e7`. PR publication, preview testing and use of the shared
database are authorized. Only the three additive Search RPCs were delivered;
the existing Starter ranking replacement stays pending. Main merges and
production deployment remain outside this delivery stage.

## Stages

1. Canonical public URLs use `/tracks/{slug}-{id}`, `/albums/{slug}-{id}`,
   `/artists/{slug}-{id}` and `/reviews/{slug}-{id}`. Profiles retain
   `/u/{username}`. The trailing twelve-character ID resolves identity; labels
   describe it. Former canonical and singular routes remain compatibility
   entries. Resolve directly to the final canonical URL, preserving functional
   review query parameters. Search's shared seed routes remain independent.
2. Performance checks target `/home` and `/?view=for-you`, assert meaningful
   content and verify compatibility redirects outside latency metrics. Starter
   publication/archive expires its shared data tag. Browser Query state is
   isolated when account identity changes.
3. Discovery transports stable artist IDs through retrieval and ranking, with
   explicit legacy-memory compatibility. Search preserves source readiness and
   explicit partial recovery. Starter taste aggregation is independent of the
   number of editorial collection memberships.
4. Search retrieval and MMR evaluation remain separate experiments until their
   result quality, SQL plans, failure behavior and runtime costs are reviewed.
   No Rust, embeddings or additional service is introduced.

## URL rollout contract

All internal links, canonical metadata, Open Graph, JSON-LD and sitemap use the
central route helpers. Legacy UUID, twelve-character and unambiguous
eight-character aliases must resolve the same resource. Ambiguity and genuine
absence remain distinct from temporary read failures. Wrong or outdated labels
canonicalize to the current title. A legacy lookup performs no viewer-state
read before redirection. Keep compatibility routes indefinitely for shared links.
Database-ID compatibility handlers return actual HTTP 308 before rendering; transient lookup
failures return uncached 503 with Retry-After rather than a false 404. Current
page labels may canonicalize through Next's streamed permanent redirect after
headers have been sent; canonical metadata still names the final document.

Preview gates: unit tests, lint/build, canonical and legacy browser navigation,
HTTP redirects, canonical metadata/sitemap, guest/authenticated state, Back,
query-driven review actions and origin failure/retry. The journey fixture uses
loopback synthetic data and local telemetry; it never requires cloud credentials.
Chromium can be selected with `JOURNEY_BROWSER=chromium`; WebKit remains default.
The fixture is functional evidence, not production latency or physical-device
coverage. Review any differences against open SEO PRs #306/#307 before integration.

Schema delivery must follow the existing Supabase workflow. SQL tested on a
disposable local instance is not a commercial migration; apply reviewed database
changes before deploying code that requires them. Missing remote delivery must
remain explicit in the handoff. MMR has no product import or runtime toggle.

## Verification record

Combined local branch: `refactor/architecture-foundations`. Implementation
commits retain separate URL, performance, identity, cache, readiness and SQL
stages. `main` remains at the audited baseline. GitHub/Vercel own PR and preview status;
a successful local check is not evidence that a deployment is ready.

- Web unit suite: 289 passing tests, run serially to avoid shared-runner timer
  contention. Workspace lint, documentation/link checks and the production
  build/typecheck pass. The final build uses isolated placeholder public reads;
  its generated output is verification material, not a production artifact.
- The production-mode WebKit journey fixture passes 74 records over guest and
  simulated-session mobile/desktop cohorts. It covers former aliases, actual
  HTTP 308, canonical metadata/sitemap, query preservation, comments/editor,
  Back and recovery. Route transitions are observed through the active route
  owner and must settle to one review. Fresh synthetic IDs keep persisted
  absence/ambiguity cache entries from contaminating independent probes.
- Account-cache browser fixtures pass nine cases in Chromium and WebKit.
  The k6 loopback fixture accepts the correct pages and rejects five invalid
  content/session/redirect scenarios, without querying production.
- Starter SQL: 18 new checks reproduce four baseline failures and pass after
  correction; all nine database test files pass (72 TAP results). Complete
  single-collection responses match in 36 scenarios at 129 and 2,000 tracks.
  Verification used PostgreSQL 17.11 with minimal auth/storage prerequisites,
  not the full Supabase services. See [SQL record](./starter-collection-scoring.md).

Independent experiment branches remain outside the combined branch:

- `test/discovery-ranking-evaluation`: 55 Discovery/MMR tests and a frozen
  six-cohort runner, with mechanical diversity/runtime measures separated from
  human quality. Its private preview lab compares one public snapshot across
  Current, control and MMR, outside the default Search/For You flows.
- `perf/search-ranked-retrieval`: 37 Search tests and 26 SQL checks. Exact matches
  survive the pre-ranking limit in the synthetic corpus, but ordered retrieval
  costs more SQL execution. Real local Data API/browser verification covers
  PostgREST 14.4/16.5 and Chromium/WebKit desktop/mobile. Target public types are
  regenerated. Live preview verification remains required before adoption.
  No speedup is claimed.

Public sitemap cache keys retire entries containing former canonical paths.
The public citation manifest follows the same URL format. The optional production
observation retains its known legacy review URL so it works before and after
rollout; it does not prove the new source was deployed.

Raw reports remain ignored. Forced origin tests still observe the known React
419 behavior; this does not establish its resolution. Simulated sessions do not
verify commercial authentication/RLS, and headless engines do not establish
physical iPhone/Safari behavior or real-user percentiles. The Starter replacement,
remaining preview checks and reconciliation with #306/#307 remain release gates.
Do not infer recommendation quality from synthetic metrics.

## Shared database and preview delivery

Draft [PR #309](https://github.com/francozeta/kocteau/pull/309) is the base for the
two experiment PRs. Its first preview is READY at `9f5bf41`, and the Verify and
Native navigation workflows passed for that commit. Protected HTTP inspection
of `/home` returned the real public catalog and the production-host canonical.
Preview readiness does not establish authenticated live flows or deployment to main.

After target authorization, the three new Search RPCs were applied through the
Supabase management connection as `20261116192307_ranked_local_catalog_search`.
The preflight checked all projected columns, table RLS/grants, absence of the
three function names, remote history and anonymous EXPLAIN ANALYZE/BUFFERS plans.
Only those functions and their execute grants were added. Post-apply checks
confirmed STABLE/SECURITY INVOKER, empty search paths, ROWS 18, explicit
anon/authenticated execution, no PUBLIC execution and bounded anonymous calls
through all seven branches. Security advisories introduce no new finding for
these functions. The existing Starter function definition hash is
unchanged. No catalog, review, profile or editorial row was written.

The pinned `pnpm supabase:db:push:dry` was attempted and failed because this
workspace has no linked CLI target. It was not presented as a successful dry run:
the tested local migration, remote read-only plan/schema checks and management
apply/history checks supplied the delivery evidence instead. Public-schema types
were generated from the target and recorded in the base; the management generator
does not return storage/graphql schemas, which were retained unchanged. The type
normalizer preserves 15 actually nullable catalog result fields that SQL function
metadata omits. The pending Starter file was recreated
with the pinned CLI after the applied Search timestamp, preserving its SQL and
avoiding an older pending migration. No remote history repair was performed.

Draft [PR #310](https://github.com/francozeta/kocteau/pull/310) (MMR) and
[PR #311](https://github.com/francozeta/kocteau/pull/311) (retrieval) target the base
branch separately. Their previews are READY; Verify and Native navigation pass
at `b21c2fe` and `d77313a`. The base passes both workflows at `8b807db`. PR
descriptions own the current protected preview links and feedback steps.
Main and the production deployment remain at `37138e7`.

Live base Chromium checks pass on mobile/desktop with real public data:
canonical track/review pages, exact HTTP 308 for former split paths, usable local
Search and visible UI results, without page errors. Retrieval also passes the
same live Chromium mobile/desktop checks and returns five local results for the
representative query with fresh readiness. Its cache may legitimately report
stale while returning usable public results; stale is not classified as failure.
The MMR deployment redirects a guest to login with noindex and its public map
returns a full 32-candidate/four-group pool with matching seed identity. A real
curator session and listener assessment of musical quality remain pending.

Before integration, reconcile the existing SEO work: #306 retires the exact
`/track` index via 308 to `/reviews` and removes its sitemap/llms/breadcrumb
entries. This is distinct from the preserved `/track/{id}` compatibility routes.
#307 adds crawlable SSR discovery links and corrects the review breadcrumb,
which currently ends at the entity; port those changes to the new compact pages,
preserving the split-path compatibility handlers. Neither PR was merged here.
