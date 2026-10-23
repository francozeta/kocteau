# Current Project State

Last checked: 2026-10-23. Anonymous review recovery is integrated in main.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Observe anonymous review recovery from [PR #241](https://github.com/francozeta/kocteau/pull/241),
under [#240](https://github.com/francozeta/kocteau/issues/240).
[Review recovery](./.plan/review-read-recovery.md) owns the confirmed boundary,
fixture reproduction and limits. Cold-read work remains under #147; feed PR #222
and the unpublished shared cooldown remain separate.

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

Next, address catalog-write invalidation in
[#228](https://github.com/francozeta/kocteau/issues/228). #147 orders progressive
rendering, measured starter SQL work and suggestion budgets. Characterize cold
Data API waits and deliver the feed consumer independently; use representative
isolated authenticated traffic before SQL or infrastructure choices.
