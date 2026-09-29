# Visual foundation — typography and testimonials

Status: planned. Start only after PR #142 is merged so performance and visual changes remain reviewable.

## Working branch

`design/editorial-visual-system`

## Phase A — Core typography

Goal: make the landing typography the official Kocteau typography without turning the product shell into a marketing page.

- Promote the existing local Circular WOFF2 to the semantic UI/body role.
- Promote the existing local Redaction WOFF2 to the editorial/display role used by review titles, section headings, and intentional music identity moments.
- Remove Geist and Merriweather from the root font runtime once the local faces cover their roles.
- Keep one restrained type scale; avoid one-off sizes and synthetic weights.
- Preserve readable body measure, balanced headings, stable line height, and mobile wrapping.
- Measure the font and route payload before accepting the change.

Feedback checkpoint: app shell, one review card, one rail module, and mobile navigation before expanding usage.

## Phase B — Full-width testimonials

Goal: turn testimonials into an editorial transition rather than a contained marketing card.

- Break the section out to full viewport width while keeping text aligned to the shared content grid.
- Keep the upper transition identical to the body surface.
- Give the lower half a second restrained monochromatic surface using the existing Paper shader.
- Do not add a bright accent gradient; the movement should carry the visual interest.
- Preserve tweet credit, real outbound links, automatic rotation, and click-to-advance.
- Keep a stable minimum height across quote lengths.
- Keep the shader deferred until near the viewport and retain a static fallback plus reduced-motion behavior.
- Verify there is no horizontal overflow on mobile/tablet/desktop.

Feedback checkpoint: palette and section boundary first; motion and testimonial typography second.

## Phase C — Visual consistency audit

Goal: leave follow-up work explicit instead of widening the implementation scope.

- Audit neutral surfaces between landing, body, app shell, cards, and rails.
- Audit title/body roles and accidental font overrides.
- Audit contrast, focus-visible states, overflow, and responsive hierarchy.
- File focused issues for anything outside the typography/testimonials scope.

## Verification

- `pnpm --filter web lint`
- `pnpm --filter web build`
- `git diff --check`
- Visual checks at mobile, tablet, and desktop widths.
- Compare route bundles before and after font/runtime changes.
