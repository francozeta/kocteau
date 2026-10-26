# Canonical public read recovery

Coordination: [#260 / KOC-105](https://github.com/francozeta/kocteau/issues/260),
with measurement under [#263 / KOC-107](https://github.com/francozeta/kocteau/issues/263)
and parent #147. Baseline: main `52932a5` / PR #264.

## Contract

A successful identity lookup may return no result or an ambiguous legacy prefix.
Those cases retain their missing/canonical behavior. A failed lookup is a read
failure and reaches a recoverable route boundary instead of becoming absence.

Canonical review, track, album and artist resolvers opt into throwing on UUID
read errors and propagate short-ID errors. The existing ID helpers retain their
default nullable fallback for optional relationship and legacy callers. Their
`throwOnError` option changes the caller's error policy, not the cached key,
payload, tags or TTL. Public cache callbacks continue to reject failed fills;
viewer state remains outside those caches.

Review, catalog and existing feed/home boundaries share the established refresh
and reset control. Catalog routes supply their own short message and Retry
label. Metadata uses the same strict resolver; no read failure is passed to
`notFound` as a missing identity. Streaming may already have committed HTTP 200,
so verification checks the visible recovery state as well as the response.

The legacy review bundle API, provider fallback policy and optional relationships
retain their existing contracts. This is a canonical-route correction, not a
global rewrite of every nullable query helper.

## Verification

`pnpm perf:journey:verify` builds the actual app against loopback Data/Auth APIs
and a local telemetry collector. Guest and simulated-session cohorts use mobile
and desktop WebKit. The Auth SDK creates the session cookies; the fixture verifies
that private reads occur for that cohort and that public identity reads do not
carry its viewer token. This validates application wiring, not production Auth,
Postgres permissions or RLS.

Fault injection selects only the required public identity table; unrelated private
profile/Auth dependencies remain healthy. The all-REST failure observation has a
separate owner: [#265](https://github.com/francozeta/kocteau/issues/265).

The matrix exercises review 503, track 403, artist header timeout and album 503;
the user retries the same page after restoring the source. Cold UUID failed-fill
cases cover each resolver separately. Successful absence, malformed IDs and
ambiguous eight-character prefixes retain their intended behavior. Early invalid
IDs are checked by their HTTP 404 response; the framework may emit an empty body.

Expected renderer errors during deliberate origin failures are recorded separately.
Healthy navigation, body probes and recovery must remain free of page errors.
React error `419` is not claimed fixed by this work. Detailed reports stay ignored.

## Controlled navigation baseline

Use the existing external Playwright setup described in the
[Discovery guide](../apps/web/components/discovery/README.md), then run:

```sh
KOCTEAU_BASE_URL=https://kocteau.com pnpm perf:journey:baseline
```

The command uses one browser worker and fresh guest contexts, alternates viewport
sizes and records public list, Link-to-review, Link-to-track and Back milestones.
It accepts 2–24 samples through `KOCTEAU_JOURNEY_SAMPLES` (default 12).
`KOCTEAU_PLAYWRIGHT_MODULE` can point to the external Playwright installation.
Reports go to ignored `.codex-private/public-journey-baseline/`.

A twelve-journey production-URL run from gru1 before this correction had median
milestones of 719 ms for the public list, 460 ms for the review, 852 ms for the
track and 84 ms for Back. It used six samples per viewport and observed healthy
guest navigation. These are controlled measurements, not a speedup, RUM,
production-wide percentiles, server-cache coldness or concurrent-user capacity.

Recent selected slow logs show waits before response headers with very small
local queue times. Such records are sampled and biased; some work is background
revalidation. They do not identify SQL duration or establish a population P95.

## Remaining gate

Representative production distributions, signed-in production cohorts, physical
iPhone/TikTok, Canvas actions and load budgets remain under #263/#147. Short-ID
mapping/cache work is #259; bounded private viewer context is #265; primary track dependencies are #261. This correction
does not prove a latency reduction or 10,000-user capacity.
