# Search Craft interactions — experiment 002

Coordination: [#279](https://github.com/francozeta/kocteau/issues/279).
Baseline: experimental Search [PR #272](https://github.com/francozeta/kocteau/pull/272), fixed control commit `040e0f42df3000a0da33d5f0f710de4cc53262cd`.
Candidate: stacked branch `feat/search-craft-interactions`. No production merge/deployment.

## Why this experiment

The prior design experiment already fixed painted cover picking, caption placement, discovery feedback and a broad set of WebGL/mobile interaction defects. Rebuilding the canvas, adding a new design system or copying the look of [Craft](https://craft.gustavofior.com/) would risk losing Kocteau's distinctive spatial music discovery.

This iteration asks whether small, high-frequency interaction changes make Search easier to operate **without adding new UI**. It follows the official published Craft guidance at `gustavo-fior/craft@586e23b34b9c27e48b2ad8be660c67db587f26ad`, including [Hover Restraint](https://craft.gustavofior.com/hover-restraint) and [Interruptibility](https://craft.gustavofior.com/interruptibility). The reference is practitioner craft, not proof of an outcome in Kocteau. Existing `DESIGN.md` wins on colors, typography, motion, interactions and structure.

## Source inspection, observed gap, alternative

On the base PR, the search input moves focus to the first result with ArrowDown, but a focused result has only Escape handling. No ArrowDown/ArrowUp traversal is provided there. Closing a search from result focus attempts to focus only `[data-global-search-trigger]`; this trigger can be absent in the desktop header or at the guest root. High-frequency search result, scope, back and options hover styles include 150ms color transitions.

**Candidate:**
- Result list supports ArrowDown to the next result, ArrowUp to previous, ArrowUp at the first result returns to the search input. The final result stays focused at the end, avoiding arbitrary wraparound. Native Tab and Enter still work, and non-result buttons keep their default keyboard behavior.
- Escape clears and closes the result list, restoring focus to the first available stable control: the existing search trigger, selected-music identity, or mobile navigation toggle.
- Remove hover color transitions from frequently traversed search result rows, scope labels and Search navigation icons, while preserving existing foreground/background contrast and visible focus. Keep the purposeful 200ms, interruptible search-form layout transition for opening/closing.
- Do **not** add decorations, new panels, tutorials, popups, shadows, gradient overlays, new animation libraries, or global changes.

**Alternative:** Keep the prior behavior. It has fewer lines of code but leaves the ArrowDown flow incomplete; original remains valid if the candidate causes unwanted focus behavior or feels overly eager on hover. We also reject a full redesign and new easings/tokens.

## Verification gates

- Check TypeScript, lint, build, unit tests, docs and Git conventions in the PR CI; record actual status and failures.
- Run the existing isolated `verify-discovery-feedback.mjs` loopback fixtures on desktop/mobile, expanded to traverse three catalog results and check Escape focus recovery. This is a browser assertion, not a proof of an actual screen-reader's behavior.
- Compare the base [PR #272](https://github.com/francozeta/kocteau/pull/272) Preview to the candidate Preview with identical music/query and screen size.
- Try rapid mouse movement across result rows and scopes, ArrowDown/Up/Escape, first and last result, Enter selection, touch, reduced motion, long text and selected-canvas Back. Verify no visual regression in the spatial WebGL covers.
- Separate rendered verification, actual user acceptance and measured performance. Owner chooses original/candidate/neither. Do not claim improvement from the reference alone.
- Keep production, auth, catalog, ranking, server APIs, DB and MDS default profile untouched. This stacked experiment should not merge before the base PR and owner acceptance.

## Evidence status

Implementation is on the isolated branch; the control PR has existing Preview and test evidence. Candidate preview, CI and cross-browser results must be recorded after checks. No listener testing or owner preference has yet been established.
