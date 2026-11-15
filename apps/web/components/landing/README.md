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

The mock-feed preview adds the companion staged product reveal: navigation,
header, tabs, review and editorial rail enter in sequence, triggered only once
they come into view. Its observer and animation live in a tiny client wrapper
and do not delay the static server-rendered preview when JavaScript is off.
Reduced-motion visitors see unanimated content. No layout, public SEO/ISR or
copy changes; keep this in a draft PR until desktop and iPhone review.

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
