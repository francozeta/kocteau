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

The landing is one choreographed page-entry sequence (no scroll trigger).
First the navigation resolves; the existing six-word H1 enters with blur,
opacity and vertical lift; the description and CTA follow with staggered
delays. The H1's copy, type, word split and per-word starting offsets remain
unchanged.

The original Kocteau mock Feed stays at its final position. Its exterior
frame, dimensions and clipping are visible immediately; only the EXISTING
inner grid (sidebar and app as one flat composited layer) resolves from
`opacity: 0; blur(9px)` to clear. It never translates, scales or animates
individual Feed components. This separates the hero's visual priority from
the product while allowing the two phases to overlap naturally.

Approximate delays: header 0ms, words 100–550ms, description 600ms, CTA
740ms, grid 880ms. The intro settles around 1.8s. Exact timing is Kocteau's
interpretation of Interfere's public design explanation and the supplied
reference video; do not claim access to Interfere's private implementation.

The Feed frame stays mounted while Starter picks stream inside the rail;
28/32/36rem of responsive height is reserved by the wrapper. A small
early Safari reload-only scroll guard restores the top of the hero on full
reload without changing back/forward or fragment navigation. Respect
`prefers-reduced-motion`; SSR/no-JS remains readable.

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
