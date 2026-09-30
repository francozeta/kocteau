# Kocteau Knowledge Layer And Search

[Docs index](./README.md) | [Product](../PRODUCT.md) | [Discovery and curation](./discovery-curation.md) | [Current state](../CURRENT.md)

The curator chooses the music. Kocteau researches it. The listener discovers it.
Editorial taste is the starting point, not the listener's ceiling.

This document defines the catalog-to-curation boundary. It extends the existing
product; it does not introduce a second catalog, an encyclopedia, or a separate
discovery application. Delivery and deployment status belong in `CURRENT.md`.

## Implementation Map

| Responsibility | Existing implementation | Boundary and next work |
| --- | --- | --- |
| Music identity | `entities`, `artists`, provider IDs, artist/album relationships; `lib/deezer.ts` and `lib/catalog/musicbrainz.ts` | Keep Kocteau IDs stable; a source search match is supporting evidence, not canonical certainty. |
| Background research | `catalog_enrichment_jobs`, claim/prepare RPCs, `lib/catalog/enrichment.ts`, protected `/api/cron/enrich-catalog` | Shared database lease for MusicBrainz and a worker execution budget; cron resumes interrupted work. |
| Source evidence | `catalog_source_observations`, `lib/catalog/source-evidence.ts`, `source-normalization.ts` | Curator-only inspection through `/api/starter/research`; known current fields derive evidence classes without rewriting observation history. Existing projected metadata has no reconstructed provenance. |
| Studio selection | `components/starter-studio-client.tsx`: Kocteau Search, Deezer Scout, responsive editor | Selecting a track starts research; supported signals populate a new or untagged draft without publishing it. |
| Draft suggestions | `lib/catalog/signal-proposals.ts`, `signal-selection.ts` | Versioned, evidence-linked deterministic output; optional Gateway context is stored separately, while curator decisions are not yet durable. |
| Editorial vocabulary | `preference_tags` with genre, mood, scene, style, era, format | Suggest existing tag IDs with evidence references; do not create a parallel taxonomy. |
| Editorial publication | `upsert_starter_track`, `starter_tracks`, `starter_track_tags`, `editorial_collections`, `editorial_collection_items` | Version proposals and decisions; add explicit destination selection and atomic acceptance. Current form uses `starter-picks`. |
| Candidate decisions | `editorial_candidates`, candidate routes and helpers | The current Search/Scout editor does not provide an integrated candidate research queue. Reuse only matching concepts. |
| Listener discovery | For You SQL ranking; Search catalog lanes and local evaluator; private library | These are existing baselines. Browser-local opens/revisits are not account-wide taste; saves do not yet train the canvas evaluator. |
| Measurement | `analytics_events`, event validation, recommendation health | Add editorial outcome events with actual consumers; do not duplicate review/save rows or store raw searches by default. |

Paths above are relative to `apps/web` where applicable. Schema source lives in
`supabase/migrations`; the presence of a migration does not prove cloud deployment.

## Three Responsibilities

### Catalog research

Deezer supplies searchable music identity, artwork, and artist/album context.
MusicBrainz supplies candidate identities, release metadata, and attributed tags.
The existing provider clients stay outside React and keep their caches, timeouts,
and provider-specific errors. The existing worker remains the orchestrator.

Do not add providers by count. Apple Music already has a maintainer import/source
rotation path; that does not make it a runtime enrichment dependency. Discogs,
Wikidata, and other providers require a concrete evidence gap and appropriate
access before integration.

Preserve `(provider, provider_id, type)` uniqueness. Artist and album context does
not introduce additional review types. Provider search scores measure matching,
not the truth of a mood, genre, scene, or editorial recommendation.

### Editorial proposals

The deterministic draft layer consumes an identity snapshot and stored source
observations, then proposes a small set of existing vocabulary IDs. Optional
Gateway synthesis can explain those signals and evidence gaps through the same boundary.
Separate external assertions, derived interpretations, and human decisions.
A provider tag may contain a mood or a style; it is not automatically a genre.

Version the schema and runtime configuration. Each proposed signal needs evidence
references, an origin (`external`, `inferred`, or `human`), and a decision state
(`suggested`, `accepted`, or `rejected`). Corrections retain their earlier proposal
and the final human decision. Explicit human assertions may lack an external
source; they must remain distinguishable from researched claims.

Research V3 classifies the support at the field and proposal-reference boundary:
`fact` is source-reported identity or release metadata, `community` is an
attributed folksonomy tag, `editorial` is a bounded sourced editorial assertion,
`inferred` is a rule-derived interpretation, and `human` is a curator assertion.
These are provenance types, not confidence levels. One observation can contain
multiple classes: MusicBrainz recording dates are factual metadata while its
tags are community evidence. Current Deezer album genre labels do not have a
verified source class; using one as a track genre is explicitly `inferred`.
Unknown fields and observations predating the current research contract remain
unclassified. A source's match score is
only for identity resolution. No class overrides a saved curator choice.

