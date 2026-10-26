# Current Project State

Last checked: 2026-10-26. Reliability diagnosis and recoverable public reads remain
the priority. Contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), [architecture](./docs/core-architecture.md).

## Active Work

[#260 / KOC-105](https://github.com/francozeta/kocteau/issues/260) owns the canonical
read recovery candidate on `fix/public-route-recovery`, alongside
[#263 / KOC-107](https://github.com/francozeta/kocteau/issues/263), under #147.
The [recovery plan](./.plan/canonical-read-recovery.md) owns scope and verification;
the [baseline plan](./.plan/reliability-baseline.md) owns the broader exit gate.

The candidate propagates canonical review/entity/artist read errors to Retry
boundaries. Genuine missing/invalid/ambiguous IDs remain separate. Optional
relationship and legacy callers retain their current fallback. SQL, RLS, cache
keys/tags/TTLs and transport deadlines are unchanged. The native guest/simulated-session matrix passes on mobile and desktop; source
work is not yet a deployed fix.

## Verified Baseline

[PR #264](https://github.com/francozeta/kocteau/pull/264) is integrated at main
`52932a5` and verified on kocteau.com. It correlates sampled browser/server tasks
and public HTTP phases; existing production sampling remains 1%.
[Its record](./.plan/journey-tracing.md) owns the original tracing evidence.

215 unit tests and lint pass for the recovery candidate. The native matrix passes
60 recorded checks, including 20 failure/retry cases across the declared cohorts. A bounded twelve-journey
guest WebKit run against production provides a controlled navigation baseline.
It does not establish production-wide P95, authenticated production coverage,
physical-device behavior or capacity. Detailed timings and limits belong to the
recovery plan; raw reports remain ignored.

## Next

Review the verified recovery candidate, then verify its deployed source before
calling the correction shipped. Continue subphase 1B with representative critical
journeys and numeric budgets. [#265](https://github.com/francozeta/kocteau/issues/265)
owns the newly observed private viewer-context wait; investigate it before wider
identity/cache changes. #259/#261 retain focused identity/primary-read scope.
#243, #228/#242, #253/#254 and SQL-CI KOC-23 remain separate.
Product experiments #245–#251 follow the reliability gate.
