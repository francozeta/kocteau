# Kocteau Public Backlog

[Docs index](./README.md) | [MVP baseline](./mvp.md) | [Web roadmap](./web-roadmap.md) | [Discovery and curation](./discovery-curation.md) | [Contributing](../CONTRIBUTING.md)

This backlog turns the roadmap into work that maintainers and contributors can pick up.

It is web-first. `apps/web` is the production surface. `apps/mobile` stays future-facing unless a maintainer explicitly opens mobile work.

For discovery, curation, recommendation, and analytics work, start with `docs/discovery-curation.md`. That document defines the product philosophy, signal contract, and phased direction for the hybrid recommendation system.

## How to Use This Backlog

- Keep work small enough to review in one PR.
- Prefer issues that improve the main loop: discover music, write reviews, read taste, return later.
- Convert contributor-ready tasks into GitHub issues with clear acceptance criteria.
- Use `good first issue` only when the task is genuinely safe for a new contributor.
- Use `help wanted` when the direction is clear but maintainers welcome outside implementation.
- Keep auth, Supabase, recommendations, analytics, CI, and release work in the maintainer review lane.

## Backlog States

- `ready`: clear enough to open as an issue.
- `needs design`: needs product/UX direction before implementation.
- `needs maintainer decision`: touches product behavior or sensitive systems.
- `blocked`: cannot move until another task lands.
- `done`: shipped or no longer relevant.

## Discovery Work Already Completed

These items should not be reopened unless a maintainer finds a regression or starts a focused follow-up.

| Work | State | Notes |
| --- | --- | --- |
| Discovery signal contract | done | Event names, metadata rules, and validation are documented for the hybrid recommendation loop. |
| Recommendation health V1 | done | Maintainers have a safe health surface and aggregate checks without exposing raw analytics rows. |
| Contextual starter rail | done | Starter picks can vary by route surface and load outside the main layout render. |
| Starter tag taxonomy | done | `era` and `format` are first-class starter signals alongside genre, mood, scene, and style. |
| Starter Studio tag editing | done | Curators can create and edit starter signals without leaving Studio. |
| Starter Studio selected-track inspector | done | The secondary rail focuses on the selected song instead of generic modules while curating. |
| Starter Studio workflow polish | done | Catalog filters, readiness labels, editorial notes, and archive confirmation are merged. |
| Anti-mainstream candidate finder V0 | done | Deezer can propose related/deep-cut candidates without writing to the database. |
| Editorial candidate queue V1 | done | Curators can persist, revisit, approve, and dismiss candidate suggestions before promoting starter picks. |
| Review card routing and reply entry | done | Review cards open detail routes, track identity links to track pages, and review detail pages include an inline reply entry point. |

## Near-Term Priorities

These are the next useful moves after enabling public contribution.

| Priority | Task | State | Suggested labels |
| --- | --- | --- | --- |
| P0 | Review and merge the Release Please PR if the generated changelog is accurate. | ready | `chore`, `area:ci` |
| P0 | Confirm the `v0.2.0` tag and GitHub Release are created after the release PR merges. | ready | `chore`, `area:ci` |
| P0 | Pin the public repository description, topics, website URL, and social preview image in GitHub settings. | ready | `docs`, `area:docs` |
| P0 | Make recommendations visible on track pages so new visitors can see "what to hear next." | done | `feature`, `area:web`, `area:recommendations` |
| P0 | Fix desktop scroll dead zones so the page still scrolls when the pointer is over the secondary rail or empty desktop space. | ready | `fix`, `area:web`, `area:ui` |
| P0 | Make review cards open their review detail route without breaking like, save, or comment actions. | done | `feature`, `area:web`, `area:ui` |
| P0 | Fix mobile toast placement so feedback is centered and clears the bottom navigation. | ready | `fix`, `area:web`, `area:ui` |
| P1 | Harden Deezer-backed search with retry, clearer empty/error copy, and non-blocking fallbacks. | ready | `fix`, `area:web`, `area:search` |
| P1 | Open 6-10 curated GitHub issues from this backlog before broader public sharing. | ready | `docs`, `help wanted` |
| P1 | Add a short "first contribution path" section to the README with links to good first issues. | ready | `docs`, `area:docs`, `good first issue` |
| P1 | Open discovery and curation issues from `docs/discovery-curation.md` with clear owner lanes. | ready | `docs`, `area:recommendations`, `needs maintainer decision` |
| P1 | Add an editable taste preferences path after onboarding. | needs design | `feature`, `area:web`, `area:recommendations` |
| P1 | Add a mobile social discovery carousel near review detail pages. | needs design | `feature`, `area:web`, `area:ui` |
| P1 | Design a listener-facing candidate finder for similar songs that feels curated rather than chart-driven. | needs design | `feature`, `area:web`, `area:recommendations` |
| P1 | Explore a compact feed view for scanning more reviews without replacing the editorial default. | needs design | `feature`, `area:web`, `area:ui` |
| P1 | Emit real review read-depth analytics from the For You feed. | done | `fix`, `area:web`, `area:analytics`, `area:recommendations` |
| P1 | Add a top-rated feed index for `rating DESC, created_at DESC, id DESC`. | done | `chore`, `area:supabase`, `area:performance` |
| P1 | Remove generated orphan components from `apps/web/components`. | done | `chore`, `area:web`, `area:maintenance` |
| P2 | Expand Kocteau-first search to artists, albums, users, and categories. | needs design | `feature`, `area:web`, `area:search`, `area:recommendations` |
| P2 | Tune recommendation reason precedence so social follows are not hidden by weak entity taste matches. | needs baseline | `feature`, `area:supabase`, `area:recommendations`, `area:analytics` |
| P1 | Keep branch protection advisory until the first public PRs prove the flow. | needs maintainer decision | `chore`, `area:ci` |
| P2 | Enable `Verify` as a required status check after 1-2 stable contribution weeks. | needs maintainer decision | `chore`, `area:ci` |