Use strict structured output, validate referenced tags and evidence on the server,
and allow uncertainty or an empty proposal. Missing context is preferable to an
invented scene, relationship, or listening description. Keep synthesis optional,
bounded by cost and time, and outside public page requests. Cache by identity,
evidence revision, schema, and runtime configuration; never silently overwrite a
curator's correction on retry.

### Recommendation and routing

For You and Search already have different working baselines. For You routes real
reviews using taste and interaction signals. Search expands catalog candidates
with deterministic ranking and bounded browser-local memory.

Editorial selections define useful entry points. Reviews, ratings, saves, follows,
and intentional exploration determine a listener's path. Ignoring a cover is not
a dislike, and saving a track is not the same action as bookmarking a review.
Keep shared public candidate responses unpersonalized; account-specific ranking
must not leak into a shared cache.

Do not change either ranking engine just to introduce catalog research. First
measure the coverage and quality of accepted signals, then add one contextual
path with an honest explanation such as “From this collection” or “Continue from
here.” Do not invent personal explanations without a corresponding user signal.

## Source Observation Contract

The worker appends an observation before projecting a source result onto an
entity or artist. Each row records:

- its existing enrichment job, which identifies the Kocteau target;
- source and source entity type/ID;
- the provider identity, title, artist, and type used for that lookup;
- selected, normalized source fields in `facts`;
- `resolved`, `no_match`, or `failed` status;
- the provider search match score when available, separate from editorial confidence;
- retrieval time, schema version, and a safe error code for failed requests.

`retrieved_at` is when the worker receives the result from the provider client.
The existing client may serve cached data; this is not a claim that an upstream
record was fetched live at that instant. `facts` is a bounded field projection,
not the full response or an exhaustive research record. Raw user input, credentials,
headers, and raw error bodies do not belong here.

Successful empty matches remain distinct from failures. Later observations append
history, preserving earlier evidence and its lookup identity. Storage failure stops
the corresponding metadata projection so catalog updates cannot silently lose
provenance. Repeated attempts may record the same cached evidence; proposal work
should reference observation IDs and deduplicate inputs by source and identity.

The table is private, with RLS enabled and only service-role SELECT/INSERT grants.
It has no direct browser access and no editorial approval semantics. Observations
are normally removed with their parent job; proposal foreign keys prevent deleting
referenced evidence or its parent job. Define retention before increasing collection volume.

Existing source rows are not backfilled as if their provenance were known. Normal
refreshes collect new observations. A new starter pick also does not necessarily
have an `entities` row: current starter upsert only syncs tags when that entity
already exists. Studio research now resolves a missing entity from server-fetched
Deezer identity, preserves catalog uniqueness, and reuses the existing target job.

## Studio Flow

The complete durable proposal/acceptance flow remains a target inside the existing
Studio dialog/drawer. Selection-driven research and draft autofill are implemented:

`Search / Scout → choose track → automatic research and signals → adjust → save`

Show cover, title, and artist immediately. Retain existing tags and notes while
sources arrive. Offer accept, remove, correct, retry, and source inspection without
requiring six categories of manual input. Closing research must not publish a pick.

Keep research state separate from the current catalog coverage filters:

| State | Meaning |
| --- | --- |
| Collecting sources | At least one source is pending; show resolved and failed sources independently. |
| Enriching | A structured proposal is being prepared from stored evidence. |
| Needs context | Evidence or identity is insufficient; preserve existing human choices. |
| Ready | A valid proposal is available for human review; it is not publication. |
| Failed | Research cannot proceed; expose retry without losing the draft. |

Today `No signals`, `Needs context`, and `Ready` only count coverage of the six tag
kinds. Do not reuse that implementation as proof of evidence quality. Future
readiness must not encourage inventing tags merely to fill every category.

Only explicit acceptance publishes approved signals through the existing write
boundary. Keep proposal/decision persistence and starter tags/membership in one
transaction, reject obsolete proposals after identity changes, and make repeated
acceptance idempotent. Current `upsert_starter_track` also publishes its collection;
review that behavior before supporting destinations beyond `starter-picks`.

## Optional Gateway Context

`Prepare context` is an explicit curator action after source research completes.
The server reloads the selected Deezer identity, version-2 observations, and the
deterministic signal proposal. The browser supplies only a validated track ID.
The model receives neither personal notes nor listener activity. It may explain
only proposed tag IDs with their own resolved observation references; its output
never selects signals, writes notes, or publishes a pick. No call is made when
deterministic research found no supported signal. Empty insights and uncertainty
are valid for other drafts. Earlier results based on older research versions are
stale and are not shown as current context.

AI SDK structured output uses Vercel AI Gateway. The default model is
`google/gemini-2.5-flash-lite`; `STUDIO_PROPOSAL_MODEL` can name another compatible
low-cost model. The database reserves an ID before inference and stores the input
snapshot, prompt version, model, result or failure, token usage, reported cost,
and up to three referenced observations. Identical current inputs reuse a
pending or completed result. Input, deterministic rules, model, or prompt changes
create a new version. A failed attempt requires an explicit retry.

