# Current Project State

Last verified: 2026-09-29
Studio baseline: `feat/studio-signal-proposals` at `14a59d2`.

Stable contracts are in [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and the [knowledge layer](./docs/knowledge-layer.md).

## Current Phase

Studio automatically researches a selected track, drafts conservative signals
from current source evidence, and keeps the curator's saved or manual choices
authoritative. Optional Gateway context is being integrated on a separate local
task branch; it explains existing source-backed proposals and cannot change a
draft or publish a pick. Human decision history, collection destination choice,
and transactional acceptance are still future work.

## Verification And Deployment

- The linked Supabase migration history shows the source and Studio research
  migrations, plus `20260929024624_studio_editorial_proposals.sql`, applied.
  The latter was executed and its access boundaries checked during the prior
  Studio work. The new `20260929152706_studio_proposal_three_sources.sql` is
  **pending**. Its linked dry run fails at Postgres authentication even after
  relinking the same project; it has not been applied.
- The proposal and three-source SQL checks pass in isolated PostgreSQL.
  The current branch passes 110 web unit tests, 15 proposal route scenarios,
  TypeScript, lint, and production build. Linked types were regenerated from
  the currently applied schema; the pending migration keeps the RPC signature.
- A refreshed local Vercel OIDC token passed read-only Gateway model and credit
  checks. No generation was run against this integrated version.
- An authenticated curator run of this integrated branch against the linked
  environment remains unverified. Earlier two-source Gateway experiments do
  not verify the current version-2 evidence flow.

## Next Priority

Restore the linked Postgres CLI credential, run the pinned dry run, apply the
pending migration, verify remote history and the affected grants/RPC, then
exercise the authenticated curator flow on the integrated web branch. Review
the local task branch before publishing or merging it into the Studio baseline.