## Ready for First Contributors

These should be safe, visible, and reviewable without deep system knowledge.

### Documentation and Setup

Suggested issue: `docs: add local setup troubleshooting notes`

- Add common `pnpm install`, env, and build troubleshooting notes.
- Mention that `pnpm check` is the current public contribution check.
- Keep secrets and production credentials out of docs.

Suggested labels: `docs`, `area:docs`, `good first issue`

Acceptance criteria:

- A new contributor can recover from the most common setup mistakes.
- The doc points back to `CONTRIBUTING.md`.

### PR Screenshot Guidance

Suggested issue: `docs: document screenshot expectations for visual PRs`

- Add a short guide for before/after screenshots or recordings.
- Include examples for desktop and narrow/mobile viewports.
- Keep it lightweight, not bureaucratic.

Suggested labels: `docs`, `area:docs`, `good first issue`

Acceptance criteria:

- Contributors know when screenshots are useful.
- The PR template remains short.

### Empty State Audit

Suggested issue: `fix(web): polish empty states across saved reviews and notifications`

- Review empty states for saved reviews, notifications, profile reviews, and search results.
- Improve copy and visual hierarchy without changing data behavior.
- Avoid touching auth, Supabase, or recommendation logic.

Suggested labels: `feature`, `area:web`, `area:ui`, `good first issue`

Acceptance criteria:

- Empty states explain what happened and offer a clear next action.
- Layout holds on desktop and narrow viewports.

### Loading State Audit

Suggested issue: `fix(web): tighten loading states for core web surfaces`

- Review skeletons, spinners, and pending UI on feed, search, track, profile, and notifications.
- Keep dimensions stable so content does not jump when loaded.

Suggested labels: `feature`, `area:web`, `area:ui`, `help wanted`

Acceptance criteria:

- Loading states do not resize major page regions.
- Pending controls are visibly disabled where needed.

### Accessibility Pass on Dialogs

Suggested issue: `fix(web): improve keyboard and focus behavior in review dialogs`

- Check review create/edit dialogs with keyboard navigation.
- Confirm focus order, escape behavior, labels, and visible focus states.
- Do not redesign the composer in this issue.

Suggested labels: `bug`, `area:web`, `area:ui`, `help wanted`

Acceptance criteria:

- Dialogs can be opened, used, and dismissed with keyboard.
- Inputs and buttons have clear accessible names.

### Copy Consistency Pass

Suggested issue: `docs(web): normalize product copy across core flows`

- Review visible strings in auth, onboarding, feed, search, saved, notifications, and review dialogs.
- Remove inconsistent language.
- Prefer short, product-grade copy.

Suggested labels: `docs`, `area:web`, `area:ui`, `good first issue`

Acceptance criteria:

- Core flows use a consistent tone.
- No unrelated UI logic changes are included.

### Discovery Documentation Examples

Suggested issue: `docs: add examples to the discovery signal contract`

- Expand `docs/discovery-curation.md` with 2-3 concrete examples of analytics event payloads.
- Include examples for a For You review impression, a starter pick pass, and a review read-depth event.
- Keep examples free of email, IP address, user agent, or raw review body text.

Suggested labels: `docs`, `area:docs`, `area:recommendations`, `good first issue`

Acceptance criteria:

- Contributors can see the expected shape of a signal before adding instrumentation.
- The examples explain which product decision each event supports.
- No production code changes are included.

### Starter Studio Copy And Empty States

Suggested issue: `fix(web): clarify starter studio empty states and helper copy`

