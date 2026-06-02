# Recommendation Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight recommendation health checks so maintainers can evaluate For You, starter picks, and discovery quality before tuning the ranking algorithm.

**Architecture:** Start with read-only, aggregate SQL checks documented for maintainers. Do not add a dashboard until the team approves a Supabase read path for safe aggregate analytics. If a web surface is approved, expose only grouped metrics through a curator-only route and never expose raw user-level analytics.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Postgres, existing `analytics_events`, existing starter curator access model, Markdown docs, optional SQL maintenance script.

---

## Scope Decision

Recommended first slice: **Phase 2A, operational health checks only.**

This gives maintainers useful signal immediately and does not require a Supabase migration, new RLS policy, service role key, or app dashboard.

Optional second slice: **Phase 2B, curator-only web health page.**

This requires explicit approval before touching Supabase because `analytics_events` currently grants inserts only. The app cannot safely read aggregate analytics without a new approved read path.

Execution note for `feat/recommendation-health`: the maintainer approved Phase 2A and Phase 2B. The implemented version uses a JSON aggregate RPC, a typed normalizer, `/studio/health`, and a curator-only Studio sidebar group.

## Files

Phase 2A:

- Create: `supabase/scripts/maintenance/recommendation-health-checks.sql`
- Modify: `docs/operations.md`
- Modify: `docs/discovery-curation.md`
- Modify: `docs/backlog.md`

Phase 2B, only after approval:

- Create: `supabase/migrations/20260601180027_recommendation_health_rpc.sql`
- Modify: `apps/web/lib/supabase/database.types.ts`
- Create: `apps/web/lib/queries/recommendation-health.ts`
- Create: `apps/web/lib/recommendation-health/metrics.ts`
- Test: `apps/web/lib/recommendation-health/metrics.test.ts`
- Create: `apps/web/app/(main)/studio/health/page.tsx`
- Create: `apps/web/components/recommendation-health-summary.tsx`
- Modify: `apps/web/app/(main)/layout.tsx`
- Modify: `apps/web/components/app-sidebar.tsx`

## Phase 2A: Read-Only Operational Checks

### Task 1: Add the SQL Health Playbook

**Files:**

- Create: `supabase/scripts/maintenance/recommendation-health-checks.sql`

- [ ] **Step 1: Create read-only SQL queries**

Add this script:

