# Kocteau Agent Rules

These rules apply to all work inside this repository. They are inspired by Vercel's Web Interface Guidelines and by Jakub Krehel's design-engineering approach to craft and iteration, but adapted to Kocteau's product direction: a dark, editorial, human-led music review experience.

Kocteau should feel closer to Letterboxd, Apple Music editorial, and a quiet music journal than to a SaaS dashboard or generic social network.

---

## Repository Operating Contract

### Source Of Truth

Use this order when gathering context:

1. `AGENTS.md` defines how repository work must be performed.
2. `PRODUCT.md` defines the product loop, current scope, and out-of-scope guardrails.
3. `DESIGN.md` defines visual, interaction, and motion decisions.
4. `CURRENT.md` records the current phase, active work, decisions, blockers, and next priority.
5. `README.md` and `docs/README.md` route setup and specialized documentation.

Before repository work, read `AGENTS.md` and `CURRENT.md` completely. Read `PRODUCT.md`, `DESIGN.md`, and specialized documents when the task touches their domain. Inspect the current branch, worktree status, and recent commits before changing files. Reconcile written status with repository evidence rather than trusting stale prose blindly.

### Ownership And Authorship

- Franco Zeta is the repository owner, product author, and public author of Kocteau.
- Assistants and automation are implementation tools. They must not present themselves as authors or become part of the repository's public identity.
- Preserve the Git identity configured by the maintainer. Never change `user.name`, `user.email`, signing settings, or authorship metadata.
- Do not add assistant co-authors, `Co-authored-by` trailers, generated-by notices, bot signatures, model names, vendor names, or AI disclosures to commits, pull requests, release notes, documentation, source comments, or product copy.
- Do not mention the tool used to produce a change unless the maintainer explicitly asks for that information.

### Session Continuity

- `CURRENT.md` is the concise public handoff between maintainers, contributors, and work sessions. It is a current-state document, not a diary or changelog.
- Update `CURRENT.md` automatically whenever work changes the active phase, in-review status, a decision, a blocker, a verification or deployment caveat, or the next priority. The maintainer should not need to request this separately.
- Do not manufacture an update for a trivial edit that changes none of those fields.
- Keep `CURRENT.md` short, evidence-based, and safe for an open-source repository.
- Do not place chat transcripts, assistant names, secrets, environment values, private links, personal data, speculative shipped claims, or long historical narratives in `CURRENT.md`.
- Do not duplicate stable product, design, or implementation rules in `CURRENT.md`; link to their canonical document instead.
- At the end of meaningful work, ensure `CURRENT.md` reflects what is actually committed, in review, blocked, or next. A local experiment is not shipped work.

### Working Notes And Plans

