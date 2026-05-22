# Kocteau Interface Craft Rules

These notes distill the interface and animation direction from the Kocteau
design reading notes. Use them together with `AGENTS.md` and
`docs/ai/motion-rules.md`.

Kocteau should not feel like a generic generated app. Shipping a working screen
is not enough. The interface should feel considered through many small details:
spacing, copy, radius, motion, color, and how surfaces respond to touch.

## Product Feel

- Build for a listener who is reading, reviewing, and forming taste.
- Keep the product closer to a quiet music journal than to a SaaS dashboard.
- Let reviews, covers, ratings, and music identity carry the visual interest.
- Keep chrome calm. UI should support reading, not compete with it.
- Make fewer elements, but make them feel more intentional.
- Before stopping on a UI, ask: would this be worth sharing as a product detail?

## Reject Defaults

Avoid:

- generic card stacks that could belong to any social app
- dashboard-like metric panels unless the task is truly operational
- loud borders, heavy shadows, glow effects, glassmorphism, and neon accents
- decorative motion that does not explain continuity, feedback, or focus
- large rounded pills for important product surfaces
- repeated badges, noisy counters, and growth-hacking language
- copy that sounds like a launch template or AI-generated marketing

Prefer:

- one clear reading path
- compact controls with stable hit areas
- subtle surface shifts instead of decorative containers
- music-native copy and editorial restraint

## Surfaces And Radius

- Use surface hierarchy deliberately. In dark mode, elevated surfaces can be a
  little lighter, but jumps should be quiet.
- Prefer transparent shadow/ring combinations over harsh solid borders when a
  surface needs depth.
- Borders should be discoverable, not the first thing the eye notices.
- Use concentric radius for nested surfaces: outer radius equals inner radius
  plus visible padding.
- Small controls should have smaller radii than cards and dialogs.
- Do not place cards inside cards unless the inner card is a real tool, modal
  content, or repeated item.
- Add subtle image outlines to covers when needed so artwork sits cleanly on
  dark surfaces.

## Typography

- Use typography as product identity, not filler.
- Use `text-wrap: balance` for compact headings when it prevents awkward breaks.
- Use `text-wrap: pretty` for body copy in editorial surfaces.
- Keep UI labels short and compact; do not overexplain common interactions.
- Use tabular numbers for ratings, counts, timers, and changing values.
- Keep font rendering crisp. Kocteau already uses antialiasing globally.
- Reserve strong editorial type for reviews, titles, music identity, and modal
  moments that deserve emphasis.

## Controls And Feedback

- Every action needs clear states: default, hover, active, focus-visible,
  disabled, loading, success, and error when applicable.
- Buttons should have at least a 40px usable hit area on touch surfaces.
- Use `active:scale-[0.96]` for tactile press feedback when it fits the control.
- Icon and text controls need optical alignment, not just geometric centering.
- Copy/save/like/bookmark feedback should happen close to the control whenever
  possible. Avoid redundant toast noise for success states that can be shown
  inline.
- For contextual icon swaps, keep both icons in place and animate opacity,
  scale, and blur instead of hard-switching the element.

## Motion

- Use motion only for continuity, feedback, hierarchy, focus, or state changes.
- Prefer CSS transitions for interruptible interaction states.
- Use `motion/react` when shared layout, gestures, or spring behavior actually
  improve clarity.
- Animate compositor-friendly properties: opacity, transform, scale, and
  occasional filter/blur when subtle.
- Do not use `transition-all`.
- Do not use `will-change: all`; add `will-change` only for specific properties
  and only when needed.
- Enter motion may be a little richer than exit motion.
- Split meaningful entrances into semantic chunks instead of animating one large
  container.
- Exit motion should be subtle, often a small fixed `y` offset plus opacity,
  rather than a large dramatic movement.
- Respect `prefers-reduced-motion`.

## Gesture Rules

- Hover, tap, focus, drag, and in-view gestures should express user intent.
- Tap feedback must remain keyboard accessible.
- Drag is allowed only when the product interaction needs direct manipulation.
- Avoid gestures that exist only to show off implementation.
- If a gesture risks fighting the main review/discovery flow, simplify it.

## Color And OKLCH

- Keep Kocteau mostly monochrome. Covers and ratings provide natural color.
- Use OKLCH for palette work when adjusting tokens or contrast.
- In dark mode, lightness drives readability. Do not rely on chroma to solve
  contrast.
- Use neutral blacks and grays. Avoid tinted slate/blue/purple defaults.
- Gradients are not a default surface treatment. Use them only with a clear
  product reason and with controlled contrast.
- If adding a new accent, explain what product meaning it carries.

## UI Review Checklist

Before calling a UI change done, check:

- desktop and mobile
- logged-in and logged-out states when relevant
- keyboard focus and dialog focus restoration
- text overflow and awkward wrapping
- cover/image outlines on dark backgrounds
- stable dimensions for controls and cards
- no layout shift during hover, loading, or success states
- contrast on dim screens
- animation in slow motion for meaningful transitions
- whether the UI still feels like a music review product when blurred or viewed
  at a glance

## Animation Review Workflow

For meaningful motion, record or inspect the transition slowly when practical.
Speed can hide flaws. At slower playback, check:

- Does the object move from a believable origin?
- Does anything resize, jump, or fade out of order?
- Is the exit softer than the entrance?
- Can the user still understand the state if the animation is interrupted?
- Does the motion clarify the product, or is it just decoration?

Fix what shows up at slow speed. The full-speed interaction will feel better.
