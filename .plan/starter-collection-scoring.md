# Starter collection scoring

Scope: local correction of [#256](https://github.com/francozeta/kocteau/issues/256).
Baseline: `main@37138e7`. No cloud migration or product deployment is included.

## Behavior

Collection membership previously multiplied the joined tag rows before taste was
summed. A second membership could increase a pick's taste score even when that
collection was unpublished. `matched_tag_count` used `DISTINCT`, hiding the
duplication in that counter.

Migration `20261116161623_starter_collection_taste_aggregation.sql` aggregates
matched taste and published collection metadata separately to one row per pick,
then joins those aggregates before ranking. The existing published-collection
bonus applies once. Source lanes, rotation, provider/review exclusions, limits,
narrow ranking rows and late content hydration retain their existing policy.

The function signature, return columns, volatility, owner context and empty
search path are unchanged. `CREATE OR REPLACE` preserves the target environment's
execute grants; the migration does not grant anonymous access or alter RLS.

## Verification

`supabase/tests/database/starter_collection_scoring.test.sql` contains 18 pgTAP
checks for taste invariance, published/unpublished membership, metadata choice,
content hydration, exclusions, deterministic context and caller separation. The
original function fails four of those checks; the replacement passes all 18.

The existing `starter_surface.test.sql` passes its 14 checks. All nine database
test files pass together, with 72 TAP results across the suite. Tests run in
transactions and roll back their fixtures.

Verification used local PostgreSQL 17.11 with the repository's 38 baseline
migrations followed by the new migration. The local harness supplied minimal
`auth`/`storage` schema prerequisites and the same claim/role interfaces needed by
the SQL tests. It did not run GoTrue, PostgREST, Realtime or the Docker-backed
Supabase stack, and does not establish browser/auth-service behavior. No
commercial database was contacted or modified.

For the standard local Supabase workflow, replay migrations on a disposable
stack and run the database suite following [local development](../docs/setup/local-development.md)
and [maintainer workflow](../docs/maintainers/supabase-workflow.md). Cloud delivery,
remote history/advisors and regenerated target types remain separate delivery
work. The SQL function's public TypeScript contract does not change.

Single-collection fixtures compare complete ordered responses for 36 cases:
three caller states, nine surfaces, limits, context normalization and exclusions.
These checks preserve the existing policy where membership does not multiply
taste. Multi-collection output intentionally changes, as covered by pgTAP.
Raw plans and fixture output stay ignored; small shared-workstation plan samples
are not production latency estimates or a measured performance improvement.
