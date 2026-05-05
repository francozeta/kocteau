# Public Maintainer Automation Design

**Goal:** Prepare Kocteau for 100% public contribution with automation that feels professional, welcoming, and protective without blocking early momentum.

**Context:** Kocteau is a public-facing music review product with a Next.js web app, Expo mobile app, Supabase-backed data/auth flows, and sensitive recommendation/editorial logic. Public contribution automation is web-first for now because `apps/web` is the production surface; `apps/mobile` remains future-facing. The known reliable checks are `pnpm lint` and `pnpm --filter web build`; root `pnpm build` timed out locally and should not become the first CI gate.

**Decision:** Use an advisory-first maintainer system for launch. GitHub automation should sort, guide, verify, and prepare releases visibly, while maintainers keep final control over sensitive areas and release PR merges.

---

## Principles

- Make first contributions feel possible within five minutes.
- Keep public automation visible and consistent, not punitive.
- Protect auth, Supabase, CI, recommendations, and release surfaces with stronger review expectations.
- Let UI, docs, copy, accessibility, and small product polish remain easy to contribute.
- Start with non-blocking checks, then escalate only when the repo has enough public signal.
- Avoid automating releases until public contribution flow is stable.

## Contribution Lanes

Kocteau should present two clear contributor lanes.

**Fast Lane:** Good for first-time contributors and casual drive-by PRs.

- Documentation fixes
- README/CONTRIBUTING improvements
- Copy polish
- UI polish that does not change auth, data writes, or recommendation logic
- Accessibility fixes in isolated components
- Loading, empty, and error-state polish
- Small mobile UI fixes

**Maintainer Review Lane:** Open to public contributors, but requires clearer explanation and maintainer review before merge.

- Supabase schema, SQL, RLS, RPC, or storage changes
- Authentication, onboarding, session, proxy, or permissions changes
- API route write flows
- Recommendation, feed ranking, starter picks, editorial curation, or analytics behavior
- CI, dependency, package manager, release, or deployment changes
- Sentry, environment, security, or observability changes

The lane is determined by intent and affected behavior, not only by file path. A UI change that alters how reviews are written or ranked belongs in the Maintainer Review Lane.

## Contributor UX

Add public-facing docs that guide contributors without overexplaining the product.

- `README.md` should include a compact "Contributing" section that links to the full guide and calls out the Fast Lane.
- `CONTRIBUTING.md` should explain setup, branch naming, checks, PR expectations, issue triage, and the two contribution lanes.
- `.github/PULL_REQUEST_TEMPLATE.md` should ask for what changed, why it changed, testing evidence, screenshots for UI, and whether the change touches sensitive areas.
- Issue templates should cover bug reports, feature requests, documentation fixes, and design/product feedback.
- `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `SUPPORT.md` should exist before public attention increases.

The wording should match Kocteau's tone: calm, human, direct, and editorial. Avoid corporate contributor language.

## Labels

Use labels as a maintainer dashboard, not decoration.

**Area labels:**

- `area:web`
- `area:mobile`
- `area:ui`
- `area:docs`
- `area:supabase`
- `area:auth`
- `area:recommendations`
- `area:analytics`
- `area:ci`
- `area:dependencies`

**Status labels:**

- `needs reproduction`
- `needs maintainer decision`
- `needs design review`
- `ready for review`
- `blocked`

**Contributor labels:**

- `good first issue`
- `help wanted`
- `first contribution`

**Type labels:**

- `bug`
- `feature`
- `docs`
- `design`
- `refactor`
- `test`
- `chore`

Labels should be synced from `.github/labels.json` through a manual and main-branch workflow so the public repo stays consistent.

## Bots and Workflows

Initial automation should guide rather than punish.

**Pull Request Labeler**

- Runs on public PR events.
- Applies labels from `.github/labeler.yml`.
- Uses path rules for area labels and branch-name hints for type labels.
- Should not require secrets.

**Sync Labels**

- Runs manually and on changes to `.github/labels.json`.
- Creates or updates labels through `actions/github-script`.
- Does not delete labels automatically.

**Dependabot**

- Runs weekly on Monday at `10:00` America/Lima.
- Groups npm production dependencies, npm development dependencies, and GitHub Actions updates separately.
- Limits open PRs to avoid launch-week noise.
- Labels dependency PRs with `area:dependencies`.

**Verify**

- Runs on pull requests, pushes to `main`, and manual dispatch.
- Uses PNPM with frozen lockfile.
- Runs `pnpm check`.
- Runs `git diff --check`.
- Initially advisory, not required by branch protection.

The first `pnpm check` should be:

```bash
pnpm lint && pnpm --filter web build
```

Root `pnpm build` should stay out of the initial check because it timed out locally. It can be revisited after Turbo build behavior is understood and mobile/package build expectations are explicit.

## CODEOWNERS

CODEOWNERS should route sensitive changes to the maintainer without making every small PR feel heavy.

Suggested sensitive ownership:

- `.github/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `turbo.json`
- `supabase/**`
- `apps/web/app/api/**`
- `apps/web/app/auth/**`
- `apps/web/app/(auth)/**`
- `apps/web/lib/auth/**`
- `apps/web/lib/supabase/**`
- `apps/web/lib/queries/feed.ts`
- `apps/web/lib/queries/starter.ts`
- `apps/web/lib/queries/reviews.ts`
- `apps/web/lib/queries/notifications.ts`
- `apps/web/lib/recommendations/**`
- `apps/web/lib/analytics/**`
- `apps/web/proxy.ts`
- `apps/web/next.config.ts`
- `apps/web/sentry.*.config.ts`
- `apps/web/instrumentation.ts`
- `apps/web/instrumentation-client.ts`
- `docs/operations.md`
- `docs/maintainers/**`

