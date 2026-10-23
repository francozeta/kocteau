# Anonymous review read recovery

Baseline: main `b66930d` on 2026-10-23.
Incident: [#240](https://github.com/francozeta/kocteau/issues/240), under
[#147](https://github.com/francozeta/kocteau/issues/147).

## Confirmed boundary

Production logged a public reviews deadline failure on `/reviews`.
An anonymous WebKit visit rendered no cards with HTTP 200 while the public feed
API returned eight reviews. An aggregate database read confirmed existing reviews;
this is a read/render failure, not evidence of deletion.

`runReviewListQuery` returned an empty list on error, inside the shared feed cache.
Different page sizes have independent keys, explaining how one list could be empty
while another worked. The public route had no distinct error or empty state.
This path predates PR #239, which changed starter/provider loaders.

## Correction

The feed query opts into propagating list-read errors. Failure escapes the cached
callback; genuine successful emptiness remains cacheable. The cache namespace
changes once to stop reusing empty entries produced by the previous error path.
TTL, tags, ordering, hydration, public filters and viewer-state boundaries remain.

Reviews, feed and public-home error boundaries provide manual refresh/retry.
The reviews page labels genuine successful emptiness separately. Feed API read
failures return private, non-cacheable HTTP 503 without a successful empty payload.
There is no new automatic origin retry or change to the three-second read budget.

The CI build uses an explicit successful-empty Data API fixture with its existing
placeholder URL/key. It no longer relies on failed reads being converted to empty
successes. The fixture rejects other credentials, unexpected remote operations and
writes. Vercel builds do not load this CI-only preload; public-home ISR stays enabled.

## Verification

Four regression checks load the actual feed query, real Next unstable_cache and
the pinned PostgREST client with isolated cache storage and synthetic responses.
The two error/recovery checks fail against the baseline and pass after correction.
Other checks preserve cacheable successful emptiness and bounded, separated reads.
The cache adapter forces refresh outside a React render; this does not test timed
expiry or the distributed platform cache.

The browser verifier copies the actual app into a disposable ignored Next project,
uses a loopback Data API and blocks other browser/server upstreams. It creates no
accounts or production activity and does not read project environment files.
It checks guest failure/retry with visible cards, API 503, recovery/warm reuse
during an origin outage, and legitimate empty HTTP 200.

Use the Playwright installation from the
[discovery browser setup](../apps/web/components/discovery/README.md).
With `KOCTEAU_PLAYWRIGHT_MODULE` pointing to that installation:

```bash
node apps/web/tests/load/verify-review-recovery.mjs
REVIEW_RECOVERY_DESKTOP=1 node apps/web/tests/load/verify-review-recovery.mjs
```

The verifier uses WebKit at mobile or desktop dimensions. These are behavioral
fixtures, not a physical iPhone check, SQL benchmark, cold-latency measurement or
capacity test. Production verification must assert visible review cards and
public API content, not only an HTTP 200 or successful navigation.

## Delivery

CURRENT.md and GitHub own actual review/deployment status. No migration, RLS change,
auth change or ranking change belongs to this delivery. Cold Data API reliability
remains under #147; #228 and the separate feed consumer PR #222 stay independent.
