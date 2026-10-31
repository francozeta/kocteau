# Search design judgment — experiment 001

Coordination: [#271](https://github.com/francozeta/kocteau/issues/271).
Status: local experiment on `feat/search-design-judgment`; no production release.
Control: main `e7718b4e2eca79becdf85d91492ca3d15aa41124`.
Method: MDS Stage 02 at `012db40d572620444399bdf3489bfc2ee34a712c`.
The initializer used `--no-skills`; the existing skill library is unchanged.

## Intent and observations before implementation

Help a listener understand what happens after selecting music in `/search`.
Read the root contracts, Discovery README, canvas state/navigation, search and
rendering code. Inspected the public guest flow in Chromium at 1440×1000 and
390×844, including selecting Happy by Mazzy Star using the keyboard.

- Selection updates the current identity and shareable route, retains previous
  covers and adds related music in place. Preserve that spatial continuity,
  negative space, monochrome chrome and the existing Review/Save hierarchy.
- Progress is only announced by an `sr-only` status in DiscoveryNavigation.
  There is no visible distinction between retained covers while requests run
  and those left after a successful empty expansion. Source confirms both lanes
  may return no usable additions; exercise this with controlled responses.
- Failure already has a retry button; improve its relationship to the same
  expansion feedback instead of adding another notification.
- Existing cover-label collisions and clipping occur in some sphere positions.
  This experiment does not establish their cause or attempt a renderer redesign.

Hypothesis: one quiet, persistent feedback location for the selected canvas can
make progress, available exploration and an empty expansion understandable
without adding navigation, a visible graph or a tutorial. This has not been
validated with listeners; self-review cannot establish better usability.

## Research and alternatives

Read MDS's pinned judgment, reference registry and review guides. Opened
[DesEngs](https://desengs.com/) and confirmed its links to the following originals
on 2026-10-31. References were read as text, not interactive demonstrations.

| Original | Type and useful principle | Application and limit |
| --- | --- | --- |
| [Web Interface Guidelines — Rauno Freiberg](https://interfaces.rauno.me/) | Practitioner heuristics: feedback close to its context; preserve useful interaction details | Keep feedback inside Search. Do not import its blanket focus, autocomplete or touch prescriptions; Kocteau and accessibility requirements decide those. |
| [You Don't Need Animations — Emil Kowalski](https://emilkowal.ski/ui/you-dont-need-animations) | Practitioner judgment: purpose and repetition determine whether motion earns its cost | Use immediate text feedback rather than a new animated loading sequence. Preserve existing purposeful spatial motion. This is not measured proof of a duration or usability gain. |
| [WCAG 2.2: Status messages](https://www.w3.org/TR/WCAG22/#status-messages), [W3C explanation](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | Normative criterion plus informative explanation: status changes can be announced without moving focus | Maintain one mounted polite status region. Browser semantics alone do not prove screen-reader interoperability or site-wide conformance. |

Use the installed `better-interface` domain guidance for accessibility, layout,
writing, typography, colors and UI craft; retain its evidence limits. No skill,
runtime dependency, reference asset or font is imported.

Considered directions:

1. Keep the existing behavior: least chrome, but leaves the observed progress gap.
2. Add a modal explanation, graph, legend or recommendation rail: rejected because
   it competes with covers and expands the product surface beyond the problem.
3. Add animated skeleton covers: rejected because they imply spatial destinations
   not yet known and distract from still-usable music.
4. Use one compact feedback area for pending, ready, empty and retry: selected
   for a bounded prototype. It costs some canvas space; check collisions and
   reading comfort before retaining it.

## Review gates

- Compare control and candidate with identical music and delayed, empty,
  successful, partial-failure and total-failure responses.
- Check desktop/mobile, 320px, long titles, keyboard selection and focus,
  reduced motion, browser Back and repeated selection while requests run.
- Keep selected identity, actions, URL/history and the previous composition.
- Run existing unit tests, lint, docs validation and web build. Record exact
  coverage and limits before publishing the branch and opening the Preview PR.
- Keep raw screenshots, reference extracts and harness output in ignored
  `.plan/local/search-design-judgment/`. Record safe outcomes here and in the PR.

Owner acceptance, physical-device behavior and any claim of improved listener
comprehension remain open. Auth, schemas, ranking, production data and unrelated
reliability work are outside this experiment.

## Implementation and critique

`discovery-feedback.tsx` presents one mounted polite live region. It distinguishes
pending, partial discovery, available related music, an empty expansion and
partial/total failure. Existing nodes attributed to the focused seed indicate
related music; unrelated retained covers never manufacture a successful result.
Retry uses the existing canvas operation and keeps keyboard focus at the feedback
location. No fetch, ranking, history, memory, renderer or action behavior changes.
The duplicate expansion announcements in the responsive navigation are removed.

The first prototype's error explanation took too much space at narrow widths.
Refinement removes the redundant recovery sentence: the adjacent **Retry
discovery** action already supplies it. Text remains immediate, with no new
transition or skeleton. A small opaque backing protects readability over artwork;
the feedback passes pointer input through except at Retry. It still consumes
visual space, especially at enlarged text sizes; owner review must decide whether
the persistent ready-state instruction earns that cost.

### Flow review

Scope: selected-canvas feedback in the existing Next.js/React/Tailwind shell.
Contracts inspected: AGENTS, PRODUCT, DESIGN, CURRENT and the Discovery README.
This is a self-critique of the affected flow, not independent acceptance.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | Keyboard selection, natural Tab order, Retry focus, stable status semantics, reduced motion; scoped axe 4.10.3 | No actionable finding in the added feedback. Screen-reader interoperability not verified. |
| Layout | 1440×1000, 390×844, 320×640, 720×500 reflow, 200% root text sizing | Feedback and Retry remain within the viewport. No added horizontal overflow; native browser zoom and physical safe areas not verified. |
| Writing | Pending, partial, ready, empty and failure labels against actual outcomes | Error copy shortened after narrow-screen inspection. No claims about music quality or fabricated result counts. |
| Typography | Existing font, 12px UI text with 20px line height; long selected titles and enlarged text | No font or scale change. Feedback contains no variable title to truncate. Existing title presentation remains outside this change. |
| Colors | Rendered feedback text and opaque backing in dark mode | Measured 11.73:1 contrast. No palette change. This is not a whole-page contrast audit. |
| UI craft | Before/after state captures; normal/reduced motion and interrupted selection | Immediate, static feedback; existing spatial behavior retained. No animation added, so no new slow-motion sequence to approve. |

| Severity | Domain | Location in control | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| MEDIUM | UI craft | `apps/web/components/discovery/discovery-navigation.tsx:163` and `:281` | Expansion progress is `sr-only` | One visible and accessible feedback location | Retained covers remain usable while discovery runs, but do not explain progress visually. |
| MEDIUM | Writing | `apps/web/components/discovery/discovery-map.tsx:232` | Failure has Retry; successful empty expansion has no explanation | State-specific copy, existing recovery operation | A listener can distinguish waiting, no related music and failure without leaving Search. |

The observed sphere-label collisions remain a separate renderer investigation.
They are not evidence that the feedback improves discovery. No global visual or
accessibility approval is claimed. Verdict for the inspected feedback: **Approve
for experimental review**, with owner acceptance and the limits below open.

## Verification record

App build: Node 24.15.0, pnpm 11.21.0, frozen lockfile. Browser regression tooling:
external Playwright 1.64.1 in Chromium; rendered comparisons also used the
environment's Chromium with Playwright 1.62.1. All application configuration used
placeholder credentials and read-only synthetic upstreams, never a cloud database.
Public music metadata was captured from the guest control; functional tests use
explicit disposable fixtures and do not fabricate product activity.

| Check | Result |
| --- | --- |
| `pnpm test` | 216/216 unit tests pass. |
| `pnpm --filter web lint` | Passes. |
| `pnpm --filter web build` | Passes, including TypeScript and documentation compilation. |
| `pnpm docs:check`, `git diff --check` | Passes. |
| `node scripts/mds.mjs context --check`, MDS structure checker | Pinned parent/entry point valid; personal-profile import explicitly disabled. Bridge and Git helper come unchanged from the pin. |
| `verify-discovery-feedback.mjs`, mobile and desktop | Both pass pending, partial, ready, empty with retained covers, failure, Retry focus, partial failure, Back/Forward and interrupted selection. Commands and external-tool setup are in the Discovery README. |
| Before/after captures | Main and candidate use the same fixed browser-local starter composition, Happy by Mazzy Star and captured recommendation responses. Desktop/mobile pending, partial, ready, empty and failure states inspected. Fixed snapshots avoid the normal three-hour starter rotation changing the control halfway through the comparison. |
| Rendered stress checks | 320×640, 390×844, 1440×1000, 720×500 reflow and 200% root text sizing: feedback remains in bounds, Retry is at least 44px, no horizontal overflow. Scoped axe has zero violations; feedback contrast is 11.73:1. Reflow/text sizing are proxies, not native browser zoom certification. |
| Motion | New feedback is static. Over a 500ms sample after settling, all 16 root cover-label positions stay unchanged under reduced motion; all 16 move with normal motion. This does not verify a live preference toggle or physical-device performance. |
| Existing `verify-search-recovery.mjs` | Mobile passes the full check. Desktop control passes; candidate fails its immediate post-reload input assertion at line 281 (`''` instead of `Network fixture`) in two runs. Do not describe this as a pre-existing failure or a full green browser suite. Search-state code is untouched; causation remains open. |

Raw captures, test output, source extracts and the comparison HTML remain in
ignored `.plan/local/search-design-judgment/`. The comparison packet can be shared
separately for review; no browser sessions, credentials or raw logs belong in Git.

A targeted diagnostic replay of the exact reload sequence subsequently found
`Network fixture` already restored at its first snapshot. A simpler reload check
also restored it on both builds. These observations do not explain the two
unmodified-check failures or establish their cause. The original recovery test
has not been weakened or changed; its desktop result remains an integration gap.

### Remaining uncertainty

- The desktop reload result must be resolved or explicitly accepted before any
  integration. The experiment does not authorize unrelated search-recovery work.
- WebKit cannot launch because this worker lacks system libraries; installing
  its host dependencies requires unavailable system privileges. Physical iPhone,
  native browser zoom, screen-reader speech and authenticated sessions were not
  verified. The feedback does not branch on authentication.
- A persistent ready-state instruction may be unnecessary for returning listeners.
  Enlarged text makes its visual cost clearer. Listener testing, rather than
  screenshot preference, should decide whether to keep it or limit its frequency.
- Original references were consulted for their principles; their interactive
  examples and any empirical improvement in Kocteau were not verified.

The next decision is owner review of this bounded candidate and its evidence,
not a claim that MDS has proved better design judgment. Keep the PR experimental;
do not merge or promote the Preview as part of this task.
