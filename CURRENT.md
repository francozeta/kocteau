# Current Project State

Last verified: 2026-10-22
Maintenance baseline: [PR #218](https://github.com/francozeta/kocteau/pull/218),
continued by [PR #219](https://github.com/francozeta/kocteau/pull/219).

Stable contracts: [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).
[Issue #206](https://github.com/francozeta/kocteau/issues/206) coordinates Studio phases.

## Reliability Audit And Recovery

A bounded read-only audit on 2026-10-22 used a protected preview whose tree
matches production `0ebf3d9`. A 24-VU run returned 1,440 matching cached search
responses at about 20 requests/second, but background cache revalidation failed
and Supabase returned 503/522 responses. Successful cached HTTP responses do not
establish healthy backend capacity. Load generators stopped; direct Data API
and management SQL reads subsequently timed out. Production routes also recorded
upstream failures/timeouts. Recovery was verified without restart at 16:45 UTC:
SQL returned 22/60 connections with no lock waits, and a fresh production search
returned all three expected matches in 845 ms. The root cause remains unresolved. The
[load guide](./docs/load-readiness.md) now requires isolated databases for gradual
tests and stopping on background/dependency failures.

The same audit reproduced an unrestricted OG asset fetch in an isolated local
fixture and identified affected dependency versions. No cloud data writes or
recovery operations were performed. [Audit evidence and follow-up](./.plan/capacity-security-audit.md)
records the measured boundaries, incident caveats, and remediation order.

The audit handoff in [PR #220](https://github.com/francozeta/kocteau/pull/220) is documentation in review;
fixes remain pending. Twenty-four synthetic search clients were the highest
tested concurrency, not an established user ceiling. Healthy product capacity
remains unknown. The report includes a cross-device investigation brief; raw
diagnostics remain ignored locally.

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

## Music Read Maintenance

Track reads reuse resolved public entities and overlap independent local and
catalog recommendation reads. The [Music guide](./apps/web/components/music/README.md)
owns these boundaries. Ranking and viewer permissions are preserved; exact
measurement and deployment evidence belongs in the PR.

## Review Pagination

Track discussions use bounded pages and complete Postgres aggregates. The Music
guide owns cursor validation, public-cache boundaries, sharing-image reads, and
private access to an off-page own review.

The summary migration is delivered through the pinned CLI and all 35 linked
migration versions match. Generated types preserve nullable aggregate results on
regeneration. Permission checks and public Data API reads verify
complete counts, averages, and the empty case. Preview and production deployment
evidence is recorded in [PR #219](https://github.com/francozeta/kocteau/pull/219).

## Verification And Limits

- 160 unit tests, web lint, and the production build with TypeScript pass using
  pinned Node 24.15.0 and pnpm 11.21.0; Node types now match the runtime major.
  Music checks cover independent sources, identity reuse, summary reads,
  bounded pages, cursor validation, and private access to an off-page own review.
  Documentation and whitespace checks run
  before publication; exact deployment verification is recorded in the PR.
- A fresh Docker-backed Supabase stack replayed migrations and seeds successfully.
  Database lint and all six SQL test files (24 checks) pass. Fixtures now respect
  provider constraints, explicit profile creation, enrichment triggers, and
  timestamp handling; their test data is rolled back.
- A disposable 3,000-review catalog traversed 250 pages without omissions or
  duplicates. Desktop/mobile checks at 1280px/390px preserve complete aggregates,
  older/latest navigation, and off-page own-review editing; a later guest session
  receives no private viewer state. Measurement evidence belongs in the PR.
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
- Authenticated OTP/onboarding, publication, cloud editing, manual SQL/RLS user flows,
  and curator/cron execution remain unverified. Local SQL fixtures and disposable
  authenticated edit persistence passed; no
  authenticated review writes were made to cloud environments. The additive
  summary migration and public Data API reads are verified in cloud.
- Restored `20260930225425_studio_research_failure_recovery.sql` from cloud statements
  verified read-only on 2026-10-21; applied history was unchanged. Fresh local schema
  replay passed; cloud feed-index parity verification remains pending.
- Linked database lint reports an error in the existing
  `extensions.index_advisor` function because `hypopg_reset()` is unresolved.
  Advisors complete with warnings. This extension issue is outside the summary
  migration; diagnose it before changing extension configuration.
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

Investigate the recovered Supabase data-plane incident, then address OG asset URL validation,
affected runtime dependencies, and search refresh concurrency/deadlines before
another capacity run. Repeat stronger tests on an isolated staging database.

Measure search percentiles and database calls with a representative catalog and
authenticated traffic before consolidating local lookups into an RPC or adding
indexes. Function placement is owned by [Operations](./docs/operations.md), and
canonical identity reuse by the Discovery guide. Verify guest draft →
OTP/onboarding → restored composer → publish/edit on a disposable stack and matching
deployment. Reconcile Studio file moves with PR #211 and verify curator research
and recovery before later human-decision/collection work in issue #206.
