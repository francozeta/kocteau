# Kocteau MVP

## Vision

Kocteau is a place where people review music, express taste, and discover what to hear next through other listeners.

The conceptual reference is:

- Letterboxd for music
- social music criticism
- human curation supported by lightweight algorithms

## Product Objective

The MVP should prove that Kocteau has a clear loop:

- create an account with email OTP
- shape an initial taste profile
- review tracks
- interact with other reviews
- return to a personalized For You feed

## Current MVP Scope

### 1. OTP-first authentication

Kocteau uses Supabase Auth with email OTP as the primary auth path.

Included:

- login with email code
- signup through the same OTP flow
- post-auth redirect handling
- incomplete profile state
- profile onboarding after auth
- taste onboarding after profile setup

Important decision:

- Supabase `Confirm email` stays enabled.
- The email template is code-only; the app verifies the OTP inside Kocteau.

### 2. Profile and onboarding

Profiles allow an incomplete state so auth can happen before identity setup.

Included:

- nullable `username` until onboarding
- display name
- avatar
- optional bio
- optional music profile links
- `onboarded`
- `taste_onboarded`

Taste onboarding collects explicit first-party signals through `preference_tags` and `user_preference_tags`.

### 3. Review creation

The heart of the product remains review creation.

Flow:

1. search track on Deezer
2. select track
3. assign mandatory rating
4. write optional title
5. write optional note
6. publish

Each review stores:

- `author_id`
- `entity_id`
- `rating`
- `title`
- `body`
- `created_at`
- `is_pinned`
- engagement counters

Review creation goes through server routes and Supabase RPCs rather than direct client writes.

## 4. Musical entity system

The `entities` table caches music results so the app does not depend on Deezer for every read.

Main fields:

- `provider`
- `provider_id`
- `type`
- `title`
- `artist_name`
- `cover_url`
- `deezer_url`

The current product focuses on tracks, though the schema allows albums.

To group reviews correctly, `entities` should remain unique by:

- `(provider, provider_id, type)`

## 5. For You feed

Home `/` is now the primary For You feed for signed-in users.

For You combines:

- explicit taste tags
- inferred entity tags
- editorial starter picks for cold-start sessions
- user follows
- familiar entities
- author affinity
- review quality signals
- recency
- diversity penalties

Fallback modes still exist:

- latest
- following
- top-rated

Signed-out users fall back to a public latest-style experience.

When there are not enough real reviews to rank, For You uses the Starter Layer: curated tracks from `starter_tracks`, grouped by optional `editorial_collections`, and matched to onboarding tags through `starter_track_tags`. This keeps early sessions useful without inventing fake users or fake reviews.

The official `@kocteau` profile can manage these picks from `/studio/starter` using the same Deezer search source as review creation.

## 6. Social interactions

The MVP now includes lightweight social behavior:

- likes
- bookmarks
- comments
- follows
- notifications
- saved reviews

These actions are product features and recommendation signals.

## 7. Track and profile pages

Track route:

- `/track/[id]`

Shows:

- cover
- basic track information
- Deezer link
- reviews for the entity

Profile route:

- `/u/[username]`

Shows:

- public identity
- profile metadata
- pinned/recent reviews
- user activity surface

## 8. Lightweight analytics

Kocteau stores minimal first-party events in Supabase:

- taste onboarding completion
- For You page loads
- For You review actions
- recommendation fallback

Analytics are used to understand whether the feed is working. They avoid sensitive fields like email, IP, and user agent.

## Out of Scope For Now

Still deferred:

- playlists
- direct messages
- gamification
- heavy ML recommendations
- full artist roles
- curator/admin dashboards
- first-class albums/artists beyond the existing entity support
- native mobile parity

## Expected MVP State

When the MVP is healthy, a user should be able to:

1. log in or sign up with email OTP
2. complete profile onboarding
3. choose initial taste tags
4. publish a track review
5. see relevant reviews on `/`
6. like, bookmark, comment, or follow
7. return later and see For You improve from behavior

If that loop feels clear and stable, Kocteau is past demo stage and ready for focused product iteration.
