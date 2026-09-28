# Kocteau Knowledge Layer And Search

[Docs index](./README.md) | [Product](../PRODUCT.md) | [Discovery and curation](./discovery-curation.md) | [Current state](../CURRENT.md)

The curator chooses the music. Kocteau researches it. The listener discovers it.
Editorial taste is the starting point, not the listener's ceiling.

This document defines the catalog-to-curation boundary. It extends the existing
product; it does not introduce a second catalog, an encyclopedia, or a separate
discovery application. Delivery and deployment status belong in `CURRENT.md`.

## Implementation Map

| Responsibility | Existing implementation | Remaining connection |
| --- | --- | --- |
| Music identity | `entities`, `artists`, provider IDs, artist/album relationships; `lib/deezer.ts` and `lib/catalog/musicbrainz.ts` | Keep Kocteau IDs stable; a source search match is supporting evidence, not canonical certainty. |
| Background research | `catalog_enrichment_jobs`, claim/prepare RPCs, `lib/catalog/enrichment.ts`, protected `/api/cron/enrich-catalog` | Retain observations; add shared request throttling and execution budgets before concurrent Studio research. |
| Source evidence | `catalog_source_observations`, `lib/catalog/source-evidence.ts`, `source-normalization.ts` | Connect authorized source inspection to Studio. Existing projected metadata has no reconstructed provenance. |
| Studio selection | `components/starter-studio-client.tsx`: Kocteau Search, Deezer Scout, responsive editor | Resolve a selected draft into catalog research without saving an active starter pick. |
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

A future structured synthesis layer consumes an identity snapshot and stored
source observations, then proposes a small set of existing vocabulary IDs.
Separate external assertions, derived interpretations, and human decisions.
A provider tag may contain a mood or a style; it is not automatically a genre.

Version the schema and runtime configuration. Each proposed signal needs evidence
references, an origin (`external`, `inferred`, or `human`), and a decision state
(`suggested`, `accepted`, or `rejected`). Corrections retain their earlier proposal
and the final human decision. Explicit human assertions may lack an external
source; they must remain distinguishable from researched claims.

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
are removed with their parent job; future proposal references must prevent deleting
referenced evidence. Define retention before increasing collection volume.

Existing source rows are not backfilled as if their provenance were known. Normal
refreshes collect new observations. A new starter pick also does not necessarily
have an `entities` row: current starter upsert only syncs tags when that entity
already exists. That bridge remains necessary before Studio can request research.

## Studio Flow

The target remains inside the existing Studio dialog/drawer:

`Search / Scout → choose track → choose destination → research → review → Accept`

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

## Delivery Gates

1. **Evidence foundation.** Reuse provider clients and jobs, preserve source outcomes,
   and enforce retry history. Verify access grants and failure behavior. See
   `CURRENT.md` for the migration and verification state.
2. **Research entry from Studio.** Resolve drafts without publishing, reuse existing
   catalog jobs, expose only authorized observations, coordinate MusicBrainz requests
   across workers, and bound work to the execution deadline. The existing 1.1-second
   in-process pause is not a shared limiter. MusicBrainz requires an identifying
   User-Agent and at most one request per second per IP; see its
   [rate-limiting policy](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting).
3. **Proposal and acceptance.** Introduce versioned structured suggestions, evidence
   inspection, corrections, and transactional human approval in the existing drawer.
   Verify curator access, concurrent edits, retry, cancellation, and stale results.
4. **Contextual discovery.** Evaluate enough accepted tracks across actual taste
   categories and collections to support one useful path. Measure corrections,
   repetition, source failures, latency, and cost before modifying ranking.
5. **Optional experiments.** Add a narrow typed decision evaluator only against a
   measured baseline. Embeddings or pgvector require an unmet retrieval need.
   No autonomous acceptance, generated reviews, extra vector service, large
   recommendation package, or Atlas surface is required by this flow.

Existing analytics already record feed/review/starter activity. Source observations
and job attempts provide operational research history in this first slice.
Editorial search, selection, proposal edits, and acceptance events should arrive
with their actual UI actions and a bounded schema. Avoid collecting speculative
free-form search logs or treating local discovery paths as permanent telemetry.

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
