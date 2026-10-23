# Scale readiness stages

Requested staged integration on 2026-10-23. Baseline main: `0ebf3d9`;
public-read branch: `ffc8e5a` ([PR #221](https://github.com/francozeta/kocteau/pull/221)).
Ten thousand active users is a target to validate, not established capacity.

1. Diagnose cold public reads: separate queue, headers and body time, bound diagnostic
   volume, reproduce native failure/cancellation cases, and inspect exact-preview
   observations before selecting a latency budget or integrating the read changes.
2. Profile authenticated feed reads and overlap independent work. Preserve ranking,
   pagination, viewer privacy, and permissions; record before/after counts and timing.
3. Coordinate refreshes and limits across instances using durable shared state.
   Confirm an existing staging target and migration/credential readiness before cloud
   schema delivery. Process-local limits alone do not protect deployment-wide load.
4. Move eligible secondary work to durable jobs with bounded workers, idempotency,
   retries and a recovery path. Keep acknowledged review writes transactional.
5. Verify database resource usage, queries, indexes and connection behavior with
   representative disposable data; size infrastructure from measurements.
6. Run mixed authenticated staging traffic at increasing arrival rates, including
   cache misses, hot items, writes, dependency failures and sustained recovery.
   Record latency, errors, queue growth and cost. Shared production is excluded.

## Active stage

Stage 1 now separates queue, headers and body for anonymous Data API reads.
Failures retain their phase/status, including a stalled body after HTTP 200 headers.
Diagnostics omit raw URLs/query values, use existing performance sampling, and
cap emitted records at ten per second per process with suppression counts.
180 tests, lint and production build pass. Exact-preview evidence remains pending;
the existing cold-read caveat stays open. Disposable local services are being
prepared for authenticated and SQL verification. Raw diagnostics remain ignored.
The owning status is [CURRENT](../CURRENT.md).

## Rollout boundaries

Each stage must have a reviewable change, relevant checks and truthful delivery
status. Existing behavior and services remain authoritative until replacement paths
are verified. New paid resources require a concrete cost and target decision.
A staging test is required before any ten-thousand-user capacity claim.
