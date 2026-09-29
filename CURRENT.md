# Current Project State

Last verified: 2026-09-29

Stable contracts are in [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and the [knowledge layer](./docs/knowledge-layer.md).

## Current Phase

Studio automatically researches a selected track, drafts conservative signals
from current source evidence, and keeps the curator's saved or manual choices
authoritative. Optional Gateway context explains those source-backed proposals
on explicit request; it cannot change a draft or publish a pick. Human decision
history, collection destination choice, and transactional acceptance are still
future work.

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
- A local Studio context-motion refinement on `feat/studio-context-motion`
  passes web lint and build. The signed-out browser route loads, but Studio
  redirects to login; the authenticated context transition remains unverified.
  This branch has not been published.

## Next Priority

Exercise the authenticated curator flow on the deployed web build, including
sparse evidence, manual edits, and non-curator denial. Audit real evidence
coverage for mood, scene, and style signals before adding providers or durable
decisions; see [KOC-52](https://linear.app/kocteau/issue/KOC-52/audit-real-evidence-for-studio-mood-scene-and-style-signals).
