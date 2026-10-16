# Safari/iOS Search

Date: 2026-10-16. Baseline: main `b9de271`. Branch: `fix/safari-mobile-search`.
Status: locally implemented and verified; not published or deployed.

## Scope And Coverage

One public flow: Search input → catalog results → selected music → reopen/close
Search, including its dock and options panel. Next.js 16.3, React 19, Tailwind,
existing UI primitives, and the contracts in AGENTS.md, PRODUCT.md, DESIGN.md,
CURRENT.md, and the Discovery/Shell READMEs govern this work.

Auth, review drafts/publication, Studio, SQL/migrations, the WebGL renderer,
and general navigation are outside this change.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Named controls, touch close, input focus, ArrowDown/Escape, options focus restoration, result visibility | Close/focus fixes verified; VoiceOver not verified |
| Layout | Production render at 320/390/768/844/1280px; simulated keyboard resize/pan/dismissal, scroll clearance, rotation and fallback | Viewport and scroll fixes verified; physical safe areas not verified |
| Writing | Search labels, empty/error messages, existing action terminology | Clear in inspected flow; copy preserved |
| Typography | Mobile input computed at 16px, result text, narrow layout and desktop render | Mobile input size preserved; reader text-size overrides not verified |
| Colors | Rendered title/artist/type against the opaque results surface | Type label corrected to 5.09:1; other inspected result text passes 4.5:1 |
| UI polish | Existing controls, transitions, selected/unselected states and screenshots | Existing visual system retained; no new motion |

## Findings And Corrections

Severity describes the original behavior; each listed correction is implemented.

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | Accessibility | `apps/web/components/discovery/discovery-search.tsx:283` | Canceling `pointerdown` suppresses the synthesized close click in touch WebKit | Preserve the native pointer/click sequence | The X received pointer events but did not close Search |
| HIGH | Layout | `apps/web/hooks/use-mobile-search-viewport.ts:20`, `apps/web/components/discovery/discovery-map.tsx:156`, `apps/web/components/shell/mobile-bottom-bar.tsx:110` | Fixed dock/results ignore the visual viewport; panning also clips the list start | Fit both result edges and the dock to visible bounds; clear adjustments during zoom and on cleanup | Keyboard occlusion makes controls/results unreachable |
| HIGH | Layout | `apps/web/components/discovery/discovery-search.tsx:131` | An end-aligned result can scroll behind the dock | Match scroll padding to the existing bottom content padding | In a 440px viewport, the last result ended at 440px while the dock began at 332px |
| HIGH | Colors | `apps/web/components/discovery/discovery-search.tsx:191` | Type-label opacity yields 3.47:1 contrast | Reuse the existing secondary-text opacity: 5.09:1 | Small text requires 4.5:1 against its rendered background |
| MEDIUM | Accessibility | `apps/web/components/discovery/discovery-search.tsx:306` | Reopening defers focus to `requestAnimationFrame` | Mount synchronously and focus inside the tap handler, without scrolling | Preserve the synchronous iOS keyboard-activation path; native keyboard still needs device confirmation |

The geometry hook batches DOM reads/writes once per animation frame, avoids
viewport-driven React renders, and removes its listeners, observer, pending frame,
and scoped CSS properties on cleanup. It ignores pinch-zoom offsets. Keyboard
hints request Search and disable automatic capitalization/correction for music names.

## Verification

- Pinned Node 24.15.0 and pnpm 11.21.0; frozen lockfile installation.
- `pnpm check`: 115 tests passed, zero failed; documentation, workspace lint,
  production build and TypeScript passed. Lint emits an upstream AwaitExpression
  parser diagnostic but exits successfully.
- `git diff --check` passed; documentation rechecked after this handoff update.
- Actual production build inspected using Chromium 151 and WebKit 26.5.
  Both passed 320/390/768/844/1280px layouts without horizontal overflow,
  simulated keyboard resize/pan/dismissal, top/bottom result bounds, last-result
  scroll clearance, zoom-inset reset, rotation cleanup, Search close/reopen focus,
  options-panel focus restoration, browser Back, ArrowDown/Escape, empty/error
  results, and missing-VisualViewport fallback. No page exceptions were observed.
- A separate focus check confirms reopening no longer focuses from an animation
  frame. Touch WebKit now delivers the close click and restores trigger focus.
- Rendered result contrast in both engines: title 13.35:1; artist/type 5.09:1.
  Screenshots were inspected at 320px and desktop. Raw local artifacts stay ignored.

Reproduce the UI cases on a local production build: open Search, enter a catalog
query, shrink/pan the visual viewport, scroll the final result into view, dismiss
the keyboard, rotate, select music, reopen Search, tap X, open/close Canvas options,
and use browser Back. Repeat with no matches and a failed search response.

Catalog responses were fixtures. The missing local database returned no starter
tracks; these checks establish client UI behavior, not live catalog or database
correctness. Native iPhone keyboard/safe-area behavior, actual pinch gestures,
VoiceOver, 200% browser zoom, authenticated flows, and deployment remain unverified.

## Verdict

Approve for the inspected Search UI and simulated viewport cases. Physical iPhone
coverage remains the next verification step; this is not a deployment claim.
