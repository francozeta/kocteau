# Landing

## Entry Points

- Public home: `guest-home.tsx`; navigation: `guest-header.tsx`, `guest-footer.tsx`.
- Supporting visuals and testimonials stay in this directory.
- Signed-in home redirects to `/feed` through `proxy.ts`.

## Preserve

The page introduces music reviews and links into public browsing. Keep the
deferred visual imports and reduced-motion behavior. Editorial direction lives
in [DESIGN.md](../../../../DESIGN.md).

## Check

Run lint and the web build. Check public navigation, signed-in redirect, mobile
overflow, keyboard focus, reduced motion, and the documentation footer link.

## Data Boundaries

The introduction renders independently of public review and starter reads.
Preview artwork and product examples share one starter promise; recent reviews
and their structured data resolve together. Keep the page's 300-second ISR policy.
This separation does not itself prove a lower production TTFB for cached HTML.

The [primary-render record](../../../../.plan/primary-render.md) explains the
isolated browser comparison and the remaining production measurement.
