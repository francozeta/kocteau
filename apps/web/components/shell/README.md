# App Shell

## Entry Points

- Composition: `app-shell.tsx`, `app-sidebar.tsx`, `header.tsx`, `mobile-bottom-bar.tsx`.
- Mobile reveal: `mobile-foreground-overlay.tsx` portals the fixed header and
  dock to a viewport-sized layer. It consumes the same Motion progress/distance
  as the main inset; never translate both a fixed descendant and its ancestor.
- Route state: `route-header-context.tsx`.
- Navigation: `nav-*`; loading geometry: `route-loading-skeletons.tsx`.
- Shortcuts: `global-shortcuts.tsx`; route motion: `app-route-transition.tsx`.
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
