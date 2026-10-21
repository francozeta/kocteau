# Current Project State

Last verified: 2026-10-21
Maintenance baseline: main at c2e20a0 ([PR #216](https://github.com/francozeta/kocteau/pull/216)).

Stable contracts: [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).
[Issue #206](https://github.com/francozeta/kocteau/issues/206) coordinates Studio phases.

## Search And Database Maintenance

- Independent local/external phases preserve shared ranking, identity, metadata,
  grouped quotas, and the Kocteau boost. Available matches stay selectable during
  loading, stale matches disappear on input changes, and partial counts are announced.
- Public catalog/link caches reduce repeated reads. Transient failures do not
  populate them; private viewer data stays outside them.
  [Discovery's owning guide](./apps/web/components/discovery/README.md) owns
  cache invalidation, request budgets, cancellation, and timing semantics.
- [PR #215](https://github.com/francozeta/kocteau/pull/215) adds a shared external
  request budget, caller cancellation, and `Server-Timing` stages
  (`local`, `catalog`, `links`, `rank`, `total`); the Discovery guide owns their semantics.

## Verification And Limits

- 143 unit tests, web lint, and the production build with TypeScript pass using
  pinned Node 24.15.0 and pnpm 11.21.0. Documentation and whitespace checks run
  before publication; exact deployment verification is recorded in the PR.
- A fresh Docker-backed Supabase stack replayed migrations and seeds successfully.
  Database lint and all five SQL test files (13 checks) pass. Fixtures now respect
  provider constraints, explicit profile creation, enrichment triggers, and
  timestamp handling; their test data is rolled back.
- Search-only k6 smoke passes with per-stage timing and result-shape checks.
  [Load readiness](./docs/load-readiness.md) owns the reproducible procedure;
  the PR tracks measurement evidence and deployment status.
- Lifecycle tests cover resource retry/fallback policy, cancellation before fetch and
  during fetch/backoff, timeouts, shared deadlines, listener/timer cleanup, and 16
  stalled concurrent searches without retry amplification. These controlled
  scenarios are not a production load benchmark.
- Controlled HTTP checks passed for stalled/failed providers, partial fallback,
  upstream connection release after caller cancellation, timing headers, and zero
  additional DB reads on a repeated cached local query. Desktop/mobile browser
  checks at 1280px/390px cancelled old requests and displayed new local results
  without exceptions.
- PR #214 passed local and exact-preview checks at 1280px/390px for partial results,
  keyboard selection, identity merging, provider failures, and stale responses.
  Main e45e39a passed remote Verify and production search/docs/private API checks.
- Authenticated OTP/onboarding, publication/editing, manual SQL/RLS user flows,
  and curator/cron execution remain unverified. Local SQL fixtures passed; no
  authenticated review writes or schema changes were made to cloud environments.
- Restored `20260930225425_studio_research_failure_recovery.sql` from cloud statements
  verified read-only on 2026-10-21; applied history was unchanged. Fresh local schema
  replay passed; cloud feed-index parity verification remains pending.
- Unknown documentation paths can log `NoFallbackError` while returning 404
  ([Next.js #90537](https://github.com/vercel/next.js/issues/90537)).

## Other Active Work

- PR #212 integrated app maintenance, auth return/draft recovery, responsive
  composer sessions, keyboard fixes, and unused-component cleanup.
  [Audit evidence](./.plan/app-audit-continuity.md) owns the detailed history.
- Source scouting is tracked in [PR #211](https://github.com/francozeta/kocteau/pull/211);
  release work is tracked in [PR #202](https://github.com/francozeta/kocteau/pull/202).
  The released version is v0.3.15. Human research decisions and the normal save
  boundary remain authoritative.

## Next Priority

Measure search percentiles and database calls with a representative catalog and
authenticated traffic before consolidating local lookups into an RPC or adding
indexes. Function placement is owned by [Operations](./docs/operations.md), and
canonical identity reuse by the Discovery guide. Verify guest draft →
OTP/onboarding → restored composer → publish/edit on a disposable stack and matching
deployment. Reconcile Studio file moves with PR #211 and verify curator research
and recovery before later human-decision/collection work in issue #206.
