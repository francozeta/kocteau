# Current Project State

Last verified: 2026-09-28
Base: origin/main at ce7eb76 (includes PR #205)

Stable contracts live in AGENTS.md, PRODUCT.md, and DESIGN.md. The implementation
boundary is in [Catalog research and curation](./docs/knowledge-layer.md).

## Current Phase

Connect Studio drafts to catalog research and source inspection. Structured
editorial proposals and human acceptance are the next phase.

## Active Work

- Draft PR #207 carries the implementation on feat/studio-catalog-research; it is
  in review, not merged. Issue #206 carries the cross-device phase sequence.
- Sources in the existing Studio dialog/drawer can research a selected track,
  inspect Deezer/MusicBrainz outcomes, and resume eligible queued work. The server
  resolves canonical identity and reuses jobs without publishing picks or tags.
- Curator-only endpoints validate IDs, limit requests, preserve backoff/exhausted
  attempts, and keep raw errors private. Existing completed jobs without source
  history can receive one recorded pass.
- Studio and cron share a database source lease and targeted job claiming.
  Provider contention defers work without consuming an attempt. The execution
  budget stops new claims; interrupted processing remains recoverable by cron.
- Public documentation is consolidated around current contracts and operations.
  Historical plans and device-local phases live in the ignored .plan/ directory.
- Search and For You retain their existing ranking and memory behavior. The
  Studio coverage labels still count tag kinds; they do not mean editorial approval.

## Verification And Deployment

- The phase-one migration 20260928051000 is applied remotely according to the
  linked CLI migration history. PR #205 is merged.
- The new migration 20260928133212_studio_catalog_research.sql is applied to
  the linked Supabase project. The remote history and a read-only check confirm
  the lease row, RLS, service-role RPC access, and denied client access. A later
  linked dry run reports no pending migrations.
- 90 unit tests, web lint, TypeScript, production build, and diff checks pass.
  SQL assertions pass in isolated embedded PostgreSQL for both source evidence
  and the new lease/targeted-claim behavior. Docker/full Supabase reset is unavailable.
- Sixteen isolated route scenarios check auth denial, input validation, rate-limit
  failure, targeted scheduling, retry boundaries, and safe errors. The actual
  local app redirects signed-out Studio access and returns 401 for both endpoints.
- The research component passes isolated desktop/mobile browser checks with
  fixture responses, retained editorial input, source links, and keyboard focus.
  This does not verify an authenticated curator session against the migrated stack.
- Generated types from the linked schema were compared to the committed schema
  additions; only formatting and declaration order differ. The maintainer's
  pre-existing generated-type changes remain separate from this branch.
  See the [rollout checks](./docs/operations.md#studio-research-rollout).
- PR verification and the web preview passed. The authenticated curator and
  cron flow has not been checked against that preview.

## Next Priority

Verify a real curator research request against the linked schema and cron recovery
after the web branch is deployed. Then add versioned, evidence-linked proposals,
corrections, collection destination selection, and transactional human acceptance.
No model inference, automated editorial approval, or ranking experiment is included.