State: `done` for the core starter workflow. Reopen only as a narrow visual QA issue if screenshots reveal confusing empty states after the candidate finder lands.

- Improve `/studio/starter` copy for empty search, no starter picks, picks without tags, and archive confirmation language.
- Preserve the current curation workflow and API behavior.
- Keep the tone editorial and concise.

Suggested labels: `feature`, `area:web`, `area:ui`, `area:recommendations`, `help wanted`

Acceptance criteria:

- The curator understands what action to take when there are no picks, no search query, or no tags.
- Starter copy does not sound like a generic admin dashboard.
- Desktop and narrow viewport screenshots are included.

## Maintainer-Led Product Work

These are important, but they need product direction before public contributors should implement them.

### Review Composer V2

Suggested issue: `feat(web): redesign review composer as a two-step flow`

- Step 1: pick track.
- Step 2: write the review.
- Add a live review card preview if it improves confidence.
- Improve post-publish feedback.

Suggested labels: `feature`, `area:web`, `area:ui`, `needs design review`

Acceptance criteria:

- The composer feels clearer than the current dialog.
- Existing review creation behavior still works.
- The PR includes screenshots or a short recording.

### Explore Surface

Suggested issue: `feat(web): shape Explore around trending and discussed music`

- Define the job of Explore separately from search.
- Start with lightweight groupings:
  - most discussed
  - top rated this week
  - recently active tracks
- Avoid adding heavy recommendation machinery in this pass.

Suggested labels: `feature`, `area:web`, `area:recommendations`, `needs maintainer decision`

Acceptance criteria:

- Explore has a clear first version.
- Data queries stay understandable and measurable.

### Kocteau-First Search V1

Suggested issue: `feat(search): add Kocteau-first unified search`

State: `partial done`. Track search now goes through a Kocteau-first API that merges local entities, starter picks, Deezer artist matches, and Deezer track fallback before ranking results. The current implementation fixes trend-biased false positives such as a song titled like an artist before the intended artist.

- Done in V1:
  - `/api/search` returns track results from local entities, starter picks, Deezer artist-top tracks, and Deezer track fallback.
  - Exact artist intent outranks unrelated title-only matches.
  - Local Kocteau results and starter picks receive source labels in the shared result UI.
  - Deezer rank is only a tie-breaker after Kocteau and intent signals.
  - Deezer failures can still return Kocteau fallback results when local data exists.
- Still needed for V2:
  - Return profiles, artists, albums, and category/tag matches.
  - Group results into `Best match`, `Artists`, `Tracks`, `Albums`, `Users`, and eventually `Categories`.
  - Activate the existing disabled tabs only when they return real data.
  - Add category search through Kocteau tags, such as genres, moods, scenes, eras, and formats.

Suggested labels: `feature`, `area:web`, `area:search`, `area:recommendations`

Acceptance criteria:

- Searching `The Cure` prioritizes tracks by the artist before unrelated title-only matches.
- Search still supports public browsing without forcing auth.
- Review creation and Starter Studio keep using raw Deezer search where curator/source fidelity matters.
- Local Kocteau results and Deezer fallback are clearly typed and can share one UI surface.
- The ranking rules are covered by tests so contributors can extend them safely.

### Track Page Recommendations V0

Suggested issue: `feat(web): add more-to-hear recommendations on track pages`

State: `done`. This was implemented as a first visible recommendation layer on track pages.

- Add a `More to hear` module on `/track/[id]` and `/track/deezer/[providerId]`.
- Start with readable sources before heavier recommendation logic:
  - local Kocteau entity tags when available
  - starter picks with overlapping tags
  - Deezer artist, album, or related-track context when Kocteau has sparse data
  - editorial starter fallback when there is no local match yet
- Show a short reason for each recommendation, such as `same mood`, `near this artist`, `curated starter`, or `deeper path`.
- Reuse the Starter Studio candidate-finder idea for public discovery: external metadata can propose candidates, but Kocteau filters, labels, and explains them before the listener sees them.
- Keep the module honest when data is sparse. Do not pretend to know the listener's taste before the user has reviewed, saved, followed, or set preferences.
- Reuse the product principle from Starter Studio: `Deezer proposes -> Kocteau filters -> listener or curator decides`.

Suggested labels: `feature`, `area:web`, `area:recommendations`, `needs design review`, `needs maintainer decision`

Acceptance criteria:

- A visitor opening a Deezer-backed track page can see related music without signing in.
- Recommendations include track identity, cover, artist, and a concise reason.
- The module does not block the track page render if external data is slow.
- Sparse track pages still show useful editorial fallback instead of an empty or misleading module.
- The implementation avoids heavy ML, embeddings, fake reviews, or fake engagement.

