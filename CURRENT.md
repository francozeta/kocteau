# Current Project State

Last checked: 2026-10-23. Public-read cache recovery is integrated in main.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Observe public-read cache recovery from [PR #239](https://github.com/francozeta/kocteau/pull/239),
under [#147](https://github.com/francozeta/kocteau/issues/147).
[Cache evidence](./.plan/public-read-cache-recovery.md) owns reproduction and limits.
Keep observing [search recovery](./.plan/search-recovery.md). Feed PR #222 and the
unpublished shared cooldown remain separate.

## Verified Delivery

PR #239 merged as `bdcc1e6`. Its production deployment was observed READY with
the `kocteau.com` alias before and after a read-only guest mobile WebKit smoke.
Home, both search sources and a provider track returned 200; artist selection and
Back restored the query without page errors. Search used stale cached results:
this is no cold-read latency or failure-recovery measurement.

Repository CI and preview passed at `e7d60ab`; verification covers 186 tests,
seven Next render scenarios, lint, docs and a production build. The verifier's
port binding and pinned pre-change comparison were also reproduced locally.

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

Next, address catalog-write invalidation in
[#228](https://github.com/francozeta/kocteau/issues/228). #147 orders progressive
rendering, measured starter SQL work and suggestion budgets. Characterize cold
Data API waits and deliver the feed consumer independently; use representative
isolated authenticated traffic before SQL or infrastructure choices.
