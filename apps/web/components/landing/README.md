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

Hero and mini UI animate at page entry, independent of scrolling. Navigation
fades in first, the hero headline reveals by word with blur + upward motion,
then description and CTAs follow.

**The original mini UI does not translate, scale or animate its children
separately.** A single animation on its height-reserved wrapper brings the
complete product mock from `opacity: 0; filter: blur(10px)` to clear and
fully opaque. Its sidebar, tabs, Feed card, editorial rail, and frame all
appear as one stationary surface (as seen in the supplied Interfere video).
The preview markup/content is preserved.

The mock-feed component stays mounted while Starter picks stream inside
the existing rail; 28/32/36rem of height is reserved at mobile/tablet/desktop
breakpoints. This avoids a second animation or layout jump when data resolves.
A small early reload-only scroll guard prevents Mobile Safari from restoring
the viewport below the hero during the one-time entrance; back/forward
navigation and URL fragments retain normal scroll handling.

The design draws from Interfere's documented blur and stagger techniques,
not undisclosed source code or proprietary timing. No scroll observer or
animation library. Respect `prefers-reduced-motion`; SSR and no-JS are
fully readable.

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
