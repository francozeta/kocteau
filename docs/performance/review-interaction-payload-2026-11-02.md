# Review list interaction payload — 2026-11-02

Related: [#263](https://github.com/francozeta/kocteau/issues/263) · [#147](https://github.com/francozeta/kocteau/issues/147)

## Source-level bottleneck

Each review card includes a client-side interaction island. The previous
`ReviewCommentsButton` imported `ReviewCommentsPanel`, the mobile Vaul
drawer and desktop Radix Sheet **at module evaluation**, despite those
overlays being closed on initial load. The panel itself imports Motion,
forms, comment mutations, dropdown menus and many client dependencies.

The shared `ReviewCardInteractionBar` also accepted an entire review
object from server-rendered pages. That needlessly serialized the review
body, title and other display metadata a second time into the client
boundary even though its buttons only need the ID, two counts and
two viewer flags.

This is a code-path finding, not yet a production LCP/INP percentile.

## Implementation

- `review-comments-overlay.tsx` owns the Drawer/Sheet, comments panel
  and form. It is dynamically imported **from a Client Component** with
  `ssr: false`, then rendered only after a visitor first requests comments.
  Once requested, the overlay remains mounted so closing transitions are
  preserved.
- The lightweight comments button and count still render immediately, and
  the lazy chunk is prefetched on pointer hover or keyboard focus for
  authenticated visitors. A new count-only hook avoids installing full
  comments-query observers and create/delete mutations for every *closed*
  button; shared React Query count keys still reflect mutations once opened.
  Anonymous comments still trigger the same auth guidance. Inline comments
  still scroll and focus the existing composer without importing the overlay.
- Review cards retain their like, bookmark and comment counts, visual
  appearance, accessibility labels and optimistic mutation behavior.
- The `ReviewCardInteractionBar` now accepts only
  `reviewId/likesCount/commentsCount/viewerHasLiked/viewerHasBookmarked`
  from server and existing client card callers. Review text and title
  are no longer serialized into that particular client island.
- No changes to pagination, review visibility, moderation, auth, network
  routing, firewall, image loading or Supabase queries.

## Validation and measurement

- Run `Verify`: tests, docs, lint, production build.
- Run `Native navigation`: WebKit guest/authenticated mobile/desktop
  synthetic journeys, editor reset and browser script sizes, no real
  credentials or production mutations.
- Compare initial `/reviews` browser JS resources against the earlier
  fixture from #263 on the same method; report decoded and transferred
  JS sizes separately. Avoid claiming exact savings without matched runs.
- Check a comments open/close interaction on mobile (Drawer) and desktop
  (Sheet), and confirm comments update their count and focus correctly.
- Check Speed Insights route/device p75 and sample count once Vercel
  makes this measurement available through the project data interface.
  Low current traffic may yield too few samples for meaningful percentiles.

## Attribution and limits

Removing unused scripts from initial navigation should reduce network
and parse/evaluation work, especially on slower phones. The actual
reduction and impact on LCP/INP must be measured. This change does not
solve the separate CDN/edge latency of the home page, which returned
~1.2 s first-body from a GitHub runner even on cache HIT. Do not
alter Vercel function region or add Cloudflare to address it without
real Lima RUM evidence and route/POP correlation.
