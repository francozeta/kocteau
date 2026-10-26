# Current Project State

Last checked: 2026-10-26. The first tracing delivery is verified locally; end-to-end reliability remains the priority.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [architecture](./docs/core-architecture.md).

## Active Work

[#263 / KOC-107](https://github.com/francozeta/kocteau/issues/263), under #147,
owns diagnosis → selective redesign → repeated verification before broader
product experience. The [baseline plan](./.plan/reliability-baseline.md) owns
journeys and the exit gate.

The first technical delivery is [PR #264](https://github.com/francozeta/kocteau/pull/264)
(`perf/journey-observability`). It joins server
tasks and public HTTP phases to existing sampled request traces and makes the
existing SDK configuration reusable for isolated collection. Its
[delivery record](./.plan/journey-tracing.md) owns verification and limits.
It includes the research from draft PR #262. PR #264 owns integration and
deployment status; this handoff records source verification.

## Verified Scope

215 unit tests passed, including actual-SDK parentage, outcomes, concurrent
isolation, unsafe-context filtering and capture beyond the diagnostic log cap. TypeScript, lint, docs and
a native local production build are checked. Mobile/desktop WebKit joined
browser/server traces and observed independent header/body delays; homepage ISR
remains 300 seconds. Origin-failure probes still reproduce #260's false missing
page under HTTP 200; the desktop fault also emitted React #419. This delivery
instruments that behavior rather than claiming a recovery fix.

Representative production p50/p95, complete error accounting, Canvas action
traces, authenticated cohorts, reliable background attribution, SQL correlation
and mixed-load limits remain pending. Local timings are not production latency
or concurrent-user capacity.

## Previous Application Baseline

The baseline before this tracing delivery is [PR #257](https://github.com/francozeta/kocteau/pull/257)
at `6c7d4ca`, followed by main evidence `ecdbc9a`. The
[starter record](./.plan/starter-query-work.md) owns its CLI migration, 38-version
history, response parity and local SQL growth results. The
[feed bundle](./.plan/authenticated-feed-read-bundle.md),
[review recovery](./.plan/review-read-recovery.md) and
[primary rendering](./.plan/primary-render.md) remain integrated.
The global linked index_advisor/hypopg_reset lint failure remains documented;
public-schema checks for the previous delivery passed.

## Other Review Work

Studio scouting: [PR #211](https://github.com/francozeta/kocteau/pull/211), #206.
Release work: [PR #202](https://github.com/francozeta/kocteau/pull/202).
Released version: v0.3.15.

## Next

Collect representative critical-journey measurements and freeze numeric budgets.
#259/#260/#261, #243 and #228/#242 retain focused read/recovery/cache scope;
known correctness defects may be fixed alongside measurement. #253 owns browser
CI; #254 interrupted prefetch; SQL-CI KOC-23 and #256 scoring remain separate.
Physical iPhone/TikTok and 10,000-user capacity are unverified. Product experiments
#245–#251 remain behind the declared reliability gate.
