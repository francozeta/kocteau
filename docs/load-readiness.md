# Load readiness

[Operations](./operations.md) | [Environment and secrets](./security/environment.md)

Kocteau uses a small, reproducible k6 suite to catch application, database, and platform regressions before traffic grows. Run the gradual profile against a Vercel preview or staging environment connected to an isolated, disposable database. Verify the database target first: a preview URL alone does not isolate Supabase pressure from production. Production, including previews that share its database, should receive only the smoke profile and only during an intentional maintainer check.

## Covered surfaces

- `/` exercises the cached public landing.
- A canonical `/tracks/{slug}/{id}` route is discovered from `/sitemap.xml` unless `K6_TRACK_PATH` is provided.
- `/search?q=…` exercises the server-rendered discovery surface.
- `/api/search?q=…` exercises Kocteau-first search plus the external catalog fallback.
- `/feed?view=for-you` is included only when `K6_AUTH_COOKIE` is provided.

The suite performs read-only requests. It does not publish reviews, mutate analytics, or create synthetic users.

## Install k6

Windows:

```powershell
winget install --exact --id GrafanaLabs.k6 --source winget
```

Other platforms should use the official Grafana k6 package for that platform.

## Smoke profile

The smoke profile runs three iterations per public surface with one virtual user. Use it to validate a fresh preview:

```powershell
$env:K6_BASE_URL = "https://preview.example.com"
$env:K6_SUMMARY_PATH = "tmp/load-tests/smoke.json"
pnpm perf:load:smoke
```

## Gradual baseline

The baseline ramps each public surface from zero to three virtual users over 80 seconds. Run it only after smoke passes:

Confirm that both the application and its database are isolated from production.
Keep provider traffic bounded separately; local search checks do not need to
generate external catalog traffic.

```powershell
$env:K6_BASE_URL = "https://preview.example.com"
$env:K6_SUMMARY_PATH = "tmp/load-tests/baseline.json"
pnpm perf:load:baseline
```

### Protected Vercel previews

Keep Deployment Protection enabled. Either provide an existing automation bypass secret through `K6_VERCEL_BYPASS_SECRET`, or let the authenticated Vercel CLI create a temporary cookie for the current preview:

```powershell
New-Item -ItemType Directory -Force -Path tmp/load-tests | Out-Null
vercel curl "$env:K6_BASE_URL/sitemap.xml" `
  -H "x-vercel-set-bypass-cookie: true" `
  -L `
  -c tmp/load-tests/vercel.cookies `
  -o tmp/load-tests/protected-sitemap.xml `
  --silent `
  --show-error

$cookieLine = Get-Content tmp/load-tests/vercel.cookies |
  Where-Object { $_ -match "_vercel_jwt" } |
  Select-Object -Last 1
$cookieFields = $cookieLine -split "`t"
$env:K6_PREVIEW_COOKIE = "$($cookieFields[5])=$($cookieFields[6])"

pnpm perf:load:baseline
Remove-Item Env:K6_PREVIEW_COOKIE
```

The cookie and generated reports remain under ignored `tmp/`. Never copy either value into documentation, an issue, or a commit.

Override discovery when a known canonical track should be measured:

```powershell
$env:K6_TRACK_PATH = "/tracks/sea-swallow-me/known-short-id"
```

## Search And Database Isolation

The search-only commands skip landing/track discovery and authenticated feed
traffic, and measure the local catalog without calling the external provider:

```bash
pnpm perf:search:smoke
pnpm perf:search:baseline
```

They default to the running app at `http://127.0.0.1:3000`. For repeatable
application measurements, use `pnpm --filter web build` followed by
`pnpm --filter web start` against disposable local Supabase. The baseline keeps
the same gradual zero-to-three-user profile; run it after smoke passes. It
measures the current fixture catalog, not production capacity.

Smoke executes three iterations, so a longer query list is not guaranteed full
coverage. Use a known query set with matches instead of measuring only one warm
cache key:

```powershell
$env:K6_SEARCH_QUERIES = '["cocteau", "burial", "FKA twigs"]'
pnpm perf:search:baseline
Remove-Item Env:K6_SEARCH_QUERIES
```

Additional controls for the existing `perf:load:*` commands:

| Variable | Meaning |
| --- | --- |
| `K6_SEARCH_ONLY=1` | Run only search page/API traffic; skip canonical-route discovery and feed traffic. |
| `K6_SEARCH_REQUIRE_MATCHES=1` | Require each executed query to return at least one result. The search-only commands enable this; use known seeded queries. |
| `K6_SEARCH_SOURCE` | `local`, `remote`, or `all`; defaults to `all`. The search-only commands select `local`. |
| `K6_SEARCH_QUERIES` | Non-empty JSON array of query strings, rotated across virtual users and iterations. |
| `K6_SEARCH_QUERY` | Existing single-query fallback when an array is absent. |

Reports include P99, source/query-count metadata, and `search_stage_local`,
`search_stage_catalog`, `search_stage_links`, `search_stage_rank`, and
`search_stage_total` from the API's timing header. Local/provider stages overlap;
do not add their durations. Result-array and timing-header checks prevent an
unrelated successful response from passing as a search measurement. Search-only
commands also require matches, so an empty fallback cannot pass the smoke check.

A warm cached result alone does not prove database connectivity. For database
failure checks, use a fresh cache key with a known fixture match or fresh local
state and verify the database call delta. Repeated queries can reuse the server data cache. A mixed query set does not
guarantee cache misses, and adding an unused URL parameter does not bypass that
cache. Use fresh disposable state or known fresh query keys, compare repeated
requests, and record database call deltas alongside timings. Smoke percentiles
have too few samples to establish latency or capacity targets. Keep production
checks on the smoke profile; gradual runs belong on local/preview/staging.

