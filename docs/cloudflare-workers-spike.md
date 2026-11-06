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