The shared database allowance is 50 attempts per UTC month, including failures.
Each call must pass an estimate below $0.02, model price ceilings, a 32 KB input
limit, and a current-credit check. Generation is limited to 2,048 output tokens
and 35 seconds with no SDK retry, tools, web search, or fallback model. This is
an application allowance, not a team billing guarantee; configure a Gateway
budget for an account spend limit. The application never buys or tops up credit.
See [Gateway pricing](https://vercel.com/docs/ai-gateway/pricing) for current
credit eligibility.

`STUDIO_PROPOSALS_ENABLED=0` stops new calls while retaining history. Vercel can
authenticate with OIDC; other environments use a server-only
`AI_GATEWAY_API_KEY`. Missing access, exhausted credit, quota limits, invalid
output, and provider failures leave manual curation available.

## Research Runtime

The Sources section loads the selected track's latest observation per provider
and source entity type, including its Deezer album. Selection starts an
authenticated curator-only POST when research is eligible; the browser supplies only
a validated Deezer ID. The server resolves missing identity from Deezer, reuses
the target job, and schedules a targeted claim after the response. Existing
evidence is reused; reopening the editor does not reset failures or backoff.
Completed jobs with older lookup versions receive one recorded pass. Version 2
uses ISRC when available and checks recording title, full artist credit, duration,
and live/edit/remix context. Ambiguous matches remain unresolved; search scores
alone do not select a recording. No starter
pick, collection membership, or taste tag is written by this route.

Studio and cron use the same claim RPC and MusicBrainz lease. The lease excludes
concurrent source calls, expires after 30 seconds if a worker disappears, and
retains a 1.1-second gap after release. A stale token cannot release a new owner.
The provider request has a ten-second timeout. Coordination failure fails closed.
The existing identifying User-Agent remains in place; see the
[MusicBrainz policy](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting).

Workers use a 50-second budget within a 60-second route. They stop claiming new
work with fewer than 30 seconds remaining and defer source contention without
spending a failed-source attempt. Database latency is not a hard wall-clock
guarantee; stale processing jobs remain recoverable after 15 minutes.
The durable queue, not the post-response callback, is the recovery boundary.

Source reads never expose raw job errors or credentials. Research requests are
limited per curator and refuse work if the rate limiter is unavailable. Client
polling is bounded to 90 seconds; Check again resumes inspection when needed.
The six-kind coverage filter remains separate from source research status.

Draft proposals include schema/rules versions, the selected identity, existing
tag IDs, external/inferred origins, and observation/field/value/class references. They
normalize attributed tags, derive era from the original recording date when
available, and use the explicitly related album for release format. Prominent
MusicBrainz tags require positive votes and at least a quarter of the highest tag
count. Suggestions are bounded to three per kind and twelve total; no category
quota invents missing context. This is a conservative rule, not confidence in a
musical assertion or a trained model.

Previously saved nonempty tags stay authoritative. New and untagged picks receive
suggestions; manual additions, removals, and Clear survive late results and retries
within the draft. Saving still uses the existing starter RPC. Draft output is
derived from stored evidence, not a persisted acceptance/rejection audit.

For Research V3 comparisons, keep a curator-selected set of roughly 20 tracks
covering familiar and unfamiliar scenes, eras, mainstream/niche releases,
ambiguous tags, and sparse evidence. For each track, record the exact identity,
source observations, proposed signals with support classes, accepted/rejected
signals, curator corrections, disagreements, and deliberately empty categories.
Compare the same set before and after a source or normalization change; report
useful coverage and false positives separately. Evaluation notes are not
publication state or a second decision store. The curator chooses the set and
judges the outcomes; see [KOC-59](https://linear.app/kocteau/issue/KOC-59/create-a-curator-owned-evaluation-set-for-research-v3).

Gateway context is persisted, but cross-session correction history, destination selection,
and atomic proposal acceptance remain separate work. Their contracts are above; current delivery
status is in [CURRENT.md](../CURRENT.md), not a second roadmap here.

## Taste Vocabulary

| Kind | Meaning | Evidence rule |
| --- | --- | --- |
| `genre` | Musical category | Attribute external tags; normalize and review before publishing. |
| `mood` | Listener feeling | Editorial interpretation. |
| `scene` | Cultural, geographic, temporal, or community context | Research or explicit curator knowledge. |
| `style` | Production, texture, arrangement, or sonic language | Describe sound without treating inference as metadata. |
| `era` | Release period or temporal route | Prefer source dates and distinguish original release from reissue. |
| `format` | Release/listening context | Metadata-derived or curator-confirmed; a deep cut is editorial. |

The taxonomy cleanup migration already exists as
`20260627010620_knowledge_layer_tag_cleanup.sql`. Verify deployment with the
existing maintenance check instead of proposing the cleanup as new work.
