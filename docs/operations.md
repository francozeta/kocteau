# Kocteau Operations

[Docs index](./README.md) | [Local development](./setup/local-development.md) | [Supabase maintainer workflow](./maintainers/supabase-workflow.md) | [Environment and secrets](./security/environment.md) | [Discovery and curation](./discovery-curation.md) | [Release automation](./maintainers/release.md)

This file captures the production setup that lives outside the codebase.

## Supabase Auth

Kocteau is OTP-first.

Recommended settings:

- Keep email confirmation enabled.
- Use Supabase Auth for OTP generation and verification.
- Do not create a custom OTP table unless Supabase Auth becomes insufficient.
- Keep profile creation/onboarding separate from auth creation.

Current app behavior:

- `/login` and `/signup` both use `signInWithOtp`.
- New emails are allowed through `shouldCreateUser: true`.
- The app verifies codes as a normal email OTP first, then falls back to a signup confirmation OTP for newly-created users.
- After verification, users are routed through profile onboarding, taste onboarding, or `/`.

## Supabase Email Templates

Kocteau uses a code-only OTP email.

Template file:

- `apps/web/emails/supabase-otp-template.html`

Supabase dashboard location:

```text
Authentication -> Emails -> Magic Link or OTP
Authentication -> Emails -> Confirm Signup
```

Use:

```text
{{ .Token }}
```

Avoid:

```text
{{ .ConfirmationURL }}
{{ .TokenHash }}
```

Those URL variables reintroduce magic-link behavior and can confuse users because Kocteau expects the code to be entered in-app.

Existing users usually receive `Magic Link or OTP`. New emails can receive `Confirm Signup`, so both templates must use the same code-only body and a consistent subject such as `Your Kocteau code`.

## Resend SMTP

Supabase Auth sends emails through custom SMTP.

Typical Resend SMTP values:

```text
Host: smtp.resend.com
Port: 465 or 587
Username: resend
Password: Resend API key
Sender email: auth@kocteau.com
Sender name: Kocteau
```

The sender domain must be verified in Resend. Avoid using Vercel preview domains as email sender domains.

## Supabase Schema And Scripts

Fresh environments should be built from:

```text
supabase/config.toml
supabase/migrations
supabase/seeds
```

Current migration responsibilities:

- base schema, RLS, explicit grants, storage policies, and core RPCs
- recommendation v2 and inferred entity taste tags
- editorial starter picks and curator RPCs
- analytics events
- creator perks

Recommended production order for a fresh setup:

1. Review migrations against the target environment.
2. Apply migrations through the [Supabase maintainer workflow](./maintainers/supabase-workflow.md) or another approved deployment path.
3. Apply production-safe seed/configuration data only when intended.
4. Update Supabase Auth email templates.
5. Deploy the application.

Maintenance scripts live in:

```text
supabase/scripts/maintenance
```

Run destructive or optional maintenance scripts only after a backup and only when intentionally operating on that environment.

Editorial starter content is product configuration, not demo user data. Keep it out of destructive demo wipes unless you intentionally want to rebuild the curated starter catalog.

`cleanup-experimental-music-links.sql` is not part of a fresh setup. Run the maintenance copy only in environments where the old `entity_external_links`/ISRC experiment was already applied.

## Post-Deploy Checks

After deploying auth or recommendation changes:

1. Log out.
2. Request OTP on `/login` with an existing email.
3. Confirm the email contains only a 6-digit code.
4. Verify the code.
5. Request OTP on `/signup` with a new email.
6. Confirm the `Confirm Signup` email contains only a 6-digit code.
7. Verify the code.
8. Complete profile onboarding if needed.
9. Complete taste onboarding if needed.
10. Confirm `/` loads For You.
11. Like, bookmark, and open comments from For You.
12. Check Supabase for analytics events.

Useful analytics check:

```sql
select event_type, source, count(*)
from public.analytics_events
group by event_type, source
order by count(*) desc;
```

Before adding broad analytics instrumentation, update the signal contract in `docs/discovery-curation.md`. Events should stay product-specific and should not store email, IP address, user agent, or raw review text in metadata.

Useful recommendation health check:

```sql
select *
from public.get_recommended_review_ids(8, null, null, null);
```

Run that recommendation check as an authenticated user context when testing from the app; direct SQL editor calls may not have `auth.uid()`.

Useful Starter Layer health check:

```sql
select *
from public.get_starter_tracks(6);
```

Useful contextual starter rail check:

```sql
select *
from public.get_starter_tracks_for_surface(
  6,
  'profile',
  'profile:kocteau',
  '{}'::text[]
);
```

Seed at least 8-12 active `starter_tracks` before inviting first users, and tag them with `starter_track_tags` so onboarding preferences can rank them.

