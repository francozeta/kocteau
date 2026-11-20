# Mobile sidebar reveal

[Current state](../CURRENT.md) · [Shell](../apps/web/components/shell/README.md) · [KOC-122](https://github.com/francozeta/kocteau/issues/298)

## Reference

Chromium inspection of [Devouring Details System / Purpose](https://devouringdetails.com/system/purpose) found a sticky header, a fixed mobile `aside`, and a `main` that scrolls with the document. The outer flex container uses `overflow-x: clip` and `isolation: isolate`. The aside has independent vertical overflow and `overscroll-behavior-y: contain`. There is no mobile bottom dock on this page.

At 390 × 844 CSS px, the aside goes from x = −200 to 0 and the 358 px main goes from x = 16 to 216. The header stays at x = 16 and y = 0. The same 200 px displacement holds at 320 and 430 px. Both moving elements use CSS `translate` for 350 ms with `cubic-bezier(0.23, 0.88, 0.26, 0.92)`. Scaling, dimming, and a raised card are absent. The mobile CSS applies through 960 px. The exact 960 px sample showed both asides, with the desktop aside alone at 961 px.

The public layout bundle toggles `data-open`, closes when a link is clicked, and installs outside click and touchstart handlers. The sidebar allowed independent vertical touch scroll and stayed open during a horizontal swipe. Links changed the route and closed the panel. Escape left it open. The mobile aside had `aria-hidden="true"` even when open, and focus could reach its links. Reduced motion left the translation duration intact. The public CSS and JavaScript were readable. Requests for the corresponding source maps returned 404.

## Kocteau history

- [#294](https://github.com/francozeta/kocteau/pull/294) established the reveal, swipe and reversible spring. The final code separately portaled the header and dock while translating the route inset. [#298](https://github.com/francozeta/kocteau/issues/298) records a clipped, shifted foreground and divergent chrome in iPhone Brave. Multiple containing blocks are the issue's suspected cause. The screenshot alone does not establish the browser mechanism.
- [#296](https://github.com/francozeta/kocteau/pull/296) reverted #294 after the production rollback. [#297](https://github.com/francozeta/kocteau/pull/297) isolated the stationary underlay and one viewport-sized foreground in a mock route.
- [#299](https://github.com/francozeta/kocteau/pull/299) merged one spring and one real foreground with internal mobile scrolling. [The later overlay restore](https://github.com/francozeta/kocteau/commit/e151d18956f292a7d8f027d47e751700ba0745a6) removed the fixed reveal wrapper and reinstated the stationary foreground with an overlay drawer. The record establishes the follow-up design change. It does not attribute a second iPhone failure to #299.

## Preview decision

Starting from `fa81fbb`, use the measured CSS trajectory and clip the right edge at the existing Kocteau mobile breakpoint. The sidebar and app surface move side by side at full size. A sticky viewport-sized layer establishes the fixed containing block for the existing header and dock, including Search slots and the comment shelf. The page keeps native document scrolling. The menu toggle stays at a fixed touch target and maps to a close control while the drawer has focus. The current sidebar visuals and Base UI modal semantics carry over.

The shell guide owns implementation details. Validate geometry and touch hit testing in the real AppShell before proposing a design-system rule. Keep the GitHub PR in draft for physical iPhone Safari, Brave and VoiceOver feedback.

## Motion design recommendations

- Specify both endpoints and measurable invariants for shell motion. At every progress value, the route, header and dock receive the same horizontal delta, widths and y anchors hold, and the document cannot pan sideways.
- Keep geometric transitions reversible from their current presentation value. Keep the dismissal target stable throughout a reversal. Define and test reduced motion and focus on the same state change.
- Test from a deep scroll position, through navigation and after rotation. Record actual iPhone browser chrome, safe-area and touch behavior separately from desktop-engine emulation.
