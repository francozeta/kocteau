# Ranked local Search branches

Initial audited baseline: main `37138e7`; the candidate is rebased on local
`refactor/architecture-foundations`. It remains independent, not a production
rollout or a demonstrated latency optimization. The earlier array
experiment lives in `.plan/search-retrieval-evaluation.md` on its own branch.

## Change

`search_local_entities`, `search_local_artists`, and
`search_local_starter_tracks` order matching rows by exact, prefix, then
substring **before** each existing limit of 18. Equal matches use deterministic
text/UUID ties. Starter keeps editorial sort order within relevance tiers.
Each function returns only the columns its existing candidate mapper consumes.
The final TypeScript ranking, grouping, source quotas, and provider search remain
unchanged.

The application still issues seven independent anonymous local reads for `all`:
track title/artist, album title/artist, artists, Starter title/artist. These are
GET calls to STABLE SECURITY INVOKER functions with empty search_path and explicit
anon/authenticated grants and ROWS 18 planner metadata, not a monolithic RPC. A failed branch preserves its
successful sibling, with the existing failure envelope, three-second fill
budget, caller cancellation, cooldown and uncached degraded result. Missing RPCs
fail rather than triggering a second seven-query legacy fallback. Cache namespace
v3 avoids reusing old unordered pools.

Literal `%`, `_`, and backslash escaping happens in SQL; query text is passed
without JavaScript rewriting. PostgreSQL ILIKE retains the current locale-aware
matching (including accented/non-Latin text). Inputs above 80 characters, empty
inputs and unknown fields return no rows; limits cannot exceed 18. This does not
add tokenization, transliteration, new indexes, dependencies or a service.

## Local verification

- Applied migration to the isolated PostgreSQL 17.11 database with the repository
  migration chain and minimal auth/storage bootstrap. No commercial writes.
- 26 pgTAP checks pass: exact matches after 18+ substrings, prefix and tie order,
  independent artist/type branches, caps, empty/overlong inputs, literal
  wildcards, Unicode, inactive Starter, grants and restrictive anon RLS.
- 37 Search tests pass serialized (including 12 actual PostgREST-client HTTP
  fixture checks): seven-call coalescing,
  no SDK retries, partial title success during artist failure, degraded cache
  recovery, missing-RPC failure, bounded stall, independent cancellation and
  canonical-link reuse. One concurrent grouped run exceeded an existing four-second
  stalled-read assertion during full builds; the serialized rerun passed without
  changing application or test deadlines. TypeScript, focused lint, documentation
  generation and whitespace checks pass.
- Real PostgREST 14.4 and 16.5 processes loaded the three functions in their schema
  caches against PostgreSQL 17.11. Seven anonymous GET branches returned the
  expected narrow columns (entities 13, artists 10, Starter 8), the eighteen-row cap and
  ordered exact matches. Literal `%`, `_`, backslash and accented/non-Latin text
  survived URL encoding and database matching; zero and overlong inputs remained
  bounded. A temporary restrictive policy on one synthetic entity hid that row
  through both the RPC and table API, then restoration made it visible again.
- The real Next.js 16.3 Route Handler, public client and local Data API passed
  successful seven-branch retrieval, three failed artist branches preserving a
  degraded 200, cooldown without a second burst, and fresh recovery. Seven stalled
  HTTP reads were cancelled within the existing budget (one local sample 3,042 ms,
  degraded 502). Cancelling one HTTP caller preserved the shared seven-read fill
  and successful result for another caller. These are contract checks, not latency
  comparisons.
- Chromium and WebKit, each in guest desktop and mobile viewports, passed the
  existing Search UI against real local RPC reads: total local failure offers
  Retry, retry retrieves all seven branches, selection opens the correct provider
  entity, and Back restores the query. No page errors were observed. Provider
  responses were isolated empty fixtures, not commercial search results. These
  browser checks used PostgREST 16.5; the HTTP contract was repeated with 14.4.