Apply `supabase/migrations/20260601195115_starter_tracks_for_surface.sql` before deploying the contextual starter rail. The rail calls `/api/starter/rail` from the client so the main app layout does not wait on starter pick ranking for every route. The route uses the current pathname as a surface/context pair, such as `home`, `profile:kocteau`, `track:{id}`, or `studio:health`, then asks the RPC for a stable daily rotation.

Use `supabase/scripts/maintenance/starter-rail-surface-check.sql` to compare several surfaces from the SQL editor. Direct SQL editor calls may not have `auth.uid()`, so validate viewer-specific taste ranking and reviewed-track filtering from the app after logging in.

Apply `supabase/migrations/20260601211257_starter_tag_taxonomy.sql` when Starter Studio needs the expanded `era` and `format` vocabulary plus curator-only tag editing. This migration is additive: it upserts baseline eras/formats and adds `update_preference_tag()` without deleting existing tags.

Use `supabase/scripts/maintenance/starter-tag-coverage-check.sql` to find preference tags with no active starter picks. Zero coverage is not a database error; it means the vocabulary exists before the curated catalog has caught up.

The easiest way to seed starter picks is the internal route:

```text
/studio/starter
```

Only the official `@kocteau` profile can write through this route. It searches Deezer, saves the track metadata, creates the default `starter-picks` collection if needed, attaches editorial tags, creates lightweight new tags when needed, and archives picks without deleting historical rows.

Starter tags affect recommendations in two stages:

1. `get_starter_tracks()` ranks starter picks against the viewer's onboarding taste.
2. `sync_entity_tags_from_starter_track()` copies starter tags to `entity_preference_tags` when a user reviews that track. If a curator edits the starter tags later, stale `system` tags are removed while manual tags are preserved.

The feed presents these picks as a lightweight taste queue. Impressions, passes, review intent, and published reviews record `starter_impression`, `starter_pass`, `starter_review_cta`, and `starter_review_published` in analytics.

## Recommendation Health Checks

Use `supabase/scripts/maintenance/recommendation-health-checks.sql` to inspect aggregate For You and starter health from the Supabase SQL editor.

Before changing `get_recommended_review_ids()`, run `supabase/scripts/maintenance/feed-tuning-baseline-snapshot.sql` and keep the aggregate output in the PR notes. Run the same script again 7-14 days after deployment before making another ranking change.

Curators can use the internal route:

```text
/studio/health
```

That route reads the same kind of aggregate signal through `get_recommendation_health_snapshot()`. Apply `supabase/migrations/20260601180027_recommendation_health_rpc.sql` before deploying the route to production.

These checks are read-only and should be interpreted directionally:

- `fallback_rate` above 0 means For You is falling back to latest reviews.
- Low review open rate by reason means a reason may be surfacing weak matches.
- High starter pass rate means a curated pick may be mistagged, too repetitive, or not editorially useful.
- Starter impressions without review CTAs may mean the pick is visible but not inviting.
- Entity opens show which tracks become discovery destinations.

Do not export raw analytics rows. Share only aggregate counts and rates.

If the full starter migration has already landed but a legacy environment needs only the starter tag/RPC patch, review `supabase/scripts/maintenance/starter-algorithm-signals-patch.sql`. It updates only the starter tag table and related RPC functions, so it takes fewer schema locks.

Track pages currently keep Deezer as the canonical external music link. Spotify/Apple/ISRC resolution is intentionally not part of the app right now because the provider access model adds avoidable operational friction for the current product stage. Future playback should be designed as a separate YouTube embed layer, likely behind explicit curator/admin controls.

If an environment still has old ISRC/link tables from experimentation, run `supabase/scripts/maintenance/cleanup-experimental-music-links.sql` after reviewing it. Do not run new backfills or add Spotify/Apple credentials unless that integration is intentionally reopened.

Public identity and internal permissions are intentionally separate:

- `profiles.is_official`: public badge for official accounts.
- `profile_roles`: private permission rows, currently `curator` or `admin`.
- `is_starter_curator()`: checks the authenticated user's role.

The editorial starter migration grants `admin` to the profile whose username is `kocteau` when it runs. If that profile does not exist yet, create the profile first or insert the role later.

## Branching and Releases

Current preference:

- Use Release Please for automatic versioning, changelog updates, tags, and GitHub Releases.
- Keep the public release process web-first until mobile becomes a production surface.
- Use branches for meaningful features.
- Use squash merge titles as the release-note source.
- Keep release PR merging manual; do not enable auto-merge for release PRs yet.
- Use `docs/maintainers/release.md` for release automation notes.
- Use `docs/maintainers/github-rules.md` for recommended repository rules.

Good branch names:

- `auth-email-code-only`
- `recommendation-v2`
- `instrumentation-v0.1.3`
- `feature-name-short`
