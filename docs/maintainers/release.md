# Release Automation

Kocteau uses Release Please for versioning, changelog updates, tags, and GitHub Releases.

This keeps release control with the maintainer while avoiding manual version and changelog work.

## Scope

The current release ritual is web-first. `apps/web` is the production contribution surface. Mobile changes can exist in the repo, but they should not drive public release notes until mobile becomes a production surface.

## How It Works

1. Contributors open PRs with clear titles.
2. Maintainers squash merge with a conventional title.
3. Release Please watches `main`.
4. Release Please opens or updates a release PR.
5. The release PR updates `package.json`, `.release-please-manifest.json`, and `CHANGELOG.md`.
6. When the maintainer merges the release PR, Release Please creates the tag and GitHub Release.

Release Please requires GitHub Actions to be allowed to create pull requests. See `docs/maintainers/github-rules.md` for the repository setting.

## PR Title Inputs

Make sure user-facing web changes use clear conventional titles:

```text
feat(web): add saved review empty state
fix(web): prevent profile header overflow
docs: clarify contributor setup
chore(repo): update maintainer automation
```

During the current web-first phase, mobile changes should usually use `chore(mobile): ...` unless the maintainer intentionally wants them in public release notes.

## Release PR Review

Before merging a Release Please PR:

- Read the generated `CHANGELOG.md` section.
- Confirm the version bump matches the merged changes.
- Confirm `package.json` and `.release-please-manifest.json` match.
- Confirm CI passes.

Prefer fixing noisy PR titles before merge. Avoid hand-editing generated release PR files unless the generated output is clearly wrong.

## Post-Release Smoke Check

After deploy:

1. Open `/`.
2. Confirm the feed loads.
3. Open search.
4. Open a track page.
5. Open a profile page.
6. Check login/signup OTP flow only if auth changed.
7. Check Supabase recommendation/starter health only if data logic changed.

## Public App Changelog

The root `CHANGELOG.md` is the technical release history. The public `/help/changelog` page is separate and renders curated MDX notes from `apps/web/content/changelog`.

Use Release Please, GitHub Releases, and tags as the technical source of truth:

1. Merge the product work to `main`.
2. Let Release Please create the release PR.
3. Review the generated `CHANGELOG.md` section before merging.
4. Merge the release PR so Release Please creates the tag and GitHub Release.
5. The release workflow drafts a public MDX changelog note in `apps/web/content/changelog`.
6. The workflow opens a follow-up PR and asks Vercel Agent for an editorial pass.
7. Review the generated note, add screenshots or edits if useful, and merge when it is ready to publish.

The automation should save writing time, not remove maintainer taste. Public notes should describe what changed for listeners and writers; they should not expose raw commit language, implementation details, or internal maintenance work.

To draft the latest public note locally:

```bash
pnpm --filter web changelog:draft
```

Vercel Agent must be enabled for the project before the automated `@vercel` PR comment can help refine the note.

## What Is Intentionally Not Automated Yet

- npm publishing
- Auto-merge for release PRs
- Production deploy promotion
