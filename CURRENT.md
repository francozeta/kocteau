# Current Project State

Search experiment checked: 2026-10-31. The reliability observations below were
last checked on 2026-10-26 and remain the product priority.
Contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), [architecture](./docs/core-architecture.md).

## Active Work

[Search design experiment 001 / #271](https://github.com/francozeta/kocteau/issues/271)
is in [draft PR #272](https://github.com/francozeta/kocteau/pull/272), isolated on
`feat/search-design-judgment` from main `e7718b4`. It tests
selected-canvas feedback while retaining Search's composition, navigation and
actions. MDS Stage 02 is pinned in `mds.json`; the existing skill library is
unchanged. The [experiment record](./.plan/search-design-judgment.md) owns
research, comparison, checks and limits. Unit tests, lint, build and the new
feedback browser checks pass. Two runs of the existing desktop search-recovery
check failed the immediate reload assertion on the candidate while the control
passed. A diagnostic replay restored the query; attribution remains open.
The implementation's Preview is READY and the live guest expansion flow passes
desktop/mobile Chromium checks. Owner acceptance and resolution of the desktop
reload check remain open; see the experiment record for the verified SHA and CI.
This is not
integrated product behavior or a production release and does not advance the
separate reliability gate.

[#269 / KOC-112](https://github.com/francozeta/kocteau/issues/269), delivery
[PR #270](https://github.com/francozeta/kocteau/pull/270), investigates unnecessary
editor code on reading routes. The [editor plan](./.plan/review-editor-loading.md)
owns source scope, browser/byte gates and the execution-resource handoff.
[Its rollout record](https://github.com/francozeta/kocteau/pull/270#issuecomment-6420280473) owns current CI results, byte comparisons and
integration/deployment evidence; source alone does not establish delivery.

[PR #268](https://github.com/francozeta/kocteau/pull/268) is integrated at main
`a772ab1`. It proves fewer canonical identity reads but its same-target guest
production medians changed only review 486 -> 468 ms and track 891 -> 876 ms,
with slower outliers. [Its rollout record](https://github.com/francozeta/kocteau/pull/268#issuecomment-6418785667)
owns deployed-source confirmation and limits. This does not demonstrate a
perceptible navigation improvement. #259/#263 remain open.

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

Use PR #270's rollout record to confirm same-worker browser/byte checks,
verified editor behavior and integration. Confirm the optional production observation's actual
outcome and deployed source separately; different CI workers cannot be compared
with the gru1 latency baseline.

#261 retains primary/optional track dependencies, #265 the private fault wait,
#267 React 419 attribution and #228 catalog invalidation. #243, #242,
#253/#254 and SQL-CI KOC-23 remain separate.
Product experiments #245–#251 follow the reliability gate.
