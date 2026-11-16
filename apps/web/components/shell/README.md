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

## Mobile sidebar overlay

Mobile navigation uses the existing `AppSidebar` in a controlled Base UI Drawer.
It slides over the page; the header, Search canvas and bottom dock do not move.
Keep the original navigation links, visual tokens, and desktop sidebar.

- The drawer handles backdrop dismissal, focus trap/return, Escape and swipe
  dismissal. Route changes continue to close the sidebar in `AppSidebar`.
- CSS transitions can reverse mid-flight and respect reduced motion.
- The mobile shell uses the original `SidebarInset` scrolling behavior.
- Validate iPhone Safari/Brave, rapid reversals, outside tap, keyboard/VoiceOver,
  safe areas, landscape, Search WebGL, dock and desktop before merging.
- The previous underlay experiment remains recorded in PR #299.
