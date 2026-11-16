# Discovery ranking evaluation

## Boundary

Independent offline experiment from `main@37138e7`. No route, renderer, provider,
database, listener memory or product ranking is changed. The evaluator lives under
`apps/web/tests/discovery/ranking-evaluation`; only the runner/tests import it.
No new dependencies or runtime service are introduced. This is a reproducible
experiment, not an adopted recommendation algorithm.

The corpus is deliberately synthetic and frozen: balanced candidates,
familiar/revisited tracks, homonymous artists and aliases, repeated artwork,
missing metadata and a sparse pool. IDs use the existing `DiscoverySeed`
provider/artist fields. Fixtures are not fabricated reviews, listeners, provider
records or real listening evidence. `.invalid` artwork is never fetched.

## Reproduction

Install repository dependencies with `pnpm install --frozen-lockfile`, then run
from the repository root:

```sh
pnpm exec tsx --test apps/web/tests/discovery/ranking-evaluation/mmr.test.ts
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
seeded history/Back and renderer regressions. No UI change is part of this PoC.

## Local verification

Nine mechanical tests pass, including replay under reversed input, hard
exclusions, identity fallback, artist quotas, empty pools and lambda boundaries.
The normal runner produces 24 selections/timing rows across six synthetic
cohorts and four variants; the blind runner produces six packet examples.
Quality remains explicitly unevaluated. Focused ESLint, documentation generation
(34 pages, 175 repository links), full web TypeScript checking after that
generation, and whitespace checks pass. No browser, provider, database or
production performance/quality claim is made by this offline experiment.
