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
- 30 Search tests pass serialized (including 12 actual PostgREST-client HTTP
  fixture checks): seven-call coalescing,
  no SDK retries, partial title success during artist failure, degraded cache
  recovery, missing-RPC failure, bounded stall, independent cancellation and
  canonical-link reuse. One concurrent grouped run exceeded an existing four-second
  stalled-read assertion during full builds; the serialized rerun passed without
  changing application or test deadlines. TypeScript, focused lint, documentation
  generation and whitespace checks pass.
- Function-only entries were added to database.types.ts from the reviewed SQL
  signatures and checked by TypeScript against actual RPC calls. Full Supabase
  CLI type generation is not claimed: the local database has no running pg-meta
  service. Regenerate against a full isolated stack before integration and reject
  unrelated generated-schema changes.

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

Keep this branch separate from URL/cache foundations. Before integration:
regenerate types with the full local Supabase tooling, verify actual Data API GET
RPC exposure/schema cache and grants, run browser Search recovery with this DB,
and compare first-selectable result/timeouts under the same runtime/region and
representative query distribution. Measure 2-character, miss, popular, selective
and multilingual cases; do not infer end-to-end latency from SQL alone.

Migration must be reviewed, applied and verified in the authorized target before
deploying code that calls the new functions. There is no runtime capability flag
or silent fallback. Production rollout remains unauthorized in this work.
No Rust, new search engine or index is justified by this experiment alone.
