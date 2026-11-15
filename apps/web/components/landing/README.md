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

The hero uses Interfere's publicly documented `opacity: 0 → 1`, `blur(10px) → 0`,
and `translateY(20%) → 0` reveal, with separate timings for title words,
description and CTA. Timing is tuned for visual testing; Interfere does not
publish exact duration or stagger values in its write-up.

The mock-feed preview is an actual composition of Kocteau UI components,
not a screenshot. A viewport-triggered sequence now establishes the shell,
brings in navigation and Feed tabs, and reveals the review's author, cover,
writing and actions in separate beats. A compact mock Listening activity list
in the right rail uses Interfere's documented timeline grammar: each connector
draws down, its marker appears, then the event copy fades in; the next item's
line begins after the previous line completes. The event descriptions are
illustrative, not live events. Exact timing is our interpretation, not copied
from proprietary Interfere source.

The observer/animation director is a small client-only wrapper around
server-rendered markup. If JS or IntersectionObserver is unavailable, the
entire preview remains visible and useful. Reduced-motion visitors see
unanimated content. The landing and Feed routes, public SEO/ISR, hero,
artwork and main mock UI geometry are unchanged. Check the clipped mobile
mini-UI, activity-rail height and Safari motion before merging.

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
