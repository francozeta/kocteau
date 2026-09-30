# Current Project State

Last verified: 2026-09-30

Stable contracts are in [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and the [knowledge layer](./docs/knowledge-layer.md).

## Current Phase

Research V3 is the current Studio direction under
[KOC-52](https://linear.app/kocteau/issue/KOC-52/research-v3-build-a-multi-source-evidence-layer-for-studio).
Studio researches a selected track and drafts conservative, source-backed
signals; saved or manual curator choices stay authoritative. Optional Gateway
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
- The proposal and three-source SQL checks pass in isolated PostgreSQL.
  The Studio integration passes 110 web unit tests, 15 proposal route scenarios,
  TypeScript, lint, and production build. Linked types were regenerated after
  applying the migration; its RPC signature is unchanged.
- A refreshed local Vercel OIDC token passed Gateway model and credit checks.
  A direct eight-token smoke request to the configured model succeeded; the
  integrated Studio generation route has not been exercised with a curator
  against the linked environment. Earlier two-source experiments do not verify
  the current version-2 evidence flow.
- Studio context motion is on `main` through PR #210; its authenticated
  transition still needs a curator browser check.
- Local `feat/studio-evidence-classes` work for KOC-54 derives classes for
  known current observation fields and preserves them per proposal reference.
  It has no schema migration or publication change. Web unit tests, lint, and
  production build pass; authenticated curator verification remains pending.
- Last.fm remains an evaluation candidate, not a runtime source. Its published
  API terms require a commercial-use agreement before such use; KOC-55 rights
  and quality checks are open. KOC-59 needs a curator-selected track set.

## Next Priority

Review KOC-54 in an authenticated curator flow, including mixed/empty evidence
and manual edits. Select the KOC-59 evaluation set and resolve KOC-55 usage
rights before comparing Last.fm with MusicBrainz. Keep Editorial Scout and other
providers behind that evidence and evaluation gate.
