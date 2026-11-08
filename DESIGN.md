# Kocteau Design

[Repository README](./README.md) | [Current state](./CURRENT.md) | [Product](./PRODUCT.md)

This is the canonical visual, interaction, and motion contract for Kocteau. Use it with `AGENTS.md`; specialized implementation details may remain under `docs/`, but they must not override this document.

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

- Give each view or interaction state one visually dominant action: the next
  meaningful step for the user. Keep supporting navigation, account entry, and
  utility actions available but quieter. Do not place two equal-weight filled
  buttons together unless they truly represent equal choices.
- Every action needs clear states: default, hover, active, focus-visible,
  disabled, loading, success, and error when applicable.
- Buttons should have at least a 40px usable hit area on touch surfaces.
- Use `active:scale-[0.96]` for tactile press feedback when it fits the control.
- Icon and text controls need optical alignment, not just geometric centering.
- Sidebar and bottom navigation icons keep the same regular/outline glyph in
  active and inactive states. Communicate the active route with the surface,
  label and `aria-current`, not a filled icon variant.
- Sidebar shortcut tooltips are desktop-only; mobile drawers show their labels
  directly and must not leave hover/long-press tooltip overlays behind.
- Continue the staged Radix → Base UI migration in #232 and #234. Do not
  replace the Sheet/Tooltip primitives ad hoc in a navigation styling PR;
  verify focus return, escape/dismiss, and mobile gestures per migrated family.
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

### Motion Contract

- CSS interaction transitions: `150ms` to `240ms` using `var(--kocteau-ease)` or `cubic-bezier(0.2, 0, 0, 1)`.
- Motion springs: `type: "spring"`, `duration: 0.18` to `0.32`, and normally `bounce: 0`.
- Press feedback: `scale(0.96)` only when it makes a control feel tactile.
- Enter motion: `y: 6` to `12`, opacity from `0`, and at most a subtle `blur(4px)`.
- Exit motion: smaller and quieter than entry, usually `y: -8` to `-12` with opacity.
- Contextual icon swaps: opacity, scale from `0.25` to `1`, and optional blur from `4px` to `0`.
- Use `AnimatePresence initial={false}` for controls that already have a stable page-load state.

Use CSS transitions for interruptible state changes. Use `motion/react` only for shared layout, gestures, springs, or staged state changes that make continuity clearer.

### Motion Patterns

Good uses:

- search or review launcher open and close
- active tab indicators
- dialog and drawer transitions
- like, save, bookmark, and publish feedback
- selected track or composer expansion from an existing surface
- contextual icon and text-state swaps

Avoid motion on:

- loading skeletons
- entire feed columns
- full-page backgrounds
- static navigation icons
- large decorative rail modules
- any interaction that makes the user wait to understand state

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

## Search Canvas

- Preserve the Feed shell's dimensions and dark background; desktop Search lives
  in its existing header. On mobile, keep two mounted dock surfaces: primary
  navigation (Home, Reviews, Library and Profile when authenticated) and a
  separate right-side Search capsule. Opening Search contracts the left
  navigation into a one-tap return to the canonical Feed route (`/`) and expands
  that same right Search capsule into the input (or selected-music actions).
  All transitions must be interruptible/reversible; no third floating bar
  replaces the dock. The X inside Search clears the text, not the route.
  Review-detail comments may use an independent contextual shelf. The public
  landing page (`/home`) does not mount the app dock. The active tab uses a surface and
  label, while **all navigation icons retain regular/outline weight**.
- Floating covers, negative space, and restrained spatial disorder carry the
  personality. Do not replace the canvas with a dashboard or a visible graph.
- Selecting a cover expands discovery in place. Keep some previous covers and
  their positions so the space remains recognizable; back restores the earlier
  composition. The entity page is an explicit secondary link.
- Give every visible cover a title and artist label that follows its position,
  without a filled label background or hover-only tooltip. The centered cover
  remains the current object. Review is the primary track action; sharing and
  saving remain quieter controls.
- Mobile search scopes float above the dock as independent slim rounded
  chips (28px visual surfaces inside 44px touch targets); the 53px original
  right-hand 53px Search capsule becomes the Search field with a 45px inner
  target and 4px concentric padding. Only the persistent dock surfaces own
  their backgrounds, radii and depth; do not nest extra shadowed input bars. The shared backdrop blur
  softens the top and bottom without obscuring artwork.
