# Public response timing breakdown — 2026-11-02

[Performance issue #263](https://github.com/francozeta/kocteau/issues/263) · [Public read-only smoke](../../apps/web/tests/smoke/public-read-only.mjs) · [Security baseline](../security/public-traffic-diagnostic-2026-11-02.md)

## Question

Does the original 2,267 ms `/reviews` result show an enduring 2.27-second
server delay, or slow completion after the browser could begin receiving HTML?

## Method and limitations

A single GitHub-hosted runner made five consecutive anonymous **GET** requests
to production; no retries, authenticated activity or load generation. The
modified smoke reports:
- `headersMs`: elapsed from Node `fetch` call to response headers, including
  any network setup, edge routing, cache lookup and origin time.
- `firstBodyByteMs`: elapsed until the first decoded response body chunk was
  read; a **proxy for body-byte arrival**, **not** browser FCP, LCP or exact
  network-level TTFB.
- `bodyTransferMs`: elapsed between response headers and full body reception,
  potentially including streaming, generation, compression and network transfer.
- `decodedBytes`: decompressed bytes received by Node; **not** actual
  Brotli-on-the-wire bytes, hydration JS weight or browser memory use.

The test is one anonymous navigation per route from an unspecified GitHub
runner location. Cache conditions, network paths and server workloads may
differ from an actual Lima-based iPhone. There is insufficient data to
estimate P75/P95 or make a cause claim. No page changes were performed.

## Results

[GitHub Actions run 41470176579](https://github.com/francozeta/kocteau/actions/runs/41470176579),
2026-11-02 15:18 UTC:

| Route | Status | Headers | First body chunk | Body after headers | Total | Edge cache | Decoded bytes |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| `/robots.txt` | 200 | 462 ms | 468 ms | 9 ms | 472 ms | MISS | 1,036 |
| `/sitemap.xml` | 200 | 1,276 ms | 1,277 ms | 2 ms | 1,278 ms | MISS | 19,540 |
| `/` | 200 | 1,148 ms | 1,150 ms | 5 ms | 1,153 ms | STALE (age 539s) | 411,496 |
| `/reviews` | 200 | 310 ms | 310 ms | 347 ms | 656 ms | MISS | 617,388 |
| `/track` | 200 | 486 ms | 486 ms | 173 ms | 659 ms | MISS | 79,506 |

Earlier [run 41468674583](https://github.com/francozeta/kocteau/actions/runs/41468674583)
reported total elapsed only: `/` 1,314 ms, `/reviews` 2,267 ms,
`/track` 684 ms, `/sitemap.xml` 1,269 ms, `/robots.txt` 282 ms.

A third bounded run
([41470574059](https://github.com/francozeta/kocteau/actions/runs/41470574059),
15:20 UTC) also passed all five GETs. Response first-body / total durations:
`/` 1,194 / 1,198 ms (**edge HIT**, age 153 s),
`/reviews` 407 / 537 ms (MISS),
`/track` 226 / 226 ms (MISS),
`/sitemap.xml` 269 / 269 ms (MISS),
`/robots.txt` 180 / 188 ms (HIT).

**Next priority from these samples:** The homepage had similar ~1.15–1.19 s
first-body delay in two successive runs even when the edge reported STALE and
HIT. This suggests a repeatable bottleneck in that runner-to-response
path, but a cache HIT alone does not distinguish CDN routing, protocol
connection, cross-region transfer, middleware or another cause. Record
network timing and POP/region before making a code or infrastructure change.
`/reviews` returned its first body chunk in 310–407 ms in the later two
runs, so reducing the review count would be an unproven UX optimization.

The two earlier requests for `/reviews` differed substantially (2,267 vs 656 ms);
**it is unsound to call 2,267 ms its typical or P95 latency**. In the second
sample, the HTML first chunk arrived in 310 ms, and subsequent body completion
took another 346 ms. The original delay could reflect transient server,
edge/cache or network variation; no trace links these runs to a cause.

The homepage first-byte wait (~1,150 ms) and the sitemap (~1,277 ms) should be
examined separately: a `STALE` edge cache header does not prove the origin
ran slowly, and the sitemap's wait is less relevant to visible UX.

## Source inspection and next discriminating experiment

- `apps/web/app/(home)/page.tsx` already streams recent reviews and
  editorial sections inside independent Suspense boundaries. Do **not** undo
  that architecture or optimize total HTML completion at the expense of
  first useful content.
- `apps/web/app/(main)/reviews/page.tsx` awaits viewer identity before
  starting the public feed query and renders up to 14 cards plus interaction
  components. A separate benchmark is needed before claiming these
  dependencies explain the anonymous response.
- `apps/web/lib/queries/feed.ts` uses shared cached public feed reads and
  separates viewer flags. Do not cache viewer-specific state publicly.
- `@vercel/speed-insights` is already integrated into `app/layout.tsx`.
  Measure real anonymized browser **LCP, FCP, INP and TTFB by route/device**,
  with sample counts, before modifying UI or caching.
- #263 defines the primary measurement contract. Record at least meaningful
  repeated visits / navigation cases (mobile Lima network, guest and signed-in
  when permitted) and local/staging fixtures to attribute server waits.
- Correlate the slow real-world requests with Vercel request traces,
  `public-read` header/body spans, cache disposition and Supabase errors.
  Separate `stale-while-revalidate` background errors from foreground waits.

## Decision

No performance optimization claimed; no firewall, CSS, infinite scroll,
cache policy or infrastructure setting changed. **Do not add Cloudflare
proxy** based on this evidence. A selective application fix should follow a
measurable bottleneck and use the same before/after comparison.
