# Kocteau Motion Rules

These rules define how to use `motion/react` in Kocteau.

Motion is optional by default. Do not animate a surface just because animation is available.

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

## Interaction Guidance

- respect `prefers-reduced-motion`
- keep motion subtle and fast
- routine product interactions should feel immediate
- the user should never wait for an animation to finish before understanding state
- shared-layout transitions should stay readable even if interrupted halfway

## Good Places to Use Motion in Kocteau

- search/review launcher open and close
- active tab highlight changes
- dialog and drawer entrance/exit
- like/save/bookmark feedback
- contextual icon swaps
- cards entering a newly filtered or reordered state

## Bad Places to Use Motion in Kocteau

- loading placeholders
- entire feed columns
- full-page decorative fades
- large rail modules moving only for flair
- background textures or chrome that compete with covers and reviews

