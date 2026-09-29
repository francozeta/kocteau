# Discovery Delivery

Coordination: [issue #206](https://github.com/francozeta/kocteau/issues/206).
Delivery status: [CURRENT.md](../CURRENT.md).
Contract: [Catalog research and curation](../docs/knowledge-layer.md).

## Intent

The curator chooses a song; Kocteau researches it and prepares useful signals;
the curator confirms the pick. Requiring six categories of manual tagging is not
the desired workflow. Missing evidence is not a reason to invent tags.

## Sequence

1. **Baseline and source history:** preserve canonical identities, source
   observations, retries, and the shared MusicBrainz lease. PRs #205 and #207
   provide the initial implementation.
2. **Selection-driven autofill:** start research when selecting a track, resolve
   the correct recording, and map stored evidence to existing vocabulary. Keep
   the form editable, retain human corrections, and publish only on explicit save.
3. **Durable proposals and decisions:** store identity/evidence/version snapshots,
   protect referenced observations from deletion, and atomically record accepted,
   rejected, and human-added signals with starter tags. Do this before claiming
   a persistent learning loop. Current derived draft suggestions are not that audit.
4. **Bounded synthesis:** add optional model interpretation only for demonstrated
   evidence gaps. Validate existing tag IDs and observation references, preserve
   deterministic fallback, impose time/cost bounds, and evaluate known tracks,
   covers, remixes, live versions, sparse evidence, and unavailable providers.
5. **Editorial destinations and discovery:** build on accepted signals and existing
   collections. Measure coverage and relevance before changing Search/For You
   ranking or adding semantic retrieval.

## Acceptance Gate

- Choosing a new or untagged pick fills supported signals without a Research/Apply step.
- Existing curated tags, notes, Clear, removals, and manual additions survive research.
- Changing tracks cannot apply the previous track's response to the current draft.
- Failures/backoff remain visible and recoverable; a provider outage does not trap editing.
- Sources are inspectable; no fabricated mood, scene, or listening cue fills a quota.
- No public search request starts inference or research; no selection auto-publishes.
- Verify desktop/mobile, curator access, signed-out denial, source failure, and save/reopen.