```sql
-- Kocteau recommendation health checks.
-- Read-only aggregate queries for maintainers.
-- Run in the Supabase SQL editor. Do not expose raw rows publicly.

-- 1. Daily For You feed load and fallback health.
SELECT
  date_trunc('day', created_at) AS day,
  count(*) FILTER (WHERE event_type = 'feed_loaded') AS feed_loads,
  count(*) FILTER (WHERE event_type = 'recommendation_fallback') AS fallbacks,
  round(
    count(*) FILTER (WHERE event_type = 'recommendation_fallback')::numeric
    / nullif(count(*) FILTER (WHERE event_type = 'feed_loaded'), 0),
    4
  ) AS fallback_rate
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type IN ('feed_loaded', 'recommendation_fallback')
GROUP BY 1
ORDER BY 1 DESC;

-- 2. Surfaced recommendation reasons.
SELECT
  metadata->>'reason' AS reason,
  count(*) AS impressions,
  min(created_at) AS first_seen_at,
  max(created_at) AS last_seen_at
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type = 'review_impression'
GROUP BY 1
ORDER BY impressions DESC;

-- 3. Review open rate by recommendation reason.
WITH impressions AS (
  SELECT
    metadata->>'review_id' AS review_id,
    metadata->>'reason' AS reason,
    count(*) AS impression_count
  FROM public.analytics_events
  WHERE created_at >= now() - interval '14 days'
    AND event_type = 'review_impression'
  GROUP BY 1, 2
),
opens AS (
  SELECT
    metadata->>'review_id' AS review_id,
    count(*) AS open_count
  FROM public.analytics_events
  WHERE created_at >= now() - interval '14 days'
    AND event_type = 'review_open'
  GROUP BY 1
)
SELECT
  coalesce(impressions.reason, 'unknown') AS reason,
  sum(impressions.impression_count) AS impressions,
  coalesce(sum(opens.open_count), 0) AS opens,
  round(coalesce(sum(opens.open_count), 0)::numeric / nullif(sum(impressions.impression_count), 0), 4) AS open_rate
FROM impressions
LEFT JOIN opens ON opens.review_id = impressions.review_id
GROUP BY 1
ORDER BY impressions DESC;

-- 4. Starter pick funnel.
SELECT
  date_trunc('day', created_at) AS day,
  count(*) FILTER (WHERE event_type = 'starter_impression') AS impressions,
  count(*) FILTER (WHERE event_type = 'starter_pass') AS passes,
  count(*) FILTER (WHERE event_type = 'starter_review_cta') AS review_ctas,
  count(*) FILTER (WHERE event_type = 'starter_review_published') AS reviews_published,
  round(
    count(*) FILTER (WHERE event_type = 'starter_review_published')::numeric
    / nullif(count(*) FILTER (WHERE event_type = 'starter_impression'), 0),
    4
  ) AS review_conversion_rate
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type IN (
    'starter_impression',
    'starter_pass',
    'starter_review_cta',
    'starter_review_published'
  )
GROUP BY 1
ORDER BY 1 DESC;

-- 5. Starter pick quality by track.
SELECT
  metadata->>'starter_track_id' AS starter_track_id,
  max(metadata->>'provider_id') AS provider_id,
  count(*) FILTER (WHERE event_type = 'starter_impression') AS impressions,
  count(*) FILTER (WHERE event_type = 'starter_pass') AS passes,
  count(*) FILTER (WHERE event_type = 'starter_review_cta') AS review_ctas,
  count(*) FILTER (WHERE event_type = 'starter_review_published') AS reviews_published
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type LIKE 'starter_%'
GROUP BY 1
ORDER BY impressions DESC NULLS LAST;

-- 6. Entity destination health.
SELECT
  metadata->>'entity_id' AS entity_id,
  max(metadata->>'provider') AS provider,
  max(metadata->>'provider_id') AS provider_id,
  max(metadata->>'type') AS type,
  count(*) AS opens
FROM public.analytics_events
WHERE created_at >= now() - interval '14 days'
  AND event_type = 'entity_open'
GROUP BY 1
ORDER BY opens DESC;
```

- [ ] **Step 2: Run a syntax-only smoke check**

Run:

```bash
git diff --check
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add supabase/scripts/maintenance/recommendation-health-checks.sql
git commit -m "docs: add recommendation health sql checks"
```

### Task 2: Document How Maintainers Should Read the Checks

**Files:**

- Modify: `docs/operations.md`
- Modify: `docs/discovery-curation.md`

- [ ] **Step 1: Add operations guidance**

Add this section to `docs/operations.md` near the starter/analytics operations content:

```md
## Recommendation Health Checks

Use `supabase/scripts/maintenance/recommendation-health-checks.sql` to inspect aggregate For You and starter health from the Supabase SQL editor.

These checks are read-only and should be interpreted directionally:

- `fallback_rate` above 0 means For You is falling back to latest reviews.
- Low review open rate by reason means a reason may be surfacing weak matches.
- High starter pass rate means a curated pick may be mistagged, too repetitive, or not editorially useful.
- Starter impressions without review CTAs may mean the pick is visible but not inviting.
- Entity opens show which tracks become discovery destinations.

Do not export raw analytics rows. Share only aggregate counts and rates.
```

- [ ] **Step 2: Add phase status to discovery docs**

Update `docs/discovery-curation.md` under Phase 2:

```md
Phase 2 starts as operational checks, not a dashboard. The first useful artifact is a read-only SQL playbook for maintainers. A curator-facing web page should wait until there is an approved aggregate read path for `analytics_events`.
```

- [ ] **Step 3: Verify docs formatting**

Run:

```bash
git diff --check
```

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add docs/operations.md docs/discovery-curation.md
git commit -m "docs: explain recommendation health checks"
```

### Task 3: Update Backlog Status

**Files:**

- Modify: `docs/backlog.md`

- [ ] **Step 1: Narrow the Recommendation Health backlog item**

Update the `Recommendation Health` section:

```md
Implementation path:

