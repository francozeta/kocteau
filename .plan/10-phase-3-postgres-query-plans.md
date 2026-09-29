# Phase 3 — Postgres query plans

Date: 2026-07-22
Branch: `perf/postgres-query-plans`

## Production baseline

- PostgreSQL 17.6.
- Database size: about 20 MB.
- Index and table cache hit rates: 1.00.
- Largest public table: `analytics_events`, about 6.9k estimated rows.
- Product tables remain small: 22 entities, 21 profiles, 17 reviews, and 16 notifications.
- The two high-call entity lookups average about 0.15 ms each. Their request count, not their individual execution time, was the resource issue addressed in phase 2.

## Representative plans

All plans were measured with `EXPLAIN (ANALYZE, BUFFERS)` against the linked database.

| Query | Execution | Buffers | Decision |
| --- | ---: | ---: | --- |
| Latest reviews | 0.81 ms | 8 hits | Keep current `(created_at desc, id desc)` index; sequential scan is correct at 17 rows. |
| Top-rated reviews | 0.15 ms | 11 hits | Keep current rating cursor index; sequential scan is correct at 17 rows. |
| Reviews by author | 0.13 ms | 10 hits | Keep current author cursor index; sequential scan is correct at 17 rows. |
| Entity provider/type/id lookup | 0.08 ms | 2 hits | Existing unique composite index is sufficient. |
| `get_recommended_review_ids(21, …)` | 42.21 ms | 2,087 hits | Do not change ranking semantics without a larger fixture and focused before/after plan. |
| `get_starter_tracks_for_surface(6, …)` | 81.91 ms | 2,521 hits | Do not change editorial rotation semantics in this migration. Revisit with realistic load data. |

## Advisor evidence

Before the migration, the linked Performance Advisor reported:

- 29 `multiple_permissive_policies` findings.
- 27 `auth_rls_initplan` findings.
- 4 byte-for-byte duplicate review indexes.
- 4 unindexed foreign keys.
- 17 unused-index notices, which are intentionally not acted on because the database is small and the statistics horizon is not representative of future product traffic.

## Implemented migration

`20260722171420_optimize_rls_and_indexes.sql`:

- Consolidates equivalent RLS policies while preserving the current read/write matrix.
- Uses `(select auth.uid())` so Postgres creates one init plan per statement rather than invoking it per row.
- Removes only duplicate review indexes, retaining the member of each pair with real production scans.
- Adds covering indexes for the four foreign keys identified by the advisor.
- Handles the environment-specific realtime policy and private OTP table conditionally so clean migration replay remains valid.

## Verification

- Full migration executed against the linked database inside an explicit transaction and rolled back successfully.
- Assertions inside that transaction verified:
  - exactly 29 canonical policies across the targeted tables;
  - zero uncached `auth.uid()` expressions in those policies;
  - all four duplicate review indexes removed;
  - all four advisor-requested foreign-key indexes present.
- A separate post-rollback query confirmed the linked database remained unchanged.
- `supabase db push --linked --dry-run` selects only this migration.

## Deferred deliberately

- Recommendation and starter RPC rewrites: correctness and editorial behavior are more important than optimizing against 17 reviews and 131 starter tracks. Build a representative fixture first.
- Unused-index removal: wait for a fresh and representative `pg_stat_user_indexes` window.
- SECURITY DEFINER grant warnings: audit separately as an authorization phase; several functions are intentionally callable product RPCs.
