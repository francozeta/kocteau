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
- The app verifies codes with `verifyOtp({ type: "email" })`.
- After verification, users are routed through profile onboarding, taste onboarding, or `/`.

## Supabase Email Templates

Kocteau uses a code-only OTP email.

Template file:

- `apps/web/emails/supabase-otp-template.html`

Supabase dashboard location:

```text
Authentication -> Email Templates -> Magic Link
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

The `Confirm Signup` template may also be kept code-only for consistency, but the current app flow primarily depends on the Magic Link template because it uses `signInWithOtp`.

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

## SQL Scripts

Scripts live in:

```text
supabase/scripts
```

Current scripts:

- `wipe-demo-auth-data.sql`
- `recommendation-v2.sql`
- `editorial-starter-layer.sql`
- `entity-external-links.sql`
- `analytics-events.sql`

Recommended production order for a fresh setup:

1. Base schema and auth/profile scripts
2. `recommendation-v2.sql`
3. `editorial-starter-layer.sql`
4. `entity-external-links.sql`
5. `analytics-events.sql`
6. Supabase Auth email template updates
7. Application deploy

Run destructive scripts only after a backup and only when intentionally clearing demo/test data.

Editorial starter content is product configuration, not demo user data. Keep it out of destructive demo wipes unless you intentionally want to rebuild the curated starter catalog.

## Post-Deploy Checks

After deploying auth or recommendation changes:

1. Log out.
2. Request OTP on `/login`.
3. Confirm the email contains only a 6-digit code.
4. Verify the code.
5. Complete profile onboarding if needed.
6. Complete taste onboarding if needed.
7. Confirm `/` loads For You.
8. Like, bookmark, and open comments from For You.
9. Check Supabase for analytics events.

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

If the full starter script hits a production lock or deadlock after the base layer already exists, run `supabase/scripts/starter-algorithm-signals-patch.sql` instead. It updates only the starter tag table and related RPC functions, so it takes fewer schema locks.

Track pages can also show platform links beyond Deezer. Run `supabase/scripts/entity-external-links.sql` to add `entities.isrc`, `entity_external_links`, and the `upsert_entity_music_link_resolution()` RPC. Deezer remains available through `entities.deezer_url`.

When a user reviews a Deezer track, the app can fetch the track's ISRC and resolve Spotify/Apple Music links in the background. Configure only the providers you want:

```text
SUPABASE_SERVICE_ROLE_KEY
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
APPLE_MUSIC_DEVELOPER_TOKEN
APPLE_MUSIC_STOREFRONT
MUSIC_LINKS_MARKET
```

`SUPABASE_SERVICE_ROLE_KEY` must be configured only as a server-side Vercel/Supabase secret. `APPLE_MUSIC_STOREFRONT` defaults to `us`; `MUSIC_LINKS_MARKET` defaults to `US`. If Spotify or Apple credentials are missing, the resolver skips that provider without failing review creation.

For older tracks and starter picks, use the internal action in:

```text
/studio/starter -> Sync links
```

That action runs `/api/starter/music-links/backfill`, checks a small batch of Deezer entities/starter picks, creates catalog entities for starter picks when needed, stores ISRC, and writes Spotify/Apple Music links when provider credentials are available. If track pages still show only Deezer, check these in order: `entity-external-links.sql` ran successfully, `SUPABASE_SERVICE_ROLE_KEY` is server-side, Spotify credentials are present, and the backfill processed the target track.

Public identity and internal permissions are intentionally separate:

- `profiles.is_official`: public badge for official accounts.
- `profile_roles`: private permission rows, currently `curator` or `admin`.
- `is_starter_curator()`: checks the authenticated user's role.

The script grants `admin` to the profile whose username is `kocteau` when it runs. If that profile does not exist yet, create the profile first or insert the role later.

## Branching and Releases

Current preference:

- Avoid automatic versioning unless explicitly requested.
- Use branches for meaningful features.
- Let GitHub PRs, merges, tags, and releases be handled manually unless asked otherwise.

Good branch names:

- `auth-email-code-only`
- `recommendation-v2`
- `instrumentation-v0.1.3`
- `feature-name-short`
