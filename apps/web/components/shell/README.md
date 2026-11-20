# App Shell

## Entry Points

- Composition: `app-shell.tsx`, `app-sidebar.tsx`, `header.tsx`, `mobile-bottom-bar.tsx`.
- Route state: `route-header-context.tsx`.
- Navigation: `nav-*`; loading geometry: `route-loading-skeletons.tsx`.
- The Query provider receives the server viewer ID and retains one account's
  cache at a time. Account changes clear the old queries/mutations and replace
  the document so server viewer props cannot remain attached to a new session.
  Signing out navigates to `/login` through that single auth listener; token
  refresh for the same account preserves the cache and mounted interface.
- Shortcuts: `global-shortcuts.tsx`; route motion: `app-route-transition.tsx`.
- Search seed URLs share the `/search` transition key: they update the existing
  canvas/header rather than crossfading two complete Search routes. Exiting
  Search components release shell portals immediately; portals are outside the
  fading route container and would otherwise overlap the next header. Other
  routes retain their existing transition keys and motion.
- The deferred composer mounts on the review event or `compose=1` URL state.
- Omit `initialSelection` when no event selection exists so the dialog reads URL
  state. Explicit `null` switches off URL initialization.

## Preserve

Keep shell geometry stable and review/discovery actions reachable. Preserve lazy
dialogs and server-rendered page content. Focus and motion rules live in
[DESIGN.md](../../../../DESIGN.md); shortcut bindings live in
[use-global-shortcuts.ts](../../hooks/use-global-shortcuts.ts).

## Check

Run lint and the web build. Check route transitions, Cmd/Ctrl+K and N, dialog focus
restoration, desktop scrolling, mobile bottom navigation, and loading dimensions.

## Mobile sidebar

In the main AppShell, the existing `AppSidebar` enters from the left while the
full-width app inset moves right by the same distance. The inset contains the
page and one sticky viewport-height layer that anchors its header and dock.
Keep native document scrolling and clip horizontal overflow at the shell edge.

- The controlled Base UI Drawer owns Escape, outside dismissal, and focus.
  The opener and dialog close control share one screen position. Menu links
  close as they navigate. Vertical menu scrolling stays in the drawer.
- CSS translates the page and panel with the same reversible timing and skips
  the transition for reduced motion. There is no shell scale or scrim tint.
- Studio keeps the mobile overlay and its swipe dismissal. Desktop retains its
  in-flow sidebar. The [preview record](../../../../.plan/mobile-sidebar-reveal.md)
  describes the reference, history and device gates.
