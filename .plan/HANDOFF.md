# Studio Signals Handoff

Branch: `feat/studio-signal-proposals`.
Base: `96af63b` (PR #207), plus the maintainer's generated-type commit recovered
from `a5d5413` as `d402d5e`. See [CURRENT.md](../CURRENT.md) for verification and PR status.

## Preserve

- The existing Studio dialog/drawer, curator auth, six-kind `preference_tags`
  vocabulary, catalog jobs/source observations, and `upsert_starter_track` write path.
- Selection starts research automatically; no extra Research/Apply button is required.
- Recording matching prefers Deezer ISRC and verifies title, full artist credit,
  duration, and version context. Never restore the previous first score-100 title
  match: it selected a live Teardrop recording for the studio track.
- Source history remains append-only. `lookup.researchVersion = 2` distinguishes
  identity-checked observations; completed older jobs receive one fresh pass.
- `lib/catalog/signal-proposals.ts` is the typed deterministic draft boundary:
  schema/rules version, identity snapshot, existing tag IDs, origins, and observation
  references. Original recording dates precede reissue dates; album context is
  marked inferred. Unknown categories remain empty.
- `signal-selection.ts` and `use-starter-catalog-research.ts` separate manual choices
  from source results. Keep their race, retry, removal, Clear, and saved-curation tests.
- Research never publishes. Only Add pick / Update pick persists selected tags.

## Integrate Parallel Model Work

1. Commit or otherwise preserve your branch before integrating this branch/PR.
   Fetch and merge the reviewed baseline normally; do not force-push or discard work.
2. Compare the existing implementation before retaining a second research endpoint,
   worker, vocabulary, or form. Extend the typed proposal boundary instead.
3. Keep deterministic suggestions available when a model is absent, slow, invalid,
   or rate-limited. Do not require new credentials merely to autofill known metadata.
4. Treat source text as data, not instructions. Validate every proposed tag against
   the current vocabulary and every evidence reference against the selected identity.
   Keep inference distinguishable from an external assertion or a curator decision.
5. Implement durable proposal/decision storage and transactional acceptance before
   claiming that corrections train or persist in a learning loop. The current form
   saves final tags, but does not persist a proposal acceptance/rejection audit.
6. Keep inference in curator/background work with versioned inputs, cache keys,
   cost/time limits, and a reproducible evaluation set. Do not change Search or
   For You ranking in this integration.
7. Shared skills, `skills-lock.json`, and `.plan/` now travel with Git. Private
   experiments go in `.plan/local/`; environment values and sessions stay excluded.

Coordinate status through issue #206 and the PR. Do not treat a local result as
deployed, automatically merge the PR, or replace the maintainer's visual decisions.
