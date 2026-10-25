# Starter query work

Issue: [#230](https://github.com/francozeta/kocteau/issues/230).
Baseline: main `fe205a1`. This stage measures editorial starters separately from
review-feed reads.

## Change and contract

The existing cloud body matches the June source-rotation migration after CRLF
normalization (body MD5 `e6d0aa60754d9a4dff3c39893c09dac0`).
The new migration keeps nine wide public-content columns outside tag/collection
aggregation and both ranking windows, then hydrates bounded lane candidates by
primary key. At limit six, the measured growth plan fetched content for ten
candidates and returned six. Scoring still considers every eligible track.

CREATE OR REPLACE preserves the existing signature, owner and execute grants.
Scores, source quotas, daily rotation, exclusions, metadata and caller taste
remain unchanged. The stable definer function retains an empty search path.
Production already permits anon execution; the local migration chain does not.
Do not change these existing permissions incidentally.

## Cloud baseline: 25 Oct 2026

Read-only inspection found 133 tracks/129 active, 743 tag links, one published
collection/133 memberships, one active source/99 items/90 eligible items, and
90 preference rows across 19 viewers. No production data was copied into fixtures.

Four-second read-only transactions captured EXPLAIN ANALYZE BUFFERS with node
timing off. Expanded home/6 SQL measured 6.827 ms execution plus 6.059 ms planning:
127 ranked tracks, 720 intermediate join rows and 79 shared-buffer hits/no reads.
It ran as the function owner with a taste-bearing caller claim and literal
arguments, rather than a real browser session.

Actual authenticated SQL function calls measured 290.880 then 136.288 ms for
home/6, and 15.724 ms for search/4. An anon/no-UID track/6 call measured 18.037 ms.
These few separate samples had buffer hits and JIT off. Function Scan hides
nested plans; expanded literal SQL is not identical to a planned function call.
These measurements establish neither production P95 nor the cause of variation.

Ordered public-payload hashes/counts were captured before delivery for home/6,
search/4 and track/6 under authenticated/taste and anon/no-UID SQL roles.
No viewer identifiers or response bodies are published.

## Local reproduction

Start the pinned CLI's Docker-backed local stack with current migrations, then:

```sh
pnpm perf:starter:verify
STARTER_BENCH_TRACKS=2000 STARTER_BENCH_COLLECTIONS=3 pnpm perf:starter:verify
STARTER_BENCH_TRACKS=10000 STARTER_BENCH_COLLECTIONS=3 pnpm perf:starter:verify
pnpm exec supabase test db
```

The verifier requires the local Unix Docker socket and exact Kocteau database
container/project label. It accepts no remote connection or cloud credentials.
Marked synthetic users/tracks and both function definitions exist only inside
one transaction that rolls back. A failed connection closes the transaction too.
Run without concurrent fixture writes. Only Node and the container's psql are used.

Each dataset has six tags per track, a taste-bearing viewer with an additional
preference source, another viewer without taste, and a no-UID case under the
authenticated SQL role. Three-collection fixtures include two published and one
unpublished collection. Seventy percent of tracks have an active source; one has
a caller-owned review. Synthetic covers/prompts/notes have nonempty wide content,
which materially affects sort costs.

Thirty-six complete ordered JSON comparisons per dataset cover nine surfaces,
viewer switching, duplicate taste sources, both lanes, scores, metadata, limits,
context normalization and provider/review exclusions. All 108 matched.
The same local four-vCPU/eight-GiB machine and Postgres 17.6 measured:

| Tracks / memberships each | Warm RPC before → after (ms) | Largest expanded sort before → after (KiB) | RPC temp blocks written before → after |
| --- | --- | --- | --- |
| 129 / 1 | 8.939 → 8.453 | 718 → 207 | 0 → 0 |
| 2,000 / 3 | 231.450 → 155.996 | 31,520 → 7,344 | 3,948 → 920 |
| 10,000 / 3 | 1,079.531 → 677.330 | 157,832 → 36,712 | 42,411 → 4,601 |

The largest warm RPC sample improved about 37%; temporary-block writes fell
about 89%. These are small local samples with warm/shared buffers, not P95,
a database-cold test or concurrent-user capacity. The current-sized fixture's
absolute gain is small. Ten thousand tracks do not mean ten thousand users.

Ignored `.codex-private/starter` owns raw plans. Fourteen SQL regression checks
cover content hydration, limits, exclusions, distinct matches, determinism,
caller isolation and existing local privileges. The local suite passes eight
files/54 checks, plus 202 web tests, actual TypeScript checking, web lint and
public-schema SQL lint.

## References and follow-up

[Bluesky's guide at fd3d7f8](https://github.com/bluesky-social/bsky-docs/blob/fd3d7f8bae5b5fb407afd715bc3cc06e1fafc1ee/docs/starter-templates/custom-feeds.mdx)
describes a feed skeleton of identifiers followed by content hydration.
Kocteau applies the useful boundary inside its existing PostgreSQL statement.

[Supabase's function-plan guide](https://supabase.com/docs/guides/troubleshooting/running-explain-analyze-on-functions)
explains Function Scan and transaction-scoped auto_explain. Nested-plan
inspection was local only; no production logging/module changes were needed.

[#256 / KOC-102](https://github.com/francozeta/kocteau/issues/256) records a
separate reproduced defect: collection membership, even unpublished, multiplies
tag contributions. Removing one local unpublished membership changed one fixed
score by 4.075. This optimization preserves that current score contract.
Production currently has one collection; no multi-collection incident is claimed.

## Delivery and limits

Pinned CLI 2.109.1 applied only `20261025203107_starter_late_hydration.sql`
after the reviewed dry run against the existing Kocteau target. All 38 versions
match local/remote history and linked type generation has no diff. Cloud body
MD5 is `cbb05f2989eb568f61699c0d572273e0` and its normalized definition matches
the reviewed migration. Existing owner, grants, volatility and search path remain.
All six before/after output hashes matched. After-delivery home/6 samples measured
14.526 ms authenticated and 15.367 ms anon; these few separate observations do not
establish a controlled production speedup. Advisor findings are unchanged. Linked schema lint still exits nonzero in the
existing index_advisor/hypopg_reset extension check; it reports no changed starter
function finding. Local public-schema lint passes; the global cloud caveat remains.

Four actual local-session WebKit contexts passed mobile/desktop feed rendering,
pagination, view changes and reversible like/save actions, without page or starter
loader errors. The runtime web source is unchanged; its existing production build
was exercised against the migrated local database. Repository CI/preview and
main integration remain to be recorded.

The public homepage uses a separate public starter loader and ISR; this change
does not establish a homepage TTFB benefit. Authenticated production browser
latency remains unverified. Next: #243 pagination retry budgets, then #228/#242
cache consistency; #256 remains a separate scoring decision.
