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
behavior is absent from the repository's 35-version migration history. This migration
aligns fresh local semantics with cloud and hardens the search path; it does not
claim to newly fix production likes. The new feed-bundle RPC is absent from cloud.

The type generator preserves nullable rating-only review titles and bodies.
The committed type update is additive; local generation has unrelated differences
from the cloud snapshot, so linked regeneration remains a delivery gate.

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
Application rollout is held during search-incident observation; its database
delivery is complete. Cloud publication/OTP and production-authenticated browser
behavior remain separate verification limits.

Shared cooldown, distributed admission, durable jobs and 10,000-user mixed traffic
remain subsequent work; this change does not establish that capacity.
