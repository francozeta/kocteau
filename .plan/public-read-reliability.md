# Public read reliability

Verified 2026-10-22 against application baseline `0ebf3d9` and the documentation
handoff in [PR #220](https://github.com/francozeta/kocteau/pull/220).
Implementation branch: `perf/public-read-reliability`, [PR #221](https://github.com/francozeta/kocteau/pull/221).
Production delivery remains pending; exact preview and CI evidence belongs in the PR.

## Implementation

The anonymous data client now uses the pinned PostgREST client directly, with
explicit retries disabled. The pinned supabase-js constructor does not forward
`db.retry`; a test against the actual SDK reproduces four attempts versus one.
The public transport permits eight active and 32 waiting reads per process.
Its three-second deadline includes queue time, response headers and body.
Authenticated/admin clients retain their existing session and permission paths.

Search shares concurrent normalized ASCII-case lookups, retaining original text
for ranking. Shared fills have independent finite deadlines (three seconds for local results
and canonical links), bounded maps and a one-second failure cooldown. Their tagged
Next.js cache retains its 60-second refresh policy. Source readiness reports
fresh, stale or degraded results even when cached data returns HTTP 200.
Cold unavailable local reads return 502. Legacy provider search uses the existing
three-second provider budget. Optional taste-tag failures no longer cache a false
empty result. The owning [Discovery guide](../apps/web/components/discovery/README.md)
defines these boundaries.

## Controlled native HTTP measurements

Both checkouts used Node 24.15.0, pnpm 11.21.0, Next.js 16.3.0 production builds,
and a loopback HTTP data/provider fixture. Each comparison sent 16 concurrent
ASCII-case query variants with cold keys and one deterministic public entity.
The fixture had a 30 ms response delay; it does not execute SQL. Expected returned
identities were asserted. Shared production data was not contacted.

| Scenario | Baseline | Candidate |
| --- | ---: | ---: |
| Healthy Data API requests | 112 | 7 |
| Healthy search P95 | 263 ms | 80 ms |
| Returned expected matches | 16 | 16 |
| Data API requests during HTTP 503 | 448 | 7 |
| Unavailable cold local response | HTTP 200, empty array | HTTP 502, degraded |
| Stalled local dependency | Previously unbounded by search | 3,015 ms, connections released |
| Stalled legacy provider | Previously outside shared budget | 3,014 ms |
| Same-key recovery | not measured here | HTTP 200/fresh, 47.5 ms |

This is a 93.75% reduction in requests for equivalent concurrent healthy keys and
98.44% during the fixture's 503 failure. It is not a maximum-user or production
latency claim. Tail latency on real data, instance scaling, CPU/memory peaks,
cross-instance refresh coordination and authenticated workflows remain unmeasured.
The cause of the earlier cloud incident remains unresolved.

## Verification and reproduction

175 unit/integration tests pass, including actual SDK retry behavior, queue bounds,
native header/body cancellation, cache coalescing, source readiness, failed-fill
recovery and taste-tag cache recovery. Production builds, lint and documentation
checks pass. Browser checks at 1280 px and 390 px preserve result rendering and
usable local results while a provider stalls; no page exceptions or mobile
horizontal overflow occurred.

`pnpm perf:reads:fixture` and `pnpm perf:reads:verify` provide a portable,
loopback-only regression path. The [load guide](../docs/load-readiness.md)
describes both production-server checkouts and the outbound-isolation preload.
Raw logs and screenshots remain ignored. No migration, production traffic,
authentication change, fake cloud engagement, merge or deployment is included.

The audit's OG asset policy, dependency advisories and authoritative mutation
quotas remain separate follow-up work; this implementation does not resolve them.


## Cloud cold-start correction

The first preview check exceeded the initial 1.5-second local fill deadline.
A direct read-only control found all seven cloud Data API reads succeeded in
2,007-2,076 ms, while management SQL remained responsive. The final public
transport and shared local/link fill budgets are three seconds each. This also
protects valid cold canonical lookups from the initial sub-second cutoff.
Provider work and canonical linking can occupy about six seconds of dependency
work in the worst case; local and remote UI phases remain independent.

This corrects fixture-derived deadlines that were too aggressive for real cold
network work. It does not establish SQL saturation or explain the earlier shared
incident. Final local checks and exact-preview verification use the corrected
budgets. No gradual cloud load was run.

## Review follow-up (2026-10-23)

Caller cancellation now stops waiting immediately for shared local and canonical
link fills, while another caller can receive the same completed work. Tests assert
a cancelled local request returns 499 in less than 500 ms without restarting the
seven reads; a surviving caller still receives the expected entity. Shared fills
retain their independent three-second deadlines.

A detected refresh failure remains degraded after the one-second retry cooldown
expires and while the retry is pending. Only a successful refresh clears that
failure entry (subject to the bounded, process-local map). This prevents cooldown
expiry from being mistaken for recovery. No cross-instance health guarantee is
implied.

The native regression now enforces exactly seven candidate Data API reads for
both healthy and 503 scenarios, checks connection release after stalled legacy
provider work, and rejects unknown fixture table/RPC paths. The fixture requires
its actual IPv4 binding. Search early responses carry no-store, and k6 reports
fresh, stale and degraded rates explicitly. Taste-tag fallback logs retain error
name/message and entity ID without caching the empty fallback.

The repeated isolated native comparison observed 112 versus seven healthy reads
(P95 270 ms versus 82 ms) and 448 versus seven reads during 503s. Stalled local and
legacy provider requests completed in 3,011 ms and 3,010 ms; active upstream
connections returned to zero in both cases. Same-key recovery was 200/fresh in
46 ms. These are repeated fixture observations, not production benchmarks.

All 175 tests, lint, production build/TypeScript, documentation and whitespace
checks pass. Desktop/mobile search at 1280/390 px returned both phases successfully
with visible expected results, no page exceptions and no horizontal overflow.
No production load, migration or authenticated cloud write was performed.

## Exact runtime preview and delivery caveat

Runtime revision `fe2ebb4` passed GitHub Verify (run 519) and its Vercel build.
The first exact-preview local track search on 2026-10-23 returned 502/degraded at
3,085 ms. Logs show all four local reads reached the shared deadline. A later
request to the same query returned 200/fresh with the expected track in 1,501 ms.
The preceding runtime preview returned the same track in 113 ms; those observations
have different cache/connection warmth and do not establish a comparative latency
gain. Empty and invalid legacy requests verified no-store with 200/400 responses.

A separate anonymous single Data API control returned 200 in 792 ms. Management
SQL observed nine client connections out of 60, one active query and no lock
waits. These controls do not identify the cause of the earlier cold deadline
failure or rule out transient infrastructure/network waits. Production delivery
still needs a justified cold-read latency budget; no deadline was increased merely
to make the subsequent check pass, and no further cloud load was generated.

A full native Next.js cache lifecycle check waited beyond the actual 60-second TTL
on isolated fixtures. It observed 200/fresh, then stale during revalidation,
degraded after failure, still degraded after cooldown expiry with a stalled retry,
and finally 200/fresh after a successful refresh. Expected results stayed available,
and active fixture connections returned to zero. This verifies real stale-while-
revalidate behavior in addition to the unit cache model.
