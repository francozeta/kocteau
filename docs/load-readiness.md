# Load readiness

[Operations](./operations.md) | [Environment and secrets](./security/environment.md)

Kocteau uses a small, reproducible k6 suite to catch application, database, and platform regressions before traffic grows. Run the gradual profile against a Vercel preview or staging environment. Production should receive only the smoke profile and only during an intentional maintainer check.

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

## Stop and rollback criteria

Stop a run when any of the following occurs:

- error rate reaches 5% for one minute;
- P95 exceeds twice its threshold for one minute;
- database connections approach 80% of the available pool;
- lock waits, CPU saturation, or memory pressure continue rising after load stops;
- external API failures cascade into application errors.

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
