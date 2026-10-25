# Authenticated feed read bundle

Stage 2 begins from production main `93baae3`, after PR #221.
The target is less sequential Data API work for authenticated For You reads.

## Change

The authenticated-only `get_recommended_feed_bundle` SQL RPC calls the existing
bounded ranking RPC, hydrates cards, and reads the current caller's likes and
bookmarks in one statement. It accepts no viewer ID, uses SECURITY INVOKER and an
empty search path, preserves existing table policies, clamps requested pages to
1–30, retains lookahead and the caller's two recent reviews on the first page.
The server route and initial page use the same bundle. Other views retain their
existing read path. Private state is never put in a public cache.

An interaction fixture on a fresh local replay exposed a repository defect in
`get_viewer_review_collection_state`: its inner `review_id` resolved to the
interaction table, making the comparison self-referential. One interaction
could mark every requested card. A separate migration qualifies the outer ID;
the function keeps its signature, privileges and SECURITY DEFINER mode,
with an empty search path and caller-only predicates. Regression checks cover
selected and unrelated cards. A subsequent read-only cloud definition check found
production already uses correctly qualified joins for this function, although that
behavior was absent from the initial 35-version repository history. This migration
aligns fresh local semantics with cloud and hardens the search path; it does not
claim to newly fix production likes. Initial cloud inspection preceded delivery of
the new feed-bundle RPC; the completed migration checks are recorded below.

The type generator preserves nullable rating-only review titles and bodies.
The committed type update began as an additive patch because local generation
had unrelated differences from cloud. Linked regeneration after delivery matched
the committed snapshot, as recorded in the cloud delivery checks below.

## Verification

- Real disposable Supabase/PostgreSQL, pinned CLI 2.109.1.
- Seven SQL test files / 40 checks pass, including denied roles, user isolation,
  nullable content, bounded results and interaction correlation.
- Two real local ES256 sessions, three pages each. Complete API JSON matches
  the previous application after applying the same viewer-state SQL correction.
  Ranking, cursor, card fields and private/no-store behavior are preserved.
- First-page Data API requests: four to one; subsequent pages: three to one.
  One small loopback run measured 141 to 65 ms for the first user's first page.
  This is a behavior/count comparison, not production latency or user capacity.
- Chromium desktop 1440×1000 and mobile 390×844 rendered authenticated reviews,
  without uncaught JavaScript errors or horizontal overflow.
- Fresh reset replayed all 37 migrations; all 40 SQL checks passed again.
- Final stage: 180 web tests, lint, production build and docs/link checks pass.
  The committed fixture scripts also passed full parity and guest checks after reset.
  Hosted CI remains a delivery-PR gate.

## Reproduction

Use [the feed guide](../apps/web/components/feed/README.md) and its local-only
fixture and parity scripts. Both builds share the same local database.
Apply the corrected viewer-state migration to that database before comparison.
Cookies remain in ignored `.codex-private`; loopback timings are not deployment
configuration.

## Cloud delivery

On 2026-10-23 the pinned CLI authenticated, linked the intended project and
confirmed exactly the two reviewed migrations in its dry run. Both applied;
remote history now matches all 37 local versions. Linked type generation
matches the committed additive snapshot, including nullable review text.
Read-only verification under the authenticated role returned 11 bounded rows for
an existing author, with flags matching the shared viewer-state RPC. Guest and
administrative-role execution are denied; invoker RLS is retained.

Advisors reported 27 warnings and no finding for the new bundle. Linked lint for
the affected public schema passed. The existing global linked-lint caveat remains;
its broad command did not finish within the bounded verification run. Local SQL
tests and cloud role/read verification pass.
Review follow-up bounds the guest verifier and asserts private/no-store headers,
corrects existing fixture-file permissions, and preserves optional guest active
profiles. Local auth.uid() reads both the individual sub GUC and JSON claims;
all 40 SQL checks pass with the JSON claim setup used by the regression tests.
PR #222 has a published review follow-up and is synchronized with search recovery.
That earlier application rollout was held during search-incident observation;
its database delivery was complete. Current integration is recorded below. Cloud publication/OTP and production-authenticated browser
behavior remain separate verification limits.

Shared cooldown, distributed admission, durable jobs and 10,000-user mixed traffic
remain subsequent work; this change does not establish that capacity.


## Current integration — 25 Oct 2026

Issue #255 reconciles PR head `65903f3` with main `bdc419d` without rewriting
published history. The page retains #252's shared, independent editorial promise;
the public list retains #241's throwing cache callback, v2 cache namespace and
HTTP 503/private-no-store recovery. Normal For You reads use the bundle once.
Only a specifically missing bundle falls back to bounded Latest hydration.
Unexpected timeouts/permission errors stop after one attempted RPC; failed
compatibility hydration also propagates rather than becoming empty success.
No new cloud migration was needed; the 37 remote versions and current bundle
privileges were rechecked read-only.

Current-source verification passes 202 tests (12 new bundle boundary cases),
seven real local SQL files/40 checks, and complete API JSON parity over three
pages for two actual local sessions. Baseline is current main `bdc419d`, using
the same 37-version local database. Each first page uses four Data API requests
before and one after; subsequent pages use three before and one after.

The matched restart sequence keeps the shared database warm. Only its initial
pair is cold at the application-process level: 221 → 122 ms. The subsequent
warm sequence measured 30–37 ms before and 22–26 ms after over six pairs.
These small loopback observations include HTTP/JSON time, exclude the trace
stabilization wait, and are neither isolated SQL time nor production P95.
Earlier verifier timings included that artificial wait; use the corrected
measurement boundary for future comparisons.

Four authenticated HTTP fault scenarios confirm non-cacheable 503 recovery,
no unexpected fallback fanout, and explicit missing-function compatibility.
Four WebKit sessions (two viewers at two viewport sizes) preserve private flags,
view navigation and pagination; reversible local like/bookmark actions pass.
The ten primary-render scenarios also pass against the integrated page.

Production-authenticated observation, physical-device verification and capacity
remain unverified. CURRENT.md and GitHub own publication/deployment status.
