# Current Project State

Last verified: 2026-10-13
Integrated baseline: origin/main at 83fa943 ([PR #210](https://github.com/francozeta/kocteau/pull/210)).

Stable contracts: [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).
[Issue #206](https://github.com/francozeta/kocteau/issues/206) coordinates Studio phases.

## Integrated And In-Review Work

- PR #209 integrated selection-driven research and optional Gateway context;
  PR #210 added context progress motion. Human choices and the normal save
  boundary remain authoritative.
- [PR #211](https://github.com/francozeta/kocteau/pull/211) remains open on
  `feat/studio-source-scout`; source scouting and direct routing are review work.
  [Release PR #202](https://github.com/francozeta/kocteau/pull/202) remains open;
  the released version is v0.3.15.
- [PR #212](https://github.com/francozeta/kocteau/pull/212) includes maintenance
  commits 5c5e6fc and b014cb3 plus the app audit. Product components have owning
  flow READMEs; public `/docs` builds from canonical Markdown.
- Published commits a3383a3 and 1915e23 in PR #212 protect auth
  return paths and guest draft recovery, preserve responsive composer sessions,
  fix keyboard rating/shortcut behavior and URL-triggered composition, and remove
  four unused components/context files. The cleanup removes 269 net lines.
  [Audit and cleanup evidence](./.plan/app-audit-continuity.md) records the scope.
  The PR remains in review; remote checks and deployment verification are pending.

## Verification And Limits

- 115 web unit tests, web lint, production build with TypeScript, documentation
  checks (33 guides, 149 repository links), and diff checks pass. Node and pnpm
  match the pinned versions. Remote CI is running on the published PR.
- The first published preview failed because deployment packaging excluded
  documentation link targets. The follow-up retains those targets and tracks
  them in build-cache inputs; analyzer generation, development shutdown, heading
  IDs, image URLs, and documentation navigation were also corrected. The revised
  preview still needs verification.
- Local production HTTP checks covered public pages, signed-out feed/Studio,
  private API denial, callback sanitization, and preservation of the draft return
  path. Browser checks at 1280px/390px covered composer state across breakpoints,
  URL initialization, rating keyboard navigation, input shortcut isolation,
  Escape/URL cleanup, mobile focus, and overflow. Inspected flows log no errors.
- Isolated session checks covered pending state, delivered responses, reopening,
  stale state updates, and changed initial review. Real authenticated publication,
  editing, OTP/onboarding, SQL/RLS, and curator/cron flows remain unverified.
  Docker is unavailable; no migrations or authenticated review writes were run.
- Earlier documentation verification (2026-10-04) covered desktop/390/320px,
  search/copy/navigation/overflow, and automated accessibility on inspected
  guides. Unknown static paths return 404 but log `NoFallbackError`
  ([Next.js #90537](https://github.com/vercel/next.js/issues/90537)).
  The documentation portal remains undeployed; a screen-reader session was not run.
- Linked history checked on 2026-10-04 confirmed all 33 main migrations applied.
  Cloud also contains `20260930225425_studio_research_failure_recovery`, whose SQL
  remains unpublished from another device. Reconcile its source before history
  repair or baseline type regeneration. Today's audit did not recheck cloud history.

## Next Priority

Complete PR #212 checks and integration. Verify guest draft → OTP/onboarding →
restored composer → publish, plus
real authenticated editing, on a disposable local stack and matching deployment.

Reconcile the unpublished failure-recovery migration and Studio file moves with
PR #211, then verify curator research/context, recovery, and deployed `/docs`.
Human decisions, collection destinations, and atomic acceptance remain later
phases in issue #206.
