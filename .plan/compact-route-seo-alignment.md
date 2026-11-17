# Compact route SEO alignment

Integrated through [PR #312](https://github.com/francozeta/kocteau/pull/312) at
main `1c115b4`. Original baseline: `712435a`, after #309, #311 and #310. This is a focused continuation of the SEO work in #306/#307 on the compact
route tree; it does not merge, close or rewrite those PRs.

## Scope

- Retire only the exact `/track` index with a permanent 308 to `/reviews`.
  Keep `/track/{id}`, `/track/deezer/*` and former split slug/ID compatibility.
- Remove the retired index from sitemap, public citation manifest and track
  breadcrumbs. Advance the persistent sitemap namespace to v4 so deployment
  cannot reuse the v3 entry containing `/track`.
- Keep the existing server-rendered review-card links to canonical music and
  public authors. Current HTML already exposes those anchors, so the additional
  review navigation from #307 duplicates them and is not ported. The current
  public shell also exposes Search and reviews links. Additional hub copy and
  empty-track links are unnecessary, so all visible review/track layouts and
  existing prefetch policies stay unchanged.
- Begin public breadcrumbs at `/home`; review breadcrumbs finish at the review's
  own canonical URL rather than the reviewed music.

The footer, approved Search/landing visuals and animations, personalization,
indexability policy, databases and package dependencies are unchanged. Help and
curator recruitment links are outside this SEO correction.

## Validation and release gates

Structured-data tests cover titled/rating-only review identity, track hierarchy
and the public reviews breadcrumb. The existing journey verifier additionally
asserts actual HTTP 308 without following the index redirect, sitemap/manifest
absence and the existing music/author anchors in server HTML after removing
script payloads. Existing canonical/legacy
navigation, error recovery, editor/comments and mobile/desktop coverage remain.

The production-only five-request smoke accepts the pre-rollout index or the new
308, since it runs against production while a PR is under review. The isolated
app and preview must prove the new redirect explicitly. Tighten the production
expectation after a confirmed rollout, not before it.

Local checks pass: four structured-data tests, web lint, Next route type
generation and full TypeScript checking, script syntax checks, documentation
(34 pages and 181 repository links), and whitespace checks. No database or cloud
write was performed by this stage.

The isolated Next16/Turbopack production build and updated WebKit matrix pass:
75 recorded checks over mobile/desktop and guest/simulated-session cohorts,
including the real exact-index308, canonical/alias behavior, sitemap/manifest
exclusion and existing entity/author SSR anchors. Raw reports remain ignored.
Known React419 observations under forced origin faults are not claimed fixed.

[PR #312](https://github.com/francozeta/kocteau/pull/312) owns current CI,
live preview evidence and feedback steps. Passing these checks establishes
route/crawlability behavior, not improved Google coverage or search ranking.
Physical iPhone Safari and actual Search Console outcomes remain separate.
