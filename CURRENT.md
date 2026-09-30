# Current Project State

Last verified: 2026-09-30

Stable contracts are in [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and the [knowledge layer](./docs/knowledge-layer.md).

## Current Phase

Research V3 is the current Studio direction under
[KOC-52](https://linear.app/kocteau/issue/KOC-52/research-v3-build-a-multi-source-evidence-layer-for-studio).
Studio researches a selected track and drafts conservative, source-backed
signals; saved or manual curator choices stay authoritative. Optional model
context explains proposals without changing or publishing them. Durable human
decision history, destination choice, and transactional acceptance remain future
work.

## Verification And Deployment

- The linked Supabase migration history shows both
  `20260929024624_studio_editorial_proposals.sql` and
  `20260929152706_studio_proposal_three_sources.sql` applied. The pinned CLI
  dry run now reports the remote database up to date. A linked read-only query
  confirmed the three-source RPC body, RLS on both private tables, denied
  client reads/reservations, and service-role reservation access.
- Studio context motion is on `main` through PR #210. Local
  `feat/studio-source-scout` includes KOC-54 field classes, direct model routing,
  and an opt-in private source lookup preview for missing moods, scenes, and
  styles. It reuses private proposal JSONB storage without a schema migration.
  No publication or recommendation behavior is changed.
- A real `gpt-6-luna` SDK request passed with server-only
  credentials. A real lookup for Underworld's `Jumbo` found editorial URLs;
  an earlier prompt overinterpreted one mood, so the current prompt requires
  explicit label support and the same lookup returns readings with no tags.
  A separate community lookup found Reddit discussions and a euphoric lead;
  that term was confirmed in the original listener's post. These single-track
  checks do not establish general curation quality or community consensus.
  Research candidates remain unverified until the curator inspects the source.
  Production lookup remains off pending source rights and KOC-59 evaluation.
- Verification passes 121 web unit tests, 15 context and 19 source lookup route
  scenarios, TypeScript, lint, and production build. Linked read-only checks
  confirmed context/scout query filters. Anonymous lookup GET/POST return 401.
  An isolated real-component fixture passed explicit confirmation, selection
  preservation across empty results, and 360px mobile overflow checks.
  Authenticated linked reservation/generation and curator acceptance remain
  unverified; the browser session has no curator login.
- Last.fm remains an evaluation candidate, not a runtime source. Its published
  API terms require a commercial-use agreement before such use; KOC-55 rights
  and quality checks are open. KOC-59 needs a curator-selected track set.

## Next Priority

Verify direct context and private source lookup in an authenticated curator flow,
including empty readings, citations, manual edits, and checked signal selection.
Select the KOC-59 evaluation set and measure false positives before production
lookup rollout. Resolve provider usage rights before adding normalized source
observations or comparing Last.fm with MusicBrainz.