### Listener Candidate Finder V0

Suggested issue: `feat(web): add curated similar-track finder`

State: `needs design`. This is the user-facing counterpart to Starter Studio's candidate finder. Instead of asking a visitor to trust a black-box recommendation, Kocteau should let them start from a track, artist, review, or taste signal and browse curated candidates with clear reasons.

Core principle:

```text
External catalog proposes -> Kocteau filters -> listener chooses what to open, save, or review
```

Candidate seeds:

- current track page, such as `Find more like this`
- a reviewed track in the feed or on `/review/[id]`
- a user's own reviewed or saved tracks when signed in
- explicit taste tags from onboarding or editable preferences
- a typed query from Explore when the user wants to steer the search

Candidate filters:

- prefer Kocteau-known tracks, starter picks, and reviewed entities before external-only items
- use Deezer related artists, artist top tracks, album context, and search fallback only as candidate sources
- demote obvious chart-first matches when the seed asks for discovery
- allow famous artists through deep-cut, contrast, or influence paths instead of excluding them completely
- dedupe tracks already reviewed, saved, shown in the same session, or active in starter picks when the context would make repeats feel stale

Candidate UI:

- show cover, title, artist, and one concise reason
- include a source label such as `same scene`, `shared mood`, `deep cut`, `near this artist`, `curated starter`, or `from your taste`
- offer clear actions: open track, review, save, or pass
- keep signed-out visitors able to browse; require auth only when saving, reviewing, or using private taste history

Suggested labels: `feature`, `area:web`, `area:recommendations`, `area:search`, `needs design review`, `needs maintainer decision`

Acceptance criteria:

- A visitor can open a track page and see a way to find related music without first setting preferences.
- A signed-in user can seed candidates from their own reviews, saved tracks, or taste tags when those signals exist.
- Each candidate has an explainable reason and does not look like a raw Deezer chart result.
- External API failure does not break the page; the UI falls back to local Kocteau picks or a calm empty state.
- The first version stays in the existing Next.js, Supabase, and Deezer stack; no embeddings, Rust worker, graph engine, or heavy ML.
- Any analytics added for candidate open/pass/save follows the signal contract and avoids private metadata.

### Track Page Depth

Suggested issue: `feat(web): make track pages stronger discovery destinations`

- Add better review hierarchy.
- Consider distribution, top reviews, recent reviews, and community stats.
- Keep Deezer as the current canonical external source.

Suggested labels: `feature`, `area:web`, `needs design review`

Acceptance criteria:

- Track pages answer why a user should keep reading.
- The page remains fast and readable.

### Review Route Interaction V0

Suggested issue: `feat(web): make review detail pages easier to open and reply to`

- Make review cards navigate to `/review/[id]` from the main readable surface.
- Keep nested controls isolated so like, bookmark, comment, menu, and profile links do not trigger review navigation accidentally.
- Add a compact reply composer on `/review/[id]` below the review:
  - viewer avatar
  - placeholder such as `Reply to @username...`
  - future-safe affordances for media, GIF, or expanded composer if those features are not active yet
- Add a mobile social discovery module near review pages, such as a horizontal `Writers to notice` carousel or listeners who recently reviewed related music.
- Keep the first version focused on interaction clarity rather than adding new social mechanics.

Suggested labels: `feature`, `area:web`, `area:ui`, `needs design review`

Acceptance criteria:

- Review cards are clearly clickable without making action buttons unreliable.
- `/review/[id]` has a visible path to reply or comment.
- The reply entry point works on mobile and desktop.
- Any unavailable media/GIF actions are either omitted or clearly non-interactive; no fake composer features.
- The page remains centered on the review and track, not a generic social feed.

### Editable Taste Preferences

Suggested issue: `feat(web): let users edit taste preferences after onboarding`

- Add a clear path from profile/settings or taste onboarding to update initial taste signals.
- Reuse the existing taste tag model before introducing new preference types.
- Show current selected tags and allow adding/removing genres, moods, scenes, styles, eras, or formats as the product supports them.
- Explain that these signals shape For You, starter picks, and future recommendation surfaces.
- Keep auth and onboarding routing unchanged unless the implementation explicitly scopes those changes.

Suggested labels: `feature`, `area:web`, `area:recommendations`, `needs design review`, `needs maintainer decision`

Acceptance criteria:

- A signed-in user can find and update their taste signals after onboarding.
- Existing onboarding users are not forced through setup again.
- Recommendation code can read the updated preferences through the existing user preference path.
- Empty or sparse preference states have calm copy and do not block browsing.

### Mobile Toast And Feedback Placement

Suggested issue: `fix(web): polish mobile toast placement above bottom navigation`

