# Current Project State

Last checked: 2026-10-25. Home/feed primary rendering is integrated in main.
Stable contracts: [AGENTS](./AGENTS.md), [Product](./PRODUCT.md),
[Design](./DESIGN.md), and [catalog research](./docs/knowledge-layer.md).

## Active Work

Observe [PR #252](https://github.com/francozeta/kocteau/pull/252), merged as
`9265b50`, under #147/#229. The [primary-render record](./.plan/primary-render.md)
owns the pinned comparison and its limits. Explicit-query Search remains open in
#229; the feed transport consumer in PR #222 is still a separate delivery.

Product hypotheses are indexed in [#251](https://github.com/francozeta/kocteau/issues/251),
with sources, scope and evaluation criteria in #245–#250. Existing GitHub imports
in Linear now have performance/product projects, priorities and status.

## Verified Delivery

CI and preview passed at `6da4189`; the merge passed CI. The production deployment
for `9265b50` was observed READY with the `kocteau.com` alias. On 25 Oct 2026,
anonymous mobile and desktop WebKit each showed three home review links, 14 public
review links and eight API reviews. Anonymous /feed redirected to login.
Settled navigation had no page errors and used no authentication cookie.

Verification covers 190 tests, ten current-source Next/WebKit scenarios, the
pinned route/landing comparison, five existing anonymous recovery scenarios,
types, lint, docs and an isolated production build. Held editorial reads block
the old route but not ready content in the new route; successful picks move the
first review by 0 px and share one origin read in both viewports.

An earlier smoke that interrupted document loads emitted RSC prefetch access-control
errors. The settled run did not reproduce them; [#254](https://github.com/francozeta/kocteau/issues/254)
owns the controlled investigation rather than treating them as a confirmed
production regression. [#253](https://github.com/francozeta/kocteau/issues/253)
tracks adding the isolated browser fixtures to CI.

Anonymous review recovery from PR #241 remains integrated. Its cache/error
boundary and earlier production evidence remain in the
[review recovery record](./.plan/review-read-recovery.md).

## In Review

- [PR #222](https://github.com/francozeta/kocteau/pull/222) contains the feed read
  bundle. Its schema was delivered through the pinned CLI; application integration
  still needs reconciliation with current main and cache/error behavior.
- Studio scouting remains in [PR #211](https://github.com/francozeta/kocteau/pull/211)
  under #206. Release work remains in [PR #202](https://github.com/francozeta/kocteau/pull/202);
  the released version is v0.3.15.

## Limits And Next Priority

These changes remove render dependencies; they do not establish production P95,
faster SQL or concurrent-user capacity. Public home retains 300-second ISR.
Authenticated production feed, physical iPhone/TikTok behavior and the historical
Data API cold-wait cause remain unverified. Existing advisor warnings and the
global index-advisor lint caveat remain. Ten-thousand-user capacity is unverified.

Next, reconcile and verify PR #222's authenticated consumer to reduce actual
round trips, then use representative current SQL plans under #230. #243 pagination
failure budgets and #228/#242 cache consistency retain high reliability priority.
#244/#231 bound history and suggestion work; #253/#254 own browser automation and
the interrupted-navigation investigation. Keep these deliveries independent.
