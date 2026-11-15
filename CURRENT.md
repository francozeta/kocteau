# Current Project State

Last checked: 2026-10-26. Reliability diagnosis and recoverable public reads remain
the priority. Contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), [architecture](./docs/core-architecture.md).

## Active Work

The Search follow-up on `feat/search-constellation` now paints new connections as live brush gestures, preserves deposited ink during motion and spawns candidates from the current seed's position/velocity. Each track owns a variable catalog pool; starters are entry points only. Ranking uses bounded, account/guest-scoped browser opens/revisits, not account-wide listening history or audio analysis. Legacy seeded snapshots refresh candidates while preserving the Back path.

The overlapping Search header was reproduced at two simultaneous owners on desktop/mobile. Search seed routes now share one transition key, and exiting routes release their shell portals. Chromium/WebKit regression checks observe at most one header/input/action/canvas owner through rapid Back/Forward; they also cover isolated seed pools, snapshots and failure/retry without starters. 239 unit tests, lint and the isolated-data build pass. WebKit uses a software-composited virtual display, not a physical iPhone. The `ff02426` preview also passed live catalog probes for two tracks and a second variant, motion/visual checks, actual candidate expansion and rapid-history header checks. Recommendation quality review and physical iPhone Safari/Brave validation remain the next gate against the earlier `55ecb3f` preview. No production release is implied.

Canvas covers now use subtle ASCII discs while images load, with finite CSS grain animation and stable geometry. Delayed, cached and failed loads, animation cleanup and reduced motion pass local Chromium/WebKit checks at desktop and mobile widths. Canvas motion still stops at rest. This follow-up is limited to Search cover loading; visual feedback on the next preview remains pending.

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
