# Phase 4 — Recommendation pipeline

Branch: `perf/recommendation-pipeline`

## Objective

Keep `For You` explainable while bounding the database work per request. The public RPC, cursor shape, ranking weights, reasons, and editorial fallback stay compatible.

## Baseline

- `get_recommended_review_ids` is the dominant recommendation query in `pg_stat_statements`.
- Historical means are roughly 137–239 ms across more than 1,600 calls.
- The current function scores every eligible review from the last 365 days before pagination.
- The web layer already hydrates recommendations in one batched query; there is no N+1 in this path.
- Public starter tracks already use a shared 15-minute cache and do not belong in this rewrite.

## Change

1. Build a bounded candidate pool from the newest eligible local reviews.
2. Apply the existing taste, follow, familiarity, affinity, quality, diversity, reason, cursor, and limit logic only to that pool.
3. Preserve a generous 480-candidate floor (up to 720 for large pages), so the normal feed has roughly sixty pages of local material before the cap matters.
4. Keep all external APIs outside the critical path.
5. Add transactional pgTAP coverage for access, own-review exclusion, reason precedence, the editorial window, and bounded public pages.

## Guardrails

- No Redis, vector search, snapshots, or new infrastructure in this phase.
- No changes to auth, onboarding, RLS behavior, response shape, or UI copy.
- No per-user Next.js Data Cache until every taste/like/bookmark/follow mutation has precise invalidation.
- Do not remove low-usage indexes from a tiny database based on immature statistics.

## Verification

- Compare the current production fixture before and after inside a rolled-back transaction.
- Run the migration through the linked database with an explicit rollback.
- Run linked pgTAP tests, database lint/advisors, web lint/build, and `git diff --check`.
- Record `EXPLAIN (ANALYZE, BUFFERS)` for the representative viewer.

## Results

- Current production fixture: identical IDs, scores, reasons, and order before/after.
- Warm current fixture: 8.39 ms before, 8.47 ms after (effectively neutral while the catalog is tiny).
- Rolled-back 1,000-review fixture: 28.37 ms before, 16.71 ms after (~41% faster).
- Linked migration dry-run: only `20260722174307_bound_recommendation_candidates.sql` would be applied.
- Linked pgTAP SQL completed inside `BEGIN/ROLLBACK`; the Docker-backed `pg_prove` wrapper remains unavailable until Docker Desktop is running.
