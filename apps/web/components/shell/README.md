# App Shell

## Entry Points

- Composition: `app-shell.tsx`, `app-sidebar.tsx`, `header.tsx`, `mobile-bottom-bar.tsx`.
- Route state: `route-header-context.tsx`.
- Navigation: `nav-*`; loading geometry: `route-loading-skeletons.tsx`.
- Shortcuts: `global-shortcuts.tsx`; route motion: `app-route-transition.tsx`.
- The deferred composer mounts on the review event or `compose=1` URL state.

## Preserve

Keep shell geometry stable and review/discovery actions reachable. Preserve lazy
dialogs and server-rendered page content. Shortcut, focus, and motion rules live
in [DESIGN.md](../../../../DESIGN.md).

## Check

Run lint and the web build. Check route transitions, Cmd/Ctrl+K and N, dialog focus
restoration, desktop scrolling, mobile bottom navigation, and loading dimensions.
