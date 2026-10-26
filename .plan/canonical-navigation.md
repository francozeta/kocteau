# Canonical navigation reads

Owner: [#259 / KOC-104](https://github.com/francozeta/kocteau/issues/259).
Reliability parent: [#263](https://github.com/francozeta/kocteau/issues/263).

## Decision and scope

The current user priority is actual content-visible navigation latency. Reuse
confirmed public data and remove serial origin work before changing presentation.
This delivery changes no optimistic UI, schema, RLS, transport timeout or viewer
cache policy.

A short review ID now selects its full public row, author and entity together.
Review and entity short-ID results use bounded loader registries and a 60-second
Next Data Cache entry per normalized route ID. UUID readers retain their existing
cache policy. IDs are case-normalized; invalid, missing and ambiguous identities
remain distinct from thrown read errors. Successful absence can be cached;
failed fills throw and remain retryable. An existing valid entry can survive an
origin outage.

Canonical mutation invalidation expires the UUID and short-route entries
immediately for review creation, editing and deletion. Creation also expires the
entity identity read after its update. The invalidation tag groups the first eight
ID characters, covering 8/12-character aliases and legacy prefix collisions;
the data cache key still uses the complete requested ID, so identities never share
a value. Global list/feed invalidations retain their existing policy. Public
caches never include session or viewer data.

Artists are unchanged because catalog invalidation still belongs to #228.
Private viewer-context fault waits (#265), secondary track dependencies (#261),
and React 419 attribution (#267) remain separate.

## Verification

`pnpm perf:canonical:verify` runs actual query modules in an isolated Next route
handler against loopback synthetic Data API rows. The temporary probe application
lives only under ignored `.plan/local/`; it is never a product route.
Set `CANONICAL_CACHE_BASELINE_REF=62763aadf957bad8e8b36fa28645d630eb56b144`
to load the old query modules for the same read-count experiment.

Observed origin reads: review cold 2 -> 1, review repeat 1 -> 0, entity cold
1 -> 1, entity repeat 1 -> 0. Candidate checks cover source failure with valid
cache, failed fill/recovery, edit/delete across UUID/12/8 aliases, creation after
cached absence, ambiguous legacy prefixes, and entity updates across all three ID forms. Synthetic 180 ms delays establish
causal I/O savings, not production percentiles; dev compilation timings are not
compared.

`pnpm perf:journey:verify` covers real production-mode Next rendering and WebKit,
guest/simulated authenticated, mobile/desktop, normal navigation and forced
failures. Fault and body-delay probes use unique identities per cohort so valid
cached content cannot accidentally bypass a cold-error assertion. Existing
narrowly recorded forced-render 419 evidence is unchanged; production telemetry
is not filtered. The candidate passes 216 unit tests, lint, TypeScript, docs/link
validation and the 60-record native browser matrix (20 failure/retry cases).

## Production comparison

`pnpm perf:journey:baseline` accepts `KOCTEAU_REVIEW_PATH`, records both canonical
paths and waits for actual review content and track heading. Pin the same review
for before/after, use the same VM/region and viewport sequence, and avoid concurrent
builds. Fresh browser contexts do not prove origin cache coldness.

Before: 2026-10-26 14:17 UTC, source `62763aad`, 12 sequential guest WebKit
journeys from gru1. Review `/reviews/f81673e3557c/sea-swallow-me-cocteau-twins`;
track `/tracks/sea-swallow-me-cocteau-twins/806fa97db9d4`.
Median visible-content times: list 815 ms, review 486 ms, track 891 ms, Back 105 ms.
P95 in this bounded sample: 971 / 526 / 965 / 161 ms respectively.
These are controlled measurements, not RUM, physical iPhone/network, authenticated
production or capacity coverage. [PR #268's rollout record](https://github.com/francozeta/kocteau/pull/268#issuecomment-6418785667)
owns merge/deployment confirmation and the after-deployment comparison.
Raw reports are ignored under `.codex-private/navigation/`.