- Revisit global toast placement on mobile.
- Keep action toasts centered horizontally and close enough to the bottom bar to feel attached, but not overlapping it.
- Reduce visual noise from borders while preserving success, warning, and destructive tone.
- Verify on narrow mobile viewport and desktop.

Suggested labels: `fix`, `area:web`, `area:ui`, `good first issue`

Acceptance criteria:

- Toasts no longer look offset from the mobile content area.
- Toasts do not cover the bottom navigation or review action.
- Existing desktop bottom-right behavior remains intact.
- Screenshots are included for mobile and desktop.

### Desktop Scroll And Wide Layout Ergonomics

Suggested issue: `fix(web): make desktop feed scrolling work outside the main column`

State: `ready`. Current desktop layouts can feel stuck when the pointer is over the secondary rail or empty layout space because the document itself is locked and only the main column scrolls.

- Route wheel/scroll behavior so desktop users can keep moving the main content even when their pointer is over the secondary rail or wide empty space.
- Preserve the sidebar and rail layout stability.
- Do not make the rail compete with the feed; it should remain an editorial companion.
- Use extra wide-screen space carefully for contextual discovery, not dashboard density.

Suggested labels: `fix`, `area:web`, `area:ui`, `help wanted`

Acceptance criteria:

- On desktop, scrolling over the main column, secondary rail, and neutral page space moves the expected reading surface.
- Mobile scroll behavior is unchanged.
- The fix does not introduce layout shift, nested-scroll traps, or broken keyboard focus.
- Desktop and narrow viewport smoke checks are included.

### Deezer Search Resilience

Suggested issue: `fix(web): harden Deezer search fallbacks and error copy`

State: `ready`. Deezer-backed search can work most of the time and still feel broken to a first-time visitor if one request returns `Deezer request failed`.

- Add a small retry or retry-after strategy for transient Deezer failures.
- Keep stale previous results visible while a new query is updating when possible.
- Replace raw failure copy with calm product copy and a retry action.
- Prefer local Kocteau results when Deezer is slow or unavailable.
- Log enough safe context for maintainers to tell whether failures are external API errors, validation errors, or Supabase enrichment issues.

Suggested labels: `fix`, `area:web`, `area:search`, `area:recommendations`

Acceptance criteria:

- A transient external failure does not make the whole search experience feel dead.
- Users can retry without closing the composer or leaving search.
- Existing review creation still works when Deezer returns results.
- No sensitive request metadata is stored.

### Compact Feed View

Suggested issue: `feat(web): explore a compact feed view`

State: `needs design`. Some users may want to scan more reviews per viewport, but the default should remain editorial and review-led.

- Add a design-only proposal for a compact review card variant or feed density toggle.
- Preserve cover, track identity, reviewer, rating, and the written take.
- Avoid turning reviews into a table, dashboard, or generic activity stream.
- Consider applying compact mode only to search, explore, or secondary feed modes before making it a global preference.

Suggested labels: `feature`, `area:web`, `area:ui`, `needs design review`

Acceptance criteria:

- The proposal explains where compact mode appears and how users opt into it.
- The default feed remains readable and editorial.
- Mobile and desktop density are evaluated separately.

### Notifications and Activity

Suggested issue: `feat(web): improve notification grouping and activity hierarchy`

- Decide which events should be visible.
- Group related notifications where it reduces noise.
- Avoid adding email/push notifications until the core inbox is healthy.

Suggested labels: `feature`, `area:web`, `needs maintainer decision`

Acceptance criteria:

- Notifications feel more meaningful and less noisy.
- Existing notification APIs remain compatible unless intentionally changed.

### Unified Auth Entry Point

Suggested issue: `feat(web): unify email auth into one entry point`

- Decide whether `/login` should become the primary email auth surface and `/signup` should redirect or render the same flow.
- Keep the OTP-first behavior and Supabase email confirmation intact.
- Preserve existing `next` redirects, onboarding routing, and signup confirmation handling.

Suggested labels: `feature`, `area:web`, `area:auth`, `needs maintainer decision`

Acceptance criteria:

- New and returning users can continue with email from the same UI.
- `/login` and `/signup` do not present conflicting copy or behavior.
- Existing OTP, signup confirmation, and onboarding tests still cover both new and returning users.

## Sensitive System Work

These can be public issues, but they should require maintainer review and careful acceptance criteria.

### Recommendation Health

Suggested issue: `feat(web): add lightweight recommendation health checks for maintainers`

State: `done` for V1. Future work should use real traffic snapshots before changing recommendation ranking.

- Track fallback rate, action rate, read-depth rate, and starter-pick usage.
- Prefer simple SQL/admin notes before building a dashboard.
- Use the signal contract in `docs/discovery-curation.md` before adding new events.

Implementation path:

