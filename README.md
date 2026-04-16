# Kocteau

Kocteau is a social app for music reviews. The current demo is focused on a simple and clear use case: search for a track, rate it, leave an optional note, and discover music through other people's reviews.

## Current Status

The demo already covers the main product loop:

- basic authentication and onboarding
- review creation with Deezer search
- main feed with recent reviews
- public user profile
- track page with all its reviews

## MVP

The MVP definition is documented in [docs/mvp.md](./docs/mvp.md).

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth, Database and Storage
- Deezer Search API

## Environment Variables

You need to define at least these variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
REDIS_URL=redis://...
```

`REDIS_URL` is server-only and powers Redis-backed rate limiting. Keep it in `.env.local` and Vercel Environment Variables, never as a `NEXT_PUBLIC_` variable.

## Local Development

Install dependencies and start the server:

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Database

The app uses these main tables:

- `profiles`
- `entities`
- `reviews`

There are also future or secondary tables:

- `review_likes`
- `entity_bookmarks`

## Main Flow

1. user creates account or logs in
2. completes onboarding with `username`
3. opens new review modal
4. searches for a track on Deezer
5. selects the track
6. leaves a required rating and optional note
7. publishes
8. the review appears in the feed, on their profile, and on the track page

## Notes

- the demo is currently focused on `track`, not albums or artists
- review body is optional in the UI; apply the latest Supabase migration so the database matches that behavior too
- some technical cleanups outside the main flow are still pending
