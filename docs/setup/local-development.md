# Local Development Setup

[Docs index](../README.md) | [Environment and secrets](../security/environment.md) | [Operations](../operations.md) | [Contributing](../../CONTRIBUTING.md)

Kocteau is local-first for contributors. A fresh checkout should run against a local Supabase stack and should not require production credentials.

## Requirements

- Node.js compatible with the repo lockfile
- pnpm 9.15.3 through Corepack or a local pnpm install
- Docker Desktop running before starting Supabase

## Fresh Install

From the repo root:

```bash
pnpm install
pnpm supabase:start
pnpm supabase:status
cp apps/web/.env.example apps/web/.env.local
pnpm supabase:reset
pnpm supabase:types
pnpm dev:web
```

Open `http://localhost:3000`.

`pnpm supabase:status` prints the local API URL and local anon key. Put those local values in `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon key from supabase status>
```

The exact public key variable name can evolve, but the rule should not: browser-safe Supabase keys must live in `NEXT_PUBLIC_*` for web, and privileged keys must never be committed or pasted into chat.

## Local OTP Email

Local Supabase does not send production email. OTP messages appear in the local email UI printed by `pnpm supabase:status`, normally:

```text
http://127.0.0.1:54324
```

Use the 6-digit code from that inbox when testing `/login` or `/signup`.

## Database Reset

Use this whenever migrations or seeds change:

```bash
pnpm supabase:reset
```

That applies `supabase/migrations` in order and then loads the deterministic seed files listed in `supabase/config.toml`.

The seed path intentionally contains only product configuration:

- preference tags
- editorial starter collection
- starter tracks and starter track tags

It does not create users, reviews, likes, bookmarks, comments, follows, notifications, or analytics events.

## Schema Changes

For future schema work:

```bash
supabase migration new descriptive_name
pnpm supabase:reset
pnpm supabase:lint
pnpm supabase:types
```

Every migration must include RLS and explicit grants for exposed tables, views, and RPCs. Public read access still needs both a policy and a grant.

## Maintenance Scripts

Fresh installs should not run anything in `supabase/scripts/maintenance`.

Those files are old, destructive, or environment-specific operator scripts. Review them with a maintainer before running them anywhere.

## Checks

Before opening a web PR:

```bash
pnpm supabase:lint
pnpm --filter web lint
pnpm --filter web build
git diff --check
```
