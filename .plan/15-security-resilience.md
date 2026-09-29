# Security and resilience gate

Status: queued. Start only after `design/editorial-shell` receives visual approval. Implement on a separate conventional branch and do not merge without review.

## Outcome

Kocteau should remain readable during crawler spikes, repeated public searches, OTP abuse, a slow music provider, or a partial database incident. Security is layered so one failed control does not expose data or consume the entire runtime budget.

This phase does not promise zero downtime. It reduces attack surface and blast radius, preserves the public reading experience where possible, and makes recovery observable and rehearsed.

## Current baseline

Already present:

- Vercel platform DDoS mitigation.
- Per-user Postgres-backed limits on authenticated mutations.
- Supabase RLS plus explicit hardening work for privileged RPCs.
- Sentry request/error instrumentation.
- Dependabot and a required repository verification workflow.
- Crawler rejection on the Deezer resolver route.

Gaps to validate or close:

- Expensive public reads reach application code without a shared edge budget.
- The application rate limiter intentionally fails open when its database RPC is unavailable.
- Auth rate limits and bot protection need a production configuration audit.
- No project-wide browser security-header or CSP policy is visible in `next.config.ts`.
- Deezer and other upstream reads need explicit timeout, concurrency, cache, and stale-fallback rules.
- Backup existence is not enough; recovery has to be tested and documented.

## Threat model

Protect these boundaries first:

1. Anonymous discovery: search, feed, recent tracks, starter content, OG routes, and entity resolvers.
2. Authentication: email OTP requests, verification attempts, callbacks, cookies, and redirects.
3. Authenticated writes: reviews, comments, follows, saves, bookmarks, preferences, and notifications.
4. Privileged data paths: service keys, `SECURITY DEFINER` RPCs, maintenance scripts, and admin-only starter routes.
5. Dependencies: Deezer, email delivery, Vercel, Supabase, Sentry, Eve, and package supply chain.
6. Recovery: accidental migrations, corrupted data, provider outage, traffic spike, and compromised secret.

Do not store raw IP addresses or user-agent strings as product analytics. Edge security may use ephemeral request signals, but application records should use a short-lived keyed hash only when a durable abuse window is genuinely necessary.

## Stage 0 — Baseline and budgets

- Inventory every public, authenticated, and privileged route with its query count, payload size, cache policy, and upstream dependency.
- Define budgets for p95 latency, error rate, Supabase connections, Vercel active CPU, and third-party calls.
- Create alerts for error-rate spikes, 429 growth, Auth failures, database saturation, and external-provider timeouts.
- Record a normal traffic baseline before blocking anything.

Gate: a route matrix exists and an incident can be detected without manually watching dashboards.

## Stage 1 — Edge shield

- Start Vercel WAF rules in log mode, then enforce after observing legitimate traffic.
- Apply the first rate-limit rule to the most expensive anonymous family, not blindly to every asset or page.
- Prefer path groups such as public search/provider resolution over a global `/api/*` rule that could punish normal navigation.
- Use IP and JA4 at the edge; use authenticated user ID inside the application for write limits.
- Reject unsupported methods, malformed identifiers, oversized URLs/bodies, and obvious automated abuse before database work.
- Keep Vercel Attack Challenge Mode as an incident switch, not as the permanent default for normal listeners.

Gate: abusive traffic receives 429/challenge at the edge and no longer creates proportional function or provider usage.

## Stage 2 — Auth and database authorization

- Review Supabase Auth production limits for OTP send, OTP verification, and token refresh.
- Add CAPTCHA only to auth flows when abuse signals justify the friction; never put it in front of public reading.
- Verify cookies, callback allowlists, redirect normalization, and session invalidation behavior.
- Confirm every exposed table has intentional grants and RLS; newly exposed objects require explicit grants.
- Test `anon`, authenticated owner, authenticated non-owner, and privileged access separately.
- Audit all views for `security_invoker` behavior or revoke public access.
- Audit every `SECURITY DEFINER` function for fixed `search_path`, internal auth checks, minimum execute grants, bounded result size, and statement timeout.
- Keep secret/service-role keys server-only and reject any `NEXT_PUBLIC_*` secret pattern in CI.

