# Contributing to Kocteau

Kocteau is a music review and taste discovery app. `apps/web` is the production
surface; native mobile parity is deferred. Prefer small, focused changes.

## Start

1. Read [AGENTS.md](./AGENTS.md) and [CURRENT.md](./CURRENT.md), then the relevant
   [product](./PRODUCT.md), [design](./DESIGN.md), or [technical guide](./docs/README.md).
2. Choose a scoped [issue](https://github.com/francozeta/kocteau/issues) or coordinate
   a task from the [contribution backlog](./docs/backlog.md).
3. Follow [local development](./docs/setup/local-development.md) for runtime,
   dependencies, environment files, Supabase, and OTP. Normal contribution work
   uses local Supabase and does not require production credentials.
4. Inspect Git status and remote history before changing files. Use a focused
   `<type>/<short-kebab-description>` branch; keep `main` releasable.

Docs, copy, accessibility, sparse states, and isolated web fixes are good first
contributions. Coordinate auth, data, recommendations, analytics, CI, and release
changes with the maintainer when their behavior is not already agreed.

## Shared Context

[Project skills](./.agents/README.md), their references, and `skills-lock.json`
travel with the clone. [Shared plans](./.plan/README.md) explain useful handoffs;
CURRENT.md and linked issues/PRs record actual status. Use separate conventional
branches for concurrent work and reconcile overlap before integration.

Keep experiments and private diagnostics in `.plan/local/` or `.codex-private/`.
Only sanitized environment examples belong in Git. Preserve the maintainer's Git
identity and authorship as required by AGENTS.md.

## Verification

From the repository root:

```bash
pnpm check
git diff --check
```

`pnpm check` runs unit tests, workspace lint, and the web production build, including
TypeScript validation. It does not exercise a real database, OTP delivery, or an
authenticated curator session. For docs-only edits, check local links and commands;
runtime or CI changes also need the relevant executable checks.

UI changes need desktop/mobile, keyboard, and relevant signed-in/out and sparse
states. Schema or permission changes also need local database lint, relevant
SQL/RLS regressions, generated types, and the affected manual flow; see the
[Supabase workflow](./docs/maintainers/supabase-workflow.md). Report any missing
environment or verification explicitly.

## Pull Requests And Releases

Use Conventional Commits for commits and PR titles, for example:

```text
fix(web): prevent review card text overflow
feat(web): add saved review empty state
docs(repo): clarify device setup
```

A PR explains the problem, resulting behavior, important decisions, verification,
and remaining caveats. Include screenshots or a short recording for visible UI
changes. Update the owning documentation when a command or contract changes.

Local commits do not authorize push, PR publication, merge, or deployment. Follow
the maintainer's direction and the [working contract](./AGENTS.md).
Do not edit `CHANGELOG.md` in normal feature/fix PRs: [Release Please](./docs/maintainers/release.md)
uses conventional squash titles to propose versions and release notes.