## Authenticated feed

Copy the complete `Cookie` request header from an intentionally-created test session. Keep it only in the current shell and never commit it:

```powershell
$env:K6_AUTH_COOKIE = "sb-project-auth-token=redacted"
pnpm perf:load:smoke
Remove-Item Env:K6_AUTH_COOKIE
```

Without the variable, the authenticated scenario is omitted instead of measuring the login redirect as a successful feed response.

## Thresholds

| Surface | P75 | P95 | Failed requests |
| --- | ---: | ---: | ---: |
| Landing | < 800 ms | < 1,500 ms | < 1% |
| Canonical track | < 1,200 ms | < 2,500 ms | < 1% |
| Search page | < 1,000 ms | < 2,000 ms | < 1% |
| Search API | < 1,500 ms | < 3,000 ms | < 2% |
| Authenticated feed | < 1,200 ms | < 2,500 ms | < 1% |

Search API has a slightly wider budget because it can use an external catalog fallback. Treat repeated fallback latency as an integration/cache problem, not automatically as a Postgres problem.

## Database snapshots

Capture read-only snapshots immediately before and after the baseline:

```powershell
pnpm exec supabase inspect db db-stats --linked
pnpm exec supabase inspect db role-stats --linked
pnpm exec supabase inspect db outliers --linked
pnpm exec supabase inspect db traffic-profile --linked
```

Review:

- cache-hit ratio and database size;
- active role connections and pool pressure;
- high-call or high-total-time statements;
- unexpected writes during a read-only run;
- lock or error growth.

Do not reset `pg_stat_statements` on production merely to isolate a test. Compare the before/after call counts or use a staging database.

## Vercel review

For the same test window, record from Vercel Observability:

- function invocations per tested route;
- P75/P95 duration and time to first byte;
- active CPU and memory;
- error rate and cold-start percentage;
- external API duration for search.

The k6 summary measures client-visible latency; Vercel and Supabase observations identify where that time was spent.

## Source readiness

The search API reports `X-Kocteau-Search-Status` and per-source readiness. The
suite rejects missing readiness and aborts on detected degraded responses,
including HTTP 200 fallbacks. Gradual runs require more than 99% fresh responses;
normal stale-while-revalidate transitions count against that budget. Smoke records
freshness without treating one normal refresh as a capacity estimate.
Observe backend refresh errors alongside HTTP status and shape; cached success
alone cannot establish dependency health.

## Stop and rollback criteria

Stop a run when any of the following occurs:

- background cache refreshes or dependency health checks fail, even when cached
  application requests still return HTTP 200;
- upstream Data API 5xx responses or administrative connection timeouts appear;
- error rate reaches 5% for one minute;
- P95 exceeds twice its threshold for one minute;
- database connections approach 80% of the available pool;
- lock waits, CPU saturation, or memory pressure continue rising after load stops;
- external API failures cascade into application errors.

Successful nonempty result arrays are insufficient to certify capacity. Check
expected result identities/completeness, freshness, upstream status, and runtime
errors throughout the same window. Stop before increasing load when the health
signal is unavailable. Record recovery separately from client-visible timings.

Roll back the application change under test when the regression reproduces against the previous deployment with the same profile and data conditions. Otherwise open a focused issue for the responsible layer: application, query/index, cache/external API, or platform capacity.

## Recorded baseline

The first gradual baseline ran on July 23, 2026 against the protected Vercel preview for PR #146. It covered public traffic only; authenticated feed measurement remains opt-in because no test-session cookie was committed or shared.

| Surface | P75 | P95 | Maximum | Failed requests |
| --- | ---: | ---: | ---: | ---: |
| Landing | 305 ms | 393 ms | 1,022 ms | 0% |
| Canonical track | 1,115 ms | 1,437 ms | 5,392 ms | 0% |
| Search page | 548 ms | 612 ms | 3,016 ms | 0% |
| Search API | 917 ms | 1,213 ms | 1,787 ms | 0% |

The run completed 211 iterations and 261 requests, with nine VUs at peak and a 100% check pass rate. Every P75, P95, and error-rate threshold passed.

Supabase remained stable across the window:

- active connections returned from 16 before the run to 14 after it;
- `authenticator` remained at 9 active connections;
- no role approached 80% of its connection limit;
- database size remained 21 MB;
- table and index hit rates remained 100%;
- the cumulative query outliers were Supabase Dashboard introspection queries, not Kocteau application queries.

The isolated maximums on canonical track and search page show a cold-tail opportunity, but they did not persist through P95 under gradual load. Investigate those paths separately before raising concurrency or changing database capacity.


## Isolated Public-Read Regression

`pnpm perf:reads:fixture` starts a loopback HTTP fixture on port 54321.
It emulates Data API/catalog responses, 503 errors, and stalled connections;
it does not execute SQL or establish database capacity.

Build separate candidate and baseline checkouts with the pinned runtime, frozen
installs, `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` and a fixture-only
publishable key. Start their production servers on ports 3000 and 3001.
For each server set `NODE_OPTIONS=--import=<absolute-path-to-fixtures/isolate-upstreams.mjs>`.
This verification preload blocks non-loopback data fetches and intercepts provider
requests. Keep it out of deployment configuration.

Run `pnpm perf:reads:verify`. Its targets are fixed loopback origins. It checks
expected identities, request amplification, deadline cancellation, and recovery.
The fixture returns deterministic rows rather than implementing PostgreSQL
filtering. These measurements do not establish production capacity, authenticated
permissions, SQL plans, or performance on a representative catalog.
