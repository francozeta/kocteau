# Kocteau Operations

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
2. Apply migrations through the Supabase CLI or approved deployment path.
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

Seed at least 8-12 active `starter_tracks` before inviting first users, and tag them with `starter_track_tags` so onboarding preferences can rank them.

The easiest way to seed starter picks is the internal route:

```text
/studio/starter
```

Only the official `@kocteau` profile can write through this route. It searches Deezer, saves the track metadata, creates the default `starter-picks` collection if needed, attaches editorial tags, creates lightweight new tags when needed, and archives picks without deleting historical rows.

Starter tags affect recommendations in two stages:

1. `get_starter_tracks()` ranks starter picks against the viewer's onboarding taste.
2. `sync_entity_tags_from_starter_track()` copies starter tags to `entity_preference_tags` when a user reviews that track. If a curator edits the starter tags later, stale `system` tags are removed while manual tags are preserved.

The feed presents these picks as a lightweight taste queue. A pass records `for_you_recommendation_action` in analytics; a review click still records `for_you_review_action`.

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
