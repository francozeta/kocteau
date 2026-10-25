# Current Project State

Last checked: 2026-10-25. Starter query optimization is integrated in main.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Observe [PR #257](https://github.com/francozeta/kocteau/pull/257), merged as
`6c7d4ca`, under #230/#147. Next work is #243's pagination retry budget. The [starter query record](./.plan/starter-query-work.md) owns current
SQL plans, exact response parity, delivery and measurement limits.

## Verified Delivery

Source CI/preview passed at `635fdcc1`; main Verify passed at `6c7d4ca`.
Production was observed READY with `kocteau.com` before/after guest WebKit checks
at 21:01 UTC: mobile/desktop each showed three home reviews, 14 public reviews,
eight API reviews and login redirect for anonymous /feed, without page errors.

Pinned CLI 2.109.1 applied only `20261025203107_starter_late_hydration.sql`
to the existing Kocteau target after dry run. All 38 migration versions match;
linked types are unchanged. Function owner, existing grants, stable definer
boundary and empty search path remain unchanged. Six ordered cloud response
hashes match before/after across three surfaces and two SQL roles.

Local verification passed 108 complete ordered response comparisons across
three datasets, eight SQL files/54 checks, 202 web tests, TypeScript, lint,
public-schema SQL lint and four real-session WebKit contexts at mobile/desktop
sizes. No production synthetic users, engagement or load was introduced.

The 10,000-track local fixture's warm RPC sample fell from 1,079.531 to
677.330 ms and temporary writes from 42,411 to 4,601 blocks. The current-sized
fixture's absolute gain is small; these are not production P95 or user capacity.
Production after-checks returned six rows in 14.526/15.367 ms under authenticated
and anon SQL roles; the few separate samples are not a controlled speedup claim.

Earlier [review recovery](./.plan/review-read-recovery.md),
[primary rendering](./.plan/primary-render.md) and the merged
[feed bundle](./.plan/authenticated-feed-read-bundle.md) remain integrated.
Existing advisor warnings and the global linked index_advisor/hypopg_reset lint
failure remain; local public-schema lint passes.

## In Review

Studio scouting: [PR #211](https://github.com/francozeta/kocteau/pull/211), #206.
Release work: [PR #202](https://github.com/francozeta/kocteau/pull/202).
Released version: v0.3.15.

## Limits And Next Priority

Next: reproduce and bound #243 pagination retries, then address #228/#242
cache consistency before broader load work. #256/KOC-102 separately records
reproduced collection-dependent taste scoring; this stage preserves ranking.
#258 links the SQL-CI gap to existing KOC-23; the 54 SQL checks currently run locally.

The public homepage uses a separate loader and ISR. Authenticated production
browser latency, physical iPhone/TikTok, historical cold Data API waits and
10,000-user capacity remain unverified. #244/#231 bound history and suggestions;
explicit-query Search remains in #229. #253 owns browser-fixture CI and #254
interrupted RSC prefetch. Product ideas #245–#251 remain behind core reliability.
