# Current Project State

Last checked: 2026-10-25. Anonymous review recovery remains integrated in main.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Home/feed primary-render work is on `perf/primary-feed-render`, based on main
`35be7d9`, under [#229](https://github.com/francozeta/kocteau/issues/229) and #147.
The [primary-render record](./.plan/primary-render.md) owns the pinned Next/WebKit
comparison: reviews and the landing introduction no longer depend on optional
editorial completion in the isolated fixture. Ten current-source browser scenarios
passed at two sizes, with one shared editorial read and 0 px review displacement.
The pinned control reproduced blocking. The 190 tests, lint, types, docs and an
isolated production build passed. Production delivery and latency remain unverified
for this stage. Explicit-query Search remains open in #229.

Product proposals are indexed in [#251](https://github.com/francozeta/kocteau/issues/251),
with source links, scope and evaluation criteria in #245–#250. Existing GitHub
imports in Linear now have performance/product projects, priorities and status.

## Verified Delivery

PR #241 merged as `aedac0d`. Its production deployment was observed READY with
the `kocteau.com` alias before and after anonymous WebKit verification on
2026-10-23. Mobile and desktop showed 14 public review cards, eight API reviews
per page and three home review links. A review detail supplied its data; neither
viewport needed manual retry or had page errors. No authentication cookie was used.

CI and preview passed at `3ffa24b`; the merge also passed CI. Verification covers
190 tests, five isolated browser recovery/API scenarios at two viewport sizes,
lint, docs and an isolated production build. Controlled failures were exercised
only in the fixture; this does not establish production failure recovery, cold
latency or capacity. Earlier starter/provider evidence remains in the
[cache record](./.plan/public-read-cache-recovery.md).

## In Review

- [PR #222](https://github.com/francozeta/kocteau/pull/222) contains the feed read
  bundle and published review fixes, synchronized with search recovery.
  Its schema is delivered through the pinned CLI; all 37 migration versions,
  linked types, affected public-schema lint, privileges and a read-only
  authenticated cloud call were checked. Application integration remains pending.
- Studio scouting remains in [PR #211](https://github.com/francozeta/kocteau/pull/211)
  under [issue #206](https://github.com/francozeta/kocteau/issues/206).
  Release work remains in [PR #202](https://github.com/francozeta/kocteau/pull/202);
  the released version is v0.3.15.

## Limits And Next Priority

Cold-read reliability and the historical Supabase data-plane cause remain
unresolved. Physical iPhone/TikTok and production-authenticated feed behavior are
not yet confirmed. Existing advisor warnings and the global index-advisor lint
caveat remain; isolated timings and the earlier 24-user run do not establish
healthy capacity. Ten-thousand-user capacity is unverified.

Next, complete verification and review of the home/feed stage. Then address
#243 pagination failure budgets and #228/#242 cache consistency, reconcile the
PR #222 consumer, and measure representative current SQL plans under #230.
#244/#231 bound history and suggestion work. Preserve independent deliveries and
use isolated representative traffic before SQL or infrastructure changes.
