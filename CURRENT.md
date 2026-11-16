# Current Project State

Last checked: 2026-11-16. URL and reliability stages are moving into PR/preview review alongside
reliability diagnosis and recoverable public reads. Contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), [architecture](./docs/core-architecture.md).

## Active Work

Work on `refactor/architecture-foundations` unifies music/review URLs around
`/{type}/{slug}-{id}`, retaining old links and the separate shared Search routes.
Parallel local stages cover performance targets, Starter invalidation, account
cache isolation and artist identity. The [stage plan](./.plan/architecture-simplification.md)
owns scope and rollout gates. Independent experiments are on
`test/discovery-ranking-evaluation` (MMR) and `perf/search-ranked-retrieval`
(ordered local retrieval). Their new runtime consumers remain outside the
combined branch. The retrieval candidate improves synthetic exact-match coverage
but costs more SQL work; MMR quality is not yet judged by listeners.
The base [PR #309](https://github.com/francozeta/kocteau/pull/309) is in draft review;
its preview is ready and Verify/Native navigation CI passed at `9f5bf41`.
The authorized shared database received only the three additive Search RPCs as
`20261116192307_ranked_local_catalog_search`; anonymous reads, grants, RLS and
remote history were checked. The existing Starter ranking function is unchanged;
its replacement remains pending. No main merge or production deployment is authorized.
The combined branch passes 289 unit tests, workspace lint, docs/link checks and
the production build/typecheck with isolated placeholder reads.
Account-cache fixtures pass nine scenarios in both Chromium and WebKit. The
isolated production-mode WebKit matrix passes 74 records across guest/simulated
session and mobile/desktop cohorts, including redirects, canonical/sitemap,
comments/editor, Back and failure/recovery. Known forced React 419 observations
remain recorded; no fix or production latency improvement is claimed.
The [stage plan](./.plan/architecture-simplification.md) records the verification
boundaries and remaining release gates.

The approved Search delivery [PR #303](https://github.com/francozeta/kocteau/pull/303)
is integrated in main at `0ae1a72`; landing entrance #304 follows at `37138e7`.
The [Discovery guide](./apps/web/components/discovery/README.md) owns canvas motion,
per-seed candidate pools, header ownership and ASCII cover-loading behavior.

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

Historical recovery-candidate evidence: 216 unit tests and lint passed. The native matrix passes
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
