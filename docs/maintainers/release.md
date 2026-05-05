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

## What Is Intentionally Not Automated Yet

- npm publishing
- Auto-merge for release PRs
- Production deploy promotion