1. Add read-only aggregate SQL checks for maintainers.
2. Add a curator-only Studio health page backed by an aggregate Supabase RPC.
3. Review a real 7-14 day snapshot after public traffic exists.
4. Tune `get_recommended_review_ids` only after capturing a before snapshot.

Suggested labels: `feature`, `area:recommendations`, `area:analytics`, `needs maintainer decision`

Acceptance criteria:

- Maintainers can tell if For You is healthy after public traffic.
- Metrics are grouped by safe fields such as event type, source, reason label, and day.
- No private user data is exposed.

### Analytics Signal Contract Implementation

Suggested issue: `feat(web): implement the discovery analytics signal contract`

State: `done` for the initial contract and validation layer. Additional instrumentation should be added only when it answers a specific product question.

- Add the first instrumentation pass for the events defined in `docs/discovery-curation.md`.
- Start with For You load, recommendation fallback, review impression/open, entity open, and starter pick actions.
- Keep analytics best-effort so product interactions never fail because an event fails.
- Avoid sensitive metadata such as email, IP address, user agent, and raw review text.

Suggested labels: `feature`, `area:web`, `area:analytics`, `area:recommendations`, `needs maintainer decision`

Acceptance criteria:

- Events follow the documented naming and metadata contract.
- Analytics validation rejects invalid event names and oversized metadata.
- The implementation includes focused tests for payload validation where practical.
- Manual verification confirms events are written after feed and starter interactions.

### Starter Picks Curation

Suggested issue: `feat(web): improve starter pick curation workflow`

State: `done` for the current Studio V2 foundation. Keep future work narrow: candidate discovery, visual QA, or measured rail diversity.

- Improve `/studio/starter` ergonomics for the official curator.
- Make tag assignment and archive behavior easier to trust.
- Add lightweight visibility into tag coverage, untagged picks, and starter pick conversion once analytics events exist.
- Do not add a broad admin dashboard in this issue.
- Treat `era` and `format` as first-class curator signals, not hidden onboarding leftovers.

Suggested labels: `feature`, `area:web`, `area:recommendations`, `needs maintainer decision`

Acceptance criteria:

- Curators can seed and maintain starter picks faster.
- Starter tags remain compatible with recommendation RPCs.
- The UI remains quiet, editorial, and focused on the starter layer.
- Curators can see tags with low or zero starter coverage while assigning signals.

### Anti-Mainstream Candidate Finder V0

Suggested issue: `feat(web): add anti-mainstream Deezer candidate finder`

State: `done` for V0. Keep follow-up work focused on queue persistence and measured curation quality.

- Add a curator-only `/api/starter/candidates` route.
- Use Deezer related artists and artist top tracks as candidate sources.
- Prefer emerging or undercovered artists for related-seed mode.
- Allow famous artists only through a deep-cut mode where the candidate track is less obvious.
- Exclude tracks already present in active starter picks.
- Return an explainable reason and anti-mainstream tier with every candidate.
- In `/studio/starter`, show candidates near the existing Deezer search flow.
- Let the curator select a candidate into the existing starter draft or skip it locally.
- Do not write candidates to the database in V0.
- Do not import charts or auto-create starter picks.

Suggested labels: `feature`, `area:web`, `area:recommendations`, `needs maintainer decision`

Acceptance criteria:

- The finder works with a seed like `Cocteau Twins` or `Michael Jackson`.
- Related mode avoids obvious chart-first recommendations.
- Deep-cut mode treats known artists as valid only when the track is framed as a less obvious pick.
- Candidate cards include track identity, cover, reason, tier, and Select/Skip actions.
- The existing starter pick save flow remains the only database write.
- Focused tests cover scoring, deduplication, existing starter exclusions, and deep-cut labeling.

### Starter Rail Diversity Follow-Up

Suggested issue: `feat(web): evaluate contextual starter rail diversity`

- Review the contextual starter rail across home, profile, track, saved, and Studio surfaces after `get_starter_tracks_for_surface()` is live.
- Compare SQL editor checks, production logs, and screenshots from desktop/narrow viewports.
- Tune only the surface/context weighting, skeleton timing, or copy if the rail still feels repetitive.
- Avoid adding heavy recommendation logic or fake activity.

Suggested labels: `feature`, `area:web`, `area:recommendations`, `needs maintainer decision`

Acceptance criteria:

- Maintainers can tell whether the rail varies by surface without harming editorial quality.
- Any ranking tweak has a before/after note with the affected surfaces.
- The rail remains client-loaded and does not block the main layout render.

### Editorial Candidate Queue

Suggested issue: `feat(web): design editorial candidate queue for starter picks`

State: `done` for V1 persistence. Future work should focus on measured curation quality and candidate generation sources, not automatic promotion.

