# Music

## Entry Points

- Catalog pages: `catalog-entity-page.tsx`, `track-page-hero.tsx`.
- Reused across Feed/Profile: `track-tile.tsx`, `track-carousel.tsx`, `starter-route-card.tsx`.
- Covers/actions: `entity-cover-image.tsx`, `entity-library-actions.tsx`.
- Identity and canonical routes: `lib/catalog`, `lib/seo-routes.ts`.

## Preserve

Use `(provider, provider_id, type)` for provider identity and Kocteau IDs for
product identity. Track bundles accept the already resolved public entity so the
route and metadata do not repeat its database lookup. ID-only image/bundle callers
still resolve it internally. Viewer state stays outside public caches.

Recommendation sources run in independent local/catalog lanes and join before the
existing ranking and canonical-link resolution. Passing `tags: []` means tags were
already resolved; omit `tags` to request a lookup. Source failures keep the existing
partial fallback behavior.

Known cover dimensions keep layout stable. Catalog decisions
live in [catalog research](../../../../docs/knowledge-layer.md).

## Track Discussion Reads

Track discussions render 12 reviews per page, with one lookahead row. The
`reviewsAfter` URL cursor includes the full timestamp and UUID; queries use
`created_at DESC, id DESC` with the existing entity/date/id index. Invalid
cursors are rejected. Older/latest links keep the canonical track route and
`#reviews` anchor; automatic prefetch is disabled for these links.

`get_entity_review_summary` computes the full count and average in Postgres using
the caller's permissions and existing RLS. Public pages and summaries share the
60-second review cache tags. Query failures propagate rather than being cached as empty pages.

Metadata uses the summary. Sharing images read only the entity identity and cover;
they do not request review bodies, summaries, or taste tags. JSON-LD keeps bounded review excerpts while
its count and average describe the full discussion.

The viewer's own review is resolved privately when absent from the current page.
Editing therefore remains available for older reviews without adding viewer state
to public caches. Migration delivery follows the [Supabase workflow](../../../../docs/maintainers/supabase-workflow.md).

## Check

Run catalog tests, lint, and the web build. Check canonical links, unresolved
provider routes, missing covers, long titles, rating-only discussion, and mobile tiles.
Check older/latest navigation, equal timestamps, invalid cursors, empty pages,
full-discussion aggregates, and an authenticated viewer whose review is off-page.


Public database reads use the bounded transport described in the
[Discovery guide](../discovery/README.md). Taste-tag lookup failures return their
empty optional fallback outside the tagged cache, so recovery can populate the
same key immediately instead of persisting a false empty result.
