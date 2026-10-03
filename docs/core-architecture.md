# Kocteau Core Architecture

[Docs index](./README.md) | [Product contract](../PRODUCT.md) | [Discovery and curation](./discovery-curation.md)

## Decision

Kocteau keeps one product loop:

`search → music entity → review → taste signal → feed → search again`

New code must strengthen that loop or remove friction from it. A feature is not part of the core merely because it already exists.

## Code Map

| Path | Responsibility |
| --- | --- |
| `apps/web/app` | App Router pages, layouts, metadata, and `api` Route Handlers |
| `apps/web/components`, `hooks`, `queries` | Product UI, interactions, and client query hooks |
| `apps/web/lib` | Server queries, auth helpers, catalog, discovery, curation, analytics, and validation |
| `apps/web/lib/supabase` | Browser/server/admin clients, environment readers, and generated database types |
| `apps/web/proxy.ts` | Session refresh and route redirects; sensitive endpoints authorize independently |
| `packages/config` | Shared theme and query defaults |
| `packages/types` | Portable domain types; generated database types remain in the web app |
| `packages/ui` | Shared UI package entry point; existing product components live in the web app |
| `supabase/migrations`, `seeds`, `templates` | Ordered schema/RLS/RPC history, deterministic configuration, and local OTP email |
| `supabase/tests` | Database and RLS regressions |
| `supabase/scripts` | Type generation, curation tooling, and reviewed maintenance |
| `apps/web/lib/**/*.test.ts`, `apps/web/tests/load` | Unit regressions and optional k6 load checks |

Do not create another application layer or service merely to match a diagram.
Follow existing domain modules and split only when a concrete boundary needs it.

## Routes And Data Flow

`/` serves the public landing and redirects authenticated listeners to `/feed`.
`/search` is the discovery canvas. Canonical public music routes use
`/tracks/{slug}/{id}`, `/albums/{slug}/{id}`, and `/artists/{slug}/{id}`;
reviews use `/reviews/{id}/{slug}`, profiles `/u/{username}`. Legacy singular
routes redirect, and Deezer resolver routes handle music without a Kocteau ID.
Route helpers in `apps/web/lib/seo-routes.ts` own canonical path construction.

`/login`, `/signup`, `/onboarding`, and `/onboarding/taste` implement the OTP/profile/
taste loop. `/studio/starter`, `/studio/health`, and `/studio/curators` are private
role-gated tools; an official badge is not permission to use them.

Typical writes follow:

`client action → Route Handler → validate session/input/limits → RPC or scoped write → Postgres`

RLS and explicit grants define database access. Routes using the server-only admin
client must check authorization before privileged work. A redirect or hidden control
does not protect an API. Review and curation invariants stay in their existing
transactional RPCs; provider data must preserve `(provider, provider_id, type)` identity.

Server-rendered pages use server queries for initial data. TanStack Query owns
live/optimistic client interactions. Public catalog caches must not include viewer
state; account-specific responses require their existing private boundaries.
Catalog research uses the durable enrichment queue shared by Studio and cron.
Evidence collection, draft context, and editorial publication remain separate;
see [catalog research](./knowledge-layer.md) and [discovery](./discovery-curation.md).

## Boundaries Today

### Next.js: product and delivery

Next.js owns:

- routes, metadata, and public indexing
- server-rendered page composition
- interactive UI islands
- auth-aware backend-for-frontend endpoints
- redirects from legacy public URLs

Pages should read on the server when possible. Client queries are reserved for live search, optimistic actions, dialogs, and state that changes without navigation.

### Supabase: identity and source of truth

Supabase owns:

- authentication and onboarding state
- Postgres data and row-level security
- reviews, interactions, profiles, and taste signals
- storage and database functions

Provider identifiers are catalog references. Kocteau entity IDs remain the stable product identity.

### Portable domain logic

Logic that could later run outside Next.js should remain independent of React:

- catalog normalization
- discovery candidate generation
- recommendation ranking and diversity
- explanation inputs

Keep this logic as typed, side-effect-light TypeScript modules until a measured reason justifies another service.

## Future Go Boundary

Go is an implementation option, not a second product architecture. Introduce it only when measurements show a sustained throughput, latency, background-processing, or operational need that Next.js cannot meet economically.

If that point arrives, migrate in this order:

1. catalog provider normalization and resolution
2. discovery candidate generation
3. batch recommendation ranking or enrichment workers

Do not begin with auth, onboarding, review CRUD, React composition, or public routing. The browser should continue talking to Kocteau's Next.js boundary first; internal services receive versioned JSON contracts and stable Kocteau entity IDs.

## Reduction Rules

- One canonical public route per concept; legacy routes only redirect.
- Search is the discovery surface. Do not add a parallel discovery product.
- Do not ship preview or maintainer-only screens as public production routes.
- Do not add an API route without a concrete consumer or documented external contract.
- Do not duplicate server-owned page data into a client cache unless live interaction requires it.
- Prefer deleting a mode or abstraction over adding configuration for it.
- A new abstraction should remove more code or coupling than it introduces.

## Change Test

Before adding a service, route, query layer, or shared primitive, answer:

1. Which step of the core loop improves?
2. Why can the existing boundary not own it?
3. What code or decision does this remove?
4. How will its cost or performance improvement be measured?

If those answers are unclear, keep the current architecture smaller.
