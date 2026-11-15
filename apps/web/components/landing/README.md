# Landing

## Entry Points

- Public home: `guest-home.tsx`; navigation: `guest-header.tsx`, `guest-footer.tsx`.
- Supporting visuals and testimonials stay in this directory.
- Public landing is `/home` for everyone, with canonical metadata and public caching. The header CTA shows **Open app** after a browser session is detected; signed-out `/` requests redirect to `/home` through `proxy.ts`.

## Preserve

The page introduces music reviews and links into public browsing. Keep the
deferred visual imports and reduced-motion behavior. Editorial direction lives
in [DESIGN.md](../../../../DESIGN.md).

## Landing motion

The public hero and existing Kocteau mini UI form **one initial page-entry
sequence**. The navigation fades in, the headline reveals word by word, and
description/CTAs follow as blocks. The original mock Feed preview is unchanged:
same navigation, tabs, review, editorial rail, copy and markup as on main.
A scoped CSS module stages the existing sidebar, Feed header, tabs, review and
editorial rail without adding activity timelines or other content.

This follows Interfere's documented hero entrance properties
(`blur(10px) → 0`, `opacity: 0 → 1`, `translateY(20%) → 0`).
Exact durations are adapted to Kocteau because their source timing values
are not published. **No IntersectionObserver, scroll trigger or animation
library** is required. SSR remains readable without JavaScript and reduced
motion disables the sequence. CSS may replay on a fresh page mount, unlike
Interfere's first-visit-only behavior; that can be refined later if desired.

### Stable mini UI during reload and streaming

The whole Feed preview always stays mounted. Public starter picks now stream
inside the right rail only, instead of swapping a full mock-feed Suspense
fallback for the real preview and restarting its entrance animation. The
wrapper reserves the preview's exact responsive 28/32/36rem height, so
streaming does not change its document-space footprint.

Mobile Safari may restore the previous scroll position on a full reload,
which would hide the hero while the entrance plays; a tiny early script
resets scroll to the top only for reloads without a fragment, leaving back /
forward and in-page navigation restoration alone. This keeps the page-entry
sequence visible at the intended position.

## Check

Run lint and the web build. Check `/home` for both auth states, signed-out root redirect, signed-in `/` Feed, mobile
overflow, keyboard focus, reduced motion, and the documentation footer link.

## Data Boundaries

The introduction renders independently of public review and starter reads.
Preview artwork and product examples share one starter promise; recent reviews
and their structured data resolve together. Keep the page's 300-second ISR policy.
This separation does not itself prove a lower production TTFB for cached HTML.

The [primary-render record](../../../../.plan/primary-render.md) explains the
isolated browser comparison and the remaining production measurement.
