# Discovery ranking evaluation

## Boundary

Independent experiment on `refactor/architecture-foundations`
(initial audited baseline `main@37138e7`), with an offline runner and an opt-in
private preview lab. Default Search, For You, their renderers, provider behavior,
database and listener memory are unchanged. The pure experimental kernel lives
in `apps/web/lib/discovery/mmr.ts`; only the private lab and evaluation tests
import it. No new dependencies or runtime service are introduced. This is a
reproducible experiment, not an adopted recommendation algorithm.

The offline corpus is deliberately synthetic and frozen: balanced candidates,
familiar/revisited tracks, homonymous artists and aliases, repeated artwork,
missing metadata and a sparse pool. IDs use the existing `DiscoverySeed`
provider/artist fields. Fixtures are not fabricated reviews, listeners, provider
records or real listening evidence. `.invalid` artwork is never fetched.

## Reproduction

Install repository dependencies with `pnpm install --frozen-lockfile`, then run
from the repository root:

```sh
pnpm exec tsx --test apps/web/tests/discovery/ranking-evaluation/mmr.test.ts
pnpm exec tsx --tsconfig apps/web/tsconfig.json --test apps/web/lib/discovery/lab-access.test.ts apps/web/lib/discovery/lab-snapshot.test.ts
pnpm exec tsx apps/web/tests/discovery/ranking-evaluation/run.ts
pnpm exec tsx apps/web/tests/discovery/ranking-evaluation/run.ts --blind
```

Keep saved reports under ignored `.plan/local/` or `.codex-private/`. The runner
prints JSON only and performs no fetch, file write, authentication or database
operation. The built-in fixture version, explicit clock, variation and listener
memory make selections replayable. Memory fixtures use the actual
`recordDiscoveryVisit` contract rather than hard-coded artist keys, including
when the experiment is rebased onto the stable-artist-identity correction.
Re-run on the same commit before comparing
runtime samples; its `current` baseline imports the actual canvas evaluator.

## Private preview feedback

`/studio/discovery-lab` is available only when `VERCEL_ENV=preview`, or in local
development with `?local=1` and no Vercel deployment environment. A production
deployment cannot be opted in by query. The page lives outside the shared
Studio route-group layout so the environment gate executes before auth or shell
reads, then requires a signed-in user and the existing Starter curator role.
It forces dynamic rendering, declares `noindex`, has no public navigation link
and is absent from the sitemap.

The curator submits a public `/api/search` query and selects an actual track.
The lab fetches one `/api/discovery/map?lane=full` pool using the chosen seed and
bounded variation (0–15). It copies and freezes that public response with one
clock, seed, rank variation, empty memory and missing album/tag features. All
three labelled panels consume the same input: current ranking, relevance-only
control, and MMR at 0.7 or 0.4. Changing lambda reuses the captured pool. The
live redundancy term uses artist identity only; it makes no audio similarity or
quality claim. Real titles, artists and artwork support listener feedback.

Degraded/stale search, partial or empty pools, errors, cancellation and explicit
retry remain visible. Aborted requests cannot replace a newer snapshot. Failed
replacements retain the earlier snapshot and its own seed label. No Starter
fallback, listener memory read/write, account persistence, feedback collection,
new API or database operation is added. Existing source deadlines and public
cache policy are reused without changes. JSON export contains the public
snapshot, lambda and selected identities; it downloads locally for replay and
feedback. The unchanged offline methods can consume its `input` without another
catalog fetch. Ranking timing and quality claims still require separate evidence.

This labelled exploratory comparison is not blinded evaluation. Before formal
quality judgement, capture representative public snapshots, freeze the corpus
and apply the quality decision gate below. Snapshot JSON carries a schema version
but must also be associated with the reviewed Git commit when results are compared.

The real client component is exercised against loopback public endpoint fixtures:

```sh
node apps/web/tests/load/verify-discovery-lab.mjs
DISCOVERY_LAB_BROWSER=webkit node apps/web/tests/load/verify-discovery-lab.mjs
```

These commands require Playwright available to the environment (optionally via
`KOCTEAU_PLAYWRIGHT_MODULE`); it is not a new project dependency. They do not
authenticate or contact Supabase, Deezer or a deployed service. Access guards
are tested separately; live curator login remains a preview acceptance check.

## Comparison

