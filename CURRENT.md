# Current Project State

Last verified: 2026-10-17 (local Search; integrated deployment evidence remains 2026-10-13)
Integrated application baseline: main at 10af8eb ([PR #212](https://github.com/francozeta/kocteau/pull/212)).

Stable contracts: [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).
[Issue #206](https://github.com/francozeta/kocteau/issues/206) coordinates Studio phases.

## Integrated And Pending Work

- Safari/iOS Search fixes are prepared locally on `fix/safari-mobile-search`
  from main `b9de271`: native close taps, immediate input focus, visual-viewport
  bounds, and result scroll clearance. Search cards now omit entity-type labels
  and redundant album metadata. Branch publication and a Vercel Preview are
  authorized and pending. [Scope and verification](./.plan/safari-mobile-search.md).
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

- Local Search verification (2026-10-17): `pnpm check` passes all 115 unit tests,
  docs, lint, and the production build with TypeScript. WebKit 26.5 and Chromium
  151 pass at 320/390/768/844/1280px, including simulated keyboard resize/pan/
  dismissal, result scrolling, rotation, zoom-inset reset, Back, empty/error
  states, touch/keyboard focus, and the missing-VisualViewport fallback.
  Inspected browser flows report no JavaScript exceptions. Mixed song/album/artist
  results omit type labels on mobile and desktop; remaining result text passes
  4.5:1 contrast.
- These local UI checks use catalog response fixtures and simulated viewport
  changes. Native iPhone keyboard behavior, VoiceOver, live catalog/database
  integration, authenticated writes, and deployment were not verified here.
- Integrated audit (2026-10-13): 115 web unit tests, web lint, production build with TypeScript, documentation
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
  Docker was unavailable in that audit; no migrations or authenticated review writes were run.
- Earlier documentation verification (2026-10-04) covered desktop/390/320px,
  search/copy/navigation/overflow, and automated accessibility on inspected
  guides. Unknown static paths return 404 but log `NoFallbackError`
  ([Next.js #90537](https://github.com/vercel/next.js/issues/90537)).
  A screen-reader session was not run.
- Linked history checked on 2026-10-04 confirmed all 33 main migrations applied.
  Cloud also contains `20260930225425_studio_research_failure_recovery`, whose SQL
  remains unpublished from another device. Reconcile its source before history
  repair or baseline type regeneration. The 2026-10-13 audit did not recheck cloud history.

## Next Priority

For mobile Search, review the prepared changes and confirm the native keyboard
and safe areas on a physical iPhone.

Verify guest draft → OTP/onboarding → restored composer → publish, plus real
authenticated editing, on a disposable local stack and matching deployment.

Reconcile the unpublished failure-recovery migration and Studio file moves with
PR #211, then verify curator research/context and recovery.
Human decisions, collection destinations, and atomic acceptance remain later
phases in issue #206.
