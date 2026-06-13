# Supabase Advisor Hardening

Kocteau keeps Supabase changes staged so production can be checked between
steps. These scripts are maintenance scripts first; promote them to a versioned
migration only after they are verified in Supabase Cloud.

## Advisor Snapshot

The June 2026 advisor export reported:

- 30 `SECURITY DEFINER` functions executable by `anon`
- 30 `SECURITY DEFINER` functions executable by `authenticated`
- 3 functions with mutable `search_path`
- 1 public `avatars` bucket listing policy
- 1 leaked-password protection warning

The most important fix is closing `anon` access to privileged RPCs. Some
`authenticated` access is intentional because Kocteau uses RPCs for reviews,
likes, bookmarks, follows, library, feed ranking, and Studio flows.

## Execution Order

1. Run `supabase/scripts/maintenance/advisor-hardening-00-diagnostics.sql`.
   This is read-only. Save the output if anything looks unexpected.

2. Run `supabase/scripts/maintenance/advisor-hardening-01-low-risk.sql`.
   This fixes helper function `search_path` settings and removes broad avatar
   bucket listing.

3. Run diagnostics again, then run Supabase Advisors again.
   The `function_search_path_mutable` and `public_bucket_allows_listing`
   warnings should disappear.

4. Run `supabase/scripts/maintenance/advisor-hardening-02-rpc-execute-grants.sql`.
   This revokes `anon` from advisor-reported `SECURITY DEFINER` functions and
   grants `authenticated` back only to RPCs Kocteau calls from authenticated
   routes or curator-gated Studio flows.

5. Run diagnostics and Supabase Advisors again.
   Remaining `authenticated_security_definer_function_executable` warnings may
   still appear for intentional authenticated RPCs. `anon` warnings should be
   materially reduced or gone.

## Smoke Test Checklist

After stage 1:

- Existing avatar images still load.
- Profile avatar upload still works.
- Supabase Advisors no longer reports broad avatar listing.

After stage 2:

- Login still works.
- Create a review.
- Like and unlike a review.
- Bookmark and unbookmark a review.
- Add and remove a track from Library.
- Add and delete a comment.
- Follow and unfollow a profile.
- Open For You feed.
- Open Starter Studio as curator.
- Open Recommendation Health as curator.

## Manual Dashboard Item

`auth_leaked_password_protection` is a Supabase Auth setting, not a SQL fix.
Kocteau is OTP-first, so this is not urgent unless password auth is enabled.
Supabase currently documents leaked password protection as available on Pro and
above.
