# Landing

## Entry Points

- Public home: `guest-home.tsx`; navigation: `guest-header.tsx`, `guest-footer.tsx`.
- Supporting visuals and testimonials stay in this directory.
- Public landing is `/home` for everyone, with canonical metadata and public caching. The header CTA shows **Open app** after a browser session is detected; signed-out `/` requests redirect to `/home` through `proxy.ts`.

## Preserve

The page introduces music reviews and links into public browsing. Keep the
deferred visual imports and reduced-motion behavior. Editorial direction lives
in [DESIGN.md](../../../../DESIGN.md).

## Public Discovery Links

The landing footer prioritizes `/reviews` and `/search` as real public
discovery routes. Individual `/tracks/[slug]/[id]` pages are linked from
reviews and other content; there is **no standalone `/track` directory**.
Only the exact legacy `/track` URL redirects permanently to `/reviews`;
Deezer resolver paths under `/track/deezer/*` still work. Music pages
retain their canonical URLs, and the public recent-tracks JSON API remains
available independently.

`Help` and `Apply to curate` are not promoted while those experiences
are outside the primary listener journey. This does **not** delete policies,
suspend applications, remove legal documents, or change restricted
`/studio/curators`. Keep Changelog, Documentation, Accessibility, Terms,
Privacy and Cookies reachable. The curator recruitment route stays available
by direct URL until a separate campaign decision is made.

## Landing Motion

The public `/home` entrance uses a scoped editorial choreography:
navigation, word-staggered H1, description and CTA, then one blur-to-focus
reveal of the stable mini UI interior. The frame retains its final layout;
there is no viewport trigger, per-widget stagger or added demo content.
Reduced-motion visitors see unanimated content.

See the canonical [Landing Entrance Motion guide](../../../../docs/landing-motion.md)
for exact timing, the streamed Starter picks boundary, stable frame sizing,
Safari reload protection, discarded alternatives, and regression checklist.
The overarching motion contract remains [DESIGN.md](../../../../DESIGN.md).

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
