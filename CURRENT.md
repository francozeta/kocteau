# Current Project State

Last verified: 2026-09-19
Base: `origin/main` at `c8716ed`

This file is Kocteau's concise public handoff. Stable operating, product, and interface rules live in `AGENTS.md`, `PRODUCT.md`, and `DESIGN.md`.

## Current Phase

Kocteau is refining the visible web core after the contextual Settings shell and progressive Search/discovery performance work landed on `origin/main`.

The immediate product goal is to make discovery feel distinctive and to create a clearer path from Search to a canonical track page and review intent. Avoid another infrastructure-only phase unless it directly removes a measured blocker.

## Active Work

- Repository continuity rules and canonical root documents are published from `docs/repository-continuity`.
- Pull request [#198](https://github.com/francozeta/kocteau/pull/198) is under review for integration into `main`.
- `/search` is the next product surface scheduled for focused UI/UX research and design before implementation.

## Decisions In Force

- Kocteau remains a music review and taste discovery product, not a streaming player.
- Search remains available for signed-out browsing where possible; authentication begins when an action requires an account.
- The route must preserve progressive result lanes and cancellation of stale search work.
- Search should lead toward stable canonical Kocteau entity routes rather than provider-shaped duplicate destinations.
- Editorial starter picks may support cold-start density, subject to the integrity guardrails in `AGENTS.md` and `PRODUCT.md`.
- Desktop and mobile may use different compositions, but they must preserve the same discovery model and navigation outcome.
- Search polish must keep the dark, editorial, minimal direction while allowing album artwork and intentional spatial disorder to carry personality.
- Task plans and scratch specs stay local by default; only durable decisions belong in the public documentation set.

## Known Gaps

- The desktop search input currently begins inside the discovery canvas. Moving it into the main-content header may improve hierarchy and preserve more space for exploration.
- The focused or selected-track component reads too much like a detached player/review control and is especially weak on mobile.
- The value of an intermediate selected-track card is unresolved. Direct navigation to the canonical track route may be clearer, with review creation available there.
- The canvas does not yet fully express the desired feeling of a young listener's disordered notebook or an expansive music catalog.
- The right balance between visible starter picks, catalog density, legibility, and rendering cost needs evidence before implementation.

## Next Priority

Research and design the `/search` discovery flow, concentrating on:

1. desktop input placement in the main-content header;
2. an intentionally scattered, explorable cover field with more useful density;
3. the click, focus, keyboard, and touch behavior for tracks;
4. whether selection should navigate directly to the canonical track route;
5. a mobile composition that does not reproduce the current selected-track bar;
6. preservation of performance, accessibility, and signed-out discovery.

Implement Search only after the interaction model and acceptance criteria are explicit.

## Verification Notes

- `origin/main` includes `feat(settings): add contextual settings shell (#194)`.
- Search/discovery performance work landed through `perf(search): cancel stale work and preserve discovery lanes (#193)` and `perf(discovery): split progressive recommendation lanes (#191)`.
- Repository continuity changes are documentation-only and require Markdown, link, diff, and Git-history verification before review.
