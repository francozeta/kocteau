# Public traffic and security baseline — 2026-11-02

[Operations](../operations.md) · [Load readiness](../load-readiness.md) · [Security issue #274](https://github.com/francozeta/kocteau/issues/274)

## Scope and safety

This is a diagnostic record, not a penetration test, incident declaration,
capacity estimate or proof that all bots are blocked. No accounts, OTP emails,
authenticated writes, abuse payloads, firewall deny rules or load tests were sent.

The bounded public HTTP smoke in
[`apps/web/tests/smoke/public-read-only.mjs`](../../apps/web/tests/smoke/public-read-only.mjs)
makes **exactly five sequential GET requests, each at most once**, to:
`/robots.txt`, `/sitemap.xml`, `/`, `/reviews`, and `/track`.
Each request has a 25-second deadline and a 2 MB maximum downloaded response
body. No retries or concurrency; it verifies HTTP 200, MIME and basic document
shape. It is not an infinite-scroll or authenticated browser test.
The corresponding workflow is `public-read-smoke.yml` (manually dispatchable;
also runs when these diagnostic files change in a pull request).
It must not be expanded into a load generator or scheduled poller on production.

## Observed production baseline

Read-only inspection on 2026-11-02:

| Evidence | Observation |
| --- | --- |
| Vercel production deployment | `221538d0` (SEO PR #273), `READY` |
| Vercel firewall | Enabled; managed Bot Protection **log only** |
| AI Bots managed rule | Disabled; no global bot/AI challenge configured |
| Active custom limiter | `GET /track/deezer/*`: six requests per minute per IP |
| Active attacks returned by provider | No anomalies in the queried window |
| Database connection snapshot | 10 current connections, 1 active |
| Catalog snapshot | 18 reviews, 19 onboarded profiles, 23 artists, 24 albums, 26 tracks |
| OG image source inventory | 50 entity cover URLs on `cdn-images.dzcdn.net`; 7 avatar URLs on the project's Supabase host |
| Recent Vercel app errors | Public Supabase read timeouts and provider fetch/socket failures, including an old deployment |
| Public crawler configuration | `ChatGPT-User` and `OAI-SearchBot` allowed on public pages; training bots remain restricted |

**Interpretation:** No active attack was reported, and a single snapshot does
not prove a load bottleneck, sustained capacity or successful reachability.
The intermittent public-data read timeouts warrant investigation of runtime
region, request budgets, upstream transport and cache recovery.
The app's catalog is far below the current sitemap's per-source 5,000-row cap;
**there is no need to shard the sitemap yet**. Infinite scroll is unrelated.

The container's direct HTTP test did **not** establish a site failure: this
environment could not resolve `kocteau.com`. Search-reader responses are
cached or constrained and are not a reliable live HTTP status check.
Use the external GitHub Actions smoke result below for the actual HTTP probe.

## HTTP smoke evidence

GitHub Actions [Public read-only smoke #41468674583](https://github.com/francozeta/kocteau/actions/runs/41468674583)
on 2026-11-02 at 15:08–15:09 UTC, from a GitHub-hosted runner:

| Route | HTTP | MIME | Duration | Decompressed body |
| --- | ---: | --- | ---: | ---: |
| `/robots.txt` | 200 | text/plain | 282 ms | 1,036 bytes |
| `/sitemap.xml` | 200 | application/xml | 1,269 ms | 19,540 bytes |
| `/` | 200 | text/html | 1,314 ms | 411,401 bytes |
| `/reviews` | 200 | text/html | 2,267 ms | 617,388 bytes |
| `/track` | 200 | text/html | 684 ms | 79,506 bytes |

**All five checks passed.** Both public SEO files were reachable, the homepage
and review pages returned HTML, and no test request hit an HTTP 403/429/5xx.
The site is externally reachable; the local container DNS limitation is not
evidence of a Kocteau outage.

The page body sizes above are **decoded HTML bytes in Node fetch**, not network
transfer bytes, JavaScript bundle sizes or device-side Core Web Vitals.
The `/reviews` total duration was the highest, but a single run cannot
attribute it to database, streaming, serialization, network or bot protection.
Before changing layout/infinite scroll, investigate request timing and
React Server Components payload size against the existing performance issues.

This is a smoke test, **not** a bot-verification test, abuse simulation or
load/capacity test. A failed future probe would be diagnostic; do not auto-retry
or automatically change firewall policy.

## Security gaps and proposed safe rollout

1. **Authoritative write controls (high):** API-only mutation quotas can be
   bypassed via authorized direct Supabase RPC/table access. The existing
   `check_rate_limit` RPC accepts caller-supplied quota parameters. Redesign
   quotas as fixed values at the authoritative database mutation boundary
   and test against isolated staging before changing production grants.
2. **Fail-open limits (high):** `apps/web/lib/rate-limit.ts` currently returns
   `ok: true` when limiter storage fails. For sensitive mutations return a
   controlled, retryable 503 on limiter unavailability. Do not fail closed
   for ordinary anonymous **reads**.
3. **OG asset fetches (high):** `apps/web/lib/og.tsx` fetches external
   image URLs without a trusted-domain allowlist, explicit redirect policy,
   size limit or timeout. Harden this separately with tests and confirm
   track/profile previews still render.
4. **Authentication (medium):** OTP requests go directly to Supabase Auth,
   bypassing Vercel's `/login` protection. Verify Supabase Auth send and
   verify quotas in the Auth settings. Add Turnstile frontend token support
   and verify accessibility/legitimate login **before enabling enforcement**.
5. **Reliability (medium):** Diagnose public Supabase data read timeouts and
   provider failures before adding stricter WAF rules. See issues #147 and #263.

The firewall configuration was *not* made more restrictive by this change.
In particular, Bot Protection remains log-only. Do not enable global
Challenges/AI Bot Deny and inadvertently break public search discovery.

## Cloudflare comparison at current scale

- **Vercel only:** Existing CDN, platform DDoS mitigation, logging and
  firewall without adding a second proxy. Hobby has one custom rate-limit rule.
- **Cloudflare DNS only:** Possible without proxying; would not introduce
  another protective WAF layer or proxy traffic in front of Vercel.
- **Cloudflare Free orange-cloud proxy:** Includes free WAF features and one
  rate-limiting rule, but adds a reverse proxy, potential latency,
  misattribution of client addresses, and reduced Vercel firewall visibility.
  Vercel supports Cloudflare with Verified Proxy Lite, but still advises
  against unnecessary proxy layering.
- **Cloudflare Turnstile standalone:** Free plan for typical small production
  apps and works without routing Kocteau's entire site through Cloudflare.
  This is the more targeted choice *if* OTP abuse becomes measurable.

**Decision (2026-11-02):** keep the current Vercel + Supabase architecture.
No evidence yet that adding Cloudflare's full proxy would solve the observed
public-read timeouts; it will not protect the direct Supabase Auth API by
itself. Reassess if sustained malicious requests, provider limits or usage
costs materially change.

Official docs:
- https://vercel.com/docs/vercel-firewall
- https://vercel.com/docs/security/reverse-proxy
- https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
- https://developers.cloudflare.com/waf/rate-limiting-rules/
- https://developers.cloudflare.com/turnstile/plans/
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/auth/rate-limits

## How to repeat and diagnose

From the GitHub Actions tab, manually dispatch **Public read-only smoke**
against the canonical public domain. Inspect individual statuses and durations;
if it fails, correlate timestamps with the production Vercel runtime logs and
Supabase logs. Record status, change, build/CI, and any rollback in this file.

Avoid load-testing production; the existing `docs/load-readiness.md` requires
an isolated disposable Supabase instance for gradual profiles.
