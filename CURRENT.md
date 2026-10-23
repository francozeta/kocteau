# Current Project State

Last verified: 2026-10-23. Production main: `93baae3` (PR #221).
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Stage 1 is merged: bounded anonymous reads, independent cancellation, shared
search fills, explicit degraded responses and sampled queue/header/body diagnostics.
Production returned three fresh search results in 2.82 seconds; cold-read
latency remains close to the three-second deadline. The cause of the earlier
shared Supabase incident remains unresolved. Ten-thousand-user capacity is unverified.

[PR #222](https://github.com/francozeta/kocteau/pull/222), stage 2, combines authenticated For You ranking,
card hydration and private viewer state into one Data API RPC. It also corrects
the shared viewer-state function's unqualified review-ID correlation.
Local verification is recorded in the
[feed stage evidence](./.plan/authenticated-feed-read-bundle.md).
Cloud schema delivery is pending CLI authentication; both migrations are local only.
The [scale stages](./.plan/scale-readiness.md) own subsequent delivery gates.

## Related Work

- [PR #220](https://github.com/francozeta/kocteau/pull/220) audit content is included
  in PR #221's merged history. [Audit evidence](./.plan/capacity-security-audit.md)
  records incident limits and remediation order.
- Studio scouting: [PR #211](https://github.com/francozeta/kocteau/pull/211)
  and [issue #206](https://github.com/francozeta/kocteau/issues/206).
- Release work: [PR #202](https://github.com/francozeta/kocteau/pull/202);
  released version v0.3.15.

## Verified Baseline And Limits

- PR #219 paginates discussions and computes complete review aggregates.
  Its 35 migration versions matched cloud history before the current local stage.
- Stage 1 passed 180 web tests, lint, build, native transport checks and desktop/mobile
  search. [Read evidence](./.plan/public-read-reliability.md) owns reproduction.
- Stage 2 passed 40 SQL checks in seven files and authenticated desktop/mobile
  rendering. Two real local sessions traversed three pages each with matching
  cards, cursors and private state; first-page requests fell from four to one.
  These local measurements establish behavior and request counts, not capacity.
- The linked database has an existing `extensions.index_advisor` lint failure
  involving `hypopg_reset()`; cloud feed-index parity remains pending.
- Cloud authenticated publication, OTP, curator/cron flows and representative
  sustained write load remain unverified.
- Unknown documentation paths may log `NoFallbackError` while returning 404
  ([Next.js #90537](https://github.com/vercel/next.js/issues/90537)).

## Next Priority

Authenticate the pinned CLI, review the linked target and pending migration SQL,
dry-run and apply the additive schema before merging the feed consumer.
Then measure cross-instance refresh contention and secondary write work on an
isolated target, following the [load guide](./docs/load-readiness.md).
Preserve guest drafts, private viewer state, ranking and the publish/edit loop.
