# Current Project State

Last checked: 2026-11-15. Approved Search integration is active alongside
reliability diagnosis and recoverable public reads. Contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), [architecture](./docs/core-architecture.md).

## Active Work

Public SEO foundation work is proposed in [PR #306](https://github.com/francozeta/kocteau/pull/306)
(`fix/public-discovery-stage-one`, draft). The landing footer no longer
promotes public Help or curator applications, but retains legal, changelog,
docs and accessibility links; the private curator administration remains
unchanged. A crawlable `/track` introduction and links to `/reviews` provide
context even when the recent-track list is empty. The approved `/home`
animation and mini UI are untouched. GitHub/Vercel preview verification and
real-world indexing evidence are separate pending gates; [#305](https://github.com/francozeta/kocteau/issues/305)
owns the later FAQ/discovery phase. No merge to `main` yet.

The approved Search delivery is tracked in [PR #303](https://github.com/francozeta/kocteau/pull/303), from `feat/search-constellation` into `main`. The `e6da873` preview received visual approval for integration. The [Discovery guide](./apps/web/components/discovery/README.md) owns canvas motion, per-seed candidate pools, header ownership and ASCII cover-loading behavior.

Local checks cover unit tests, lint, the isolated-data build and Chromium/WebKit desktop/mobile regressions; preview checks cover live catalog expansion, motion continuity, header history and delayed/cached/failed covers. Integration hardening addresses review edge cases and updates the native verifier's existing ISR assertion to the canonical `/home` route. The PR owns CI and integration status; Vercel deployment state is verified separately. WebKit uses a virtual display, and physical iPhone Safari/Brave validation remains follow-up work.

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
