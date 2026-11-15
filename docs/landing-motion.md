# Landing Entrance Motion

This guide documents the public `/home` **editorial entrance choreography** adopted in PR #304. It is a deliberately scoped extension of the canonical [design contract](../DESIGN.md), not a new default for Kocteau's application screens.

## Design Intent

The landing's purpose is to introduce a place for music reviews, listening notes, discovery and memory. Visual weight belongs to the editorial heading and the *realistic product view*. The product is not an ornamental 3D object or a collection of unrelated reveal effects.

**Principle: choreograph comprehension, not components.** Establish the page hierarchy, introduce the text through meaningful units, and let the product come into focus in a stable frame. Motion should clarify what the visitor is looking at, not delay comprehension.

This method emerged from two reference recordings and iterative feedback. The working reference is [Interfere](https://interfere.com/), accompanied by its publicly available [building notes](https://interfere.com/blog/how-we-built-interferes-new-website). Their published treatment includes staggered text, opacity, blur and upward motion. **Kocteau's implementation and timing are original adaptations**, not a reconstruction of inaccessible proprietary JavaScript, internal CSS, or exact private timing.

## Visual Ownership

| Element | Visual treatment | Must remain stable |
| --- | --- | --- |
| Guest navigation | Short blur + opacity reveal | Fixed header, link positions, touch targets and progressive blur backdrop |
| H1 | Six word spans with staggered opacity, blur and upward movement | Original copy, editorial typography, line wrap and block height |
| Description | One semantic text block, revealing after the first words | Original text and spacing |
| CTAs | One group after the description begins | Two existing links, focus treatment and destinations |
| Product frame | Visible from the initial HTML; stationary | Original grid, background, sidebar, Feed header, review, editorial rail and clipping |
| Mini UI inner grid | A **single** opacity/blur layer from soft to sharp, with **no translation** | No movement, per-widget stagger, fabricated activity, new rows or content swaps |

The interior mini UI and the frame serve different purposes. Keeping the **frame** present while revealing its **content** helps the composition read as an existing application, rather than a card that flies up from nowhere.

## Timing Contract

All relative to initial page render, with `cubic-bezier(0.16, 1, 0.3, 1)`:

| Start | Duration | Target | Keyframes |
| --- | --- | --- | --- |
| 0 ms | 600 ms | Navigation | opacity `0 → 1`, blur `8px → 0` |
| 100, 190, 280, 370, 460, 550 ms | 760 ms per word | Six H1 words | opacity `0 → 1`, blur `10px → 0`, translateY `20% → 0` |
| 600 ms | 660 ms | Description | Same H1 keyframes, as a block |
| 740 ms | 660 ms | CTAs | Same H1 keyframes, as a block |
| 880 ms | 900 ms | Inner product grid | opacity `0 → 1`, blur `9px → 0`; **no transform** |

The stages **overlap** but do not all begin together. Navigation establishes place; words express intent; copy/actions give context; the real product becomes clear after its context is legible. The final phase settles at approximately 1.78 seconds.

The recorded values are not a mandate to add more animation. When refining, adjust the relative start times before increasing blur, movement or duration.

## DOM And Data Boundaries

Source entry points:

- `apps/web/app/(home)/home/page.tsx`: server-rendered public page; `revalidate = 300`; starter/reviews fetch concurrently. Canonical metadata stays `/home`.
- `apps/web/components/landing/guest-header.tsx`: fixed guest header and its navigation reveal.
- `apps/web/components/landing/guest-home.tsx`: H1 word spans, description/CTA groups and **height-reserved** product wrapper.
- `apps/web/components/landing/guest-home-hero.module.css`: semantic entrance classes and one CSS-only motion timeline.
- `apps/web/components/landing/guest-product-preview.tsx`: existing Feed mock with the real ReviewCard and editorial rail. Do not redesign its content to support the animation.

The preview reserves **28rem mobile, 32rem at `sm`, 36rem at `lg`**, regardless of whether starter data has loaded. Its server-rendered shell does **not** get replaced when the starter promise resolves. Only the existing `Starter picks` portion of the editorial rail is a nested Suspense boundary; while it loads, a height placeholder preserves space. This prevents a second animation, a flash or layout displacement on delayed responses.

The outer frame is visible and remains at its final coordinates. Animate only the existing `.kocteau-product-preview > div > div:first-child` grid as a unified layer. Avoid broad selectors on every article, sidebar or button.

## Device, Accessibility And Performance

- **Page entry only.** There is no scroll listener, IntersectionObserver, viewport-driven trigger or heavy animation library for the intro.
- **Reduced motion:** turn off all entrance keyframes under `prefers-reduced-motion: reduce`.
- **Server-rendered content:** HTML, headings and links are meaningful without JavaScript. Avoid hiding source text behind a client-only initialization gate.
- **Stable layout:** opacity/blur do not change occupied space. Never transform the entire product frame or animate layout-affecting heights, margins or positioning.
- **Safari reloads:** the small early script on `/home` resets the scroll position to the top for *full reloads without a fragment* so a restored scroll location does not conceal the hero during playback. Preserve history back/forward behavior and fragment navigation.
- **Filters:** blur is a controlled exception for this public introductory sequence; keep animation limited to these few elements. Monitor Safari paint cost and lower blur on underpowered devices if needed.
- **Focus/links:** no change to CTA, navigation or keyboard targets. Preserve visible focus indicators.
- **Repeat policy:** the sequence replays on fresh page mounts; *first-visit-only* behavior was not implemented. Do not infer that behavior from the visual reference.

## Lessons From The Iterations

1. **First prototype:** very short `560ms`, `blur(4px)`, `10px` movement was barely perceptible.
2. **Stronger word reveal:** `blur(10px)` with a word stagger clarified the H1. It became the retained basis.
3. **Rejected scroll orchestration:** revealing the product only at an intersection threshold missed the intended page-entry relationship with the heading.
4. **Rejected extra activity timeline:** it introduced UI not present in Kocteau and moved attention away from the actual product.
5. **Rejected per-widget motion:** individually animated tabs/sidebar/review looked busy and obscured the unified product identity.
6. **Rejected whole-frame translation/fade:** the whole mock moving or disappearing made its geometry uncertain. Keep its outer shell visible and reveal only the inner content.
7. **Streaming/Safari bug:** substituting the entire Suspense preview replayed motion; restored iOS scroll could hide the hero. Keep the frame mounted, reserve height and scope the reload fix narrowly.
8. **Final direction:** a coordinated set of text beats plus one stationary, unified reveal of the mini UI. Preserve the frame and let the content sharpen.

## QA Before Release And Future Changes

- Verify the public `/home` as signed out and signed in. It stays independent of the private `/` Feed.
- Inspect first load, hard reload at the top, reload after scrolling, back/forward navigation, and fragment navigation on **iPhone Safari** and desktop.
- Verify the frame has its final height before and after delayed starter data, with no double entry, flash, scroll jump or content change.
- Slow down screen recordings to inspect word order, overlap and the unified product reveal.
- Verify no scrolling is needed to start entrance, and changing scroll does not replay it.
- Check keyboard focus, screen-reader headings, reduced motion, JavaScript disabled, and narrow-screen clipping.
- Confirm Vercel preview build, GitHub Verify, then production commit/route after merge. Build success is not proof of a physical-device visual check.

Keep `DESIGN.md` the overarching design contract; this document owns **only the public landing entrance exception**. Other review, Search and navigation animations keep the compact motion contract.