1. Add read-only aggregate SQL checks for maintainers.
2. Review a real 7-14 day snapshot after public traffic exists.
3. Decide whether a curator-only health page is worth the Supabase read-path migration.

Do not tune `get_recommended_review_ids` from vibes alone. Capture a before snapshot first.
```

- [ ] **Step 2: Verify docs formatting**

Run:

```bash
git diff --check
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add docs/backlog.md
git commit -m "docs: phase recommendation health work"
```

## Phase 2B: Curator-Only Health Page, Requires Supabase Approval

Do not start this phase until the maintainer explicitly approves a Supabase migration.

### Task 4: Design the Aggregate Read Path

**Files:**

- Create: `supabase/migrations/<generated>_recommendation_health_rpc.sql`

- [ ] **Step 1: Confirm the desired access model**

Decision to confirm before implementation:

```text
Only users where public.is_starter_curator() returns true can read aggregate recommendation health.
No raw user_id values are returned.
No raw analytics rows are returned.
All rows are grouped by day, event type, source, reason, entity_id, or starter_track_id.
```

- [ ] **Step 2: Create the migration with Supabase CLI**

Run:

```bash
supabase migration new recommendation_health_rpc
```

Expected: creates a timestamped file under `supabase/migrations`.

- [ ] **Step 3: Add an aggregate RPC**

Use this shape for the migration after reviewing current Supabase docs:

```sql
BEGIN;

