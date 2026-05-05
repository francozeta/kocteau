# Kocteau Interface System

## Direction

Kocteau is a premium music review product: dark, editorial, quiet, human, and review-led. The interface should feel closer to a music journal or editorial feed than a SaaS dashboard.

Reviews are the main event. Navigation, tabs, launchers, and side rails must support reading and discovery without competing for attention.

## Palette

Use a black and white monochrome world:

- Canvas: true black or near-black.
- Elevated surfaces: charcoal steps that get slightly lighter as they rise.
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

## Depth

Use surface color shifts plus soft layered shadows. Avoid heavy borders.

- Page frame: canvas with a barely visible shell on desktop.
- Review card: borderless, lighter than the canvas, with subtle top light and depth shadow.
- Featured review: one luminance step above the regular review card.
- Controls: borderless charcoal controls with soft inset/top light.
- Side rails: transparent by default, only lightly surface on hover.

## Radius And Spacing

- Review cards: `1.05rem`.
- Feed controls and search launcher: `0.95rem`.
- Tab active state: inner radius should stay visually concentric with the outer control.
- Keep padding calm and symmetric; prefer small spacing adjustments over new wrappers.

## Typography

- Use serif type to give reviews and track identity editorial weight.
- Use sans type for navigation, controls, and metadata.
- Apply `text-pretty` to review copy and `text-balance` where headings can wrap awkwardly.
- Use `tabular-nums` for ratings and counters.

## Component Patterns

- Review cards should prioritize track identity, cover art, reviewer, rating, written take, then lightweight actions.
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
