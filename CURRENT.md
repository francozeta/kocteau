# Current Project State

Last verified: 2026-09-21
Base: `origin/main` at `0037d42`

Stable operating, product, and interface rules live in `AGENTS.md`, `PRODUCT.md`, and `DESIGN.md`.

## Current Phase

Make Search a personal discovery canvas: choose a seed, explore a cover, expand
the same space, and return along the path. Preserve the existing dark Feed shell
and floating-cover visual direction.

## Active Work

- Implementation on `feat/search-discovery-canvas`; publication requested for
  product review, without merging into `main`.
- Compact responsive navigation distinguishes song, album, and artist seeds.
  Scope controls filter seed search, not the current canvas. Candidate generation
  still returns tracks; mixed-type curation is not implemented yet.
- Current music identity and back navigation share one quiet context area.
  Secondary actions use the existing desktop dialog / mobile drawer primitives.
- Desktop Search uses the existing header; mobile keeps its bottom dock. The
  floating Review/Open-track bar is removed; the entity page is a secondary link.
- Search results and covers open branches in place. Fast/deep catalog lanes share
  a query cache; stale work is cancelled and late responses cannot change another branch.
- Back/forward and reload restore bounded session snapshots. Resolved branches
  are not re-ranked when revisited.
- The deterministic evaluator balances artist familiarity, unseen tracks, and
  candidate lanes. Ignored covers are not negative signals.

## Persistence And Scope

- Up to 12 session steps expire after eight hours. Up to 80 local opening/revisit
  aggregates expire after 30 days; account and guest storage are separate.
- Personalization is browser-local, not cross-device or synchronized with the
  existing review/taste graph. New canvas preserves taste; Clear discovery memory
  explicitly resets it from Canvas options.
- Public candidate responses remain shared and unpersonalized. Advanced curation,
  additional intelligence layers, and Atlas remain outside this implementation.
- No auth, RLS, schema, or For You ranking changes.

## Verification

- 74 unit tests passed, including ranking, history, stale-response rejection,
  bounds, and storage validation; web lint, TypeScript, and production build passed.
- Browser checks passed for signed-out desktop (1440×900), mobile (390×844),
  seed selection, branch expansion, back/reload, keyboard activation, reduced
  motion preference, failed requests/retry, and horizontal overflow.
- Signed-in visual verification and cross-device behavior are not verified.
- Build completed with existing slow upstream-data diagnostics; lint emitted
  existing JSX parser notices without failing.

## Next Priority

Review the discovery loop with real listening paths, especially candidate
relevance, repetition, and continuity on mobile. Gather product feedback on the
pull request before expanding curation or merging.
