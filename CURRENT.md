# Current Project State

Last checked: 2026-10-25. Starter optimization is integrated; canonical-route defects are reproduced in isolation.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Read-only canonical review/track latency investigation at main `ecdbc9a` is
recorded in the [route research](./.plan/canonical-route-latency.md), under #147.
Local query checks confirm repeated short-ID reads; mobile/desktop WebKit against
a local production build confirms origin failures can display false missing pages.
Production feedback now prioritizes #259/#260 canonical identity/recovery, then
#261 track dependencies, before #243 pagination budgets. The investigation makes
no application/schema/hosting changes; the issues are Todo, not shipped fixes.

The last application delivery remains [PR #257](https://github.com/francozeta/kocteau/pull/257),
merged as `6c7d4ca` under #230. Its [starter record](./.plan/starter-query-work.md)
owns SQL delivery and measurement limits.

## Verified Delivery

The following verification belongs to the previous code delivery. The latest
research used six HTTP reads, normal mobile Link navigation, runtime logs and two
read-only SQL plans. Further local debugging completed 17 helper checks and eight
guest production-build browser checks; the combined development browser fixture
was incomplete. None of these establishes production capacity or P95.

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

Next: implement #259/#260 with canonical lookup/error regressions, then #261
primary-track dependency checks and #243 retry budgets. #228/#242 cache
consistency and SQL-CI KOC-23 remain high-priority before broader load work. #256/KOC-102 separately records
reproduced collection-dependent taste scoring; this stage preserves ranking.
#258 links the SQL-CI gap to existing KOC-23; the 54 SQL checks currently run locally.

The public homepage uses a separate loader and ISR. Authenticated production
browser latency, physical iPhone/TikTok, historical cold Data API waits and
10,000-user capacity remain unverified. #244/#231 bound history and suggestions;
explicit-query Search remains in #229. #253 owns browser-fixture CI and #254
interrupted RSC prefetch. Product ideas #245–#251 remain behind core reliability.
