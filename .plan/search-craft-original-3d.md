# Kocteau Search — original 3D + Craft interaction details (experiment 003)

## User preference / goal

Owner feedback, 2026-11-03: the latest Craft iteration is almost right, but the original Kocteau 3D **flow, cover composition and movements** feel better. Keep the working Craft changes to search controls, scrolling cues, image edges and accessibility. This is an explicit product decision and overrides the desire to apply every detail from a third-party design reference.

## Exact controls

- **Original motion reference:** `main@8587fea237b9b317355ebf679a7ec33d7ffd8f3b`, `apps/web/lib/discovery/image-sphere.ts`; source cover scale is based on depth and per-cover variation, with no selected-state size cap
- **Craft reference:** `feat/search-craft-interactions@b3b584b5673a7bba5c9fc63aa558f37cd45ad295` ([PR #280](https://github.com/francozeta/kocteau/pull/280)), which is itself based on the selected-canvas experiment [#272](https://github.com/francozeta/kocteau/pull/272)
- **Hybrid candidate:** `feat/search-craft-original-3d`, based on the fixed Craft reference above; all changes remain outside `main`

## Source-level finding

The original and experiment use the **same** drag inertia, home ease, automatic rotation rates, depth-scale gradient, hover/press scaling and camera distances. The experiment changed the *spatial composition* by capping all non-anchor covers after selecting music:

`maxPixels = Math.min(148, viewportWidth * 0.24, viewportHeight * 0.24)`

That cap compresses the apparent relative depth and size variation that made the original 3D feel expressive. It is not a performance budget or functional requirement and was not separately approved by the owner. The experiment also improved paint-order picking, keyboard access, missing-cover fallback and caption visibility. Reverting the full 3D implementation would discard those fixes.

## Candidate change

Remove only the selected-state non-anchor size cap, using the original depth gradient and individual cover scaling in both animated and reduced-motion render paths. Keep:

- The unchanged Three.js sphere, easing, inertia, automatic rotation, camera and input hit regions
- Painting-order-aware selection; a visible foreground cover must remain the selected target, not the cover behind it
- Missing-artwork, drag-vs-tap, keyboard/Back, and low-motion guards from the earlier experiment
- More legible selected-music identity, careful caption placement and persistent async feedback
- Craft adaptations: edge-aware scroll fade, subtle cover outlines, responsive hover, arrow-key result navigation and Escape focus recovery
- The repo-local pinned Craft skill and existing no-new-library rule

This first hybrid does **not** revert captions, change texture or add a toggle for 3D algorithms. If the owner's preference is specifically the original caption treatment too, evaluate that separately rather than coupling it to motion.

## Verification and acceptance

1. Unit regression locks the same original depth/anchor scale behavior as production, without hardcoding 148px and without coupling to viewport dimensions.
2. Run `pnpm test`, `pnpm lint`, docs check, TypeScript/Next build and `git diff --check` through the existing Verify workflow.
3. Run isolated mobile/desktop Chromium Search fixture for Craft scrolling, cover edges and keyboard/feedback.
4. Run isolated mobile/desktop Chromium **painted WebGL** fixture for correct foreground picking, upper-right overlap taps, drag, missing artwork, native keyboard, Back, reduced motion and WebGL fallback. Browser tests use synthetic covers and loopback fixture; do not use production accounts or DB.
5. Compare the three real surfaces with the **same songs and screen sizes**: original production, Craft Preview #280, hybrid Preview. Observe both initial motion and post-selection motion, especially cover overlap and attention hierarchy. Owner chooses hybrid, original or Craft. A clean CI does not prove perceived motion quality.
6. Keep a separate draft PR and Preview until owner preference. No merge, promotion, production API/auth/catalog change or MDS profile migration.

## Status

Implementation is a bounded preview candidate. Record workflow results and immutable Preview SHA in the PR. Human visual preference has not been revalidated since this change.
