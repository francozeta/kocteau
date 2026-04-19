# Kocteau

Kocteau is a social music app for reviews, taste discovery, and human-led recommendations. The current product loop is simple: enter with email OTP, complete a profile, choose initial taste signals, review music, and discover new reviews through a personalized For You feed.

## Current Status

Kocteau is now past the original demo baseline. The web app currently includes:

- OTP-first authentication with Supabase Auth
- Resend/Supabase SMTP-ready code-only email templates
- profile onboarding with nullable username until setup is complete
- taste onboarding with curated preference tags
- Deezer track search for review creation
- reviews, likes, bookmarks, comments, follows, notifications, and saved reviews
- a personalized For You home feed at `/`
- fallback feed modes for latest, following, and top-rated reviews
- lightweight feed analytics stored in Supabase
- Supabase Postgres rate limiting, with no Redis dependency

## Product Flow

1. User enters an email on `/login` or `/signup`.
2. Supabase sends a 6-digit email code.
3. User verifies the code inside Kocteau.
4. New users finish profile onboarding.
5. Users choose taste tags during taste onboarding.
6. Home `/` opens the personalized For You feed.
7. Users create reviews from Deezer search.
8. Likes, bookmarks, comments, follows, and review activity shape future recommendations.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth, Postgres, Storage, RLS, and RPCs
- TanStack Query for client cache and optimistic updates
- Resend SMTP through Supabase Auth for OTP email delivery
- React Email for transactional email templates
- Deezer Search API

## Environment Variables

Minimum local variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

Optional production services are configured outside the app:

- Supabase Auth SMTP points to Resend.
- Supabase email templates use the code-only OTP template in `apps/web/emails`.
- Rate limiting is handled through Supabase Postgres, so no `REDIS_URL` is required.

## Local Development

Install dependencies and start the web app:

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
pnpm --filter web lint
pnpm --filter web build
```

Email preview:

```bash
pnpm --filter web email:dev
```

## Database

The core public tables are:

- `profiles`
- `entities`
- `reviews`
- `review_comments`
- `review_likes`
- `review_bookmarks`
- `entity_bookmarks`
- `profile_follows`
- `notifications`
- `preference_tags`
- `user_preference_tags`
- `user_music_seeds`
- `entity_preference_tags`
- `editorial_collections`
- `editorial_collection_items`
- `starter_tracks`
- `starter_track_tags`
- `analytics_events`
- `rate_limit_windows`

Important scripts live in `supabase/scripts`:

- `wipe-demo-auth-data.sql`: destructive reset for demo/test data
- `recommendation-v2.sql`: entity tags, recommendation scoring, inferred taste signals
- `editorial-starter-layer.sql`: human-curated starter picks for cold-start For You
- `analytics-events.sql`: lightweight product analytics table and policies

Run SQL scripts manually from the Supabase SQL Editor after reviewing them.

## Authentication

Kocteau is OTP-first:

- `signInWithOtp` sends codes for login/signup.
- `verifyOtp({ type: "email" })` verifies the 6-digit code in-app.
- `Confirm email` should stay enabled in Supabase.
- The Supabase `Magic Link` template must be code-only and use `{{ .Token }}`.
- Do not include `{{ .ConfirmationURL }}` or `{{ .TokenHash }}` in the OTP template unless intentionally re-enabling magic links.

See [apps/web/emails/README.md](./apps/web/emails/README.md).

## Recommendation System

For You is the primary signed-in home experience at `/`.

Recommendation inputs currently include:

- explicit taste onboarding tags
- inferred tags from positive review activity
- tags attached to entities
- follows
- familiar entities
- author affinity from liked/bookmarked reviews
- rating, likes, comments, and recency
- light diversity penalties to reduce repetition

If the recommendation RPC fails, the app logs `for_you_fallback` and falls back to latest reviews instead of breaking the feed.

When a signed-in user's For You feed is empty or sparse, Kocteau can show editorial starter picks. These are not fake reviews; they are curated track prompts stored in `starter_tracks` and ranked against the user's onboarding tags through `get_starter_tracks`.

Starter picks can be curated from `/studio/starter` by the official `@kocteau` profile. The studio uses Deezer search, so curators do not need to copy provider ids manually.

Official identity and internal permissions are separate:

- `profiles.is_official` controls the public official badge.
- `profile_roles` controls private roles such as `curator` and `admin`.

## Analytics

Kocteau uses a small first-party analytics table in Supabase. Events currently tracked:

- `taste_onboarding_completed`
- `for_you_reviews_loaded`
- `for_you_review_action`
- `for_you_fallback`

The goal is product feedback, not surveillance. Events avoid emails, IPs, user agents, and long free-form payloads.

## Documentation

- MVP and product baseline: [docs/mvp.md](./docs/mvp.md)
- Web roadmap: [docs/web-roadmap.md](./docs/web-roadmap.md)
- Operational notes: [docs/operations.md](./docs/operations.md)
- Email templates: [apps/web/emails/README.md](./apps/web/emails/README.md)

## Current Product Direction

Kocteau is becoming a hybrid music discovery system: human taste as the source material, lightweight algorithms as the routing layer. The near-term priority is to keep the product simple while making For You feel increasingly relevant from real user behavior.
