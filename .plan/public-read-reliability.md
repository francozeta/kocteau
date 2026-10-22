# Public read reliability

Verified 2026-10-22 against application baseline `0ebf3d9` and the documentation
handoff in [PR #220](https://github.com/francozeta/kocteau/pull/220).
Implementation branch: `perf/public-read-reliability`. Deployment is pending.

## Implementation

The anonymous data client now uses the pinned PostgREST client directly, with
explicit retries disabled. The pinned supabase-js constructor does not forward
`db.retry`; a test against the actual SDK reproduces four attempts versus one.
The public transport permits eight active and 32 waiting reads per process.
Its three-second deadline includes queue time, response headers and body.
Authenticated/admin clients retain their existing session and permission paths.

Search shares concurrent normalized ASCII-case lookups, retaining original text
for ranking. Shared fills have independent finite deadlines (1.5 seconds local,
750 ms links), bounded maps and a one-second failure cooldown. Their tagged
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
| Healthy search P95 | 241.7 ms | 62.0 ms |
| Returned expected matches | 16 | 16 |
| Data API requests during HTTP 503 | 448 | 7 |
| Unavailable cold local response | HTTP 200, empty array | HTTP 502, degraded |
| Stalled local dependency | Previously unbounded by search | 1,511 ms, connections released |
| Stalled legacy provider | Previously outside shared budget | 3,012 ms |
| Same-key recovery | not measured here | HTTP 200/fresh, 45.7 ms |

This is a 93.75% reduction in requests for equivalent concurrent healthy keys and
98.44% during the fixture's 503 failure. It is not a maximum-user or production
latency claim. Tail latency on real data, instance scaling, CPU/memory peaks,
cross-instance refresh coordination and authenticated workflows remain unmeasured.
The cause of the earlier cloud incident remains unresolved.

## Verification and reproduction

171 unit/integration tests pass, including actual SDK retry behavior, queue bounds,
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
