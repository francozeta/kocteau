# Current Project State

Last checked: 2026-10-25. The authenticated feed bundle is integrated in main.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Observe [PR #222](https://github.com/francozeta/kocteau/pull/222), merged as
`094d094`, under #255/#147. The [feed bundle record](./.plan/authenticated-feed-read-bundle.md)
owns the current-main comparison, failure behavior and measurement limits.
SQL investigation under #230 is next; #243/#228/#242 retain high reliability priority.

Product hypotheses remain in [#251](https://github.com/francozeta/kocteau/issues/251)
and #245–#250, organized in Linear behind core reliability/performance work.

## Verified Delivery

CI and preview passed at `0d90ff6`. The production deployment for `094d094`
was observed READY with the `kocteau.com` alias before and after settled guest
WebKit verification on 25 Oct 2026. Mobile/desktop each showed three home review
links, 14 public review links and eight API reviews; anonymous /feed redirected
to login, with no authentication cookie or page errors.

Verification passes 202 web tests, seven real local SQL files/40 checks, twelve
complete API payload comparisons for two actual local sessions over three pages,
four authenticated HTTP failure/compatibility cases, four authenticated WebKit
contexts, ten primary-render scenarios, five guest recovery scenarios, types,
lint, docs and both production builds.

Authenticated For You uses one Data API request instead of four on its first
page and three later. Local payloads preserve ranking, cursor and caller flags.
Unexpected RPC failures stop after one attempt and return private/no-store 503.
Only a specifically missing bundle uses bounded Latest compatibility. All 37
cloud migration versions and bundle privileges were rechecked read-only; no new
cloud migration or production synthetic activity was introduced in this stage.

The earlier #241 review recovery and #252 progressive editorial rendering remain
integrated. Their evidence is in the [review record](./.plan/review-read-recovery.md)
and [render record](./.plan/primary-render.md).

## In Review

Studio scouting remains in [PR #211](https://github.com/francozeta/kocteau/pull/211)
under #206. Release work remains in [PR #202](https://github.com/francozeta/kocteau/pull/202);
the released version is v0.3.15.

## Limits And Next Priority

The local process-restart/warm timings are not production P95, isolated SQL time
or concurrent-user capacity. Authenticated production feed and physical
iPhone/TikTok behavior remain unverified. The historical Data API cold-wait cause,
existing advisor warnings and global index-advisor lint caveat remain open.
Ten-thousand-user capacity is unverified.

Next, use representative current SQL plans under #230; reproduce #243's pagination
failure budget and address #228/#242 cache consistency before broader load work.
#244/#231 bound history and suggestions. Explicit-query Search remains in #229;
#253 owns browser-fixture CI and #254 the interrupted RSC-prefetch investigation.