- Add a maintainer-reviewed design for `editorial_candidates` before implementation.
- Candidate reasons may include review velocity, bookmark growth, read depth, trusted-user activity, emerging tags, and undercovered taste areas.
- The first version should support saving to queue, selecting into the starter draft, approving after starter save, and dismissing.
- Keep curator approval required before a candidate becomes official starter content.

Suggested labels: `feature`, `area:web`, `area:supabase`, `area:recommendations`, `needs design review`, `needs maintainer decision`

Acceptance criteria:

- The proposed schema avoids private user data and keeps RLS explicit.
- The product flow is `signals -> candidate -> curator decision -> starter pick or dismissal`.
- The implementation plan explains how candidates are generated without heavy ML.
- Existing starter pick RPCs and curator access remain compatible.

### Recommendation Ranking Tuning

Suggested issue: `feat(web): tune For You ranking with measured signals`

State: `next maintainer phase`. Do not change the recommendation RPC until a baseline snapshot is captured.

- Tune `get_recommended_review_ids` only after analytics events can report feed health.
- Consider written-review quality, author diversity, entity diversity, exploration, and editorial fallback.
- Keep the product democratic: users can review known music, but ranking should reward reviews that add context rather than recognition alone.
- Keep the scoring inspectable and reversible.

Implementation path:

1. Run `supabase/scripts/maintenance/feed-tuning-baseline-snapshot.sql` in the Supabase SQL editor and save aggregate results in the PR notes.
2. Identify one or two ranking hypotheses, such as written-review lift, author/entity diversity, or editorial fallback quality.
3. Change only `get_recommended_review_ids()` and any directly related indexes/types in one focused PR.
4. Re-run the same snapshot 7-14 days after deployment before tuning again.

Suggested labels: `feature`, `area:supabase`, `area:recommendations`, `area:analytics`, `needs maintainer decision`

Acceptance criteria:

- A before/after health snapshot is captured with safe aggregate metrics.
- The SQL remains readable and has indexes for the new access pattern if needed.
- Recommendation reason labels still map cleanly to the web UI.
- Sparse-data users still receive useful editorial fallback.

Technical audit notes:

- `revalidateTag(tag, "max")` is intentional for the installed Next.js 16 cache API. Do not remove the second argument as a cleanup; the single-argument form is deprecated.
- `review_read_50` and `review_read_90` are now emitted from authenticated For You feed review cards when the user scrolls through 50% and 90% of a card.
- The `entity_taste` reason precedence may still need tuning, but it should be changed only after read-depth and feed health baselines exist.

### SEO Indexability Health

Suggested issue: `chore(web): add SEO indexability health checks`

State: `needs maintainer decision`. Search Console may report `Discovered - currently not indexed` for new or low-volume pages even when sitemap, robots, metadata, and structured data are valid.

- Add a maintainer SEO checklist for Search Console statuses such as page with redirect, discovered but not indexed, crawled but not indexed, and excluded by `noindex`.
- Add a small local smoke check that fetches production `robots.txt`, `sitemap.xml`, and representative public URLs.
- Verify sitemap URLs return `200`, have canonical metadata, are not `noindex`, and are not blocked by `robots.txt`.
- Keep `/track/deezer/*`, auth, onboarding, notifications, saved, and API routes out of indexable sitemap targets.
- Make sitemap `lastmod` values more truthful for static routes instead of using the generation time for every request.
- Decide an indexing policy for thin pages: rating-only reviews, empty track pages, and profiles with no reviews.
- Connect this work with Track Page Depth so indexable pages have enough public music context.
- Document the manual Search Console workflow: resubmit sitemap, inspect representative URLs, run live test, and request indexing when the live URL is valid.

Suggested labels: `chore`, `area:web`, `area:seo`, `needs maintainer decision`

Acceptance criteria:

- Maintainers can classify Search Console issues without guessing.
- The sitemap contains only canonical, crawlable, public URLs that Kocteau wants indexed.
- Representative review, track, profile, and static pages pass a local SEO smoke check.
- Redirect-only URLs are understood as non-canonical and are not treated as failed indexation.
- Search Console follow-up steps are documented in `docs/operations.md` or a linked maintainer note.

### Trust and Safety V1

Suggested issue: `feat(web): add basic report flow for reviews and profiles`

- Add a lightweight report entry point.
- Store reports in a minimal table or agreed moderation path.
- Avoid a large moderation dashboard in v1.

Suggested labels: `feature`, `area:web`, `area:supabase`, `needs maintainer decision`

Acceptance criteria:

- Users have a clear path to flag problematic content.
- Maintainers can review reports without exposing private data.

## Automation Hardening Later

Do this after the public flow has real usage.

