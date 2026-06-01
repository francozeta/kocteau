# GitHub Rules

[Docs index](../README.md) | [Release automation](./release.md) | [Operations](../operations.md) | [Backlog](../backlog.md)

These settings keep Kocteau open to public contributions while protecting release, auth, data, and recommendation flows.

## General Repository Settings

- Enable issues.
- Enable discussions when there is time to moderate them.
- Enable squash merge.
- Prefer squash merge for public PRs so the final title feeds Release Please cleanly.
- Disable auto-merge until the public workflow is stable.
- Keep merge commits disabled once contributors are comfortable with squash PRs.

## Actions Permissions

Release Please needs permission to open and update release PRs.

In GitHub, enable:

- Settings -> Actions -> General -> Workflow permissions: `Read and write permissions`.
- Settings -> Actions -> General -> Workflow permissions: `Allow GitHub Actions to create and approve pull requests`.

Without the second setting, Release Please will run but fail when it tries to create the release PR.

## Branch Protection for `main`

Start with advisory checks during launch. After one to two stable public contribution weeks, enable:

- Require a pull request before merging.
- Require approvals: 1.
- Require review from Code Owners.
- Require conversation resolution before merging.
- Require status checks to pass before merging.
- Required check: `Verify`.
- Do not require linear history until the team wants it.
- Do not require signed commits yet.

Keep admins able to bypass during the early launch period only when production needs it.

## Release Please

Release Please runs on pushes to `main`.

It opens or updates a release PR that changes:

- `package.json`
- `.release-please-manifest.json`
- `CHANGELOG.md`

When the release PR is merged, Release Please creates:

- the `vX.Y.Z` tag
- the GitHub Release

Do not manually edit release PR files unless the generated release notes are clearly wrong.

## PR Title Convention

PR titles and squash commit titles drive releases:

```text
feat(web): add saved review empty state
fix(web): prevent profile header overflow
perf(web): reduce feed image layout shift
docs: clarify contributor setup
chore(repo): update maintainer automation
```

During the current web-first phase, mobile work should normally use `chore(mobile): ...` unless the maintainer intentionally wants it in public release notes.

## Labels

Run the `Sync Labels` workflow after changing `.github/labels.json`.

Labels are for triage, not status theater. Prefer useful labels over many labels.
