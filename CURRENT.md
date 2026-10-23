# Current Project State

Last checked: 2026-10-23. PR #223 is merged; its production deployment is ready
and a read-only production smoke check passed.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Observe search recovery and investigate remaining cold Data API waits.
[Search evidence](./.plan/search-recovery.md) owns verification and limits;
the [Discovery guide](./apps/web/components/discovery/README.md) owns behavior
and reproduction. The feed application and shared-read cooldown rollouts stay
separate during incident observation. The cooldown experiment is unpublished.

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

Observe the search fix in real use, characterize cold-read waits, then deliver
the feed consumer independently and reassess shared backoff. Use representative
isolated authenticated traffic before search RPC, index or infrastructure choices.
