# Environment And Secret Handling

[Docs index](../README.md) | [Local development](../setup/local-development.md) | [Operations](../operations.md) | [Contributing](../../CONTRIBUTING.md)

Keep local development, staging, and production separate. These are configuration
boundaries, not a claim that every environment is provisioned; check the target
before using maintainer commands.

## Environment Boundaries

- Local development uses the Docker-backed Supabase CLI stack.
- Staging uses its own Supabase Cloud project and its own deploy environment.
- Production uses a separate Supabase Cloud project with real users.

Do not point local development at production by default.

Maintainers should deploy schema changes through versioned migrations using the [Supabase maintainer workflow](../maintainers/supabase-workflow.md). Contributors should stay on the local stack unless a maintainer explicitly grants a cloud task.

## Public Variables

Public browser values are allowed in web variables prefixed with `NEXT_PUBLIC_*`.

For Supabase, the canonical web variables are:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`apps/web/lib/supabase/env.ts` reads this canonical key first, then the legacy
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` deployment fallback. New local
configuration uses the canonical name from `apps/web/.env.example`.

## Secret Variables

Never commit, paste, or include these in examples:

- Supabase service role keys
- Supabase secret keys
- database passwords and pooler URLs
- Supabase access tokens
- Resend API keys or SMTP passwords
- Sentry auth tokens
- production `.env.local` files

Secrets live only in controlled systems such as Vercel environment variables, GitHub environment secrets, Supabase dashboard settings, or a maintainer password manager.

## Web Runtime Inventory

The web app intentionally keeps a small environment surface:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical URL outside Vercel. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase API origin. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | RLS-protected browser access. The legacy `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` remains a temporary deployment fallback. |
| `SUPABASE_SECRET_KEY` | Server only | Catalog worker and privileged server operations; `SUPABASE_SERVICE_ROLE_KEY` is the legacy fallback. Use only a local key for local Supabase. |
| `CRON_SECRET` | Server only | Authenticates Vercel Cron requests to `/api/cron/enrich-catalog`. Configure it in Project Settings → Environment Variables, not in the Cron Jobs screen. |
| `V0_REFERRAL_URL` | Server only, optional | Creator Perks destination. |
| `APPLE_MUSIC_DEVELOPER_TOKEN` | Server only, optional | Maintainer-only Apple Music import. |
| `SENTRY_AUTH_TOKEN` | Build only, optional | Source-map upload during deployment. |
| `AI_GATEWAY_API_KEY` | Server only, optional | Studio source-context generation outside Vercel OIDC. |
| `VERCEL_OIDC_TOKEN` | Server only, temporary | Local Gateway authentication from the Vercel CLI; it expires and must not be committed. |
| `STUDIO_PROPOSALS_ENABLED` | Server only, optional | `0` disables new Gateway generation while retaining history. |
| `STUDIO_PROPOSAL_MODEL` | Server only, optional | Gateway model override; default and budget contract live in [catalog research](../knowledge-layer.md#optional-gateway-context). |
| `KOCTEAU_PERF_*` | Server only, optional | Sampled performance diagnostics. |

Use `apps/web/.env.example` as the configuration template. Preserve existing local
files when synchronizing devices. Next.js development overrides such as
`.env.development.local` can supersede `.env.local`; build and development may
therefore target different environments. Do not copy a cloud secret into a local
example or pull environment files over existing overrides without preserving them.

MusicBrainz does not require an API key. Kocteau identifies itself with a stable
`User-Agent`, stores matches in Supabase, and performs enrichment only through
the protected background worker. Do not add MusicBrainz calls to client components
or synchronous page rendering.

## Contributor Defaults

Contributors should need only:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key>
```

Optional analytics and referral variables should be blank unless a maintainer intentionally configures them.

Privileged local Studio/worker checks additionally need the local server-only key
from Supabase status and an intentionally configured curator role. Normal public
web work does not need Gateway, SMTP, or production credentials. Having a variable
configured does not prove its credential is current or a flow has been verified.

## Supabase Safety Checklist

- Enable RLS on tables in exposed schemas.
- Pair public access with explicit grants and narrow policies.
- Keep storage write policies scoped to authenticated users and their own user-id folder.
- Avoid `user_metadata` for authorization decisions.
- Do not use `service_role` in browser code or `NEXT_PUBLIC_*` variables.
- Keep destructive SQL in `supabase/scripts/maintenance`, not in the fresh install path.
