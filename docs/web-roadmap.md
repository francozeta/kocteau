# Kocteau Web Roadmap

## Scope

This roadmap is for the web app only.

- Primary surface: `apps/web`
- Shared packages touched only when the web app needs them:
  - `packages/api`
  - `packages/types`
  - `packages/ui`
- Out of scope for now:
  - `apps/mobile`
  - major platform expansion
  - broad feature experiments that do not improve the core web product loop

## Product Goal

Turn Kocteau from a solid MVP into a product that feels intentional, distinctive, and habit-forming on web.

The priority order is:

1. clarity
2. retention
3. usability
4. visual polish
5. discovery
6. real-product feel

## Working Principles

- Improve the existing product instead of rebuilding it.
- Prefer changes that deepen the main loop over adding disconnected features.
- Treat design, UX, data ranking, and product logic as one system.
- Every phase should ship visible product value.
- Mobile parity is not required during execution of this roadmap.

## Phase 0: Product Foundation

### Goal

Align the web app around a sharper product direction before larger UI execution.

### Outcomes

- clear product promise for web
- clear IA for primary navigation
- shared definition of what makes a review, track page, and profile page feel complete
- decision on which features are core now vs later

### Work

- Define the signed-out and signed-in product promise in one sentence each.
- Freeze the primary nav model for web:
  - `Feed`
  - `Explore`
  - `Activity`
  - `Saved`
  - `Profile`
- Decide whether `Tracks` remains a standalone destination or folds into `Explore`.
- Define feed modes that deserve to exist now, and remove weak overlaps.
- Define the minimum social graph direction:
  - no follow system yet
  - or lightweight follow system in Phase 3

### Likely Files

- `docs/mvp.md`
- `docs/web-roadmap.md`
- `apps/web/app/(main)/layout.tsx`
- `apps/web/components/app-sidebar.tsx`
- `apps/web/components/mobile-bottom-bar.tsx`

### Exit Criteria

- navigation model is stable
- feed purpose is clear
- the next phases can execute without re-litigating fundamentals

## Phase 1: Clarity and First-Run Experience

### Goal

Make Kocteau understandable and emotionally legible within the first session.

### Outcomes

- stronger signed-out and auth experience
- better onboarding that seeds taste, not just identity
- clearer brand voice and product explanation

### Work

- Redesign auth shell copy so it explains what Kocteau is.
- Improve signup and login pages so they feel like entry into a product, not generic auth.
- Upgrade avatar upload in onboarding and profile settings:
  - add square crop flow before save
  - optimize uploaded images client-side to reduce payload without harsh quality loss
  - keep the implementation reusable for future user-image fields
- Expand onboarding from identity setup into taste setup:
  - favorite artists
  - first review prompt
  - optional suggested tracks or writers to follow later
- Tighten empty states and product copy across feed, track, saved, and notifications.
- Standardize language and remove mixed English/Spanish product strings.

### Likely Files

- `apps/web/components/auth/auth-form-shell.tsx`
- `apps/web/components/auth/login-page-client.tsx`
- `apps/web/components/auth/signup-page-client.tsx`
- `apps/web/app/(auth)/onboarding/page.tsx`
- `apps/web/components/avatar-crop-dialog.tsx`
- `apps/web/components/profile-editor-form.tsx`
- `apps/web/lib/avatar-image.ts`
- `apps/web/components/ui/empty.tsx`
- `apps/web/app/api/reviews/route.ts`
- `apps/web/components/new-review-form.tsx`

### Exit Criteria

- a new user can understand the product quickly
- onboarding establishes taste, not only profile metadata
- copy feels consistent and product-grade

## Phase 2: Review Creation and Content Quality

### Goal

Make writing a review faster, more expressive, and more confidence-building.

### Outcomes

- more intuitive compose flow
- better review quality without adding heavy friction
- stronger perceived polish around create and edit flows

### Work

- Redesign the review composer as a clearer two-step flow:
  - pick track
  - write take
- Make optional fields feel intentional instead of empty.
- Add guided prompts for the note:
  - mood
  - standout moment
  - quick take
- Show a live preview of the review card before publish.
- Improve edit flow so it feels native, not just reused create UI.
- Improve publish success states and post-publish routing.
- Consider a “quick rating only” path only if it does not flood the feed with low-signal content.

### Likely Files

- `apps/web/components/new-review-dialog.tsx`
- `apps/web/components/new-review-form.tsx`
- `apps/web/components/edit-review-dialog.tsx`
- `apps/web/components/review-card.tsx`
- `apps/web/components/review-route-cards.tsx`
- `apps/web/app/api/reviews/route.ts`
- `apps/web/app/api/reviews/[reviewId]/route.ts`

### Exit Criteria

- composer feels productized, not just functional
- publish flow is fast and reassuring
- review content quality improves visibly

## Phase 3: Feed, Discovery, and Relevance

### Goal

Turn the home and discovery surfaces into a reason to return.

### Outcomes

- a feed with stronger relevance and hierarchy
- an explore system that is not just recent tracks
- a stronger distinction between browsing, searching, and following taste

### Work

