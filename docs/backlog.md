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

## Near-Term Priorities

These are the next useful moves after enabling public contribution.

| Priority | Task | State | Suggested labels |
| --- | --- | --- | --- |
| P0 | Review and merge the Release Please PR if the generated changelog is accurate. | ready | `chore`, `area:ci` |
| P0 | Confirm the `v0.2.0` tag and GitHub Release are created after the release PR merges. | ready | `chore`, `area:ci` |
| P0 | Pin the public repository description, topics, website URL, and social preview image in GitHub settings. | ready | `docs`, `area:docs` |
| P1 | Open 6-10 curated GitHub issues from this backlog before broader public sharing. | ready | `docs`, `help wanted` |
| P1 | Add a short "first contribution path" section to the README with links to good first issues. | ready | `docs`, `area:docs`, `good first issue` |
| P1 | Open discovery and curation issues from `docs/discovery-curation.md` with clear owner lanes. | ready | `docs`, `area:recommendations`, `needs maintainer decision` |
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

### Track Page Depth

Suggested issue: `feat(web): make track pages stronger discovery destinations`

- Add better review hierarchy.
- Consider distribution, top reviews, recent reviews, and community stats.
- Keep Deezer as the current canonical external source.

Suggested labels: `feature`, `area:web`, `needs design review`

Acceptance criteria:

- Track pages answer why a user should keep reading.
- The page remains fast and readable.

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

- Improve `/studio/starter` ergonomics for the official curator.
- Make tag assignment and archive behavior easier to trust.
- Add lightweight visibility into tag coverage, untagged picks, and starter pick conversion once analytics events exist.
- Do not add a broad admin dashboard in this issue.

Suggested labels: `feature`, `area:web`, `area:recommendations`, `needs maintainer decision`

Acceptance criteria:

- Curators can seed and maintain starter picks faster.
- Starter tags remain compatible with recommendation RPCs.
- The UI remains quiet, editorial, and focused on the starter layer.

### Editorial Candidate Queue

Suggested issue: `feat(web): design editorial candidate queue for starter picks`

- Add a maintainer-reviewed design for `editorial_candidates` before implementation.
- Candidate reasons may include review velocity, bookmark growth, read depth, trusted-user activity, emerging tags, and undercovered taste areas.
- The first version should support approve to starter, dismiss, and later states.
- Keep curator approval required before a candidate becomes official starter content.

Suggested labels: `feature`, `area:web`, `area:supabase`, `area:recommendations`, `needs design review`, `needs maintainer decision`

Acceptance criteria:

- The proposed schema avoids private user data and keeps RLS explicit.
- The product flow is `signals -> candidate -> curator decision -> starter pick or dismissal`.
- The implementation plan explains how candidates are generated without heavy ML.
- Existing starter pick RPCs and curator access remain compatible.

### Recommendation Ranking Tuning

Suggested issue: `feat(web): tune For You ranking with measured signals`

- Tune `get_recommended_review_ids` only after analytics events can report feed health.
- Consider written-review quality, author diversity, entity diversity, exploration, and editorial fallback.
- Keep the scoring inspectable and reversible.

Suggested labels: `feature`, `area:supabase`, `area:recommendations`, `area:analytics`, `needs maintainer decision`

Acceptance criteria:

- A before/after health snapshot is captured with safe aggregate metrics.
- The SQL remains readable and has indexes for the new access pattern if needed.
- Recommendation reason labels still map cleanly to the web UI.
- Sparse-data users still receive useful editorial fallback.

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
