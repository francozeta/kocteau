# Journey tracing: first technical delivery

Issue: [#263 / KOC-107](https://github.com/francozeta/kocteau/issues/263), under #147.
Source baseline: main `ecdbc9a`. This is subphase 1A of the
[end-to-end baseline](./reliability-baseline.md), not the complete latency diagnosis.

## Scope

Reuse the installed Sentry SDK and request-level sampling. Existing
`measureServerTask` callers become child spans; each completed public Data API
observation creates a child span with its measured duration, queue/header/body
phases, outcome, HTTP status and payload size. These are HTTP round trips, not
SQL execution times. Task logs include generated trace/span IDs when recording.

Traces are independent of the biased slow-log filter and diagnostic burst cap.
They still obey the SDK's root sampling and span/event limits; no population
percentile or complete error denominator is inferred from diagnostic logs.
Calls without an active request do not create unrelated root traces. Parallel
request contexts remain separate. Foreground/revalidation attribution is explicitly
unknown. Background tasks that outlive the parent request require later work.

Manual spans contain logical task/table/RPC names and bounded timing/status
attributes, without caller context, query text, raw URLs or credentials.
Existing SDK automatic instrumentation retains its own behavior.

The installed Next SDK already configures client trace metadata for Next 15+.
No root-layout metadata change or new client measurement framework is needed
for this delivery. Query results, retries, transport deadlines and caches are
unchanged. No database migration or new telemetry service is introduced.

## Configuration

One shared configuration owns browser, Node and edge settings. Production
defaults retain the existing project, 1% tracing, disabled structured logs and
`sendDefaultPii: false`. Public DSN/rate overrides permit controlled local
collection without emitting synthetic events to the production project.
The [environment guide](../docs/security/environment.md) owns variable semantics.
Existing performance-log controls do not disable SDK tracing.

## Verification

Unit verification: 215 tests passed, including actual-SDK in-memory transport
checks for nested parentage, timing attributes, 50 reads beyond the log cap,
error identity, cancellation, parallel isolation and no orphan root traces.
TypeScript and lint are checked separately. The browser verifier includes a real
production build and asserts the public homepage retains 300-second ISR.

The portable verifier refuses application environment files, starts only
loopback services, uses dummy credentials, overrides telemetry to its local
collector and prevents external browser/fetch dependencies. It observes normal
Link/back navigation, visible review/track content, synthetic header/body delays,
an origin failure and same-route recovery. Status-only success is insufficient.

Install Playwright externally as described by the
[Discovery guide](../apps/web/components/discovery/README.md), then run:

```sh
KOCTEAU_PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
PLAYWRIGHT_BROWSERS_PATH=/absolute/path/to/browsers \
pnpm perf:journey:verify
```

Aggregate output is printed and stored under ignored `.codex-private/journey-tracing`.
Small deterministic fixture timings are not production p50/p95, LCP, physical
iPhone results, authenticated coverage or capacity. This verifier observes
#260's error-state behavior; it does not claim that defect has been fixed.

The completed local production-build run on 26 Oct 2026 recorded
30 public-read spans and 12 trace IDs joined to browser transactions or
propagated browser requests. The fixture made 4 build-time and 38 runtime origin
calls; these are separate populations, and the manual-span count is not claimed
as complete transport coverage. Header and body delay assertions passed, and
the homepage retained 300-second ISR. Healthy navigation/body/recovery had no
page errors. The deliberately failed desktop render also emitted React #419;
both sizes showed the existing false missing page with HTTP 200 under #260.

Normal Link/back flows are measured separately from fresh-document origin probes.
Interrupted hard-document/prefetch behavior remains under #254; the verifier
does not certify that separate scenario. The broader
baseline remains open: representative production observations, Canvas action
traces, authenticated cohorts, reliable background attribution, SQL correlation,
numeric journey budgets and a declared mixed-load envelope.

## Verifier safety and coverage

The isolated collector rejects malformed gzip envelopes with HTTP 400 and remains
available for valid SDK traffic. The verifier checks that rejection before the
browser journeys, scans manual span values for URL, host, credential, query and
content canaries, and observes propagated requests across every page in each
browser context. Propagation counters do not imply complete transport coverage.
