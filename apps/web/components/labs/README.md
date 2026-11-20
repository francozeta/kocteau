# Sidebar reveal geometry lab

Experimental and intentionally not part of the application shell. This route
(`/lab/sidebar`) is available **only in the preview branch**
`experiment/sidebar-motion-isolated`; do not merge without mobile device QA.

## Why this exists

PR #294 placed Motion inside the real sidebar and separately portaled
fixed header and bottom dock, creating competing coordinate systems on
iPhone/Brave. The entire PR was reverted through #296 after a user-submitted
production screenshot and Vercel production rollback.

This lab:
- stays outside `(main)` and `(studio)` layouts
- has one viewport-sized foreground holding scrolling body, header and dock
- animates only its x-position/radius (and a fixed-depth opacity layer)
- renders the sidebar underlay behind it, without portal or duplicated transforms
- compares *stationary* sidebar vs 12px entrance, using a single MotionValue
- supports interruptible clicking, limited drag from menu trigger, viewport resizing,
  and reduced-motion settings, without capturing gestures over content/WebGL
- uses fake labels and fake record artwork, no privileged application state
- does not claim to be production ready or equivalent to native iOS gestures.

## QA before moving to a real app page

Run tests, lint, build. On an iPhone (Safari and Brave), verify:
- menu open/close fast and drag reversal; controls stay aligned at every frame
- body scroll and safe area, top and bottom browser chrome
- no horizontal body/document scroll
- sidebar rows fit within panel width
- dock follows same foreground underlay during reveal
- keyboard/VoiceOver focus, reduced motion, narrow 320px screens
- no separate portal/overlay or hydration shift

The old PR is an archived source of behavior, not the design authority.
Await the user's original designer reference before adapting the aesthetic.
