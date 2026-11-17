# Public home build reliability

Baseline: main `1c115b4`, after #312. Parent investigation:
[#263](https://github.com/francozeta/kocteau/issues/263). This stage removes the
landing's live-data dependency from compilation; it does not attribute the
underlying HTTP delay or change public read budgets.

## Evidence and choice

A Vercel build of `fd588be` timed out before public-read headers at about three
seconds while prerendering `/home`. Retrying that same commit succeeded. Code
inspection distinguishes the failed feed read, which throws, from Starter's
existing optional fallback outside its Data Cache. A Starter error alone must
not be presented as proof of a fatal build error.

A loopback reproduction against the original `fd588be` Home implementation
(which is unchanged in baseline main) exits with build code 1 and an explicit
`/home` prerender/deadline error. It makes exactly one home feed request and one
home Starter request. Setup failures do not count as reproduction. Raw evidence
stays ignored under `.codex-private/home-build-baseline`.

Use the existing Next.js on-demand static generation mechanism: move the page
entry to `home/[[...path]]`, return no build-time static params, retain
`revalidate = 300`, and reject suffixes before starting either public promise.
The public path, metadata, complete landing JSX, parallel reads, Suspense,
visual imports and motion remain unchanged. No client-only data switch,
`connection()`, `force-dynamic`, Cache Components migration or service is added.

References: [all paths at runtime](https://nextjs.org/docs/app/api-reference/functions/generate-static-params#all-paths-at-runtime),
[ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration),
[not-found streaming behavior](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).
The pinned Next.js implementation supports this mechanism; the runtime verifier
checks effective caching rather than assuming that an exported number proves ISR.

## Verification contract

The existing native journey verifier supplies one isolated production build:

- Make only Home's feed and Starter origin calls unavailable during build.
  Compilation must succeed with zero such reads. Other page/sitemap reads are
  counted separately, so a broad origin failure cannot disguise the result.
- Check the optional route's blocking static fallback in the build manifest.
  `/home` is absent from the pregenerated paths by design.
- First request with unavailable feed must not become a reusable successful
  empty page. Restore the origin and require real review and Starter content,
  canonical metadata, JSON-LD and headings in server HTML.
- Require first healthy generation MISS, next request HIT, effective
  `s-maxage=300`, and no origin reads on the cached response during an outage.
- `/home/unexpected` and a nested suffix must return 404/noindex without origin
  reads. Preserve the existing guest/simulated-session mobile/desktop matrix.

This does not exercise a full 300-second expiry or establish production-wide
percentiles, real authentication coverage or physical-device behavior. A later
expiry/regeneration observation must be described separately from cache-hit reuse.

## Boundaries and tradeoffs

The first request after an uncached deployment now pays origin/render work and
can fail if the origin is unavailable. A valid generated page remains reusable
under the existing ISR and data-cache policies. This is build isolation, not a
claim of faster cold requests or guaranteed origin availability.

Starter still permits a partial page through its existing optional fallback.
Its failed Data Cache fill is not stored as a successful empty catalog, but a
successful whole-page render may retain that partial representation until page
revalidation. This pre-existing policy is not changed or claimed fixed here.
Public/private clients, RLS, mutation invalidation, read deadlines and runtime
retry policy remain unchanged. No cloud SQL or production deployment is part of
this stage.

## Status

The baseline failure is reproduced. The candidate production build passes with
zero Home reads (one separate sitemap read). Its 80 WebKit checks pass, including
first-generation HTTP500 without a cached hit, healthy recovery with server HTML,
MISS then HIT with effective 300-second ISR, and two rejected suffixes. TypeScript
passes as part of the production build. Google indexing and latency improvements
are not claimed. Cloud CI and preview evidence belong to the delivery PR.