- Selecting music on mobile replaces the header with one compact cover/title/
  artist link. The leading back arrow replaces the sidebar trigger and returns
  to all starter covers; the trailing options button holds sharing and memory
  actions. Desktop retains its existing header and previous-canvas navigation.
- The same mobile dock also morphs between Search input and selected-track
  actions: Review/Save with a Search icon, or Open/Share for albums and artists.
  Only the inner controls change, with short interruptible opacity/scale
  transitions. Leave the outer surface mounted across app route changes.
  Recovering search restores its scopes and input in place; hover alone must
  not switch the dock.
- Each selected song, album, or artist has a shareable Search route that follows
  the focused canvas seed. Back restores the previous route and canvas frame.
  Share the Search route from the canvas. Keep canonical entity routes as
  explicit secondary destinations; do not merge these route responsibilities
  without validation.
- Search results use an opaque surface and structural skeletons. Keyboard users
  must be able to choose seeds and expand covers without manipulating WebGL.
- Song, album, and artist scopes filter seed search; they do not hide the active
  canvas. Keep back navigation and current identity compact, with secondary
  actions in the existing dialog/drawer pattern. Starting a new canvas must not
  silently erase taste memory.
- Stop automatic rotation for reduced motion and pause rendering offscreen.

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

### Mobile sidebar reveal / Base UI experiment

- The left navigation is an **underlay**, not an overlay Sheet: the existing
  content surface slides right and gains a gentle left-side radius/shadow while
  the original sidebar remains behind it. Reuse the existing menu rows, icons,
  labels, colors, hierarchy, guest CTA and active states unchanged.
- Base UI Drawer owns accessible open/close state, swipe dismissal and focus
  semantics only for the mobile sidebar. The desktop sidebar and unrelated
  Sheet/Tooltip/Dialog components keep their current implementation.
- Opening and closing must reverse smoothly, dismiss when tapping the exposed
  main surface, honor reduced motion and not intercept Search's 3D canvas drag.
- The persistent SidebarProvider owns one Motion spring progress and measured
  reveal distance. Animate the SidebarInset, its left radii/shadow and the menu
  entrance from that same progress; keep Base UI responsible for swipe, focus
  and dismissal. The mobile fixed header and dock/haze portal to viewport-sized
  sibling overlays that use this **same** spring, rather than staying fixed
  inside a transformed long-scrolling main (which breaks fixed positioning).
  Avoid independent animation timelines and remounts during open/close.
- Ship as a separate preview PR. Verify iOS Safari scroll restoration, bottom
  bar and fixed header movement, focus return, nested menus and no mobile
  tooltips before merging to main.

- Mobile drawer geometry cannot rely on CSS variables scoped to the SidebarProvider:
  Base UI portals into document.body, outside that CSS inheritance tree. Pass
  explicit measured width to the popup, leave a 16px gap before the foreground,
  constrain all internal flex children to min-width: 0/max-width: 100%, and let
  guest copy wrap naturally within the panel. The foreground and menu use one
  near-critically damped Motion spring; no independent popup opacity transition.
- Keep Base UI's popup present during a closing spring, and let it finish closing
  only after the foreground covers it. On open, re-target the same spring. Avoid
  separate keyframes, unnecessary bounce or extra stage delays.

### Mobile navigation motion study (November 2026)

- Physical continuity matters more than animation spectacle. The menu stays
  legible and nearly stationary beneath the foreground; only a restrained
  12px offset follows the same near-critically damped spring as the main frame.
- Do not fade the entire menu on open: the foreground's translation is already
  its reveal. Avoid independent opacity timelines that make it feel synthetic.
- Keep the gesture on a narrow explicit region, not the scrollable main or 3D
  canvas, until direct-manipulation QA is proven on touch hardware.
- Apple HIG motion: https://developer.apple.com/design/human-interface-guidelines/motion
- Emil Kowalski, Great Animations: https://www.hackdesign.org/lessons/great-animations/
- Jakub Krehel, drag gestures: https://jakub.kr/work/drag-gesture
- Gustavo Fior, Interruptibility: https://craft.gustavofior.com/interruptibility
- Continuity navigation study: https://github.com/francozeta/continuity/tree/feat/persistent-navigation-study
- The `(main)` shared AppShell preserves the bottom dock across Feed, Reviews,
  Library, Search, and Settings routes. Moving between `(main)` and `(studio)`
  remounts their distinct Next layouts; cross-group persistence is **not**
  established and must not be claimed until a common owner is implemented.
