# Canonical public root with a private Feed

Stacked on [PR #313](https://github.com/francozeta/kocteau/pull/313) (`fix/home-build-reliability`), which keeps the /home marketing HTML on-demand and cached for 300 seconds. The current production root redirects signed-out visitors to /home while valid sessions open the private Feed. This stage changes the public URL contract **without changing the landing JSX, motion, Feed, auth provider, database, or the landing ISR policy**.

## Behavioral contract

- Anonymous GET / returns **200** at the original URL with the existing public marketing HTML. Proxy rewrites internally to the existing /home ISR route; there is no extra landing renderer or UA-based bot split.
- Valid logged-in GET / returns the existing Feed and sends noindex and private/no-store responses. The feed route itself continues to require verified Supabase claims.
- Expired/invalid Supabase cookie on GET / gets the public landing, never private content. Refreshed auth response cookies are carried across the rewrite; such requests must not produce publicly cached responses.
- GET /home stays a public marketing alias for anyone (including signed-in visitors), with canonical /.
- /feed continues to redirect to /; /track's existing 308 and canonical music/review/provider aliases are unchanged.
- Root may carry public landing metadata for unsigned requests only; signed-in Feed metadata remains noindex. No crawler/user-agent special cases.
- Public breadcrumbs, WebPage JSON-LD, sitemap and llms.txt point to /; /home is excluded from the sitemap and remains crawlable so its canonical can be read.

## Verification gate

- Keep #313 on-demand build isolation and 300-second public ISR; do not add request cookies to the static /home page.
- Verify no redirect for guest /, public HTML, self-canonical, public WebPage JSON-LD and root-only sitemap.
- Verify valid session / is the Feed with noindex/private/no-store; /home stays the marketing page with canonical /; invalid cookies cannot leak private HTML.
- Run native WebKit/mobile/desktop cohorts and the HTTP build/recovery fixture. The production-only smoke must continue accepting the **old production redirect** until this stacked PR is merged; isolated preview must prove 200.
- Verify back/forward, sign-in/out transitions and public link navigation on physical Safari. Do not claim Search Console indexing or ranking improvement without Search Console measurements.
- After #313 integration, retarget this PR to main, verify CI and the production deployment independently. If internal rewrites produce different ISR cache behavior at /, investigate before shipping.

Related: [SEO issue #305](https://github.com/francozeta/kocteau/issues/305), [reliability #263](https://github.com/francozeta/kocteau/issues/263).
