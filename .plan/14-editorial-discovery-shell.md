# Editorial discovery shell

Status: active on `design/editorial-shell`. Do not merge until the visual direction has been reviewed in desktop and mobile and explicitly approved.

## Product intent

Kocteau should help a listener find something worth hearing before it asks them to know, follow, or trust another user. Community remains essential, but it enters through reviews and taste context instead of a generic people graph.

The experience combines:

- the immediate exploration of Radiooooo, Music-Map, and Gnoosic;
- the authored context, recurring formats, and archive value of Bandcamp Daily, Pitchfork, FLOOD, and Ones To Watch;
- the stable hierarchy, content-first chrome, and dedicated discovery patterns described in Apple's Human Interface Guidelines;
- Kocteau's existing review-led, monochrome, quiet editorial identity.

## Signature: the listening route

Every discovery surface should answer three questions with very little copy:

1. What is this?
2. Why is it here?
3. Where can I go next?

The answer can be a short recommendation reason, a nearby taste signal, a scene/era path, or a review excerpt. It must never look like an opaque engagement score.

## Phase 1 — Shell hierarchy

Goal: make discovery and listening intent legible before changing feed content.

- Keep Feed as the primary reading surface.
- Rename Explore to Discover throughout the product shell.
- Keep Atlas as the semantic map of scenes, moods, eras, and styles.
- Remove Feedback from the primary navigation.
- Prioritize Library over Activity on mobile.
- Replace the global people-first rail with an editorial discovery rail.
- Align the desktop route title with the reading column instead of centering it decoratively.
- Keep controls and navigation visually separate from the content layer; do not apply glass/material effects to review content.

Feedback checkpoint: shell silhouette, navigation hierarchy, desktop alignment, mobile tab order, and discovery rail.

## Phase 2 — Public discovery without an account

Goal: make `/search` a useful destination even before a query or login.

- Search remains the first control, but the empty state becomes a discovery edition.
- Use real recently discussed tracks, curated starter picks, and Atlas paths.
- Add restrained entry points such as scenes, eras, moods, and “sounds near this.”
- Preserve direct track access and keyboard search.
- Do not fabricate reviews, activity, popularity, or listeners.

Feedback checkpoint: discovery modules and their editorial labels before adding motion.

## Phase 3 — Explainable personalization

Goal: scale the For You loop without making cold-start feel empty.

- Signed-out fallback: curated starter coverage plus recent public review signals and diversity limits.
- New-account fallback: explicit onboarding taste signals plus editorial coverage.
- Established account: taste/entity affinity, follows, saves, review behavior, recency, and diversity.
- Show one quiet reason when it adds trust: “Because you return to dream pop,” “From a scene you follow,” or “Discussed this week.”
- Keep Following as an intentional view, not the default discovery engine.

Feedback checkpoint: reason language, diversity, and fallback quality.

## Phase 4 — Indexable public music graph

Goal: turn genuine product data into durable discovery entry points.

- Keep track, public review, profile, Atlas, and curated collection pages server-rendered with stable canonical URLs.
- Index only useful, sufficiently populated pages; query-string search results remain `noindex`.
- Expand sitemap coverage only for canonical public entities and curated Atlas pages.
- Use semantic `MusicRecording`, `Review`, `Person`, `BreadcrumbList`, and collection markup where the visible page supports it.
- Connect tracks to nearby Atlas signals, real reviews, and related public routes.
- Preserve author, publication date, update date, and source attribution.
- Keep `llms.txt` concise and factual; do not create separate AI-targeted prose.

### Google Search Console rollout

1. Verify the `kocteau.com` domain property.
2. Submit `/sitemap.xml` and inspect representative track, review, profile, and Atlas URLs.
3. Monitor indexed/not-indexed reasons, canonical selection, crawl activity, and Core Web Vitals.
4. Compare impressions and clicks by page class, not only site-wide totals.
5. Add new indexable templates only after existing page classes show useful coverage and retention.

## Phase 5 — Craft and motion

Goal: make the system feel considered without making it performative.

- Shared cover movement only when it preserves object continuity.
- Interruptible tab and rail transitions under 200ms.
- Stable geometry and reduced-motion fallbacks.
- Album art and rating are the only routine color sources.
- No decorative gradients, glass content cards, bouncing controls, or dashboard widgets.

## Phase 6 — Security and resilience gate

Goal: protect the discovery and review loop from abuse, traffic spikes, and upstream failures before this direction is approved for a final merge.

- Keep this work isolated from the design branch until the visual direction is approved.
- Add edge protection before expensive public requests reach Next.js, Supabase, or Deezer.
- Audit Auth, RLS, exposed grants, privileged RPCs, and browser security headers.
- Make public discovery degrade to cached editorial content when an upstream service fails.
- Define recovery, alerting, and load-test gates instead of promising impossible zero downtime.

The threat model, rollout order, and acceptance criteria live in `15-security-resilience.md`.

## Success signals

- A signed-out listener reaches a meaningful track or Atlas page without authenticating.
- The feed remains the strongest surface after sign-in.
- Discovery does not depend on a large user graph.
- Public entity pages earn impressions independently from the landing page.
- Recommendation reasons increase trust without adding explanatory clutter.
- The shell remains visually quiet at desktop, tablet, and mobile widths.
