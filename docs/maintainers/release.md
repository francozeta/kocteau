# Release Checklist

Kocteau uses manual releases with an automatically generated changelog.

This keeps release control with the maintainer while avoiding manual changelog writing for contributors.

## Scope

The current release ritual is web-first. `apps/web` is the production contribution surface. Mobile changes can exist in the repo, but they should not drive public release notes until mobile becomes a production surface.

## Before Release

1. Pull the latest `main`.
2. Check that the working tree is clean.
3. Review merged PR titles and squash commit messages.
4. Make sure user-facing web changes use clear conventional titles:

```text
feat(web): add saved review empty state
fix(web): prevent profile header overflow
docs: clarify contributor setup
chore(repo): update maintainer automation
```

5. Run:

```bash
pnpm check
```

## Prepare Changelog

1. Choose the next version.
2. Update the root `package.json` version.
3. Preview the generated web changelog:

```bash
pnpm changelog:preview
```

4. Generate `CHANGELOG.md`:

```bash
pnpm changelog
```

5. Review `CHANGELOG.md` for obvious noise. Prefer fixing noisy commit or PR titles before generation instead of hand-editing entries.

## Commit and Tag

Commit the release files:

```bash
git add package.json pnpm-lock.yaml CHANGELOG.md
git commit -m "chore(release): vX.Y.Z"
```

Create the tag:

```bash
git tag vX.Y.Z
```

Push:

```bash
git push origin main
git push origin vX.Y.Z
```

## GitHub Release

Create a GitHub Release from the tag and use the matching `CHANGELOG.md` section as the release notes.

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

- Version bumping
- GitHub Release creation
- Tag creation
- Release Please
- npm publishing
