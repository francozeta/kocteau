# Current Project State

Last checked: 2026-10-23. PR #223 is merged; deployment `578f59e` was observed READY.
A read-only production smoke check passed without recording the served commit.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Review public-read cache recovery in [PR #239](https://github.com/francozeta/kocteau/pull/239),
under [#147](https://github.com/francozeta/kocteau/issues/147).
[Cache evidence](./.plan/public-read-cache-recovery.md) owns reproduction and limits.
Keep observing [search recovery](./.plan/search-recovery.md). Feed PR #222 and the
unpublished shared cooldown remain separate.

## In Review

- [PR #239](https://github.com/francozeta/kocteau/pull/239) addresses #226/#227:
  failed starter reads stay outside the cache and provider lookups share a render.
  Local 186 tests, seven Next scenarios, lint, docs and isolated build pass.
  CI and preview passed at `1964bf2`. Review follow-up makes the verifier bind
  directly and documents the pinned baseline checkout; final checks and the
  authorized main/production rollout remain pending.
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

After the cache fixes, address catalog-write invalidation in
[#228](https://github.com/francozeta/kocteau/issues/228). #147 orders progressive
rendering, measured starter SQL work and suggestion budgets. Characterize cold
Data API waits and deliver the feed consumer independently; use representative
isolated authenticated traffic before SQL or infrastructure choices.