- Make `Verify` required for `main`.
- Require CODEOWNERS review for sensitive paths.
- Decide whether to keep all third-party actions allowed or restrict to a curated list.
- Pin GitHub Actions to commit SHAs only after the workflow set is stable.
- Decide whether Discussions should be enabled and moderated.
- Consider issue forms for RFCs only if product discussion becomes noisy.

## Future RFC Backlog

These ideas are not ready for implementation issues yet. They are useful prompts for contributors who want to help with product research, design notes, or RFC drafts.

### Taste Graph

Suggested RFC: `rfc: define a manual taste graph for entity relationships`

- Explore a small `entity_relationships` model before embeddings.
- Relationship examples: similar texture, influence, same scene, contrast pick, gateway recommendation.
- Focus on explainability for track pages, Explore, and future For You tuning.

Suggested labels: `rfc`, `area:recommendations`, `area:product`, `needs maintainer decision`

### Taste Atlas

Suggested RFC: `rfc: design Kocteau Taste Atlas`

- Explore an interactive discovery surface where listeners can start from a track, artist, tag, or mood and move through nearby recommendations.
- Treat the first version as an editorial and explainable graph, not as a black-box algorithm.
- Use Kocteau signals first: starter tags, entity tags, reviews, saves, follows, curator relationships, and underexposed tracks.
- Let the surface ask for simple taste feedback such as closer, stranger, softer, darker, deeper cut, or skip.
- Support known artists through hidden-gem paths instead of excluding them. A popular artist can still lead to a less obvious track.
- Keep the first implementation web-first with TypeScript, Supabase, and existing recommendation data. Do not add a separate runtime, Rust worker, vector system, or heavy graph engine until usage proves the need.
- Avoid fake activity, fake affinity, or pretending Kocteau has learned more than the current data supports.

Suggested labels: `rfc`, `area:recommendations`, `area:product`, `area:web`, `needs maintainer decision`

### Cover Color Signals

Suggested RFC: `rfc: model cover color as a lightweight discovery signal`

- Define when cover colors are analyzed: only after a track or album enters Kocteau through review, starter pick, or curator candidate review.
- Compare automatic palette extraction with curator overrides.
- Start with broad visual categories such as red, black, white, pastel, dark, saturated, muted, and high-contrast.
- Decide whether color belongs on entities, starter metadata, or a separate visual-signal table.
- Keep color as a discovery hint, not a substitute for taste tags, reviews, or editorial judgment.

Suggested labels: `rfc`, `area:recommendations`, `area:product`, `area:supabase`, `needs maintainer decision`

### Native Artist Discovery

Suggested RFC: `rfc: explore native artist profiles without hosting audio`

- Research whether Kocteau should let emerging artists create lightweight profiles with external music links.
- Consider Bandcamp, SoundCloud, YouTube, Audiomack, and official site links.
- Avoid audio hosting, rights management, or playback commitments in the first RFC.

Suggested labels: `rfc`, `area:product`, `area:research`, `needs maintainer decision`

### Artist-As-Curator

Suggested RFC: `rfc: explore artist-as-curator flows`

- Define how artists could review or recommend music that influenced them.
- Keep the value centered on taste, context, and discovery rather than promotion.
- Include risks around reciprocal praise and low-trust activity.

Suggested labels: `rfc`, `area:product`, `area:community`, `needs maintainer decision`

### Review Premiere

Suggested RFC: `rfc: explore review premieres for independent releases`

- Explore whether artists can prepare context before a release while curators write early reviews from external private links.
- Keep the first version operationally light and avoid storing audio.
- Identify trust, moderation, and disclosure requirements before implementation.

Suggested labels: `rfc`, `area:product`, `area:community`, `needs maintainer decision`

### Embeddings And Vector Search

Suggested RFC: `rfc: evaluate embeddings and pgvector for discovery`

- Define which objects would be embedded and why.
- Compare manual taste graph, tag matching, and vector similarity.
- Do not implement embeddings until Kocteau has enough real reviews and interactions to evaluate quality.

Suggested labels: `rfc`, `area:recommendations`, `area:supabase`, `needs maintainer decision`

## Deferred

- Full mobile production work.
- Native app release automation.
- Direct messages.
- Heavy ML recommendation infrastructure.
- Albums and artists as first-class review targets.
- Creator programs or public curator applications.
- Auto-merge for release PRs.

## Tomorrow's Maintainer Checklist

1. Review PR #4 generated by Release Please.
2. Merge PR #4 if the changelog and version bump look right.
3. Confirm the `v0.2.0` GitHub Release appears.
4. Open the first 6-10 public issues from the "Ready for First Contributors" section.
5. Add `good first issue` only to tasks with narrow scope and low risk.
6. Keep sensitive issues labeled with `needs maintainer decision`.