- Function entries now use the canonical public-schema output generated from the
  authorized target through Supabase MCP. Existing graphql_public/storage blocks,
  helper types and Constants are preserved; there is no unrelated public-schema
  drift. SQL metadata omits nullable result columns, so the existing generator
  normalizer also preserves the fifteen nullable string fields across these three
  functions. Normalization is idempotent. The pinned CLI 2.109.1 `gen types
  --db-url` requires the pg-meta container and failed against an unavailable local
  Docker socket; full local multi-schema CLI generation is not claimed.

The Data API/browser checks use identified synthetic local rows and a loopback
gateway; their rows and temporary policy are removed afterward. The gateway
forwards real database reads as anon and supplies empty provider responses while
blocking external fetches. Next runs in development mode with webpack, so this
does not establish production framework-cache or runtime behavior. It does not
verify Supabase gateway JWT handling, authenticated requests, target PostgREST
configuration or commercial data.
Local PostgreSQL uses the C locale: ASCII case folding preserves `björk` against
`Björk`, while `BJÖRK` does not match. This is inherited ILIKE behavior, not new
Unicode normalization. Matching parity must be checked against the target locale.

Run SQL tests against a disposable local stack with current migrations:

```sh
pnpm exec supabase test db
```

For the benchmark fixture, use a local `psql` connection only:

```sh
psql "$LOCAL_DATABASE_URL" -X -At -v ON_ERROR_STOP=1 \
  -f supabase/tests/fixtures/ranked-search-benchmark.sql
```

The fixture inserts 10,001 synthetic entities inside one transaction, including
100 substring matches and one exact match inserted last. It captures seven
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF, FORMAT JSON) samples per variant as anon,
then returns candidate counts and rolls back. It performs local ANALYZE for the
fixture; never run it against commercial data. It is not part of normal database
regression runs.

Baseline query selects the same 13 projected columns from entities with
provider='deezer', type='track', title ILIKE '%needle%', LIMIT 18 and no order.
Candidate query: `select * from public.search_local_entities('needle','track','title',18)`.

Initial warm local sample: baseline execution median 0.736 ms, max 1.777 ms;
ranked RPC median 7.930 ms, max 28.351 ms; median planning 0.060/0.027 ms,
respectively. Both had zero shared-buffer reads. Seven samples are not P95;
sequential order, warm buffers, shared CPU and synthetic distribution limit the
comparison. The final ROWS 18 definition was also measured: execution medians 0.931/11.560 ms,
maxima 1.362/26.382 ms, median planning 0.074/0.027 ms (baseline/RPC), with zero
shared-buffer reads. Function Scan's estimate is now 18 rows rather than the
PostgreSQL default 1000. Function Scan includes the SQL function but hides its
nested plan.
Ordering all matches costs more than stopping at the first 18: this branch
improves constructed candidate coverage, not execution speed. A repetition while other full builds/lints ran measured execution medians
0.957/29.769 ms and maxima 42.975/58.877 ms (baseline/RPC); raw plans remain local. Both runs returned 18 rows, baseline exact-match count 0 and ranked
exact-match count 1 among 101 matching rows. This is a constructed fixture, not a
measured omission rate in the real catalog. It does not establish production
latency, capacity or listener preference.

## Rollout gate

The authorized target preparation applied only the three additive functions as
`20261116192307_ranked_local_catalog_search`. Invoker/grants/RLS/ROWS metadata
were checked, the preceding Starter RPC definition remained unchanged, and
canonical public types were regenerated. The migration file retains the exact
reviewed SQL under the target's recorded version. This does not deploy the app.

Keep this branch separate from URL/cache foundations. Before integration:
verify target Data API GET RPC exposure/schema cache and grants, and compare
first-selectable result/timeouts under the same runtime/region and
representative query distribution. Measure 2-character, miss, popular, selective
and multilingual cases; do not infer end-to-end latency from SQL alone.

Migration must be reviewed, applied and verified in the authorized target before
deploying code that calls the new functions. There is no runtime capability flag
or silent fallback. Production rollout remains unauthorized in this work.
No Rust, new search engine or index is justified by this experiment alone.
