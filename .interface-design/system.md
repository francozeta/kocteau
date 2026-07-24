# Kocteau Interface System

## Direction

Kocteau is a premium music review product: dark, editorial, quiet, human, and review-led. The interface should feel closer to a music journal or editorial feed than a SaaS dashboard.

Reviews are the main event. Navigation, tabs, launchers, and side rails must support reading and discovery without competing for attention.

## Palette

Use a black and white monochrome world:

- Canonical grayscale source: OKLCH gray from oklch.fyi, stored as `--kocteau-gray-1` through `--kocteau-gray-12`.
- Canvas: `--kocteau-gray-1`, a neutral near-black.
- Elevated surfaces: mostly `--kocteau-gray-2` with restrained mixes of `--kocteau-gray-3`; do not jump to mid-gray for cards.
- Text: warm white for primary reading, softened warm gray for metadata.
- Dividers: low-opacity grayscale only.
- Color: album art and rating stars only. Avoid decorative purple, blue, green, neon, gradients, and colorful pills.

Use the semantic Kocteau tokens in `apps/web/app/globals.css` before adding new values:

- `--kocteau-canvas`
- `--kocteau-shell`
- `--kocteau-surface`
- `--kocteau-surface-raised`
- `--kocteau-surface-featured`
- `--kocteau-surface-control`
- `--kocteau-line`
- `--kocteau-line-soft`
- `--kocteau-shadow-card`
- `--kocteau-shadow-control`

Keep marketing and product-demo surfaces isolated:

- `--kocteau-landing-canvas` is the pure-black guest landing background.
- `--kocteau-preview-canvas` and `--kocteau-preview-shell` reproduce the authenticated product inside landing previews.
- Scope reused core components under `.kocteau-product-preview` so their canonical surface aliases resolve to preview tokens.
- Never override `--kocteau-canvas` or `--kocteau-shell` at the landing root; those remain canonical core-app tokens.

## Depth

Use surface color shifts plus soft layered shadows. Avoid heavy borders.

- Page frame: canvas with a barely visible shell on desktop.
- Review card: borderless, lighter than the canvas, with subtle top light and depth shadow.
- Featured review: one luminance step above the regular review card.
- Controls: borderless charcoal controls with soft inset/top light.
- Side rails: transparent by default, only lightly surface on hover.

## Radius And Spacing

- Review cards: `0.95rem`.
- Feed controls and search launcher: `0.78rem`.
- Tab active state: inner radius should stay visually concentric with the outer control.
- Keep padding compact and symmetric; the shell can feel spacious, but feed internals should stay tight and reading-led.

## Button Density

- Button chrome is compact by default: use `2rem` to `2.5rem` visible heights and roughly `0.625rem` to `1rem` horizontal padding.
- Landing CTAs may reach `2.5rem`, but should not become oversized capsules. Large pills are an exception, not the default.
- Use tighter gaps when a button includes an icon; the icon should not create extra empty width.
- Preserve a comfortable touch target through placement, spacing, or an invisible hit area instead of inflating the visible button.
- Keep primary and secondary actions optically related: density should communicate hierarchy through contrast, not size alone.

## Typography

- Use Redaction for the guest landing's major editorial statements.
- Use Geist Pixel at medium weight for product page titles, review titles, and track identity.
- Use Geist Sans for body copy, navigation, controls, labels, and metadata.
- Apply `text-pretty` to review copy and `text-balance` where headings can wrap awkwardly.
- Use `tabular-nums` for ratings and counters.

## Component Patterns

- Review cards should prioritize track identity, cover art, reviewer, rating, written take, then lightweight actions.
- Feed review cards should keep equal visual weight; do not make the first item larger or label a viewer's own review as "Your contribution."
- Rating-only reviews should read as intentional quiet copy, not an italic error or empty-state warning.
- Feed tabs should be compact, stable, monochrome, and visually connected to the launcher.
- The global review/search launcher should feel like part of the feed controls, not a separate dashboard module.
- Sidebar active states should be readable but quiet: monochrome background lift, no strong inset border.
- Right rail modules should feel editorial. Use labels like "Fresh voices" or "Writers to notice" instead of generic growth widgets.
- Like, save, and comment controls are monochrome. The heart can fill, but it should not introduce red or social-network color.

## Motion

Use only small, interruptible micro-interactions:

- Hover/press should affect transform, opacity, color, or local background only.
- Press scale should be subtle, around `0.96`.
- Interaction feedback should stay under `200ms`.
- No decorative animation.

## Texture

- The guest landing may use a visible monochrome grain layer to connect its black surfaces.
- Keep the global grain static and pointer-transparent; animated WebGL texture stays section-local and pauses offscreen.
- Grain should add material character without softening text, obscuring cover art, or entering the authenticated product shell.
