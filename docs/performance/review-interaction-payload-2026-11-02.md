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
  The responsive breakpoint subscription also lives in the lazy overlay,
  rather than being installed once per idle review card.
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

## Actual-Next/WebKit fixture results

Validated on GitHub Actions commit `b6b795d3`:
- [Verify #41505486016](https://github.com/francozeta/kocteau/actions/runs/41505486016): tests, docs, lint and production build passed.
- [Native navigation #41505486068](https://github.com/francozeta/kocteau/actions/runs/41505486068): mobile/desktop, guest/authenticated simulated journeys passed, including the lazy comments overlay opening and closing in mobile Drawer / desktop Sheet; the test asserts an additional JS resource is fetched only **after** interaction.
- Vercel Preview for `b6b795d3`: `READY`.

The earlier unchanged fixture [#41477517794](https://github.com/francozeta/kocteau/actions/runs/41477517794) vs candidate #41505486068:

| Initial `/reviews` JS | Earlier reference | Candidate | Difference |
| --- | ---: | ---: | ---: |
| Guest, decoded | 2,058,312 bytes | 2,046,963 bytes | **-11,349 bytes** |
| Guest, encoded | 609,161 bytes | 606,739 bytes | **-2,422 bytes** |
| Authenticated fixture, decoded | 1,650,729 bytes | 1,639,380 bytes | **-11,349 bytes** |
| Authenticated fixture, encoded | 498,456 bytes | 496,034 bytes | **-2,422 bytes** |

These measurements are from **different CI runs**, albeit the same WebKit
fixture and route. Bundler, runner and test ordering are not fully paired.
They are indicative rather than a strict causal performance benchmark. The
JS resource **count** increased by one, even though aggregate bytes fell.
The outcome does **not** establish a measurable p75 LCP, INP or TTFB change
for users on iPhones in Lima.

The gain is modest (~0.55% of the guest initial decoded JS bytes). A future
pass should profile AppShell/client route chunks with the same isolated
measurement method before redesigning hydration boundaries.

## Attribution and limits

Removing unused scripts from initial navigation should reduce network
and parse/evaluation work, especially on slower phones. The actual
reduction and impact on LCP/INP must be measured. This change does not
solve the separate CDN/edge latency of the home page, which returned
~1.2 s first-body from a GitHub runner even on cache HIT. Do not
alter Vercel function region or add Cloudflare to address it without
real Lima RUM evidence and route/POP correlation.
