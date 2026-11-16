# Canonical URLs and discovery reliability

Baseline: main `37138e7`. PR publication and preview testing are authorized.
Main merges, production deployment and commercial database migrations remain
outside this delivery stage.

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
coverage. Review any differences against open SEO PRs #306/#307 before publishing.

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

- `test/discovery-ranking-evaluation`: nine tests and a frozen six-cohort runner,
  with mechanical diversity/runtime measures separated from human quality.
- `perf/search-ranked-retrieval`: 30 Search tests and 26 SQL checks. Exact matches
  survive the pre-ranking limit in the synthetic corpus, but ordered retrieval
  costs more SQL execution. Full Data API/browser verification and target type
  generation remain required before adoption; deployment requires its migration
  before application code. No speedup is claimed.

Public sitemap cache keys retire entries containing former canonical paths.
The public citation manifest follows the same URL format. The optional production
observation retains its known legacy review URL so it works before and after
rollout; it does not prove the new source was deployed.

Raw reports remain ignored. Forced origin tests still observe the known React
419 behavior; this does not establish its resolution. Simulated sessions do not
verify commercial authentication/RLS, and headless engines do not establish
physical iPhone/Safari behavior or real-user percentiles. Commercial SQL delivery,
remote history/advisors, preview checks and reconciliation with #306/#307 remain
release gates. Do not infer recommendation quality from synthetic metrics.
