# Current Project State

Last verified: 2026-10-23. Production baseline before this change is `93baae3` (PR #221).
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Search recovery is the priority after production local-search failures.
The [incident record](./.plan/search-recovery.md) owns the correction and limits.
The separate shared public-read cooldown experiment is local and unpublished.
Ten-thousand-user capacity remains unverified.

## In Review

- [PR #222](https://github.com/francozeta/kocteau/pull/222) bundles authenticated
  For You reads. Its two migrations were applied through the pinned CLI; all
  37 local/remote versions match. The application change remains unmerged.
  The pull request owns its detailed verification.
- Studio scouting remains in [PR #211](https://github.com/francozeta/kocteau/pull/211)
  under [issue #206](https://github.com/francozeta/kocteau/issues/206).
  Release work remains in [PR #202](https://github.com/francozeta/kocteau/pull/202);
  the released version is v0.3.15.

## Verified Baseline And Limits

- PRs #220/#221 are merged. Anonymous reads have explicit retry control,
  process-local concurrency/queue bounds, shared cache fills and stage diagnostics.
  Cold-read reliability remains unresolved; these guards do not prevent distinct
  typing prefixes from creating separate fills.
- Feed schema delivery passed affected public-schema linked lint, generated-type
  comparison, role/privilege checks and a read-only authenticated cloud call.
  A disposable local stack passes seven SQL files (40 checks).
  Cloud advisor warnings remain; the existing all-schema index-advisor lint
  caveat does not affect the passing targeted public-schema check.
- The feed candidate preserves two local sessions' full payloads over three
  pages while reducing Data API calls from 4 to 1 initially and 3 to 1 later.
  This fixture does not demonstrate production latency or capacity.
- Search recovery passes 182 web tests, lint, build and docs checks. Mobile
  Chromium/WebKit, desktop Chromium and a disposable authenticated session verify
  typing, cancellation, failure recovery, Back/reload and blocked storage. Browser
  fixtures reduce 14 requests to 2 for one typing cadence; no load claim follows.
  CI, preview and production verification remain pending. The
  [Discovery guide](./apps/web/components/discovery/README.md) owns the flow.
- The underlying historical Supabase data-plane incident remains unexplained.
  Isolated fixtures and the earlier 24-user run do not establish a healthy-user ceiling.

## Next Priority

Deliver and verify search recovery, then integrate the feed application after its
review follow-up passes. Reassess shared backoff against the incident evidence.
Measure representative isolated authenticated traffic before infrastructure,
search RPC or index decisions. Preserve the unresolved cold-read evidence.
