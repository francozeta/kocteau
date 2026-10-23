# Current Project State

Last verified runtime: 2026-10-23, production `578f59e` (PR #223).
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Observe search recovery after the production incident and investigate remaining
cold Data API waits. [Search evidence](./.plan/search-recovery.md) owns the
correction, verification and limits. The feed application rollout is held for a
separate stage during incident observation; its schema is already delivered.
The shared-read cooldown experiment remains local and unpublished.
Ten-thousand-user capacity remains unverified.

## In Review

- [PR #222](https://github.com/francozeta/kocteau/pull/222) bundles authenticated
  For You reads. Pinned-CLI delivery applied its two migrations and verified all
  37 local/remote versions, linked types, privileges and an authenticated cloud
  read. Review follow-up is published; application integration remains pending.
- Studio scouting remains in [PR #211](https://github.com/francozeta/kocteau/pull/211)
  under [issue #206](https://github.com/francozeta/kocteau/issues/206).
  Release work remains in [PR #202](https://github.com/francozeta/kocteau/pull/202);
  the released version is v0.3.15.

## Verified Baseline And Limits

- PR #223 is merged and deployed. Search waits 300 ms for settled typing, cancels
  obsolete source requests immediately, offers manual error recovery and restores
  query/scope through history and optional session storage. Canvas selection is
  retained during search failures.
- Verification passes 182 web tests, lint, production build and docs checks.
  Mobile Chromium/WebKit, desktop Chromium and a disposable authenticated session
  pass failure/retry, Back/reload, full canvas-session preservation and disabled
  storage. A fixture typing cadence reduces 14 requests to 2; this is not a load
  result. A read-only guest WebKit session on production received both sources'
  200 responses, selected Slowdive and restored its query on Back without page
  errors. Physical iPhone/TikTok behavior is not yet confirmed.
- PRs #220/#221 provide bounded anonymous reads and phase diagnostics. Distinct
  shared fills still have separate origin work; cold-read reliability and the
  underlying historical Supabase data-plane cause remain unresolved.
- Feed verification passes seven real local SQL files (40 checks). Two disposable
  sessions retain complete payloads over three pages with Data API calls reduced
  from 4 to 1 initially and 3 to 1 later. Cloud affected public-schema lint passes;
  existing advisor WARN findings and the all-schema index-advisor caveat remain.
  Production authenticated application behavior is not yet verified.
- The [Discovery guide](./apps/web/components/discovery/README.md) owns the
  reproducible browser checks. The earlier 24-user run does not establish a
  healthy-user ceiling.

## Next Priority

Characterize cold-read queue/header waits and observe the search fix in real use.
Deliver the feed consumer independently after incident observation, then reassess
shared backoff. Use representative isolated authenticated traffic before search
RPC, index or infrastructure decisions; retain the unresolved incident evidence.
