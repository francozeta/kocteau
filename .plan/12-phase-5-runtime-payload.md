# Phase 5 — Runtime, payload and images

Status: complete  
Branch: `perf/runtime-payload`

## Goal

Reduce Vercel runtime work and initial client payload without changing Kocteau's approved visual hierarchy or interaction model.

## Baseline

- Next.js: `16.2.10` with Turbopack.
- Official analyzer: `pnpm --filter web exec next experimental-analyze --output`.
- `/` client graph: 1,948.1 KB raw / 767.3 KB compressed.
- `/feed` client graph: 2,432.9 KB raw / 932.9 KB compressed.
- Sentry browser traffic is tunneled through the Vercel route `/monitoring`.
- Production tracing sample rate is 5% on browser, server, and edge.
- Sentry wizard example page and API route are deployed.
- The global Sonner toaster is mounted on every route, including the public landing page.
- Lower landing sections mount animated shaders before they approach the viewport.
- Optional feed CTA/starter modules are statically imported even when guest props disable them.

The analyzer totals include initial and async client chunks; they are used as a consistent before/after graph metric, not as a claim about first-load transfer size.

## Changes

- [x] Send Sentry browser events directly to Sentry instead of proxying through Vercel.
- [x] Lower production performance tracing to 1% while retaining error capture.
- [x] Remove Sentry example routes from the production route graph.
- [x] Stop widening client source-map uploads during every deployment.
- [x] Scope the global toaster to the authenticated application shell and defer its mount until browser idle time.
- [x] Mount lower-page shaders only near the viewport with stable visual fallbacks.
- [x] Replace the guest home feed client with a server-rendered review list.
- [x] Re-run analyzer, lint, production build, and route checks.

## Result

- `/` analyzer graph: 1,948.1 → 1,211.1 KB raw (`-37.8%`).
- `/` analyzer graph: 767.3 → 500.2 KB compressed (`-34.8%`).
- `/feed` analyzer graph: 2,432.9 → 2,421.0 KB raw; no signed-in regression.
- Production HTML measurement for `/`: 26 → 15 initial scripts.
- Production HTML measurement for `/`: 1,797.9 → 1,124.9 KB raw script assets (`-37.4%`).
- Public home no longer includes Sonner or Supabase client code.
- Public review cards remain linked and editorial, but no longer hydrate TanStack pagination, composer actions, read-depth analytics, or authenticated interaction controls.
- `/monitoring`, `/sentry-example-page`, and `/api/sentry-example-api` all return 404 and are absent from the route graph.
- Sentry source-map hook measured 30.8 seconds in the accepted build versus roughly 77 seconds in the prior baseline build. Build-to-build network variance still applies.
- Production build passed with 55 generated pages.
- Lint and `git diff --check` passed. ESLint printed two upstream `jsx-ast-utils` diagnostic notices but returned zero warnings/errors.

## Decision log

- Next/Turbopack still advertises lower-page shader chunks from the route graph. The optimization therefore targets WebGL mount/execution rather than claiming the library is absent from the initial transfer.
- A first attempt to split three optional feed modules increased duplicated async graph weight. It was removed rather than retaining complexity without measurable transfer value.
- Deezer cover images already bypass Vercel transformations and use provider-sized assets, so no additional image rewrite was warranted in this phase.

## Acceptance

- No `/monitoring` route in the built application.
- No Sentry example page or example API route.
- Public home retains the same layout and visual treatment.
- Review composer, toast, and feed flows remain available.
- Analyzer graph does not regress; deferred modules leave critical work.
- `pnpm --filter web lint`, `pnpm --filter web build`, and `git diff --check` pass.