- Redesign feed hierarchy:
  - one clear primary rail
  - one secondary discovery rail
- Replace weak tabs with meaningful feed modes.
- Rank written reviews above low-signal entries when appropriate.
- Add stronger explore groupings:
  - trending now
  - most discussed
  - top rated this week
  - recently active tracks
- Rework search so it transitions naturally into discovery and review creation.
- Decide and implement lightweight follow system if product value is clear enough here.

### Likely Files

- `apps/web/app/(main)/page.tsx`
- `apps/web/app/(main)/search/page.tsx`
- `apps/web/components/search-page-client.tsx`
- `apps/web/components/app-sidebar.tsx`
- `apps/web/lib/queries/feed.ts`
- `apps/web/lib/queries/discovery.ts`
- `apps/web/queries/feed.ts`
- `apps/web/queries/tracks.ts`
- `packages/api/src/query-keys.ts`

### Exit Criteria

- home feels curated rather than merely chronological
- explore has a clear job
- users have more than one good path to find things worth reading

## Phase 4: Track Pages and Profile Pages

### Goal

Turn detail pages into destinations that express taste and invite deeper browsing.

### Outcomes

- track pages feel rich and alive
- profiles communicate identity and taste
- more reasons to click deeper through the graph

### Work

- Add better track-page structure:
  - top reviews
  - recent reviews
  - review distribution
  - community summary or key stats
- Improve track CTAs:
  - write your take
  - see your review
  - compare with the crowd
- Expand profiles with taste signals:
  - favorite or pinned tracks
  - recurring artists
  - rating behavior
  - recent activity
- Decide whether saved reviews should remain a separate private space only.
- Strengthen review page context so comments feel anchored to a meaningful object.

### Likely Files

- `apps/web/app/(main)/track/[id]/page.tsx`
- `apps/web/app/(main)/track/page.tsx`
- `apps/web/app/(main)/u/[username]/page.tsx`
- `apps/web/app/(main)/review/[id]/page.tsx`
- `apps/web/components/review-comments-panel.tsx`
- `apps/web/lib/queries/entities.ts`
- `apps/web/lib/queries/profiles.ts`
- `apps/web/lib/queries/reviews.ts`
- `packages/types/src/kocteau-domain.ts`

### Exit Criteria

- track pages are worth revisiting
- profiles answer “why should I care about this person’s taste?”
- deeper navigation feels rewarding

## Phase 5: Visual Identity, Polish, and Accessibility

### Goal

Make Kocteau feel memorable, intentional, and production-grade.

### Outcomes

- stronger brand signature
- better visual rhythm and hierarchy
- accessibility and interaction polish at a real-product level

### Work

- Refine typography, spacing, and surface hierarchy across core pages.
- Push album art and editorial presentation further without losing usability.
- Create a stronger wordmark and brand-lockup usage system for web.
- Tighten hover, focus, pressed, and loading states.
- Review semantic heading structure, keyboard flows, contrast, and screen-reader labeling.
- Remove rough edges in dialogs, drawers, forms, and interactive cards.
- Use shadcn MCP where it accelerates composition or component upgrades.

### Likely Files

- `apps/web/app/globals.css`
- `apps/web/app/layout.tsx`
- `apps/web/components/header.tsx`
- `apps/web/components/brand-logo.tsx`
- `apps/web/components/review-card.tsx`
- `apps/web/components/search-page-client.tsx`
- `apps/web/components/new-review-form.tsx`
- `apps/web/components/ui/*`

### Exit Criteria

- the app feels distinct at first glance
- the UI feels deliberate, not assembled
- major accessibility issues are resolved on core flows

## Phase 6: Trust, Activity, and Retention Loops

### Goal

Strengthen the reasons people come back and feel safe participating.

### Outcomes

- more meaningful activity
- better social feedback loops
- stronger trust and account confidence

### Work

- Improve activity inbox hierarchy and grouping.
- Decide which actions should create notifications and which should stay silent.
- Add basic trust tools:
  - report
  - block or mute
  - simple moderation pathways
- Add retention hooks only after the core loop is healthy:
  - weekly recap
  - active friends or active reviewers
  - new reviews from followed users if follow system ships

### Likely Files

- `apps/web/app/(main)/notifications/page.tsx`
- `apps/web/components/notifications-inbox.tsx`
- `apps/web/components/notification-list.tsx`
- `apps/web/lib/queries/notifications.ts`
- `apps/web/lib/notifications.ts`
- `apps/web/app/api/notifications/*`

### Exit Criteria

- activity feels meaningful
- the product has clearer return loops
- basic safety and trust expectations are covered

## Deferred Until the Web Core Is Strong

- full mobile product expansion
- playlists
- albums and artists as first-class review targets
- heavy recommendation systems
- gamification and streaks
- direct messages
- large creator or curator programs

## Suggested Execution Order

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6

## Immediate Next Execution Steps

1. Lock the web IA and feed model in Phase 0.
2. Execute Phase 1 and Phase 2 together where it improves first-session experience.
3. Move next into Phase 3, because discovery and relevance are the biggest product-depth gap after clarity.
