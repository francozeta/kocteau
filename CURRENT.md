# Current Project State

Last checked: 2026-11-16. Canonical URLs and reliability stages are integrated;
compact-route SEO alignment is the current review stage. Contracts:
[AGENTS](./AGENTS.md), [Product](./PRODUCT.md), [Design](./DESIGN.md),
[architecture](./docs/core-architecture.md).

## Active Work

[PR #309](https://github.com/francozeta/kocteau/pull/309) (URLs/cache/identity),
[PR #311](https://github.com/francozeta/kocteau/pull/311) (ranked local retrieval)
and [PR #310](https://github.com/francozeta/kocteau/pull/310) (private MMR lab)
are integrated in main at `712435a`. Vercel reports the corresponding production
deployment READY; bounded public Search returns usable local results. The MMR
lab intentionally returns 404/noindex in production and still requires preview,
a real session and curator access. Its musical quality remains unevaluated.

The shared database history now contains both Search RPCs
(`20261116192307`) and Starter collection scoring (`20261116192407`). Read-only
inspection after integration confirmed the Starter function body exactly matches
the checked-in migration and keeps its existing return contract. This verification
did not apply SQL or repair remote history.

Work on `fix/compact-route-seo-alignment` reconciles the necessary SEO changes
from #306/#307 with the new compact pages: retire only the exact `/track` index,
keep entity/provider aliases, correct breadcrumbs and verify existing server-rendered
detail links without adding duplicate navigation. Search presentation and motion stay unchanged.
Draft [PR #312](https://github.com/francozeta/kocteau/pull/312) owns review, CI
and preview evidence for this stage. Its isolated Next/Turbopack production build
and 75 WebKit checks pass, including the exact 308, sitemap/manifest exclusion,
existing SSR anchors and mobile/desktop guest/simulated-session journeys.
The [SEO plan](./.plan/compact-route-seo-alignment.md) owns scope and
[the architecture record](./.plan/architecture-simplification.md) owns the earlier
verification and integration boundaries. No SQL, main merge or production
deployment was performed by the SEO stage.

The integrated runtime passed Verify/Native navigation CI, unit tests, lint and
build/typecheck. Live Chromium guest checks passed on mobile/desktop for the base
and retrieval previews, including canonical pages, exact compatibility 308 and
visible Search results without page errors. Local WebKit journey/account fixtures
also passed. These checks do not establish authenticated production behavior,
physical-device parity or production-wide latency. Forced origin React 419 remains
a separate observation; no recommendation-quality or speedup claim is made.

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

Use PR #312's focused preview for feedback and its CI/HTTP record for release gates.
Reconcile #306/#307 against that implementation before integrating either older
route patch. Use #270's rollout record for the separate editor/browser work;
different CI workers cannot establish a comparison with the gru1 latency baseline.

#261 retains primary/optional track dependencies, #265 the private fault wait,
#267 React 419 attribution and #228 catalog invalidation. #243, #242,
#253/#254 and SQL-CI KOC-23 remain separate.
Product experiments #245–#251 follow the reliability gate.