This protects core systems while leaving most component, copy, docs, and isolated UI work approachable.

## Escalation Rules

Start launch with advisory automation. Escalate only when specific signals justify it.

**Promote `Verify` to a required check when all of these are true for at least one public contribution week:**

- Most contributor PRs can run the workflow without environment-related failures.
- Maintainers trust the check output and are not routinely bypassing it.
- The workflow duration stays acceptable for public contributors.
- Failures point to real issues instead of unstable tooling.

**Add stricter controls if any of these happen repeatedly:**

- PRs merge with lint or build failures.
- Contributors frequently change sensitive files without explanation.
- Dependency PRs become noisy enough to slow review.
- Public PRs create confusion around Supabase, auth, recommendations, or releases.

**Defer stricter controls when these happen:**

- CI failures are caused by missing secrets or fork restrictions.
- Root monorepo build remains unstable or too slow.
- Contributors are mostly submitting low-risk docs/UI work.

Controls to defer until justified:

- Required branch protection
- Commitlint
- Husky hooks
- Auto-merge
- Stale bot

## Changelog and Release Strategy

Use Release Please for versioning, `CHANGELOG.md`, tags, and GitHub Releases. Keep the final release PR merge manual.

Add `docs/maintainers/release.md` with:

- Pre-release checks
- Release Please PR review rules
- Web-first changelog scope for the current production surface
- Tag naming convention through Release Please
- GitHub Release checklist
- Post-release smoke checks

Contributors should not write changelog entries manually. Maintainers should preserve or adjust clear PR titles and squash commit messages so Release Please can generate useful release notes.

## Security and Fork Safety

Public forks must not receive secrets.

- Workflows should avoid `pull_request_target` unless the job does not check out or execute untrusted code.
- Verify jobs should run with read-only permissions.
- Labeling can use trusted metadata-only actions.
- Release and deployment workflows should not run on forked PRs.
- Secrets should not be required for the initial public checks.

## Rollout Plan

**Phase 1: Public Contributor Foundation**

- Add public contribution docs, templates, labels, CODEOWNERS, and Dependabot.
- Add `pnpm check` with the known stable command.
- Add advisory Verify workflow.
- Keep branch protection unchanged.

**Phase 2: Launch Observation**

- Watch public PRs for one to two weeks.
- Track common failure causes and confusing contribution paths.
- Refine labels, templates, and CONTRIBUTING copy before adding enforcement.

**Phase 3: Selective Enforcement**

- Make Verify required only if it is stable and useful.
- Add stricter review requirements for sensitive lanes if needed.
- Keep first-contribution paths lightweight.

**Phase 4: Release Automation Hardening**

- Keep Release Please PR merges manual during launch.
- Revisit auto-merge only after public contribution patterns are clear.

## Success Criteria

- A new contributor can identify a safe first contribution quickly.
- Maintainers can triage public PRs from labels without reading every file first.
- Sensitive changes are clearly surfaced for review.
- CI gives contributors useful feedback without blocking early momentum.
- Dependency updates arrive in manageable groups.
- Release control remains manual and predictable during launch.

## Non-Goals

- No release PR auto-merge in v1.
- No manual changelog entry requirement for contributors.
- No stale bot in v1.
- No auto-merge in v1.
- No commit message enforcement in v1.
- No required branch protection until launch-week signal supports it.
- No root monorepo build enforcement until `pnpm build` behavior is understood.
