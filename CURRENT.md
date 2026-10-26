# Current Project State

Last checked: 2026-10-26. Reliability diagnosis and recoverable public reads remain
the priority. Contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), [architecture](./docs/core-architecture.md).

## Active Work

[#259 / KOC-104](https://github.com/francozeta/kocteau/issues/259) now prioritizes
actual canonical navigation latency, following the user's production feedback.
The [navigation plan](./.plan/canonical-navigation.md) owns the single-read review
resolution, short-ID public caches, immediate alias invalidation and measurement
limits. Local cache checks verify review cold reads 2 -> 1 and repeat review/entity
reads 1 -> 0; production improvement is not yet established.

[PR #266](https://github.com/francozeta/kocteau/pull/266) is integrated at main
`62763aad`. Its [recovery plan](./.plan/canonical-read-recovery.md) owns canonical
Retry vs genuine absence; [#263 / KOC-107](https://github.com/francozeta/kocteau/issues/263)
and the [baseline plan](./.plan/reliability-baseline.md) retain the broader gate.

## Verified Baseline

[PR #264](https://github.com/francozeta/kocteau/pull/264) is integrated at main
`52932a5`. Its [rollout record](https://github.com/francozeta/kocteau/issues/263#issuecomment-6405758213)
documents bounded anonymous production navigation. It correlates sampled browser/server tasks
and public HTTP phases; existing production sampling remains 1%.
[Its record](./.plan/journey-tracing.md) owns the original tracing evidence.

216 unit tests and lint pass for the recovery candidate. The native matrix passes
60 recorded checks, including 20 failure/retry cases across the declared cohorts. A bounded twelve-journey
guest WebKit run against production provides a controlled navigation baseline.
It does not establish production-wide P95, authenticated production coverage,
physical-device behavior or capacity. Detailed timings and limits belong to the
recovery plan; raw reports remain ignored.

Forced origin failures may still record React error `419`. Covered canonical
identity failures now show Retry in the local matrix; this does not claim a fix
for `419`, legacy/provider policies or the separate private wait in #265.

## Next

Complete the navigation candidate's browser/check gate, integrate it and compare
the same production review/track before and after deployment. The navigation plan
records pinned targets and the bounded baseline. Do not infer production-wide
speed or capacity from origin-read counts.

[#265](https://github.com/francozeta/kocteau/issues/265) retains the private
viewer-context fault wait; it follows the newly prioritized normal-navigation
work. #261 retains secondary track dependencies. #267 retains React 419
attribution. #243, #228/#242, #253/#254 and SQL-CI KOC-23 remain separate.
Product experiments #245–#251 follow the reliability gate.