- Plans, scratch notes, and implementation checklists are working memory, not public documentation by default.
- Keep short plans in the active session. If a persistent local file is genuinely useful, store it under the path returned by `git rev-parse --git-path agent-plans` so it remains local in normal clones and linked worktrees.
- Do not add generated plans or specs to `docs/` unless the maintainer explicitly asks for a public RFC, design record, or long-lived contributor document.
- Promote only durable outcomes: update `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `CURRENT.md`, a relevant specialized document, or the implementation itself.
- Remove obsolete local planning notes when the task is complete. Do not make contributors navigate process artifacts to understand the product.

### Branches, Commits, And Pull Requests

Every new task branch must use:

```text
<type>/<short-kebab-description>
```

Allowed types are `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`, and `revert`.

Examples:

```text
feat/search-discovery-canvas
fix/search-mobile-selection
docs/repository-continuity
```

- Never use assistant, model, vendor, automation, personal, or generated prefixes. Disallowed examples include `codex/`, `copilot/`, `claude/`, `chatgpt/`, `ai/`, `agent/`, and `bot/`.
- If the active branch violates this convention, create a correctly named task branch before implementation. Do not rename or delete a shared branch without explicit maintainer direction.
- Keep `main` releasable. Do not commit directly to `main` unless the maintainer explicitly requests it.
- An approved request to implement, fix, refactor, document, or optimize authorizes creating a focused local task branch and making focused local commits after proportional verification.
- Use Conventional Commits for every new commit and pull-request title: `<type>(optional-scope): <imperative summary>`.
- Keep commits cohesive and exclude unrelated user changes, secrets, logs, verification-only screenshots, and generated test output.
- Inspect the final diff before every commit. Preserve existing user changes and do not rewrite unrelated files.
- Local implementation and commits do not authorize publishing. Push, pull-request creation or updates, merge, release, force-push, amendment of published commits, and shared-history rewrites require explicit maintainer direction.
- When the maintainer says the work is ready for a pull request, push the task branch and open or update the PR with the product outcome, important implementation decisions, and verification performed.
- Never merge a pull request unless the maintainer explicitly requests the merge.

---

## 1. Product Truths

- Kocteau is a music review and taste discovery product.
- The core experience is not “social posting”; it is reviewing music, expressing taste, and discovering what to hear next through other listeners.
- Reviews are the main event.
- The feed is the primary surface, not a generic dashboard.
- For You is the main signed-in home experience.
- Human taste is the source material. Lightweight algorithms route that taste.
- Editorial curation matters, especially during cold-start.
- Social features exist to support discovery, trust, and recommendation quality. They should not overpower reviews.
- Improve the existing product. Do not rebuild the app from scratch unless explicitly asked.

---

## 2. Product Loop

Protect and improve this loop:

1. User enters with email OTP.
2. User completes profile onboarding.
3. User chooses initial taste signals.
4. User reviews a track.
5. User interacts with reviews through likes, bookmarks, comments, or follows.
6. User returns to a personalized For You feed that improves from behavior.

When making changes, ask:

- Does this make reviewing music easier?
- Does this make discovery feel more human?
- Does this improve the For You loop?
- Does this preserve the editorial/minimal feel?
- Does this add clarity without adding noise?

If the answer is no, avoid the change unless explicitly requested.

### Design Engineering Mindset

- Use AI to accelerate iteration, not to replace product judgment.
- Prototype uncertain UI directions quickly, then keep, refine, or discard them fast.
- The human stays in charge of taste, hierarchy, writing, and final polish.
- Build scaffolding first, then tweak, polish, and animate.
- Prefer smaller sequential tasks over one giant ambiguous prompt.
- Understand what the agent changed before building on top of it.

---

## 3. Stack Defaults

Use the existing stack and patterns:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth, Postgres, Storage, RLS, and RPCs
- TanStack Query
- `cn(...)` for class composition
- `motion/react` only when motion improves clarity
- Server routes and Supabase RPCs for write-sensitive flows

Prefer existing project conventions over new abstractions.

For interface craft, visual polish, color, typography, gesture, and motion decisions, use [DESIGN.md](./DESIGN.md).

---

## 4. Visual Direction

Kocteau should feel:

- dark
- editorial
- minimal
- premium
- musical
- quiet
- human
- slightly cinematic through tone and imagery, not decorative effects

The visual language should be mostly monochrome.

Use color with restraint:

- The star/rating accent may use color.
- Album and track covers may provide natural color.
- Avoid extra accent colors unless already part of the product system.
- Do not introduce purple, blue, green, gradient, neon, or SaaS-like color accents without explicit direction.

Prefer:

- restrained contrast
- thin borders
- soft dark surfaces
- stable geometry
- calm spacing
- subtle dividers
- strong typography only where it supports reviews or music identity

Avoid:

- loud gradients
- glow-heavy styling
- oversized shadows
- glassmorphism for decoration
- dashboard-like cards
- excessive badges
- colorful pills
- productivity-app UI patterns

Small details compound into feel. Favor micro-polish that quietly improves the interface:

- use balanced or pretty text wrapping when long headings or copy would otherwise break awkwardly
- use concentric border radii for nested surfaces when padding and radius are both visible
- align optically, not only geometrically, especially in icon + text controls
- use tabular numbers when values update or compare side by side
- keep dark text rendering crisp and calm

---

## 5. Layout Principles

- The primary column should carry the experience.
- Reviews should dominate the hierarchy.
- Secondary rails should support discovery, not compete with the feed.
- The sidebar should remain stable, quiet, and functional.
- Do not over-design navigation.
- Keep surfaces visually integrated instead of stacking too many separate containers.
- Prefer one strong reading flow over multiple competing focal points.
- Keep dimensions stable to avoid layout shift.
- Use empty space intentionally, not as a placeholder for unfinished modules.

For the feed layout:

- Left sidebar = navigation and primary action.
- Center column = search, feed filters, reviews.
- Right rail = editorial discovery, trends, starter picks, or contextual recommendations.
- The right rail should feel like an editorial companion, not a social sidebar.

---

## 6. Editorial Rail Rules

The secondary rail should lean editorial, not generic social.

Good rail modules:

- Top conversations
- Editor’s pick
- Recently discussed
- Starter picks
- From the Kocteau desk
- Popular reviews
- Recommended because of your taste
- Fresh voices, only if framed editorially

Avoid making the rail feel like:

- a follower-growth widget
- a SaaS dashboard panel
- a noisy activity stream
- an ad column
- a generic “Who to follow” block with no editorial reason

If showing people, explain the music/taste reason subtly.

Prefer:

- “Fresh voices”
- “Writers to notice”
- “Listeners reviewing your taste”
- “Because you like dream pop”

Over:

- “Who to follow”
- “Suggested users”
- “People you may know”

---

## 7. Feed and Tabs

Feed tabs should organize the reading experience without dominating it.

Use simple, clear labels:

- For You
- Following
- Top

Use current product labels unless the task explicitly includes a product rename. Today, the feed/navigation language is closer to:

- For You
- Following
- Top
- Latest
- Explore
- Activity
- Saved

Avoid ambiguous labels like `Top` unless the ranking definition is obvious.

Tabs should be:

- quiet
- compact
- keyboard accessible
- stable in width
- visually connected to the feed
- not colorful
- not overly pill-shaped if it makes the UI feel like a dashboard

The active tab should be clear through contrast, not bright color.

The feed search/review launcher should feel integrated with tabs. It should not look like a separate app module fighting for attention.

---

## 8. Search and Review Launcher

Search and review creation may share a global launcher, but their intent must remain clear.

Search intent:

- helps users find tracks, albums, artists, reviews, or profiles
- should work for signed-out users when possible
- should not require auth just to browse

Review intent:

- starts with track search
- leads into rating and review composition
- requires auth only when the user attempts to create or publish

Use:

- `Cmd/Ctrl + K` for search
- `N` for new review

Avoid duplicate visible shortcuts for the same action.

Do not make `/search` only a modal target. `/search` or Explore should remain a fuller discovery surface when needed.

---

## 9. Review UI Rules

Reviews are the product’s main unit.

A review card should prioritize:

1. track identity
2. cover image
3. reviewer identity
4. rating
5. written take
6. lightweight engagement

Use album/track covers as visual anchors.

Keep review cards readable and calm:

- avoid excessive metadata
- avoid too many badges
- avoid loud engagement counters
- avoid turning every card into a dense dashboard object

If a review only has a rating, present that state gracefully. Do not make it feel broken.

When possible, support editorial texture:

- short take
- taste tags
- recommendation reason
- review context
- “based on recent discussion”
- “starter pick”
- “because of your taste”

Keep this copy subtle.

---

## 10. Copywriting Rules

Kocteau copy should feel precise, human, and editorial.

Prefer:

- short phrases
- plain language
- music-native wording
- quiet confidence

Avoid:

- corporate SaaS language
- growth-hacking language
- exaggerated empty states
- mixed-language copy in the same surface unless intentionally designed
- overexplaining basic UI

Good examples:

- “Review a track”
- “Find something to review”
- “Recently discussed”
- “Editor’s pick”
- “Shape your feed”
- “Save this review”
- “Only a rating was left for this track.”

Avoid:

- “Maximize your discovery workflow”
- “Engage with content”
- “Unlock the full experience”
- “Boost your profile”
- “Suggested users”

Use the ellipsis character `…` for follow-up actions and placeholders when needed.

---

## 11. Authentication and Permissions

Do not casually change auth behavior.

Kocteau is OTP-first:

- Supabase Auth sends email codes.
- The app verifies the OTP inside Kocteau.
- Profile onboarding can happen after auth.
- Username can remain nullable until onboarding is complete.
- Taste onboarding happens after profile setup.

Do not change Supabase OTP, onboarding, RLS, recommendation RPCs, or profile completion flows unless the task explicitly requires it.

Signed-out users should be able to browse where reasonable.

Require auth for:

- publishing reviews
- liking
- bookmarking
- commenting
- following
- saving
- profile-specific actions

---

## 12. Recommendation and Editorial Logic

Do not rewrite recommendation logic unless asked.

For You may use:

- explicit taste tags
- inferred tags
- entity tags
- follows
- familiar entities
- author affinity
- review quality signals
- recency
- diversity penalties
- editorial starter picks

Starter picks are curated prompts, not fake reviews.

Do not invent fake users, fake reviews, fake ratings, or fake engagement.

If recommendation data is sparse, prefer graceful editorial fallback over pretending the app has activity it does not have.

---

## 13. Data and Supabase Rules

Keep writes intentional.

Use server routes and RPCs where the project already does.

Do not bypass RLS casually.

Preserve uniqueness rules for music entities:

- provider
- provider_id
- type

Do not introduce duplicate entity behavior unless explicitly solving a known catalog issue.

Be careful with:

- reviews
- comments
- follows
- bookmarks
- notifications
- analytics events
- rate limiting
- recommendation RPCs
- starter track tags
- entity preference tags

Do not add sensitive analytics fields such as email, IP, or user agent.

---

## 14. Component Rules

Prefer small, readable components.

Avoid turning large product surfaces into one huge client component.

Split by product intent, not by arbitrary UI fragments.

Good splits:

- `review-card`
- `review-actions`
- `review-composer`
- `track-search`
- `feed-tabs`
- `editorial-rail`
- `starter-pick-card`
- `global-launcher`

Avoid:

- generic components with unclear names
- copy-pasted components named like `comp-543`
- one-off styling blobs
- introducing new design primitives when existing ones work

Use shadcn/ui where it fits, but do not let shadcn defaults make Kocteau feel generic.

---

## 15. Client and Server Boundaries

Default to server components where possible.

Use client components for:

- interactive controls
- dialogs
- optimistic actions
- keyboard shortcuts
- forms
- live search
- TanStack Query state

Do not move large server-rendered surfaces to the client without a clear reason.

Preserve URL state when it improves:

- shareability
- navigation
- back button behavior
- recovery after refresh

Do not preserve URL state for purely temporary UI if it creates noise.

---

## 16. Loading States

Use structural skeletons.

Skeletons should:

- mirror final layout
- preserve spacing
- preserve dimensions
- stay calm and dark
- avoid over-detailing every element

Do not use spinners as the main loading state for pages.

Spinners may be used only for small inline actions.

Avoid:

- splash screens
- blocking overlays
- animated full-page skeletons
- layout-jumping placeholders

---

## 17. Accessibility and Interaction

Keyboard support should work wherever reasonable.

Use:

- visible `:focus-visible` states
- `<button>` for actions
- `<a>` or `<Link>` for navigation
- `aria-label` for icon-only controls
- generous hit targets, especially on mobile

Do not block paste.

Dialogs must:

- trap focus correctly
- restore focus after close
- avoid hydration mismatch
- avoid losing input focus unexpectedly

Inputs should feel reliable and fast.

---

## 18. Performance Rules

Optimize for perceived speed.

Prioritize:

- stable skeletons
- progressive rendering
- minimal initial client-side work
- stable image sizes
- predictable layout
- reduced layout shift

Covers are important product assets.

For images:

- use correct sizes
- avoid unnecessary quality values
- keep `next/image` configuration simple
- prevent layout shift with known dimensions
- do not over-optimize covers until they look visually weak

Avoid adding client-side work to the initial feed unless it directly improves interaction.

---

## 19. Mobile Rules

Verify mobile for any meaningful UI change.

Mobile should preserve the same product hierarchy:

1. review/feed
2. search/review action
3. discovery
4. profile/activity

Avoid squeezing desktop rails into mobile.

On mobile:

- collapse secondary editorial modules below the feed or into Explore
- keep bottom navigation simple
- keep review actions reachable
- keep hit targets generous
- avoid sticky elements that consume too much vertical space

Native mobile parity is out of scope unless explicitly requested.

---

## 20. Out-of-Scope Guardrails

Do not add these unless explicitly requested:

- playlists
- direct messages
- gamification
- heavy ML recommendation systems
- full artist roles
- complex admin dashboards
- native mobile parity
- first-class album/artist systems beyond current entity support
- Spotify/Apple catalog coupling
- fake activity or fake reviews

If a request implies one of these, propose the smallest version that supports the current MVP loop.

---

## 21. Code Quality

Keep code readable and boring in the best way.

AI should help Kocteau write less code, not more.

Prefer:

- direct logic
- clear names
- typed inputs and outputs
- existing patterns
- small reusable components
- minimal abstraction
- clear server/client separation
- deleting duplication when a shared utility or component already solves it
- existing packages or exports over manually redefining assets the codebase can import cleanly

Avoid:

- clever abstractions
- hidden side effects
- unnecessary global state
- over-generalized UI primitives
- mixing product logic deeply into presentational components
- changing unrelated files
- defensive slop
- extra comments the file does not need
- `any` casts used only to get unstuck
- writing bespoke code when an established project primitive already exists

When editing, keep the diff focused.

---

## 22. Verification

Run the smallest useful verification for the task.

For UI changes, check:

- desktop
- mobile
- overflow
- layout shift
- weak contrast
- keyboard focus
- logged-in state
- logged-out state
- empty/sparse data state

For meaningful web changes, prefer:

```bash
pnpm --filter web lint
pnpm --filter web build
git diff --check
```
For auth, Supabase, recommendation, or RPC changes, also verify the relevant user flow manually.

## 23. Decision Rule
- When unsure, choose the option that makes Kocteau feel more like:
- a premium music review product
- an editorial discovery surface
- a human taste network
- a calm, dark, minimal reading experience

If two valid options remain, prefer:

1. protecting the review/discovery loop
2. preserving clarity and reading comfort
3. keeping the UI visually quiet
4. adding polish only after the first three are satisfied
