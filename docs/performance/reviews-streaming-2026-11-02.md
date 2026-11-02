# Stream the public review index — 2026-11-02

[Latency diagnostics](./public-response-breakdown-2026-11-02.md) · [Observability #263](https://github.com/francozeta/kocteau/issues/263) · [Primary render #229](https://github.com/francozeta/kocteau/issues/229)

## Problem and evidence

The existing `/reviews` route awaited `getCurrentUserId()`, then the
shared public `getFeedPage()`, then (for signed-in visitors) viewer-specific
likes/bookmarks **before** returning its static heading. A slow public data
read could therefore hold all route content, even though the heading, page
description and shell do not depend on it. This is a sequential dependency
in the reviewed source, **not** proof it explains the preceding 2,267 ms
single-request production total.

Prior production read-only HTTP observations:
- First run: `/reviews` whole HTML 2,267 ms.
- Second: first body 310 ms, whole HTML 656 ms, edge cache MISS.
- Third: first body 407 ms, whole HTML 537 ms, edge cache MISS.

The variable results are not valid P75/P95, and decoded HTML size
(~617 KB) is not compressed transfer size or a Web Vitals metric. The
homepage's ~1.2 s first-body wait persisted even with cache HIT; this
change does not target that CDN/network issue.

## Implementation

1. Render the stable `/reviews` heading and description synchronously.
2. Move the public review data read, per-user flag resolution and cards
   into `PublicReviewsList` behind React `Suspense`, using existing
   accessible skeletons. This allows initial HTML to stream without waiting
   for a slow catalogue read (once the shared AppShell is ready).
3. Start the independent shared public feed and user ID lookups together
   with `Promise.all`; keep per-user likes/bookmarks **after** identity
   resolution, outside public data cache.
4. Preserve fourteen visible reviews, JSON-LD, full review text/links,
   canonical routes, viewer flags, guest behavior and the existing SEO
   metadata. Do not change infinite-scroll or caching rules.
5. Add `tests/load/verify-reviews-stream.mjs`: an isolated actual-Next.js
   fixture with the review feed deliberately held. The test must see the
   heading and loading state **before** the fixture feed is released, then
   see the review afterward. No external database, production requests,
   credentials or authenticated test users.

## Expected and measured effect

**Expected:** earlier meaningful page shell and a loading state during
slow public reads. The application still has to finish fetching and
rendering the real reviews; no SQL or full-response speedup is asserted.

**Verification checklist:**
- [ ] Isolated Next streaming fixture passes.
- [ ] GitHub Verify tests, lint, docs and production build pass.
- [ ] Vercel preview builds.
- [ ] After merge, inspect a bounded production read-only smoke and compare
      first body/complete as diagnostic, not as proof of a causal regression.
- [ ] Real guest and authenticated mobile/desktop journeys preserve the
      correct review list and interaction flags.
- [ ] Obtain actual Speed Insights LCP/INP/TTFB counts by route before
      promising improvements to real-user percentiles.

## Next priorities

- **Homepage:** isolate runner-to-edge connection and POP routing on cache
  HIT before touching its ISR or landing design.
- **Review index:** consider reducing repeated RSC/client hydration work
  only after a browser bundle and real-user LCP/INP profile shows impact.
  Do not delete reviews or reduce public discovery merely to improve HTML
  size.
- **Supabase:** correlate slow or timed-out public-read spans with
  foreground requests; stale-cache revalidation errors are not
  automatically user-facing delays.
- **Cloudflare:** do not insert an extra proxy without demonstrating
  that the present latency is an edge-routing problem it would solve.
