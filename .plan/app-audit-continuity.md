# App Audit And Working Context

Baseline: `b014cb3`, based on integrated `origin/main` at `83fa943`.
Task: `fix/app-audit-continuity`; commits `a3383a3` and `1915e23` are published in
[PR #212](https://github.com/francozeta/kocteau/pull/212), pending integration.
Verified evidence belongs in [CURRENT.md](../CURRENT.md). Studio coordination
remains in [issue #206](https://github.com/francozeta/kocteau/issues/206).

## Reproduced Defects

| Trigger | Failure | Correction |
| --- | --- | --- |
| A post-auth `next` value starts with slash/backslash or contains control characters | The old prefix-only check accepts a destination that browsers resolve outside the app | Reject ambiguous characters and destinations whose normalized origin/path is unsafe |
| A guest resumes a review after login | The draft targets `/`; the signed-in landing redirect discards `compose` and `draft` | Return directly to `/feed?compose=1&draft=review` |
| Browser storage is blocked, full, or cannot be read/cleared | Saving or restoring throws; cleanup can interrupt the successful publish branch | Return the existing failed-save/empty-read states and allow cleanup failure |
| The open composer crosses the mobile breakpoint | Switching between dialog and drawer remounts the form and clears selection, rating, and text | Keep session state above the responsive surface for create and edit |
| A listener presses the documented `N` shortcut | No composer opens; the implementation and visible hint use `C` | Use `N` in the handler and visible hints |
| The composer is in its second step | The visually hidden search step remains reachable to keyboard and assistive technology | Make inactive steps inert and autofocus only active search |
| Enter activates the fourth star | The pointer-only click calculation selects 3.5 stars | Keyboard activation selects whole stars; arrows retain half-star changes and move focus |
| A `compose=1` return URL reaches the app shell | The deferred composer never mounts; an explicit null selection also prevents reading URL state | Mount on URL intent and allow URL/draft initialization when no event selection is present |
| A keyboard user returns from composition to search | Removing the back button leaves focus on the dialog container | Focus the search input when its step becomes active |

The targeted suite first failed five cases on the baseline and then passed all
eight after correction. These are local regression results, not an end-to-end
OTP or deployed-flow verification.

Browser checks at 1280px and 390px now retain the selected track, rating, title,
and note across responsive changes. `N` opens the composer; typing it into a
field does not restart it. A URL selection opens composition without a launcher
event. Enter, arrows, Home/End, a single rating Tab stop, Escape, URL cleanup,
mobile modal focus, and overflow were checked. Inspected flows log no errors.
The guest draft is read before opening its interactive session, avoiding a blank
session that is immediately replaced by restored state.

An isolated session regression also checked retained pending state across consumer
remounts, delivered errors/results, fresh state after reopening, rejection of
updates from an older session, and replacement of the initial review. This does
not verify a real authenticated publication or edit against the database.

Eleven local production HTTP cases passed: public pages, signed-out feed/Studio,
denied private APIs, rejected external callback destinations, and preservation
of the valid draft return path. The login → signup link also retains that path.

## Code Cleanup

Creation and editing share `review-composer-session.tsx` for scoped state and
`review-composer-surface.tsx` for layout, close controls, and modal focus.
Their entry dialogs retain initial selection/URL handling. The form retains
search and submission behavior. Existing deferred loading remains in place;
the composer uses a calm structural loading state.

Import resolution and full-repository name/path searches confirmed four unused
files: `command-icon.tsx`, `header-user-menu.tsx`, `editorial-discovery-rail.tsx`,
and its unused `secondary-rail-context.tsx`. They were removed and flow READMEs
corrected. The review/shell cleanup commit removes 269 net lines across 16 files,
including the shared replacements and documentation. It does not rewrite ranking.

## Durable Context

Publication verification exposed deployment packaging that removed documentation
link targets. The follow-up preserves the small shared indexes/plan Markdown and
includes external link targets in build-cache inputs. It also generates docs for
analysis, prevents development watchers reopening after shutdown, gives headings
unique IDs, retains table alignment, and serves relative images from raw asset URLs.
The remaining flow index corrections describe current behavior rather than changing ranking.

[Working context](../docs/working-context.md) now defines compact handoff fields:
outcome, baseline, reproduced finding, decision, verification scope, limits,
and next action. [AGENTS.md](../AGENTS.md) routes context progressively through
root contracts, owning flow, and relevant skills rather than preloading everything.
Keep one owner per fact; maintain source links instead of parallel summaries.

The [filesystem-agent case study](https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools)
reported better results after simplifying retrieval tools, using a legible
semantic layer. Its comparison used five queries. That supports a local trial
of simpler context access, not a predicted speed or success improvement here.
Preserve authorization, publication, RLS, and human curation boundaries.

## Next Workflow Improvements

1. Exercise guest draft → OTP → onboarding → restored composer → publish on a
   disposable local stack, then confirm the matching deployment. The regressions
   above should become acceptance checks for that flow.
2. Reconcile the existing unpublished migration before verifying Studio against
   cloud. Track web baseline, schema baseline, role, and environment together;
   a build cannot prove that those match.
3. Evaluate workflow changes using representative tasks: locating a flow,
   reproducing a defect, and recovering the handoff on another checkout. Record
   correctness, missing context, repeated reads, and elapsed time. Add retrieval
   tools or new providers only when those tasks expose a measurable gap.

Do not treat this audit as a full application security review. Authenticated
interactions, SQL/RLS assertions, and real curator/cron behavior need their own
environment verification.