CREATE OR REPLACE FUNCTION public.get_recommendation_health_snapshot(
  p_days integer DEFAULT 14
)
RETURNS TABLE (
  metric text,
  bucket text,
  value numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_starter_curator() THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT
    'feed_loads'::text AS metric,
    date_trunc('day', created_at)::date::text AS bucket,
    count(*)::numeric AS value
  FROM public.analytics_events
  WHERE created_at >= now() - make_interval(days => greatest(1, least(p_days, 90)))
    AND event_type = 'feed_loaded'
  GROUP BY 2

  UNION ALL

  SELECT
    'recommendation_fallbacks'::text AS metric,
    date_trunc('day', created_at)::date::text AS bucket,
    count(*)::numeric AS value
  FROM public.analytics_events
  WHERE created_at >= now() - make_interval(days => greatest(1, least(p_days, 90)))
    AND event_type = 'recommendation_fallback'
  GROUP BY 2

  UNION ALL

  SELECT
    'starter_reviews_published'::text AS metric,
    date_trunc('day', created_at)::date::text AS bucket,
    count(*)::numeric AS value
  FROM public.analytics_events
  WHERE created_at >= now() - make_interval(days => greatest(1, least(p_days, 90)))
    AND event_type = 'starter_review_published'
  GROUP BY 2;
END;
$$;

REVOKE ALL ON FUNCTION public.get_recommendation_health_snapshot(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_recommendation_health_snapshot(integer) TO authenticated;

COMMIT;
```

- [ ] **Step 4: Run security review before committing**

Run:

```bash
supabase db advisors
```

Expected: no new security warnings caused by the migration.

### Task 5: Add the Server Query

**Files:**

- Create: `apps/web/lib/queries/recommendation-health.ts`

- [ ] **Step 1: Add a typed query wrapper**

```ts
import "server-only";

import { measureServerTask } from "@/lib/perf";
import { supabaseServer } from "@/lib/supabase/server";

export type RecommendationHealthMetric = {
  metric: string;
  bucket: string;
  value: number;
};

export async function getRecommendationHealthSnapshot(days = 14) {
  return measureServerTask(
    "getRecommendationHealthSnapshot",
    async (): Promise<RecommendationHealthMetric[]> => {
      const supabase = await supabaseServer();
      const safeDays = Math.max(1, Math.min(days, 90));
      const { data, error } = await supabase.rpc(
        "get_recommendation_health_snapshot",
        { p_days: safeDays },
      );

      if (error) {
        console.error("[recommendationHealth.getSnapshot] failed", {
          code: error.code ?? null,
          message: error.message ?? null,
        });

        return [];
      }

      return (data ?? []).map((row) => ({
        metric: row.metric,
        bucket: row.bucket,
        value: Number(row.value),
      }));
    },
    { days },
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run:

```bash
pnpm --filter web build
```

Expected: build passes after `database.types.ts` includes the RPC.

### Task 6: Add a Quiet Studio Health Page

**Files:**

- Create: `apps/web/app/(main)/studio/health/page.tsx`
- Create: `apps/web/components/recommendation-health-summary.tsx`

- [ ] **Step 1: Add route protection**

Use the same access model as `/studio/starter`:

```tsx
import { notFound, redirect } from "next/navigation";
import RecommendationHealthSummary from "@/components/recommendation-health-summary";
import { getCurrentUser } from "@/lib/auth/server";
import { createPageMetadata } from "@/lib/metadata";
import { getStarterCuratorAccess } from "@/lib/queries/curation";
import { getRecommendationHealthSnapshot } from "@/lib/queries/recommendation-health";

export const metadata = createPageMetadata({
  title: "Recommendation Health",
  description: "Internal Kocteau recommendation health checks.",
  path: "/studio/health",
  noIndex: true,
});

export default async function RecommendationHealthPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const hasAccess = await getStarterCuratorAccess();

  if (!hasAccess) {
    notFound();
  }

  const metrics = await getRecommendationHealthSnapshot(14);

  return <RecommendationHealthSummary metrics={metrics} />;
}
```

- [ ] **Step 2: Keep the UI text compact**

```tsx
import type { RecommendationHealthMetric } from "@/lib/queries/recommendation-health";

type RecommendationHealthSummaryProps = {
  metrics: RecommendationHealthMetric[];
};

export default function RecommendationHealthSummary({
  metrics,
}: RecommendationHealthSummaryProps) {
  const latest = metrics.slice(0, 12);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 pb-8">
      <div className="space-y-1">
        <p className="text-[12px] font-medium text-muted-foreground/72">
          Studio
        </p>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Recommendation health
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Aggregate checks for For You and starter picks. No raw user analytics are shown.
        </p>
      </div>

      <div className="divide-y divide-border/18 rounded-[var(--kocteau-radius-card)] border border-border/24 bg-card/30">
        {latest.length > 0 ? (
          latest.map((metric) => (
            <div
              key={`${metric.metric}:${metric.bucket}`}
              className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {metric.metric.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">{metric.bucket}</p>
              </div>
              <p className="text-right font-mono text-sm tabular-nums text-foreground">
                {metric.value.toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No aggregate health signals yet.
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify**

Run:

```bash
pnpm --filter web lint
pnpm --filter web build
git diff --check
```

Expected: all commands pass.

## Manual Verification

Phase 2A:

- Open `supabase/scripts/maintenance/recommendation-health-checks.sql`.
- Confirm every query is `SELECT` only.
- Run the script in Supabase SQL editor against a non-production dataset first.
- Confirm results show aggregate counts only.

Phase 2B:

- Log in as a curator.
- Open `/studio/health`.
- Confirm the page loads aggregate rows.
- Log in as a non-curator.
- Confirm `/studio/health` returns not found.
- Confirm no raw `user_id`, email, IP address, user agent, or raw review body is visible.

## Recommended Branch Flow

Start Phase 2 only after Phase 1 is merged, or branch from `feat/analytics-signal-contract` and rebase after merge.

Suggested branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/recommendation-health
```

If Phase 1 is not merged yet:

```bash
git switch feat/analytics-signal-contract
git switch -c feat/recommendation-health
```

## Self-Review

- Spec coverage: covers fallback rate, action/open rates, starter usage, entity destinations, and safe aggregate handling. Read-depth metrics are intentionally not included in Phase 2A because `review_read_50` and `review_read_90` are documented but not yet instrumented.
- Placeholder scan: no open placeholder text is required for execution; the generated migration filename must come from `supabase migration new`.
- Type consistency: event names match `docs/discovery-curation.md` and the phase 1 analytics contract.
