# Current Project State

Last verified: 2026-10-21
Previous integrated application baseline: main at 10af8eb ([PR #212](https://github.com/francozeta/kocteau/pull/212)).

Stable contracts: [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).
[Issue #206](https://github.com/francozeta/kocteau/issues/206) coordinates Studio phases.

## Search Performance Maintenance

- Local and external catalog search run as independent phases. Local matches
  remain visible and selectable during external loading or failure; stale
  matches disappear immediately when the query changes.
- The API now delegates to a server-only catalog module. Shared ranking preserves
  provider identity, metadata merging, grouped quotas, and the Kocteau boost.
  Anonymous local lookups and entity links use a 60-second tagged cache; failed
  lookups do not populate it. Screen readers hear partial result counts.
  [Discovery's owning guide](./apps/web/components/discovery/README.md) documents
  the cache boundaries and invalidation behavior.
- Restored `20260930225425_studio_research_failure_recovery.sql` from the
  applied cloud history, verified read-only on 2026-10-21. This is source
  reconciliation; no cloud migration or history repair was executed.
- Verified locally: 120 unit tests, web lint, production build with TypeScript,
  documentation and whitespace checks.
  Build uses pinned Node 24.15.0 and pnpm 11.21.0.
- Browser checks at 1280px and 390px passed: local matches remain visible and
  keyboard-selectable with the remote phase pending, duplicates merge, local
  fallback survives upstream failure, and late responses cannot replace a new
  query. No browser exceptions occurred in those scenarios.
- Real read-only HTTP checks passed for local, remote, and combined search,
  empty queries, and invalid parameters. Five repeated cached local requests
  had a 3.6 ms median in the local production server; this is a smoke measurement,
  not a production load-test result. Deployment checks run separately in the PR.

## Integrated And Pending Work

- PR #209 integrated selection-driven research and optional Gateway context;
  PR #210 added context progress motion. Human choices and the normal save
  boundary remain authoritative.
- [PR #211](https://github.com/francozeta/kocteau/pull/211) remains open on
  `feat/studio-source-scout`; source scouting and direct routing are review work.
  [Release PR #202](https://github.com/francozeta/kocteau/pull/202) remains open;
  the released version is v0.3.15.
- PR #212 integrated the maintenance work and app audit. Product components have owning
  flow READMEs; public `/docs` builds from canonical Markdown.
- The integrated fixes protect auth
  return paths and guest draft recovery, preserve responsive composer sessions,
  fix keyboard rating/shortcut behavior and URL-triggered composition, and remove
  four unused components/context files. The cleanup removes 269 net lines.
  [Audit and cleanup evidence](./.plan/app-audit-continuity.md) records the scope.
  Guest drafts are read before opening the session; returning to search restores focus.

## Verification And Limits

- 115 web unit tests, web lint, production build with TypeScript, documentation
  checks (33 guides, 150 repository links), and diff checks pass. Node and pnpm
  match the pinned versions. Remote Verify passed for PR head d3051ac and
  integrated main 10af8eb. The exact preview passed and served `/docs` and the
  revised review guide with HTTP 200.
- Deployment packaging/cache inputs retain documentation link targets.
  Isolated fixtures reproduced and verified heading/image and shutdown fixes;
  the analyzer generates docs before starting. Local desktop/mobile checks
  verified the documentation skip link, table alignment, and overflow.
- Production 10af8eb is READY and assigned to `kocteau.com`. Its exact deployment
  served `/docs` and the revised review guide with HTTP 200; the private saved
  reviews API returned 401 without an application session.
- Local production HTTP checks covered public pages, signed-out feed/Studio,
  private API denial, callback sanitization, and preservation of the draft return
  path. Browser checks at 1280px/390px covered composer state across breakpoints,
  URL initialization, rating keyboard navigation, input shortcut isolation,
  Escape/URL cleanup, mobile focus, and overflow. Inspected flows log no errors.
- A real local guest action saved the draft and reached login with the feed
  return path. Restoration on the public search surface retained its track,
  rating, title, and note at desktop/mobile widths. Search-back focus passed at
  both widths; the temporary draft was cleared without publishing.
- Isolated session checks covered pending state, delivered responses, reopening,
  stale state updates, and changed initial review. Real authenticated publication,
  editing, OTP/onboarding, SQL/RLS, and curator/cron flows remain unverified.
  Docker is unavailable; no migrations or authenticated review writes were run.
- Earlier documentation verification (2026-10-04) covered desktop/390/320px,
  search/copy/navigation/overflow, and automated accessibility on inspected
  guides. Unknown static paths return 404 but log `NoFallbackError`
  ([Next.js #90537](https://github.com/vercel/next.js/issues/90537)).
  A screen-reader session was not run.
- Earlier linked-history checks found 33 repository migrations plus the cloud-only
  failure-recovery migration. Its applied statements were checked again on
  2026-10-21 and restored to version control; cloud history was not modified.

## Next Priority

Verify guest draft → OTP/onboarding → restored composer → publish, plus real
authenticated editing, on a disposable local stack and matching deployment.

Measure search latency and database calls under representative load before adding
indexes or splitting services. Check fresh-schema feed index parity and cursor
validation next. Reconcile Studio file moves with PR #211, then verify curator
research/context and recovery.
Human decisions, collection destinations, and atomic acceptance remain later
phases in issue #206.
