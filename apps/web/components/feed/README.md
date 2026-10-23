# Feed

## Entry Points

- Route: `app/(main)/feed/page.tsx`; composition: `authenticated-feed-surface.tsx`.
- Views and lists: `feed-view-tabs.tsx`, `feed-review-list.tsx`.
- Discovery: `feed-starter-layer.tsx`, `feed-starter-shelf.tsx`, `feed-in-rotation-shelf.tsx`.
- Reads: `lib/queries/feed.ts`; client state: `queries/feed.ts`.

## Preserve

Reviews carry the hierarchy. Keep viewer-specific data outside public caches.
Starter picks are editorial prompts. Ranking and signal contracts live in
[discovery and curation](../../../../docs/discovery-curation.md).

## Check

Run tests, lint, and the web build. Check For You/Following/Trending, pagination,
empty and sparse feeds, optimistic review actions, and mobile rail placement.
Record an aggregate baseline before changing ranking.

## Authenticated read bundle

For You uses the authenticated-only `get_recommended_feed_bundle` RPC: existing
ranking, card hydration and caller-specific interaction flags in one statement.
It accepts no viewer ID and uses existing RLS. The page and API share this read;
API responses remain `private, no-store`. Guest For You requires authentication.
Latest/Following/Trending keep their existing paths. The shared viewer-state RPC
qualifies each requested review ID so one interaction cannot select every card.

### Local parity check

Use the pinned toolchain and a disposable Docker-backed Supabase stack. Apply
all migrations locally, including the viewer-state correlation fix. Keep cloud
credentials out of this run. This comparison creates disposable local users,
reviews, likes and bookmarks and leaves them in that local database.

1. Prepare a baseline worktree at main revision `93baae3` and the candidate branch,
   install frozen dependencies, and build both against
   `http://127.0.0.1:54321` with the stack's local publishable/anon key.
   Use the local key for the browser configuration; never use a service-role key.
2. Start baseline on port 3001 and candidate on port 3000 with
   `NODE_OPTIONS="--import=<candidate>/apps/web/tests/load/fixtures/isolate-upstreams.mjs --import=<candidate>/apps/web/tests/load/fixtures/observe-feed-reads.mjs"`.
   Replace `<candidate>` with its absolute repository path.
   Set `FEED_READ_TRACE_FILE` respectively to the absolute candidate paths
   `.codex-private/feed/baseline.jsonl` and `.codex-private/feed/candidate.jsonl`.
   Create that ignored directory and empty trace files first.
   Both servers need the same local Supabase URL and publishable key at runtime.
3. From the candidate root, run `pnpm perf:feed:seed`. The helper verifies the
   exact loopback API and Docker project label, creates/reuses marked local
   accounts, and writes login cookies to a mode-600 ignored fixture file.
   It seeds 10 profiles, 108 reviews, rating-only content and one selected card.
4. With no other traffic hitting those two builds, run `pnpm perf:feed:verify`.
   It compares three pages for each account, full API JSON, private flags and
   cursor continuity; checks one candidate Data API request per page; and verifies
   a guest receives no personalized data without a feed Data API call.

The baseline shares the corrected local SQL function so its old interaction bug
does not invalidate card/ranking parity. SQL regression tests separately prove
that correction. Counts establish reduced HTTP round trips; small loopback
latencies do not establish production P95, database throughput or user capacity.
See [stage evidence](../../../../.plan/authenticated-feed-read-bundle.md).
