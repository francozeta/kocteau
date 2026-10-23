# Current Project State

Last verified: 2026-10-23. Production main remains `0ebf3d9` (PR #219).
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## In Review

- [PR #220](https://github.com/francozeta/kocteau/pull/220) records the capacity
  and security audit. The shared Supabase data plane recovered without restart;
  the cause remains unresolved and healthy user capacity remains unknown.
  [Audit evidence](./.plan/capacity-security-audit.md) owns incident measurements
  and remediation order. The [load guide](./docs/load-readiness.md) requires an
  isolated database for gradual tests.
- [PR #221](https://github.com/francozeta/kocteau/pull/221) builds on that audit:
  bounded anonymous reads, explicit retry control, shared search fills and
  observable stale/degraded responses. Review follow-up adds independent caller
  cancellation, recovery-backed health status and enforced fixture bounds.
  [Implementation evidence](./.plan/public-read-reliability.md) owns measurements,
  preview verification and reproduction. These changes are not merged to main.
- Studio source scouting remains in
  [PR #211](https://github.com/francozeta/kocteau/pull/211);
  [issue #206](https://github.com/francozeta/kocteau/issues/206) owns its phases.
  Release work is in [PR #202](https://github.com/francozeta/kocteau/pull/202);
  the released version is v0.3.15.

## Verified Baseline And Limits

- Production PR #219 paginates discussions and computes complete review aggregates.
  Its migration was applied through the pinned CLI, all 35 migration versions
  match, and generated types preserve nullable aggregate results.
  The [Music guide](./apps/web/components/music/README.md) owns read boundaries;
  the [Discovery guide](./apps/web/components/discovery/README.md) owns search.
- PR #221 review follow-up passes 175 tests, lint, production build, native HTTP
  regression checks and desktop/mobile search. Its reproduction now enforces
  request counts and connection release. Exact published revision, CI and preview
  evidence belong in the PR. Isolated timings are not user-capacity evidence.
- A real cold preview read hit the three-second deadline and returned 502;
  a later read returned 200/fresh. Cold-read reliability remains a delivery
  caveat, recorded in the [implementation evidence](./.plan/public-read-reliability.md).
- A disposable Supabase stack replayed migrations/seeds, passed six SQL test files
  (24 checks), and traversed a 3,000-review catalog without omissions or duplicates.
  Disposable edit persistence passed. Cloud authenticated publication, OTP,
  curator/cron flows and representative write load remain unverified.
- The linked database has an existing `extensions.index_advisor` lint failure
  involving `hypopg_reset()`; cloud feed-index parity remains pending. The restored
  research migration was verified read-only without changing cloud history.
- Unknown documentation paths may log `NoFallbackError` while returning 404
  ([Next.js #90537](https://github.com/vercel/next.js/issues/90537)).

## Next Priority

Characterize cold Data API waits before delivering the public-read changes.
Then constrain OG asset fetching
and patch affected runtime dependencies. Preserve the unresolved incident evidence.
Measure a representative isolated catalog and authenticated traffic before
choosing search RPCs, indexes or infrastructure upgrades. Verify the guest draft,
OTP/onboarding and publish/edit loop on disposable data; continue Studio research
and recovery within issue #206.
