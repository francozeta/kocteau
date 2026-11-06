# Kocteau · Cloudflare Workers compatibility experiment

This experiment evaluates moving **Next.js hosting only** from Vercel to Cloudflare Workers. It does **not** modify the Kocteau product, 3D visuals, MDS, live DNS, or the production database.

## Isolation and current state

- Work only on `test/cloudflare-workers-spike`, with a draft PR to `main`.
- The public `kocteau-edge-probe.francozeta.workers.dev/health` is **not Kocteau**; it is a tiny infrastructure checker with no Supabase URL, no login, no music, and no user data.
- Kocteau Supabase project `ytxilnlmvioccfaomizi` is paused at the time of the experiment; keep it paused. Do not assume a successful DB read or authentication flow.
- Vercel Production and `kocteau.com` remain unchanged. No production DNS change, secrets, Cron, emails, or writes.
- Cloudflare Workers `workers.dev` preview probes are not production sites.

## Initial compatibility test

The GitHub workflow runs **from `apps/web`**, not the monorepo root, and checks `vinext` against the real Next.js app. An isolated CI-only production bundling attempt uses placeholder Supabase variables and upgrade experiments; no dependency upgrades are committed to the application.

Build results and blockers should be recorded in this PR, and tests verified before changes to shipping code.

## Deployment blockers — not yet approved

1. `apps/web` includes `@sentry/nextjs`, `@next/mdx`, custom `next/font/local` and a Next.js proxy. Check vinext handling of each. Preserve the original Three.js/OGL/WebGL transitions and benchmark them in an actual browser.
2. Supabase Auth uses `@supabase/ssr` with cookies in `proxy.ts`; verify sign-in, passkeys, OTP, redirects, sessions and RLS against an **isolated** project before routing traffic.
3. Compare caching semantics (`next/cache`, `revalidateTag`, `revalidatePath`), SEO metadata, sitemap, OpenGraph images, public read latency, remote image optimization, rate limiting, and bot protections. Vercel has cron `/api/cron/enrich-catalog`; Cloudflare Cron Triggers require separate setup and security checks.
4. Preserve Sentry observability; remove or replace Vercel-only Speed Insights/Analytics only on a **deliberate** Cloudflare branch.
5. Assess Cloudflare Worker code size, CPU/memory limits, and 3D asset transfer sizes. Browser WebGL runs client-side, but assets and SSR/streaming may differ.
6. Never redirect `kocteau.com` or reactivate paused Supabase for this experiment. Cutover requires explicit approval and a reversible plan.

## Relevant docs

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/static-assets/migration-guides/vercel-to-workers/nextjs/


## Verified result — 05 Nov 2026 (UTC run on Nov 6)

- **Cloudflare account:** `kocteau-edge-probe.francozeta.workers.dev/health` uploaded and routed successfully, HTTP GET health verified from GitHub Actions; private routes (`/search`) return HTTP 404. This is **only infrastructure**, not Kocteau.
- **GitHub Actions:** `Verify` and `Kocteau Cloudflare compatibility (experiment)` both passed on commit `5e8882c9fc1698d13ece6106662bc04b570b87a8`.
- **vinext 1.4.3 check:** **95%** (28 supported, 3 partial, 0 unsupported issues): image resizing/optimizer config, Turbopack loaders, and Sentry Webpack build extras. Static scanner success is not runtime validation.
- **Actual vinext Vite build:** **passed** in isolated GitHub runner using placeholder Supabase URL/key, React and react-dom **19.3.1**, `@vitejs/plugin-rsc@0.5.38`, Vite 8.2.2, and `@mdx-js/rollup@3.1.1`. App files and lockfile on main were **not** upgraded. Generated docs (`pnpm docs:check`) and an explicit MDX Vite plugin are required before compiling.
- vinext detected home, search, reviews, auth callback, metadata, API and Cron routes in its build manifest. Routes marked `?` have unknown classification from static analysis; this is **not** a guarantee that redirects, cookies, or API requests work on Workers.
- Client build reported a chunk around **552.55 kB minified** (140.55 kB gzip). Benchmark real 3D assets and waterfall before committing to migration.
- The monorepo automatically triggered **Vercel branch previews** which were `ERROR` (`turbo run build` exited 1); no Vercel **Production** release was touched. Investigation of preview settings/mocks is separate from the vinext build passing in CI.
- Kocteau Supabase was `INACTIVE` before and after. The experiment neither resumes it nor performs auth/DB queries.

### Gate before real Cloudflare preview

Implement a deliberately isolated vinext + Cloudflare deployment with proper static assets, image optimization, Sentry instrumentation, and a safe read-only public test. Because the live Supabase DB is paused, **do not claim search/discovery, sign-in, OTP or reviews work**. Preserve the original WebGL implementation, compare Core Web Vitals, and only restore backend after explicit approval and a separate available slot. The current public edge-probe intentionally has no app bundle.
