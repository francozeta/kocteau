# Current Project State

Last checked: 2026-11-17. Compact-route SEO is integrated; public Home build
reliability is the current stage. Contracts: [AGENTS](./AGENTS.md),
[Product](./PRODUCT.md), [Design](./DESIGN.md),
[architecture](./docs/core-architecture.md).

## Active Work

[PR #312](https://github.com/francozeta/kocteau/pull/312) is integrated in main at
`1c115b4`; #306/#307 were closed as replaced. Vercel reports the production
commit READY. Independent bounded HTTP checks confirm `/track` returns exact
308 to `/reviews`, `/home` serves its canonical and public music links, and the
sitemap excludes the retired index. Earlier architecture, retrieval and private
MMR lab stages are integrated through #309/#311/#310; the lab remains preview
and curator gated, and its musical quality is still unevaluated.

Work on `fix/home-build-reliability` addresses the observed Home prerender timeout
under [#263](https://github.com/francozeta/kocteau/issues/263). The original build
failure has a loopback reproduction. The candidate generates only the bare
`/home` path on first access while retaining 300-second ISR and rejecting suffixes
before data reads. Landing markup, motion, data policies and budgets are unchanged.
The [Home reliability plan](./.plan/home-build-reliability.md) owns evidence,
verification and the cold-first-request tradeoff. Its isolated production build
passes with zero Home reads, and 80 WebKit checks cover cold failure/recovery,
effective 300-second ISR via MISS/HIT, cached reuse and suffix 404 responses. Draft [PR #313](https://github.com/francozeta/kocteau/pull/313) owns Cloud CI,
preview evidence and feedback for this stage.
The underlying timeout before HTTP headers remains unattributed. This stage does
not execute cloud SQL, merge main or deploy production.

The shared database already contains Search RPCs (`20261116192307`) and Starter
collection scoring (`20261116192407`). Prior read-only inspection confirmed the
Starter body matches the checked-in migration. The
[architecture record](./.plan/architecture-simplification.md) and
[SEO record](./.plan/compact-route-seo-alignment.md) own those earlier stages.

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

Complete the focused Home reliability PR and its preview/failure recovery gates.
Then continue [SEO #305](https://github.com/francozeta/kocteau/issues/305): verify
indexability/Search Console evidence and consider the compact editorial FAQ
below the approved landing experience. Evaluate MMR with human listening feedback
before changing default recommendation ranking.

#261 retains primary/optional track dependencies, #265 the private fault wait,
#267 React 419 attribution and #228 catalog invalidation. #243, #242,
#253/#254 and SQL-CI KOC-23 remain separate. Production-wide latency and physical
Safari verification retain their existing limits.
