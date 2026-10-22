# Capacity and security audit

Verified on 2026-10-22. Application baseline: `0ebf3d9`, following
[PR #219](https://github.com/francozeta/kocteau/pull/219).
This is measurement and implementation feedback, not a deployment or capacity certification.

## Immediate reliability finding

The bounded preview test returned successful cached search responses while its
upstream data plane failed. Load generators have stopped. Subsequent management
SQL, pinned CLI login-role initialization, and a direct public Data API read
timed out. A control-plane `ACTIVE_HEALTHY` response did not establish
data-plane availability.

Recovery was verified without restart: a fresh direct public Data API read
returned a row at 16:44:51 UTC; SQL at 16:45:24 UTC returned 22/60 connections,
one active session, no lock waits, and the unchanged 18-review count. A new
production local-search cache key returned all three expected matches at
16:45:36 UTC in 845 ms, with 345 ms in server processing. The original test
generators remain stopped. This verifies recovery, not the cause of the incident.

The inspected project-wide Data API window, 16:28–16:38 UTC, contained 2,615 HTTP
522 responses, 2,360 HTTP 503 responses, 721 HTTP 200 responses, and two HTTP 525
responses. These include background refreshes and other project traffic; they
are not independent visitor counts. The first failed minute in the inspected
series was 16:31 UTC. Error volume fell after the load generators stopped.
Vercel recorded repeated `public-catalog-search-v1` and
`public-catalog-entity-links-v1` revalidation failures; one ten-minute query
returned 226 error/fatal records for `/api/search`.
Production runtime logs also recorded upstream lookup failures and function
timeouts during the same incident window; impact was not limited to the preview.

This establishes a failure during the test window, not its root cause or a
universal 24-user limit. Connection exhaustion, compute/memory pressure,
provider infrastructure, and refresh amplification still need distinguishing.
The provider's global status page reported operational when checked.

## Scope and method

- Production received the repository smoke profile: 12 read-only HTTP requests.
- Gradual public API checks used the protected final PR #219 preview. Its complete
  Git tree matches the deployed main tree. It uses the existing cloud database;
  a preview URL does not isolate database pressure.
- The real search API used six known matching local-catalog queries, a one-second
  pause per virtual user, 10-second request timeouts, and abort thresholds for
  response failures and excessive measured latency. Provider search was excluded
  from the gradual profiles. The production smoke included the normal provider path.
- Levels were 3, 6, 12, and 24 VUs with 12 iterations each. A separate 24-VU run
  executed 60 iterations per user. Setup requests were recorded separately.
- A separate bounded cold-key check used 16 case variants of one known matching
  query, with four concurrent workers. No nonmatching filler queries were used.
- Security checks used signed-out routes, public-key Data API reads, read-only
  catalog/permission inspection, a dependency audit, and a bounded local fixture.
  No accounts, OTP emails, authenticated review writes, cloud DDL, resets, or
  exploit payloads were generated.

## Measurements and limits

| Preview scenario | Measured matching responses | P95 | P99 | HTTP/shape failures |
| --- | ---: | ---: | ---: | ---: |
| 3 VUs, prepared cache | 36 | 160 ms | 680 ms | 0% |
| 6 VUs, prepared cache | 72 | 273 ms | 1,558 ms | 0% |
| 12 VUs, prepared cache | 144 | 214 ms | 269 ms | 0% |
| 24 VUs, prepared cache | 288 | 302 ms | 1,573 ms | 0% |
| 24 VUs, sustained cached responses | 1,440 | 180 ms | 399 ms | 0% |
| 4 concurrent cold-key workers | 16 | 7,704 ms | not established | 0% |

The sustained run lasted approximately 71 seconds including setup and completed
about 20.3 measured requests/second. Its maximum VU gauge confirms 24. It returned
about 2.6 MB including setup. Background failures invalidate a conclusion that
this is healthy end-to-end capacity. Even the shape checks only establish a
nonempty matching array, not freshness or complete source coverage.

Production smoke had no HTTP errors, but song/search page latency exceeded the
repository's budgets. With only three samples per surface, those percentiles
are diagnostic rather than stable estimates. The track maximum was 2,665 ms;
search page maximum was 2,411 ms. Preview cold track responses reached 4,266 ms.
Runtime logs include slow route identity, starter reads, and recommendations.
Full HTML response time includes completion of streamed sections, not only TTFB.

Cold local-search responses reached about 7.2 seconds inside the server's
`local` stage, with `catalog=0`. Earlier representative PostgreSQL inspection
completed a small entity lookup in 0.181 ms. The before/after statement samples
also showed sub-millisecond to low-millisecond mean execution for frequently
called reads. This does not support adding indexes as the first fix for the
multi-second wait. Network/gateway time, initial connections, refresh fan-out,
and runtime scheduling remain hypotheses requiring isolation.

Connection snapshots before the incident showed 19–22 total connections against
`max_connections=60`, with no lock waits. These are samples, not peak monitoring;
later SQL reads failed, so the audit cannot claim stable connections throughout.
Vercel's detailed metric query required Observability Plus. CPU, memory, pool
peaks, and cold-start percentages were therefore not established. No plan or
observability purchase was made.

An initial sustained run was excluded because a k6 configuration environment
variable overrode the intended scenario. It is not part of this table. Raw
diagnostics, scripts, and temporary access material remain ignored locally.

## Security findings

### P1: OG asset URLs allow unrestricted server-side fetches

`apps/web/lib/og.tsx` accepts external HTTP(S) and data URLs, follows fetch
redirects, and reads the entire response without an explicit timeout, byte cap,
or trusted-host policy. The public profile OG route passes the profile's avatar
URL into that helper. Live database inspection confirmed that authenticated
owners can update `profiles.avatar_url`; the column has no URL restriction and
the profile triggers only maintain timestamps.

An isolated fixture ran the actual helper source with cache/image-render adapters
and a controlled local PNG server. Profile image generation fetched its loopback
asset twice. This reproduces the helper's unrestricted network behavior; it is
not an authenticated production exploit or evidence of data extraction. No
private off-host endpoint was contacted.

Constrain assets to approved HTTPS origins and paths, validate each redirect,
reject arbitrary data/SVG inputs where appropriate, and cap time, bytes, and
content type. Keep the same policy at the data write boundary and OG read boundary.

### P1: affected dependency versions need a focused update

`pnpm audit --prod --json` against the main lockfile reported 27 advisories:
3 critical, 17 high, 6 moderate, and 1 low. Counts are advisories, not 27
independently exploitable application bugs. Several transitive modules are used
by build tooling despite being in the production dependency graph.

| Module | Advisories | Installed version |
| --- | ---: | --- |
| next | 9 | 16.3.0 |
| sharp | 2 | 0.35.3 |
| brace-expansion | 6 | 5.0.6 |
| fast-uri | 9 | 3.1.0 |
| source-map-js | 1 | 1.2.1 |

The three critical Next.js advisories concern Windows-hosted servers, AVIF image
optimization, and Node `ImageResponse`. The Windows prerequisite does not describe
the Vercel production deployment. The OG advisory requires attacker-controlled
SVG content, attributes, or styles; that exact exploit condition was not
reproduced. The image pipeline still deserves priority because arbitrary asset
fetching exists and the avatars bucket permits WebP/SVG uploads up to 5 MB.

Use at least the verified Next.js 16.3.8 patch line and sharp 0.35.5, align the
Next-related packages, and resolve the relevant transitive advisories through a
reviewed lockfile update. Verify build, image generation, auth, and the public
discovery flow before deployment.

Primary advisories:
[AVIF](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4),
[Node OG](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j),
[Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36),
[image SSRF](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4).

### P1/P2: search amplification and hidden dependency failures

`loadLocalCandidates` issues seven independent database reads for `type=all` on a
cache miss. Local cache fills are deliberately independent of caller cancellation
but have no shared finite deadline. The external three-second budget does not
bound this work. Query casing also fragments otherwise equivalent cache keys.

Successful stale responses can mask repeated background refresh failures. Add
bounded refresh concurrency and deadlines, report degraded/freshness state, and
ensure the load harness fails on dependency errors and incomplete expected data.
Verify cache coalescing across requests; do not assume per-request deduplication
prevents a refresh stampede. A stampede is a hypothesis, not an established root cause.

The legacy `/api/deezer/search` route also omits the caller signal and the shared
search deadline. Public routes have no application-level read quota in the
reviewed handlers. Infrastructure protections were not disabled or exhaustively
tested. Test abuse controls on isolated staging.

### P2: mutation limits can be bypassed outside application routes

The application applies rate limits before mutations, but live function metadata
shows authenticated execution of `create_review_with_entity`,
`toggle_review_like`, and `toggle_profile_follow` without an internal
`check_rate_limit` call. Direct own-row write policies also exist. A caller using
the Data API can bypass route-only quotas. No authenticated cloud mutation was
used to exploit this path. Move critical quotas into the authoritative database
boundary or restrict direct access after reviewing supported clients.

### P2: browser response hardening

Production HEAD and preview GET responses lacked CSP/frame restrictions,
`X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`; HSTS is
present. These are hardening gaps, not demonstrated XSS or session compromise.
Introduce a compatible policy with staged enforcement and browser verification.

## Verified access boundaries

Seventeen corrected method/route checks passed: private reads, curator/admin
actions, unauthenticated review create/edit/comment requests, cron denial,
oversized/invalid search parameters, disallowed image hosts, and external auth
return-path sanitization. Two initial method-discovery probes returned 405 and
were replaced by checks of their supported methods.

Public-key reads of nine private tables returned zero rows or permission denial:
bookmarks, library state, notifications, preferences, roles, curator applications,
catalog observations, proposals, and rate windows. Every inspected public table
had RLS enabled. This does not replace authenticated cross-user authorization
tests or prove safety of every SECURITY DEFINER function.

## Next actions

1. Investigate the recovered shared-data-plane incident, preserving its logs and failure window.
2. Restrict OG asset fetching and update affected runtime dependencies.
3. Bound local DB work and refresh concurrency; detect stale/degraded success.
4. Run a staged test with isolated data, representative catalog size, real test
   sessions, expected result identities, and application/dependency telemetry.
5. Increase concurrency only after latency, backend health, and error budgets all
   pass. Measure writes/OTP separately; no maximum user count is established here.

The [load guide](../docs/load-readiness.md) now requires an isolated database for
gradual tests and treats background/dependency errors as immediate stop signals.
The data plane recovered before a restart was needed. No production configuration,
application deployment, or recovery write was performed.
