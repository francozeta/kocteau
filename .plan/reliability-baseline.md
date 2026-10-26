# End-to-end reliability baseline

Owner: [#147](https://github.com/francozeta/kocteau/issues/147).
Active measurement work: [#263 / KOC-107](https://github.com/francozeta/kocteau/issues/263).
Baseline source: main `ecdbc9a`, checked 25 Oct 2026.
Status: telemetry/region audit and the first [tracing delivery](./journey-tracing.md) are verified locally; representative journey baseline and fixes remain pending.

## Decision

The maintainer prioritizes reliable, visibly fast core journeys before broader
discovery-experience work. Measure complete journeys, select changes from the
evidence, then verify the same journeys. Known recovery defects may receive
focused regressions while the broader investigation proceeds; their correction
does not certify whole-app performance.

The [canonical-route record](./canonical-route-latency.md) owns the existing
query-count and browser-failure reproductions. The
[capacity audit](./capacity-security-audit.md) owns the earlier incident.
Neither 24 test users nor a long wall-clock task establishes the current
concurrent-user ceiling or SQL execution time.

## Confirmed observability gaps

The default `lib/perf.ts` policy records tasks at/above 750 ms and a 1% sample of
the rest; public-read diagnostics cap at ten records/second/process. Runtime
overrides were not inspected. These logs help locate outliers but cannot directly
provide unbiased p50/p95 or complete error denominators. Existing browser/server
Sentry tracing defaults to 1% in production. Check the existing SDK/platform
coverage before adding instrumentation or another service.

The public transport already records queue, headers and body phases. Correlate
these with browser intent/content readiness and the server request. Distinguish
foreground, background revalidation and prefetch when attribution is reliable;
otherwise report unknown. Preserve bounded overhead and privacy protections.

Observed production Vercel configuration is `gru1` and Supabase project metadata
is `sa-east-1`, both São Paulo regions. This does not isolate transport/gateway
latency, actual routing or startup. A healthy project status is not a successful
Data API check.

## Critical journeys

| Journey | Required behavior to observe |
| --- | --- |
| Public home/reviews → review → track | Useful content, actual Link and direct navigation |
| Authenticated feed → detail → back | Ranking, caller flags and restored reading position |
| Feed pagination | Bounded work, cursor continuity and manual recovery |
| Canvas search → multiple artists → detail → back | Query, selection and canvas retained |
| Timeout/503/permission/empty results | Explicit, recoverable states and correct absence semantics |

Run guest/authenticated and mobile/desktop cohorts separately. Declare device,
network, source/deployment and observed cache conditions. A primary-data marker,
painted content, LCP and full body completion are distinct measurements.

## Three phases

1. **Diagnose.** Correlate complete requests and child reads; report p50/p95,
   errors, cancellations, sample size/window and sampling/suppression policy.
   Compare representative read-only SQL plans with bounded HTTP observations.
   Use complete counters or a representative journey sample, not slow-only logs.
   Attribute startup, local queue, HTTP wait, provider, SQL and rendering where
   evidence permits. Record unknowns and the next distinguishing experiment.
   Freeze numeric journey/error budgets and an initial realistic load envelope
   before judging performance changes.
2. **Redesign selectively.** Change the layer implicated by a reproduced delay
   or failure. Keep public data, private state, cache invalidation and recovery
   coherent. Capture the baseline before each change and preserve behavior.
   Shared admission controls, jobs, indexes or new infrastructure require measured
   need; they are not automatic phases inherited from the older scale plan.
3. **Verify.** Repeat the same scenarios and method against the candidate and
   baseline. Include mobile, real local sessions, multi-artist search, back
   navigation, interrupted/slow dependencies, deletes/edits and sustained recovery.
   Assert visible content/error states even when the HTTP response is 200.

Increase arrival rates and mixed read/write sessions only on isolated local or
staging data. Record queue depth, rejection/error rate, database connections,
CPU/memory and recovery, with a bounded stop condition. Bounded production reads
can observe actual delivery; shared production is not the saturation fixture.

## Exit to product-experience work

Core journeys must meet their recorded budgets under the declared workload,
retain state during navigation and show recoverable errors instead of false
missing/empty content. Compare before/after with the same cohort and method;
report meaningful regressions as well as improvements. Production P95 remains
unverified until a representative production sample exists.

The gate is a verified, realistic operating envelope for this stage. Ten thousand
simultaneous users remains a separate capacity target, not a prerequisite for
every product experiment. Keep the first product experiment small and selected
from [#245–#251](https://github.com/francozeta/kocteau/issues/251), centered on human
music discovery rather than visual polish alone.

## Existing follow-ups

Reuse #259/#260 for public canonical reads/recovery, #261 for track dependencies,
#243 for retry budgets, #228/#242 for cache consistency and #253 for browser CI.
Canvas scenarios enter #263 before a new unverified root cause or fix is proposed.
Product research stays in its existing lower-priority project. No implementation,
hosting/schema change or capacity result is delivered by this plan.
