# Current Project State

Last verified: 2026-10-03
Integrated baseline: origin/main at 83fa943 ([PR #210](https://github.com/francozeta/kocteau/pull/210)).

Stable contracts live in [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).
[Issue #206](https://github.com/francozeta/kocteau/issues/206) coordinates Studio phases.

## Integrated And In Review

- [PR #209](https://github.com/francozeta/kocteau/pull/209) integrated selection-driven research, conservative source-backed draft
  signals, and optional Gateway context into main. PR #210 added context progress
  motion. Saved/manual curator choices remain authoritative; publication uses the
  normal save boundary.
- [PR #211](https://github.com/francozeta/kocteau/pull/211) is open on
  `feat/studio-source-scout`: evidence classes, direct model routing, and optional
  source scouting remain review work. They are not part of main.
- [Release PR #202](https://github.com/francozeta/kocteau/pull/202) for v0.3.16 is open;
  the current released version remains v0.3.15.
- Documentation and device-readiness maintenance is local on
  `docs/laptop-project-readiness`, pending publication. The entry points now route
  to owning guides; runtime versions and returning-device checks are explicit.

## Verification And Caveats

- Frozen-lockfile installation, 110 web unit tests, workspace lint, production
  build with TypeScript, documentation links, and diff checks pass. Node matches
  the version shared with CI. The updated workflow has not run remotely.
- The local production server returns 200 for landing/login/Search, redirects
  signed-out feed/Studio access to login, and denies research/context APIs with 401.
- Read-only linked history confirms all 33 migrations present on main are applied.
  Cloud also contains `20260930225425_studio_research_failure_recovery`, absent
  from every fetched branch. The maintainer confirmed its SQL is pending
  publication from another device. Do not repair history or regenerate baseline
  types against that newer schema until the source is reconciled.
- Local Supabase reset, SQL/RLS checks, and local OTP were not rerun because Docker
  is unavailable. Earlier Studio SQL/route verification is recorded in PR #209;
  it does not verify an authenticated curator session on the current deployment.
- Real curator research/context, cron recovery, manual selection preservation,
  and desktop/mobile authenticated behavior remain unverified.

## Next Priority

Publish and reconcile the existing failure-recovery migration from its source
device, then verify the authenticated curator and cron flow against the matching
web/schema baseline. Review PR #211 and evaluate real source support before
scouting rollout. Durable human decisions, collection destinations, and atomic
acceptance remain later phases in issue #206.