All variants receive exactly the same candidate pool and use the current
`evaluateCandidate` base relevance. Current uses lane interleaving and its
existing identity policy. Relevance-only sorts globally with stable artist IDs
and the same hard constraints as MMR. MMR variants use lambda 0.7 and 0.4.
Compare MMR with relevance-only to isolate the redundancy term. Comparing only
current versus MMR would confound lane policy, artist identity and MMR.

MMR greedily selects `lambda * normalizedBaseRelevance - (1-lambda) *
maximumRedundancyWithSelected`. Base relevance is min/max-normalized within the
eligible, identity-deduplicated pool. Equal scores normalize to one. At lambda
zero the first result uses relevance as deterministic tie-break, then diversity
dominates. Tie-breaking uses explicit lexical identity, without locale-dependent
ordering. Seed identity, missing artwork and nonfinite scores are excluded;
artwork is unique and at most two candidates per known artist are admitted.

Redundancy uses stable provider artist identity first, normalized-name fallback
only for missing IDs, same album (0.8), and tag Jaccard (0.5 weight). Same artist
is 1. Tags/album IDs are fixture metadata, not additional product assumptions.
These weights are experiment parameters, not tuned musical truth. Absent
metadata gives no evidenced redundancy; pair coverage is reported separately
so it cannot be mistaken for known dissimilarity. Hard artwork constraints are
display policy, never an instruction to merge different tracks in persistence.

The runner separates selection proxies from CPU timing. It reports normalized
base relevance, artist/artwork/lane/tag coverage, unseen share, metadata coverage
and known-pair redundancy. These do not establish musical relevance, listening
satisfaction, audio similarity or serendipity. It prints no quality lift.

Warm local CPU uses 200 warmups and 20 batches of 50 per method/cohort, rotating
variant order each batch. It reports median and P95 **of batch means**, not
individual-call tails, browser performance, endpoint latency or capacity. Module
startup, retrieval, rendering and JSON output are excluded. The code uses no
Rust/Wasm; a future comparison must include cold load, bridging and full-path
costs if profiling finds a reason to undertake it.

## Quality decision gate

Synthetic fixtures can verify mechanics only. Before any recommendation-quality
decision, create a separate reviewed corpus of public candidate snapshots with
source provenance, reliable identities, missing-data markers and listening
context; no private user histories. Freeze retrieval/time/memory across methods.
Include popular/obscure seeds, repeated albums, cold start and revisits. Neither
MMR nor a better score can retrieve a candidate absent from the pool.

Pre-register the judge rubric and non-inferiority margin before revealing
variant labels. Each blinded pair should ask: relevance to this seed (1–5),
would-listen (1–5), redundant choices (count), and unexpected-but-relevant
choices (count). Permit ties and insufficient-context responses; record
disagreement. Novelty without relevance is not serendipity. The `--blind`
output demonstrates A/B packet shape only, with deterministic alternating panel
assignment; it does not implement randomization, a statistical test or actual
musical evaluation. Real judge assignments and answer keys must be reviewed
separately and kept out of the panel material.

Adopt only after human relevance stays within the predeclared margin, listeners
prefer useful diversity on the reviewed corpus, and measured runtime plus
recovery/first-pool budgets do not regress. Before product wiring, also run
existing candidate, memory, cancellation, partial-lane, no-Starter-fallback,
seeded history/Back and renderer regressions. The existing Search UI and approved
motion are outside this PoC; the private lab does not wire MMR into them.

## Local verification

Nine kernel tests cover replay under reversed input, hard
exclusions, identity fallback, artist quotas, empty pools and lambda boundaries.
The normal runner produces 24 selections/timing rows across six synthetic
cohorts and four variants; the blind runner produces six packet examples.
Quality remains explicitly unevaluated. Six additional tests cover environment
gates, actual page auth ordering/curator access, public snapshot copying,
deterministic JSON replay and honest partial/empty pools. All 55 Discovery and
evaluation tests pass. Focused ESLint, documentation generation (34 pages, 179
repository links), Next route type generation, full web TypeScript checking and
whitespace checks pass. The loopback Chromium and WebKit fixture verifies opt-in retrieval, the shared pool,
lambda changes without refetch, degraded/partial status, JSON export, preserving
the previous seed after failure, retry and cancellation. This verifies client
mechanics; no provider, database, preview authentication or production
performance/quality claim is made.
