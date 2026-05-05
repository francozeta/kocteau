# Contributing to Kocteau

Kocteau is a music review and taste discovery app. The public contribution path is web-first for now: the production surface is `apps/web`, while `apps/mobile` is intentionally future-facing.

The best early contributions are small, focused, and easy to review.

## Quick Path

Good first contributions usually live in one of these areas:

- README or docs improvements
- Copy fixes
- Small web UI polish
- Accessibility improvements in isolated web components
- Loading, empty, or error-state polish
- Small bug fixes with clear before/after behavior

Avoid starting with auth, Supabase, recommendation, analytics, release, or CI changes unless a maintainer has already discussed the direction with you.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start the web app:

```bash
pnpm dev:web
```

Open `http://localhost:3000`.

Minimum local environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

## Checks

Before opening a web PR, run:

```bash
pnpm check
```

That currently runs:

```bash
pnpm lint && pnpm --filter web build
```

Root `pnpm build` is not the public contribution check yet because the monorepo build path still needs more review.

## Pull Requests

Keep PRs narrow. A strong PR explains:

- what changed
- why it changed
- how it was checked
- whether it touches a sensitive area
- screenshots or short recordings for visible UI changes

Use clear PR titles. Maintainers use PR titles and squash commit messages to generate `CHANGELOG.md` automatically, so contributors do not need to write changelog entries by hand.

Good title examples:

```text
fix(web): prevent review card text overflow
feat(web): add saved review empty state
docs: clarify local web setup
chore(repo): document release checklist
```

## Sensitive Areas

These areas need extra context and maintainer review:

- Supabase schema, SQL, RLS, RPC, or storage
- Auth, onboarding, session, proxy, or permission flows
- API route write behavior
- Recommendation, feed ranking, starter picks, or editorial curation
- Analytics behavior
- CI, package manager, dependency, release, or deployment changes
- Sentry and environment configuration

Public contribution is welcome here, but please open an issue or discussion first when the behavior is not already agreed.

## Changelog

Do not edit `CHANGELOG.md` in normal feature or fix PRs.

The changelog is generated from git history:

```bash
pnpm changelog:preview
pnpm changelog
```

Maintainers run this during the release process after choosing the release version and final squash commit titles.
