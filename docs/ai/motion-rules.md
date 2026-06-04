# Kocteau Motion Rules

[Docs index](../README.md) | [Interface craft rules](./interface-craft-rules.md) | [Web roadmap](../web-roadmap.md) | [Backlog](../backlog.md)

These rules define how to use `motion/react` in Kocteau.

Motion is optional by default. Do not animate a surface just because animation is available.

Reference inspiration:

- [Transitions.dev](https://transitions.dev/) for reusable interaction patterns such as icon swaps, success checks, notification badges, tab indicators, panel reveals, tooltip entrances, and text-state swaps.
- [Details that make interfaces feel better](https://interfaces.dev/magazine/issues/details-that-make-interfaces-feel-better#animate-icons-contextually) for contextual icon motion, interruptibility, staggered entrances, subtle exits, optical alignment, tabular numbers, and text polish.

Use these references as craft direction, not as a visual theme. Kocteau should still feel dark, editorial, restrained, and review-led.

## Purpose

Use motion only when it improves:

- continuity
- feedback
- hierarchy
- focus
- state transitions

Kocteau motion should feel:

- subtle
- interruptible
- contextual
- physically believable
- faster than decorative product marketing motion

## Motion Contract

Default interaction values:

- CSS transitions: `160ms` to `220ms`, `var(--kocteau-ease)` or `cubic-bezier(0.2, 0, 0, 1)`
- Motion springs: `type: "spring"`, `duration: 0.3`, `bounce: 0`
- Press feedback: `scale(0.96)` only when it helps the control feel tactile
- Enter offsets: `y: 6` to `12`, `opacity: 0`, optional `filter: "blur(4px)"`
- Exit offsets: smaller than entry, usually `y: -8` to `-12`
- Icon swap scale: `0.25` to `1`, with `opacity` and `blur(4px)` to `blur(0px)`

Use CSS transitions for interactive state changes because they retarget when the user changes intent. Use keyframes only for staged one-shot sequences such as a success check or a temporary badge pop.

## Prefer

- `opacity`
- `transform`
- small `scale`
- small `y` offset
- contextual icon swaps
- shared layout movement when the same highlighted element changes state
- slightly richer enter motion and softer exit motion
- breaking large entrances into smaller animated pieces instead of one large animated block
- `layoutId` when one card, highlight, tab indicator, or media surface morphs between states
- `will-change` only on elements that truly animate, and only for specific properties

## Avoid

- layout-heavy properties
- animating width or height for routine UI transitions
- animating large containers without a clear product reason
- skeleton surfaces
- full-page backgrounds
- decorative autoplay motion
- long staged sequences for routine product actions
- blur-heavy entrances when a simpler transition communicates the same thing
- `transition-all`
- bounce on routine UI; Kocteau motion should feel composed, not playful
- first-load animations for default state controls

## Interaction Guidance

- respect `prefers-reduced-motion`
- keep motion subtle and fast
- routine product interactions should feel immediate
- the user should never wait for an animation to finish before understanding state
- shared-layout transitions should stay readable even if interrupted halfway
- keep controls usable while motion is running
- use `AnimatePresence initial={false}` for toggles, icon swaps, tabs, and segmented controls that already have a default page-load state

## Contextual Icons

Animate icons only when the icon represents a state change or appears contextually.

Good examples:

- like to liked
- save to saved
- review action to success
- play to pause
- search clear icon appearing after input
- overflow actions appearing on hover or focus

Do not animate static navigation icons, decorative icons, or icons that are always visible and not changing state.

Use this `motion/react` shape when possible:

```tsx
<AnimatePresence initial={false} mode="popLayout">
  <motion.span
    key={isActive ? "active" : "inactive"}
    initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
  >
    <Icon />
  </motion.span>
</AnimatePresence>
```

If CSS is enough, keep both icons mounted and cross-fade with exact transition properties. Do not add another dependency for icon motion.

## Entrances And Exits

When a surface appears, split the motion by semantic chunks instead of animating a large block:

- title or track identity first
- supporting copy second
- actions last

Stagger small groups by roughly `80ms` to `100ms`. Keep blur subtle and remove it if text feels soft or slow.

Exit animations should be quieter than entrances. Use smaller movement, shorter duration, and never make the outgoing element demand more attention than the incoming state.

## Pattern Guidance

Adapt these patterns when they serve the review/discovery loop:

- card resize: only when a selected track, composer, or contextual rail panel expands from an existing surface
- number pop-in: ratings, counts, unread dots, and small counters with `tabular-nums`
- notification badge: unread indicators and success badges, not decorative attention grabs
- text-state swap: saving to saved, publish to published, loading to ready
- origin-aware menu: dropdowns, context menus, and overflow actions should open from their trigger
- panel reveal: drawers, review composer, secondary rail details, and starter studio panels
- tab sliding: active feed/studio tabs may use a shared indicator
- success check: one-shot publish/save confirmation, kept quick and quiet
- error shake: only for direct form validation, never for whole pages or review cards
- tooltip open: appear with a slight delay, exit immediately or almost immediately

## Review Guidance

- Review meaningful motion slowly when practical; speed can hide visual flaws.
- Check whether elements jump, resize, fade out of order, or move from an unclear origin.
- Fix issues visible at slow speed; the full-speed interaction will feel more polished.
- Prefer contextual icon swaps that animate opacity, scale, and subtle blur instead of hard toggles.
- Keep exit animations softer than entrance animations.
- Check optical alignment after motion settles. If an icon looks off even when geometrically centered, adjust the icon or its local padding.
- Confirm dynamic numbers use `tabular-nums` before animating them.

## Good Places to Use Motion in Kocteau

- search/review launcher open and close
- active tab highlight changes
- dialog and drawer entrance/exit
- like/save/bookmark feedback
- contextual icon swaps
- cards entering a newly filtered or reordered state
- selected song preview appearing in the studio rail
- toast status changes such as loading to success
- review composer drawer handle, sheet, and publish-state transitions

## Bad Places to Use Motion in Kocteau

- loading placeholders
- entire feed columns
- full-page decorative fades
- large rail modules moving only for flair
- background textures or chrome that compete with covers and reviews
