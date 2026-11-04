# Search: listening index

Independent exploration from production/main `8587fea237b9b317355ebf679a7ec33d7ffd8f3b`.
Branch: `feat/search-craft-codrops`. No merges or cherry-picks from #272/#280/#281.
MDS: `012db40d572620444399bdf3489bfc2ee34a712c`; existing local UI, layout,
typography and accessibility skills; [Kocteau design contract](../DESIGN.md).

## Renderer audit — before design

Production was independently confirmed through Vercel's production deployment
metadata: `dpl_6pbUcj4KRhL9osLwQpHLpLtppR7f` targets main `8587fea`.
The live `/search` was inspected in desktop Chromium. Its spatially varied covers
and crowded all-cover captions match the main implementation.

Compared production files against fetched, read-only PR heads:

| Candidate | Head | Technical difference from production | Implication |
| --- | --- | --- | --- |
| [#272](https://github.com/francozeta/kocteau/pull/272) | `040e0f4` | `getPlaneScale` caps non-anchor covers at `min(148, width*.24, height*.24)` pixels after selection. | Confirmed spatial regression: depth no longer determines cover size as in production. |
| [#280](https://github.com/francozeta/kocteau/pull/280) | `b3b584b` | Retains the same renderer and wrapper changes as #272. | The UI refinements do not restore the original spatial experience. |
| [#281](https://github.com/francozeta/kocteau/pull/281) | `221a522` | Removes the cap but retains the label solver, picking and wrapper changes. Its still-frame anchor scale also includes baseScale, unlike production's `renderStill`. | Restoring the cap alone does not restore production behavior. |

All three add `updateCoverPositions` to the render loop. Instead of one linear
projection and callback per cover, it allocates cover/label collections, sorts
them, builds per-cover occluder arrays and searches collision-free placements.
That adds quadratic comparisons and allocation pressure each frame. The wrapper
also observes caption sizes/chrome and writes width, datasets and text alignment
for all labels. This is a credible lag mechanism, not a measured device slowdown.
All three change raycast ordering from nearest hit to renderOrder, and add pointer
guards. These can change overlapping-cover selection and keyboard/pointer behavior.

The collision solver can hide **captions**; no inspected diff directly proves it
makes artwork disappear. Brief artwork flicker reported by the owner remains a
runtime report, not a root cause established by this audit. Source comparison is
not evidence of Safari/iPhone frame continuity. Candidate previews have not been
modified or redeployed.

Decision: retain main's complete `image-sphere.ts`, geometry, camera options,
texture lifecycle, movement and pointer behavior. Keep discovery data/navigation
unchanged. Consume the existing projection callback for one selected DOM caption;
do not put label collision resolution back into the renderer.

## Intent and research

Help listeners choose a starting point, recognize their explicit selection and
continue exploring without the interface competing with the spatial artwork.
The all-cover captions are noisy; search currently paints over the whole canvas.

Craft source was inspected at its own repository, not copied from experimental
Search. Studied `site-shell.tsx`, `sidebar-nav.tsx`, `concept-card.tsx`,
`resources/page.tsx`, the scroll fade and interruptibility demos and concept source.
Its narrow reading column, quiet fixed utilities, shared alignment and immediate
hover feedback transfer; its light theme, documentation navigation, progressive
blur and sound effects do not. No upstream assets or runtime dependencies copied.

| Reference | Transfer to Kocteau | Limit |
| --- | --- | --- |
| [Craft / Scroll Fades](https://craft.gustavofior.com/scroll-fades), [source](https://github.com/gustavo-fior/craft/blob/main/src/components/demos/scroll-fades.tsx) | Edge-aware fade inside the results list; clear first/last rows. | No mask on canvas or focus outline; native scrolling remains available. |
| [Image Outlines](https://craft.gustavofior.com/image-outlines) | Faint inset edge on DOM search thumbnails. | Never alter WebGL materials. |
| [Hover Restraint](https://craft.gustavofior.com/hover-restraint) | Immediate row/filter hover; selection only on activation. | No hover selection, animated row choreography or floating titles. |
| [Interruptibility](https://craft.gustavofior.com/interruptibility) | Search/close/filter controls remain available during state changes. | CSS local transitions only; no input locks. |
| [Craft resources](https://craft.gustavofior.com/resources), [Rauno interaction design](https://rauno.me/craft/interaction-design), [Emil: You don't need animations](https://emilkowal.ski/ui/you-dont-need-animations) | Intent, direct feedback and frequency govern motion. | Public material only, no paid-course access claimed. |
| [Codrops](https://tympanus.net/codrops/), [Demos Hub](https://tympanus.net/codrops/demos/) | Strong editorial alignment, asymmetric media composition, quiet corner controls. Inspected their own rendered pages, navigation and demo/source links. | No ad density, article-card grid or promotional chrome. |
| [Grid to Slideshow](https://tympanus.net/Development/GridToSlider/) | One selected image earns identity; clear exit returns to exploration. | No fullscreen morph, hiding other covers or new layout engine. |
| [Infinite GSAP Gallery](https://tympanus.net/Tutorials/InfiniteScrollGSAPGallery/), [source](https://github.com/surya-aditya/codrops-infinite-scroll-and-content-transition) | Separate expressive media from a precise editorial frame; inspected `Transition.js`, `Slider.js`, CSS and live demo. | Reject its 1.2s Flip, SplitText and fading other images. |
| [EaseReverse Clip Menu](https://tympanus.net/Development/EaseReverseClipMenu/), [source](https://github.com/codrops/EaseReverseClipMenu) | Inspect reversing mid-open and distinct close behavior. | No GSAP, clip-path menu or large masked layer. |
| [A Drift](https://tympanus.net/Demos/ADrift/), [source](https://github.com/zen-aperios/a-drift) | Sparse marginal labels and separation between composition and controls. | Reject ghost trails, ongoing type effects, sequencer and extra audio. |

## Directions considered

1. **Instrument panel:** consolidated controls and dense metadata. Rejected: a
   dashboard competes with the music and spends attention on settings.
2. **Kinetic sleeve:** oversized editorial type, animated text and media-to-detail
   morph. Rejected: it steals identity from the artwork and threatens continuity.
3. **Listening index — chosen:** a calm typographic frame around the unchanged
   spatial field; concise guidance at rest, precise search rows, one moving
   selected caption and a clearly subordinate path to the canonical music page.

Keep Geist Pixel for music identity and Geist Sans for controls. Monochrome tokens,
opaque local surfaces, compact corners and aligned baselines. Search should be an
index into the music; the original canvas remains the expressive composition.

## Verification record

Pending implementation and browser review. Raw screenshots/diagnostics remain
ignored in `.plan/local/`. No physical iPhone or Safari installation is attached.
Linux WebKit is a useful engine check, not a substitute for physical-device GPU,
Safari viewport/keyboard behavior or VoiceOver testing.
