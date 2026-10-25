# Canonical route latency

Read-only investigation under [#147](https://github.com/francozeta/kocteau/issues/147),
following production feedback about roughly two-second review/track navigation.
Observed main: `ecdbc9a`, deployment `dpl_HP7a2M1h259TPRjGzLmSL9ZPbVTX`, READY with
the production alias and configured region gru1. No application, schema or
hosting/cache configuration was changed for these measurements.

## Why the feed and detail differ

`getPublicReviewByRouteId` has React render cache, not persistent tagged cache.
A short route ID first selects the UUID, then awaits `getPublicReviewById`,
whose hydrated payload has its own 60-second cache. Feed/list payloads do not
populate that separate detail cache. A cold detail can therefore have two
serial origin reads; even a warm payload still requires the short-ID lookup.

`getEntityPageByRouteId` also has render-only caching, although UUID/provider
entity loaders have persistent caches. It already returns the resolved current
track, which the route correctly passes into the public bundle. A subsequent
UUID lookup may be the parent album; it is not proof of duplicated current-track
hydration.

The track route waits for public reviews, summary and taste tags alongside
artist/album context. Private viewer/library work starts after that batch.
Recommendations already use Suspense, but taste tags are awaited earlier inside
the public bundle. Optional-context latency can therefore remain upstream of
primary content even when recommendations themselves are deferred.

## Existing production evidence

At approximately 21:13 UTC on 25 Oct 2026, review ID-only responses of 47 bytes
took 960.3 and 2533.8 ms; header waits were 945.1 and 2533.4 ms. Track identity
returned 620 bytes in 1084.7 ms with 0.1 ms queue time. Another track request
logged private viewer state at 1300.2 ms, taste tags at 1196.1 ms and optional
recommendations at 1582.3 ms.

Some public reads were background stale revalidations. Do not sum all log
durations into foreground page time or count the Suspense recommendation task
as a primary-content blocker.

Separate read-only EXPLAIN ANALYZE/BUFFERS transactions, role anon, four-second
statement budget, measured:

| Public predicate | Planning (ms) | Execution (ms) | Buffer hits / reads |
| --- | --- | --- | --- |
| Review UUID by 12-character short ID, limit 2 | 21.884 | 0.733 | 2 / 0 |
| Track public identity by 12-character short ID, limit 2 | 15.981 | 1.922 | 3 / 0 |

These are two SQL samples, not application P95. They do not attribute the HTTP
wait to DNS/TLS, network, connection initialization or the Data API gateway.

## Bounded observations

Six sequential anonymous HTTP reads used a normal mobile Safari user agent,
existing caches, no purge/restart and a fifteen-second per-request deadline.
Headers, a primary JSON-LD data marker and body completion were timed separately.

| Route | First headers / marker / completion (ms) | Repeat headers / marker / completion (ms) |
| --- | --- | --- |
| Review list | 1152.8 / n.a. / 1230.5 | 100.5 / n.a. / 174.7 |
| One canonical review | 113.8 / 863.4 / 879.1 | 153.5 / 228.7 / 236.6 |
| Its canonical track | 74.5 / 490.1 / 887.2 | 67.0 / 181.1 / 303.0 |

The list uses a different card wrapper, so this diagnostic did not have a valid
list primary-content marker. This is not missing-content evidence.
All six responses were HTTP 200 with private/no-store whole-page headers and
x-vercel-cache MISS. That does not imply the public data cache was missed:
private pages can reuse tagged public data while adding caller state.

Decoded HTML sizes were about 626 KB for the list, 138 KB for the detail and
175 KB for the track. These are not compressed transfer sizes or hydration CPU
measurements, so no payload or rendering bottleneck is inferred from them alone.

A normal fresh anonymous mobile WebKit context then navigated with actual Links:
list→review reached the primary-data DOM marker in 1500 ms and review→track in
829 ms, with no page errors. This followed the six HTTP reads and used ordinary
prefetch, without throttling. It generated 95 resource requests, including 17
prefetch requests; those counts are not SQL-read counts or proof of saturation.
A bounded runtime-log lookup for one prefetch had no retained log, so no SQL
origin attribution is claimed for that prefetch.

This is neither a cache-cold benchmark nor authenticated/physical-iPhone
verification. JSON-LD marker attachment is data readiness, not measured LCP or
the first painted frame. Raw aggregate observations and scripts remain ignored
under `.codex-private/detail` and private scratch paths.

## Additional reliability finding

Review/entity route helpers return null after read failures, and their pages
or metadata call notFound on null. Production canonical album/artist identity
timeouts around three seconds were logged. For the shared entity/review helpers,
timeout→null→notFound follows current source control flow. A production 404 was
not deliberately forced or injected.

## Prioritized follow-ups

- [#259 / KOC-104](https://github.com/francozeta/kocteau/issues/259): collapse short
  review lookup/hydration and persist successful canonical public lookups;
  preserve collision checks, mutation invalidation, RLS and caller isolation.
- [#260 / KOC-105](https://github.com/francozeta/kocteau/issues/260): distinguish
  temporary read failures from genuine absence, including metadata and retry.
- [#261 / KOC-106](https://github.com/francozeta/kocteau/issues/261): separate track
  primary dependencies and overlap independent private state, preserving current
  editing/actions, counts, pagination, recommendation quality and geometry.

These are Todo/High, not delivered fixes. They should precede the next #243
pagination-budget stage in response to the new foreground-latency feedback.
#228/#242 and SQL-CI KOC-23 remain relevant. #229 retains explicit-query Search;
#254 remains the separate interrupted-prefetch investigation. No new cache
service, index or infrastructure expansion is justified by these measurements.
