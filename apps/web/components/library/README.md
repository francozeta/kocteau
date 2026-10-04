# Library

## Entry Points

- Routes: `app/(main)/library`; grid: `library-entity-grid.tsx`.
- Reads/state: `lib/queries/entity-library.ts`, `queries/entity-library.ts`.
- Writes: `app/api/entities/library`; bookmarks reuse Reviews components.

## Preserve

Library state is viewer-specific. Preserve entity identity and distinguish saved
music from bookmarked reviews. Follow [data boundaries](../../../../docs/core-architecture.md).

## Check

Run library tests, lint, and the web build. Check songs/albums/artists/bookmarks,
empty collections, save/remove rollback, signed-out access, and mobile overflow.
