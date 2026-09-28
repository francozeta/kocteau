# Current Project State

Last verified: 2026-09-28
Base: local `origin/main` reference at `7ddbf7b` (includes PR #204)

Stable contracts live in `AGENTS.md`, `PRODUCT.md`, and `DESIGN.md`. The catalog,
curation, and discovery implementation map lives in [Knowledge Layer and Search](./docs/knowledge-layer.md).

## Current Phase

Make catalog research traceable before connecting it to Studio proposals and human
acceptance. Reuse the existing catalog clients, background jobs, starter tables,
collections, and responsive editor.

## Active Work

- Local branch `feat/catalog-source-evidence`; no push or pull request for this work.
- The existing worker records Deezer track/album and MusicBrainz artist/entity
  observations before applying metadata. Each observation retains source identity,
  lookup context, selected fields, retrieval time, match score, and schema version.
- Resolved, unmatched, and failed lookups remain separate. Observations append
  history; failed later requests preserve earlier evidence. The private table has
  RLS and service-role SELECT/INSERT grants only.
- Strict Deezer lookups expose failures to the worker while normal page lookups
  retain their fallback. Queue preparation preserves retry counts and backoff,
  including exhausted jobs, and does not let failed targets starve new work.
- Product and roadmap documents now distinguish existing Search/Scout, collection
  storage, candidate APIs, catalog research, and the missing approval connection.
  Studio's current Ready label still means six-kind tag coverage, not reviewed evidence.

## Existing Discovery Baseline

- Search focus, cover labels, contextual actions, share routes, and history fixes
  from PR #204 are present in the base. This does not establish deployment status.
- Search uses bounded session history and account/guest-scoped browser memory:
  12 steps for eight hours, 80 opening/revisit aggregates for 30 days. Ignored covers
  are not negative signals; saves do not yet feed its evaluator.
- For You remains separate. Cross-device discovery memory and synchronization with
  review/taste signals are not implemented. Earlier signed-out browser checks are
  recorded in Git history; signed-in saving/publishing still needs verification.

## Verification And Deployment

- 86 unit tests pass, including 10 new source-evidence/provider-failure checks.
  Web lint, TypeScript, production build, and diff whitespace checks pass.
- The new migration and SQL regression assertions pass in isolated embedded
  PostgreSQL with minimal catalog prerequisites. This covers evidence constraints,
  grants, preserved history, backoff, exhausted retries, and queue starvation.
- Docker is unavailable here. Full Supabase migration/reset tests, generated-type
  regeneration, and an end-to-end worker run remain unverified. The new table's
  TypeScript shape was synchronized manually and checked against SQL columns.
- Apply `20260928051000_catalog_source_observations.sql` before deploying the worker;
  neither the cloud migration nor deployment has been performed. No backfill or
  bulk re-enrichment was run. See [operations](./docs/operations.md#catalog-evidence-rollout).
- Lint retains existing JSX parser notices; the build retains upstream-data latency
  diagnostics. Neither failed verification. No UI, auth, or ranking changes here.

## Next Priority

Validate the migration and worker on a full local/staging stack. Then connect a
selected Studio draft to canonical research without publishing it. Add shared
MusicBrainz throttling and execution deadlines before concurrent Studio requests;
today's pacing is process-local. Follow with versioned proposals, source inspection,
corrections, and atomic acceptance into existing tags and collection membership.
Structured synthesis, new editorial UI events, decision-model experiments, and
embeddings are not implemented by this slice.
