# URL Contract V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Kocteau's public review and track pages to stable, SEO-friendly canonical URLs without changing existing Supabase data.

**Architecture:** Add a small URL helper layer that derives slugs and 8-character route IDs from existing entity and review UUIDs. New canonical routes render the public pages; existing `/review/:id`, `/track/:id`, full-UUID canonical variants, `/track/deezer/:providerId`, and provider-flavored track routes permanently redirect when the canonical entity already exists. Sitemap, structured data, and `llms.txt` consume the same helpers so future URL changes stay centralized.

**Tech Stack:** Next.js App Router, TypeScript, Supabase public queries, Next metadata, Schema.org JSON-LD.

---

## Files

- Create `apps/web/lib/seo-routes.ts`: canonical entity/review URL helpers.
- Modify `apps/web/lib/queries/entities.ts`: add provider-based entity lookup and short route ID lookup for canonical routes.
- Modify `apps/web/lib/queries/reviews.ts`: allow entity types beyond `track` in review page data and short route ID lookup for review pages.
- Create `apps/web/app/(main)/reviews/[reviewId]/[slug]/page.tsx`: canonical review detail route.
- Replace `apps/web/app/(main)/review/[id]/page.tsx` with `route.ts`: legacy HTTP 308 redirect route.
- Create `apps/web/app/(main)/tracks/[slug]/[id]/page.tsx`: canonical track detail route.
- Create `apps/web/app/(main)/tracks/[slug]/[id]/[providerSlug]/route.ts`: provider-flavored HTTP 308 compatibility redirect for `/tracks/{provider}/{providerId}/{slug}` without conflicting with the canonical App Router segment names.
- Replace `apps/web/app/(main)/track/[id]/page.tsx` with `route.ts`: legacy HTTP 308 redirect route.
- Modify `apps/web/app/(main)/track/deezer/[providerId]/page.tsx`: redirect existing entities to canonical track URL.
- Modify `apps/web/app/sitemap.ts`: emit canonical review and entity URLs automatically.
- Modify `apps/web/lib/structured-data.ts`: use canonical URL helpers in JSON-LD.
- Modify `apps/web/app/llms.txt/route.ts`: describe canonical public URLs by pattern.
- Modify `apps/web/proxy.ts`: HTTP 308 redirect full UUID public URLs to short ID canonical URLs.
- Modify `apps/web/components/track-page-hero.tsx`: remove unverified taste chips from the hero.
- Create `apps/web/lib/seo-routes.test.ts`: lock the route contract with small helper tests.

## Tasks

### Task 1: Add Canonical URL Helpers

- [x] Create `apps/web/lib/seo-routes.ts` with slug generation, short route IDs, entity path builders, review path builders, and legacy path helpers.
- [x] Keep slugs deterministic from `title` and `artist_name`; do not persist slugs in the database.
- [x] Use plural entity route roots: `/tracks`, `/albums`, `/artists`.
- [x] Keep provider names out of reviewed entity canonical URLs; provider routes are preview or compatibility only.

### Task 2: Add Provider-Based Entity Lookup

- [x] Add `getEntityPageByProvider(provider, type, providerId)` to `apps/web/lib/queries/entities.ts`.
- [x] Add short ID route lookup through UUID-prefix range queries, avoiding a database migration in this phase.
- [x] Keep `findEntityByProvider` compatible for existing API callers.
- [x] Broaden entity types to include future `artist` support at the TypeScript boundary without adding a migration in this phase.

### Task 3: Canonical Review Route

- [x] Create `/reviews/[reviewId]/[slug]`.
- [x] Resolve review by short ID or full UUID, derive canonical path, and redirect/canonicalize when the path mismatches.
- [x] Keep review page hierarchy track-first: metadata title and OG image should prioritize entity title/artist.
- [x] Change `/review/[id]` to a legacy HTTP 308 permanent redirect.

### Task 4: Canonical Track Route

- [x] Create `/tracks/[slug]/[id]`.
- [x] Resolve the existing entity by short ID or full UUID, derive canonical path, and redirect/canonicalize when the path mismatches.
- [x] Redirect full-UUID `/tracks/[slug]/[id]` URLs to short-ID URLs at the proxy layer for HTTP 308.
- [x] Redirect `/tracks/[provider]/[providerId]/[slug]` to `/tracks/[slug]/[id]` with HTTP 308 when that provider entity exists, implemented with shared dynamic segment names to satisfy App Router.
- [x] Change `/track/[id]` to a legacy HTTP 308 permanent redirect.
- [x] Keep `/track/deezer/[providerId]` as the noindex preview path for non-existing entities, with existing-entity canonicalization handled separately.

### Task 5: Automatic SEO Surfaces

- [x] Update sitemap to emit canonical review URLs and canonical track URLs.
- [x] Update JSON-LD review, feed, reviews index, and track nodes to reference canonical URLs.
- [x] Update `llms.txt` patterns so citation guidance points at canonical URLs without listing every concrete route manually.
- [x] Keep inferred entity taste tags out of the track hero until verified/curator-backed signal display is designed.

### Task 6: Verification

- [x] Run `pnpm --filter web lint`.
- [x] Run `pnpm --filter web build`.
- [x] Run the focused SEO route helper test.
- [x] Run `git diff --check`.
- [x] Manually inspect generated routes in code for no accidental auth, Supabase, recommendation, or analytics behavior changes.
