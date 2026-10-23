# Public read cache recovery

Baseline: main `f695d7f` on 2026-10-23. Delivery is tracked by
[#147](https://github.com/francozeta/kocteau/issues/147).
This stage addresses [#226](https://github.com/francozeta/kocteau/issues/226)
and [#227](https://github.com/francozeta/kocteau/issues/227).

## Changes

Public starter reads throw origin failures from inside the existing tagged cache.
Their optional empty fallback stays outside it. Successful empty catalogs remain
valid cache entries; failed fills and refreshes cannot store a false empty result.
The existing error log, rotation, limits, tags and anonymous client remain.

Provider identity lookup uses React cache with primitive provider/type/id
arguments. Metadata and page can share its work in one server render, including
a recovered failure. Persistent Next caching stays underneath, and a subsequent
render can recover. Public-read deadlines, AbortSignal, private state and schema
are unchanged. Route handlers outside a React render gain no request memoization.

The explicit boundary matters: Next 16.3.0 bypasses automatic fetch deduplication
when an AbortSignal is supplied. Removing that signal would lose the existing
cancellation/deadline guarantee, so reuse belongs at the query level.

## Verification

The starter regression uses real Next 16.3.0 unstable_cache and the pinned
PostgREST SDK, backed by isolated in-memory cache storage and synthetic responses.
It exercises a forced refresh outside a React render. It does not test expiry,
the platform's distributed cache backend or production stale-while-revalidate.

- The original starter implementation fails both recovery regressions.
- The changed implementation passes four checks: failed first fill can recover;
  failed refresh preserves the previous entry; successful empty data is reusable;
  contexts remain independent and the public query stays bounded.
- A failed first call plus successful recovery uses two origin reads. Repeating
  the successful call adds none; this is a correctness/read-count fixture.

The provider verifier starts a disposable Next server and a loopback Data API,
imports the actual entity loader, and renders metadata plus a page. It needs
installed dependencies, creates no users/activity and requires no credentials or
database. Next binds an OS-assigned port directly; readiness uses its announced
loopback URL. It starts with only fixture configuration and stops after
the checks. Generated files belong to ignored `.plan/local/`.

```bash
node apps/web/tests/load/verify-provider-cache.mjs
```

`PROVIDER_CACHE_BASELINE=1` only disables the new read-count assertions. It does
not select an older implementation: running it in the changed checkout measures
the changed loader. The baseline column below was measured with the loader from
main `f695d7f`, before React memoization, and is reproducible in a separate
checkout. Copy the verifier there because that revision predates the harness:

```bash
git worktree add --detach .plan/local/provider-baseline f695d7f5a97373899fda4739380260ff8b6bf69f
cp apps/web/tests/load/verify-provider-cache.mjs .plan/local/provider-baseline/apps/web/tests/load/
pnpm --dir .plan/local/provider-baseline install --frozen-lockfile
(
  cd .plan/local/provider-baseline
  PROVIDER_CACHE_BASELINE=1 node apps/web/tests/load/verify-provider-cache.mjs
)
```

The copied harness imports the baseline checkout's actual loader and pinned
dependencies. It leaves the active checkout unchanged. Keep that worktree for
comparisons, or remove the copied verifier and then remove the worktree with
`git worktree remove .plan/local/provider-baseline`.

| Scenario | Baseline origin reads | Changed origin reads |
| --- | ---: | ---: |
| Cold identity used by metadata and page | 2 | 1 |
| Same identity in a later warm request | 0 | 0 |
| Distinct metadata/page identities | 2 | 2 |
| Failed origin during one render | 2 | 1 |
| Next request after that origin recovers | 2 | 1 |
| Successful absence in a cold render | 2 | 1 |
| Repeated successful absence | 0 | 0 |

These are simulated HTTP-origin counts, not SQL executions, production latency
percentiles or concurrent-user capacity. A cold first read may still be slow.

## Delivery and follow-up

The cache fixes are independent of pending feed consumer PR #222 and the
unpublished shared cooldown experiment. No migration or production load test is
part of this stage. Record actual branch/PR status in CURRENT.md.

Next is [#228](https://github.com/francozeta/kocteau/issues/228), catalog-write
invalidation. Then [#229](https://github.com/francozeta/kocteau/issues/229) owns
progressive rendering, [#230](https://github.com/francozeta/kocteau/issues/230)
owns measured starter SQL work and [#231](https://github.com/francozeta/kocteau/issues/231)
owns suggestion budgets. Capture representative cold/warm browser-to-origin
timings before announcing a latency improvement or changing infrastructure.
