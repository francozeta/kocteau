# Current Project State

Last verified: 2026-09-29
Studio baseline: `feat/studio-signal-proposals` at `14a59d2`.

Stable contracts are in [AGENTS.md](./AGENTS.md), [PRODUCT.md](./PRODUCT.md),
[DESIGN.md](./DESIGN.md), and the [knowledge layer](./docs/knowledge-layer.md).

## Current Phase

Studio automatically researches a selected track, drafts conservative signals
from current source evidence, and keeps the curator's saved or manual choices
authoritative. Optional Gateway context is in [PR #208](https://github.com/francozeta/kocteau/pull/208)
on `feat/studio-gateway-reconciliation`; it explains existing source-backed
proposals and cannot change a draft or publish a pick. Human decision history,
collection destination choice, and transactional acceptance are still future work.

## Verification And Deployment

- The linked Supabase migration history shows both
  `20260929024624_studio_editorial_proposals.sql` and
  `20260929152706_studio_proposal_three_sources.sql` applied. The pinned CLI
  dry run now reports the remote database up to date. A linked read-only query
  confirmed the three-source RPC body, RLS on both private tables, denied
  client reads/reservations, and service-role reservation access.
- The proposal and three-source SQL checks pass in isolated PostgreSQL.
  The current branch passes 110 web unit tests, 15 proposal route scenarios,
  TypeScript, lint, and production build. Linked types were regenerated after
  applying the migration; its RPC signature is unchanged.
- A refreshed local Vercel OIDC token passed Gateway model and credit checks.
  A direct eight-token smoke request to the configured model succeeded; the
  integrated Studio generation route has not been exercised with a curator
  against the linked environment. Earlier two-source experiments do not verify
  the current version-2 evidence flow.

## Next Priority

Exercise the authenticated curator flow on the PR preview, including sparse
evidence, manual edits, and non-curator denial. Review the PR before merging it
into the Studio baseline.
