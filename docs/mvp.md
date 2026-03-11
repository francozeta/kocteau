# Kocteau MVP

## Vision

Kocteau is a place where people write song reviews, share them, and discover music through others.

The conceptual reference is:

- Letterboxd for music
- Pitchfork social

## Demo objective

Demonstrate that Kocteau already has a recognizable identity with minimal but clear features:

- search songs
- rate them
- leave an optional note
- publish reviews
- discover tracks and opinions from other people

## What's included in the MVP

### 1. Authentication and basic profile

- login
- signup
- simple onboarding
- public profile by `username`
- avatar
- optional short bio

### 2. Create reviews

The heart of the MVP.

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

## 3. Musical entity system

The `entities` table caches music results to avoid depending on Deezer for every read.

Main fields:

- `provider`
- `provider_id`
- `type`
- `title`
- `artist_name`
- `cover_url`
- `deezer_url`

In this demo, the focus is on `track`, though the schema already allows expansion to `album`.

## 4. Simple feed

The home shows recent reviews with:

- track cover
- track name
- review author
- rating
- optional note

No algorithm or personalization yet.

## 5. Track page

Route:

- `/track/[id]`

Shows:

- cover
- basic track information
- link to Deezer
- all reviews associated with that same entity

## 6. Public profile

Route:

- `/u/[username]`

Shows:

- basic user identity
- pinned review
- remaining reviews

## Data model concept

The important MVP relationship is:

- one row in `entities` represents a track
- many rows in `reviews` can point to the same entity

This allows different users to review the same song and group them on the same track page.

To guarantee this, the database must have a `unique` constraint on:

- `(provider, provider_id, type)` on `entities`

## What's out of scope for the MVP

To avoid overloading the demo, these are out for now:

- playlists
- complex recommendations
- comments on reviews
- direct messages
- curators
- artist roles
- complete MusicBrainz
- gamification
- advanced social system

## Expected MVP state

When the MVP is complete, a person should be able to:

1. create an account
2. complete their minimal profile
3. publish a track review
4. see that review in the feed
5. enter the track page
6. enter the author's profile

If that loop feels clear and stable, the demo already identifies the product.

## Risks / current decisions

- rating is mandatory because it's the app's core
- written note in the UI is optional to reduce friction
- if the database enforces `body not null`, that must be aligned before demo launch
- the current MVP prioritizes product clarity over future features
