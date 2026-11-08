# App Shell

## Entry Points

- Composition: `app-shell.tsx`, `app-sidebar.tsx`, `header.tsx`, `mobile-bottom-bar.tsx`.
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

## Mobile reveal (preview-only, November 2026)

The stable mobile Sheet is replaced in an experimental branch with a static
Base UI underlay and ONE motion foreground. This is intentionally different
from the reverted #294, which portaled the header and bottom bar to distinct
motion layers and failed on iPhone Brave.

- `SidebarProvider` owns one `useSpring` progress value. Consecutive toggles
  always retarget the same spring; no isAnimating gate or CSS keyframes.
- The 100dvh mobile `MobileRevealInset` owns header, scrollable content and the
  bottom dock. The content-frame scrolls internally only on mobile to keep fixed
  elements rooted in one moving viewport; desktop continues unchanged.
- The sidebar is still the real AppSidebar with existing links, permissions
  and styling. Base UI Drawer provides semantics; its swipe is disabled on
  drawer content until shared drag integration is device-verified.
- The original `ProgressiveMobileHeaderBlur` and `BottomBlur` remain intact,
  in the shared foreground; no independent overlay portals.
- Check iPhone Brave and Safari gesture reversal, content scrolling, search
  WebGL positioning, header and dock alignment, route changes, narrow widths,
  focused inputs, VoiceOver/focus, reduced motion, and landscape before merge.
- Source reference: https://craft.gustavofior.com/interruptibility
- Do NOT merge to main without real-device approval.