Gate: anonymous users cannot write; authenticated users cannot read or mutate another user's protected rows; privileged RPCs expose only the intended bounded result.

## Stage 3 — Application containment

- Keep existing per-user mutation limits, but separate fail-open and fail-closed behavior by risk: low-risk engagement may fail open briefly; review publication, profile changes, and privileged operations should not silently bypass an unavailable limiter.
- Validate request bodies and query parameters at each route boundary with bounded strings, arrays, pagination, and accepted URL schemes.
- Add `AbortSignal` timeouts to external requests and cap retries with jitter; never retry validation or authorization failures.
- Add per-provider concurrency limits so a slow Deezer request cannot occupy every function.
- Cache stable catalog/editorial results and serve stale data during an upstream outage.
- Bound feed/search/RPC result counts and prefer cursor pagination over unbounded offsets.
- Move non-critical side effects such as notifications or analytics out of the user-facing response when the existing architecture supports it.

Gate: disconnecting Deezer does not take down the landing, public reviews, profiles, or cached discovery.

## Stage 4 — Browser and response security

- Introduce a Content Security Policy in report-only mode first; inventory Sentry, Vercel, Supabase, fonts, images, and shader requirements before enforcement.
- Preserve static rendering and CDN caching where possible; do not force the whole product dynamic solely to add per-request nonces.
- Add `frame-ancestors 'none'`, `object-src 'none'`, a restricted `base-uri`, `form-action`, HSTS in production, `X-Content-Type-Options`, a restrained referrer policy, and a minimal Permissions Policy.
- Validate same-origin state-changing requests and use SameSite cookies as defense in depth.
- Render review/profile copy as text. Sanitize only if rich text is deliberately introduced later.
- Keep JSON-LD serialization escaped and audit every remaining `dangerouslySetInnerHTML` use.

Gate: CSP reports are clean enough to enforce without breaking auth, monitoring, images, or the landing.

## Stage 5 — Data recovery and operations

- Confirm the production backup tier and its real retention. Free projects need scheduled off-site logical dumps; paid projects still need a restore exercise.
- Remember that database backups do not restore deleted Storage objects; define a separate Storage recovery policy if user uploads become material.
- Test a restore into a separate project and document RPO, RTO, missing settings, and the exact rollback sequence.
- Require a backup/restore point and reviewed rollback for destructive migrations.
- Add an incident runbook: detect, limit traffic, disable a risky surface, fall back to cached editorial content, rotate secrets, restore, and communicate.
- Maintain kill switches for non-essential providers and expensive discovery modules.

Gate: a second environment can be restored and validated without improvising from production.

## Stage 6 — Verification gate

- Run Supabase Security and Performance Advisors and resolve or explicitly document each finding.
- Add authorization tests for RLS/RPC ownership boundaries.
- Add route tests for malformed input, oversized payloads, 401/403/404 separation, 429 responses, provider timeout, and stale fallback.
- Load-test a staging deployment with realistic read/write ratios; never load-test production without coordination.
- Run dependency audit, secret scan, lint, build, and `git diff --check` in CI.
- Review logs to ensure errors do not contain OTPs, cookies, authorization headers, email addresses, or raw provider payloads.

Gate: the app stays responsive at the agreed staging load, unsafe access tests fail closed, and degraded providers return a usable editorial fallback.

## Rollout order

1. Observe and measure.
2. Protect the expensive anonymous edge.
3. Verify Auth/RLS/RPC authorization.
4. Add timeouts, bulkheads, and stale fallbacks.
5. Roll out CSP and browser headers report-first.
6. Rehearse restore and incident response.
7. Enforce the final merge gate.

## Explicit non-goals

- No generic enterprise security stack before traffic justifies it.
- No persistent fingerprinting or invasive user tracking.
- No CAPTCHA on normal browsing.
- No global rate limit that breaks crawlers, previews, or ordinary multi-device use.
- No migration or firewall rule applied directly to production without an observed preview/staging pass and rollback path.
