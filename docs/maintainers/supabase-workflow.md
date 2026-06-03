# Supabase Maintainer Workflow

[Docs index](../README.md) | [Operations](../operations.md) | [Local development](../setup/local-development.md) | [Environment and secrets](../security/environment.md)

Kocteau uses two Supabase workflows:

- Contributors use the Docker-backed local stack.
- Maintainers use versioned migrations against Supabase Cloud projects.

This keeps public contribution safe while letting maintainers operate like a SaaS project with staging, production, and migration history.

## CLI Installation

The Supabase CLI is installed as a repo dev dependency:

```bash
pnpm exec supabase --version
pnpm supabase:version
```

Do not rely on a global `supabase` binary. Use `pnpm` scripts so everyone runs the version pinned by the repo lockfile.

## Environment Model

Use separate Supabase Cloud projects:

- Development cloud: maintainer-only experiments that need real cloud behavior.
- Staging: production-shaped verification before launch.
- Production: real users and canonical data.

Contributors should not connect to any cloud project by default. Their workflow remains local:

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:types
pnpm dev:web
```

## Maintainer Commands

Use these for cloud work:

```bash
pnpm supabase:login
pnpm supabase:link --project-ref <project-ref>
pnpm supabase:migration:list:linked
pnpm supabase:db:push:dry
pnpm supabase:db:lint:linked
pnpm supabase:db:advisors:linked
pnpm supabase:db:push
pnpm supabase:types:linked
```

Use these for migration authoring:

```bash
pnpm supabase:migration:new descriptive_name
pnpm supabase:reset
pnpm supabase:lint
pnpm supabase:types
```

Use these for local contributor-compatible checks:

```bash
pnpm supabase:start
pnpm supabase:status
pnpm supabase:reset
pnpm supabase:lint
pnpm supabase:types
```

## Migration Rules

- Every schema change must be in `supabase/migrations`.
- Every exposed table needs RLS and explicit grants.
- Sensitive writes should go through server routes or curator-only RPCs.
- Run `pnpm supabase:db:push:dry` before any cloud push.
- Do not use `supabase db reset` against cloud databases.
- Do not run `supabase/scripts/maintenance` unless the script is reviewed for that target environment.
- Regenerate types after migrations are applied to the environment being verified.

## Development Workflow

For normal product work:

1. Create or edit migration SQL in `supabase/migrations`.
2. Test locally with Docker:

```bash
pnpm supabase:reset
pnpm supabase:lint
pnpm supabase:types
pnpm --filter web lint
pnpm --filter web build
```

3. Open a PR with the migration and generated types.

## Staging Workflow

After a PR is ready:

1. Link the staging project:

```bash
pnpm supabase:link --project-ref <staging-ref>
```

2. Check migration history:

```bash
pnpm supabase:migration:list:linked
```

3. Preview pending migrations:

```bash
pnpm supabase:db:push:dry
```

4. Apply migrations only after reviewing the dry run:

```bash
pnpm supabase:db:push
pnpm supabase:db:lint:linked
pnpm supabase:db:advisors:linked
pnpm supabase:types:linked
```

5. Deploy the staging web app and manually verify the affected flows.

## Production Workflow

Production follows the same shape as staging, with more ceremony:

1. Confirm staging has passed.
2. Confirm the migration list is in sync.
3. Take or confirm an available backup for risky schema work.
4. Run:

```bash
pnpm supabase:db:push:dry
```

5. Review pending migration names and SQL.
6. Apply:

```bash
pnpm supabase:db:push
pnpm supabase:db:lint:linked
pnpm supabase:db:advisors:linked
```

7. Deploy web.
8. Run post-deploy checks from [operations](../operations.md).

## Branch And Project Hygiene

- Keep `.temp` and any local Supabase state out of git.
- Do not commit access tokens, database URLs, passwords, service role keys, or cloud anon keys.
- If a cloud project and local migrations diverge, stop and inspect with `pnpm supabase:migration:list:linked` before using repair commands.
- Repair commands require maintainer review because they change migration history.

## Docker Boundary

Docker remains required for contributor local Supabase and local migration resets.

Maintainers do not need Docker for daily cloud operations such as:

```bash
pnpm supabase:migration:list:linked
pnpm supabase:db:push:dry
pnpm supabase:db:push
pnpm supabase:types:linked
```

Use Docker when you want local parity before a PR. Use Cloud when you are deploying versioned migrations to staging or production.
