# Local Development

[Docs](../README.md) | [Environment](../security/environment.md) | [Contributing](../../CONTRIBUTING.md) | [Supabase workflow](../maintainers/supabase-workflow.md)

Contributors use local Supabase. A checkout must not require production credentials.
An existing maintainer cloud environment follows the separate Supabase workflow;
fetching code does not authorize cloud migrations or resets.

## Runtime

- Use the Node version in [`.node-version`](../../.node-version); CI reads this same file.
- Use the pnpm version in the root [`package.json`](../../package.json) `packageManager` field.
- Docker Desktop must be installed and running for the local Supabase stack.
- Supabase CLI is a repository dependency; run the `pnpm supabase:*` scripts.

Check `node --version` and `pnpm --version` before installation. Use an existing
Corepack setup or install the specified pnpm version; do not regenerate the lockfile
with a different package manager to get an install past an error.

## New Checkout

From the repository root, install dependencies and start local services:

```bash
pnpm install --frozen-lockfile
pnpm supabase:start
pnpm supabase:status
```

For a checkout without an environment file, copy `apps/web/.env.example` to
`apps/web/.env.local`. On PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

On macOS/Linux use `cp apps/web/.env.example apps/web/.env.local`.
Do not overwrite existing overrides. Fill the URL and browser key from local
Supabase status. For privileged local Studio/worker operations, also fill the
server-only local secret/service-role key. See [environment variables](../security/environment.md).
Leave external service credentials blank unless intentionally testing an integration.

Then initialize this disposable local database and run the app:

```bash
pnpm supabase:reset
pnpm supabase:types
pnpm dev:web
```

Open [localhost:3000](http://localhost:3000). `/` is the public landing; signed-in
listeners reach For You at `/feed`. The local email inbox shown by Supabase status,
normally [localhost:54324](http://127.0.0.1:54324), captures six-digit OTP codes for
`/login` and `/signup`.

`supabase:reset` deletes local database data, replays migrations, and loads the
deterministic seeds in `supabase/config.toml`. Seeds contain product configuration
(tags, collections, starter picks), not users, reviews, or engagement.

## Returning Device

Read AGENTS.md, CURRENT.md, and the linked issue/PR before continuing an active task.
Inspect the checkout, other worktrees, and newly fetched history:

```bash
git status --short --branch
git worktree list
git fetch --all --prune --tags
git log -10 --oneline --decorate origin/main
git branch -vv
```

When the checkout is clean, update the integrated baseline with:

```bash
git switch main
git merge --ff-only origin/main
```

Continue an existing task branch against its own upstream, or create a conventional
task branch from main. Preserve local commits and edits first. A failed fast-forward
means histories diverged; inspect rather than resetting. Open PR branches remain
review work and should not be merged just to synchronize a laptop.

Run `pnpm install --frozen-lockfile` after updating. Preserve existing environment
files and compare variable names with `.env.example` without sharing values.
Development overrides such as `.env.development.local` can supersede `.env.local`;
review both when the app reaches the wrong environment.

For local Supabase, compare migrations before restarting or resetting. Reset only
a disposable local database whose data can be discarded. Generate types from the
schema actually being verified and inspect their diff; do not substitute cloud
types for a local schema. Report code, dependency, database, and manual-flow readiness
separately.

## Checks

```bash
pnpm check
git diff --check
```

The combined check runs unit tests, workspace lint, and the web build with TypeScript
validation. These checks need dependencies and web configuration, but do not require
a running local database. They do not prove that database permissions or OTP work.

For database changes, additionally run on the disposable local stack:

```bash
pnpm supabase:lint
pnpm exec supabase test db
pnpm supabase:types
```

RLS regression instructions are in [supabase/tests/rls](../../supabase/tests/rls/README.md).
For the affected flow, verify signed-out, authenticated, and denied-role behavior.

## Optional Tools And Troubleshooting

- Without Docker, web tests/lint/build can still run. Local Supabase, migration
  resets, SQL tests, and local OTP remain unverified; do not replace them with production.
- Gateway context is optional and needs its own server credential. Manual curation
  remains available without it; see [Studio rollout](../operations.md#studio-gateway-context-rollout).
- `pnpm --filter web email:dev` previews email templates; k6 belongs to the
  separate [load-readiness workflow](../load-readiness.md).
- Fresh installs do not run `supabase/scripts/maintenance`; those are reviewed,
  target-specific operator tools. `pnpm supabase:stop` stops the local stack.
