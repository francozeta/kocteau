# Current Project State

Last verified: 2026-09-25
Base: `origin/main` at `78194d1` (public v0.3.15 changelog)

Stable operating, product, and interface rules live in `AGENTS.md`, `PRODUCT.md`, and `DESIGN.md`.

## Current Phase

Make Search a personal discovery canvas: choose a seed, explore a cover, expand
the same space, and return along the path. Preserve the existing dark Feed shell
and floating-cover visual direction.

## Active Work

- Review branch: `feat/search-action-dock-polish`; awaiting product feedback.
- Compact responsive navigation distinguishes song, album, and artist seeds.
  Scope controls filter seed search, not the current canvas. Candidate generation
  still returns tracks; mixed-type curation is not implemented yet.
- Mobile selected music uses the existing header: cover, title, artist, and a
  back arrow that returns to all starter covers. Sharing and memory actions use
  the existing options drawer; desktop retains previous-canvas navigation.
- Desktop Search uses the existing header; mobile keeps its bottom dock.
  Selecting music reveals contextual actions and a single header identity.
  Tracks reuse sharing, the global composer, and the library mutation; albums
  and artists offer sharing and their existing page. Search is always recoverable.
- Mobile scopes sit above the input as slim opaque chips. Selection replaces them
  with two slim text actions (Review / Save, or Open / Share) and a separate
  search control. Home's dark edge gradient frames the floating controls;
  the canvas extends behind the top header fade.
- Canvas saving is an idempotent add, not a library toggle with assumed state.
  Library writes retain existing authentication; saves do not yet feed the local
  canvas evaluator. Canonical pages remain secondary destinations and share URLs.
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
- Browser checks passed for signed-out desktop (1440×900), mobile (320×720 and 390×844),
  seed selection, branch expansion, back/reload, keyboard activation, reduced
  motion preference, failed requests/retry, and horizontal overflow.
- Production-browser checks cover type scopes, 320px layout, contextual actions,
  drawer layering, search recovery/shortcut, composer opening, guest save guard,
  and canonical share payload (native share stubbed). Memory reset and new-canvas
  persistence were checked separately.
- Signed-in saving/publishing and cross-device behavior are not verified.
- Build completed with existing slow upstream-data diagnostics; lint emitted
  existing JSX parser notices without failing.

## Next Priority

Review the discovery loop with real listening paths, especially candidate
relevance, repetition, and continuity on mobile. Gather product feedback on the
pull request before expanding curation or merging.
