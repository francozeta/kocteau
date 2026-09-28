# Discovery And Curation

[Docs index](./README.md) | [Product](../PRODUCT.md) | [Current state](../CURRENT.md) | [Catalog research](./knowledge-layer.md)

For You routes real reviews through taste, follows, affinity, recency, quality, and
diversity. Starter picks provide curated entry points during sparse activity.
Search expands catalog candidates with a deterministic evaluator and bounded
browser-local memory. These are separate surfaces with separate baselines.

The curator controls editorial publication. Catalog metadata is evidence;
accepted signals and actual listener behavior support discovery. Source collection
and proposal rules live in [Catalog research](./knowledge-layer.md).

## Implementation Map

- Feed and starter ranking: Supabase recommendation RPCs and their migrations.
- Event validation: `apps/web/lib/analytics` and `/api/analytics/events`.
- Candidate sourcing: `/api/starter/candidates` and `/api/starter/candidate-queue`.
- Editorial selection: `/studio/starter`; source inspection shares its existing editor.
- Health and rollout checks: [operations](./operations.md).

## Signal Contract

Analytics should remain small, first-party, and product-specific. Events should explain a user action or product state that can inform a real product decision.

Do not send email, IP address, user agent, or raw free-form review text in `analytics_events.metadata`.

### Event Naming

Use lowercase snake case:

```text
review_impression
review_open
review_read_50
review_read_90
entity_open
feed_loaded
recommendation_fallback
for_you_review_action
starter_impression
starter_open
starter_pass
starter_review_cta
starter_review_published
```

### Required Shape

Every event should include:

- `event_type`: stable event name
- `source`: product surface, such as `feed:for-you`, `feed:starter`, `track:page`, or `search:page`
- `metadata`: a small object with identifiers and non-sensitive counters

### Recommended Metadata

Use only fields that help answer a product question:

| Event | Suggested metadata | Product decision |
| --- | --- | --- |
| `feed_loaded` | `view`, `review_count`, `starter_count`, `has_cursor` | Is the feed loading enough material? |
| `recommendation_fallback` | `code`, `cursor` | Is For You healthy or falling back too often? |
| `review_impression` | `review_id`, `entity_id`, `reason`, `position` | Which recommendation reasons get surfaced? |
| `review_open` | `review_id`, `entity_id`, `reason`, `position` | Which surfaced reviews earn deeper reading? |
| `review_read_50` | `review_id`, `entity_id`, `reason` | Which reviews hold attention? |
| `review_read_90` | `review_id`, `entity_id`, `reason` | Which reviews are genuinely read? |
| `entity_open` | `entity_id`, `provider`, `provider_id`, `type` | Which tracks become discovery destinations? |
| `for_you_review_action` | `action`, `review_id`, `entity_id`, `reason` | Which feed actions should tune ranking? |
| `starter_impression` | `starter_track_id`, `provider_id`, `matched_tag_count`, `position` | Which editorial picks are shown? |
| `starter_pass` | `starter_track_id`, `provider_id`, `matched_tag_count` | Which editorial picks should be downranked or replaced? |
| `starter_open` | `starter_track_id`, `provider_id`, `matched_tag_count` | Which editorial picks become discovery destinations? |
| `starter_review_cta` | `starter_track_id`, `provider_id` | Which starter picks invite reviews? |
| `starter_review_published` | `starter_track_id`, `provider_id` | Which starter picks convert into reviews? |

### Example Payloads

These examples use placeholder IDs and include only the fields needed to support a product decision. The required envelope fields are `event_type`, `source`, and `metadata`.

#### For You Review Impression

```json
{
  "event_type": "review_impression",
  "source": "feed:for-you",
  "metadata": {
    "review_id": "review_example_01",
    "entity_id": "track_example_01",
    "reason": "taste_match",
    "position": 3
  }
}
```

- Required metadata: `review_id`, `entity_id`, and `reason`.
- Optional metadata: `position` when the review appears in an ordered surface.
- Product decision: compare impressions with opens and actions by recommendation reason before tuning For You ranking.

#### Starter Pick Pass

```json
{
  "event_type": "starter_pass",
  "source": "feed:starter",
  "metadata": {
    "starter_track_id": "starter_example_01",
    "provider_id": "provider_track_example_01",
    "matched_tag_count": 2
  }
}
```

- Required metadata: `starter_track_id` and `provider_id`.
- Optional metadata: `matched_tag_count` when the pick was selected from taste-tag matches.
- Product decision: identify starter picks that should be downranked, reframed, or replaced after repeated passes.

#### Review Read Depth

```json
{
  "event_type": "review_read_90",
  "source": "feed:for-you",
  "metadata": {
    "review_id": "review_example_02",
    "entity_id": "track_example_02",
    "reason": "author_affinity"
  }
}
```

- Required metadata: `review_id`, `entity_id`, and `reason`.
- Optional metadata: none for the minimal event; do not attach raw review text or granular scroll traces.
- Product decision: find recommendation reasons that lead to sustained reading rather than impressions alone.

### Signal Rules

- One event should answer one question.
- Prefer stable IDs over display text.
- Keep metadata under the existing database size limits.
- Use reason labels from the recommendation system when the event comes from For You.
- Do not create a new event if an existing event plus an `action` value can express the behavior clearly.
- Add event documentation before adding broad instrumentation.

## Contribution Boundaries

UI accessibility, empty states, metadata mapping, candidate-scoring tests, and
event validation are useful focused contributions. Coordinate changes to RLS,
curator permissions, analytics schema, publication, or recommendation RPCs with
the maintainer. See the [contribution backlog](./backlog.md) for entry points and
[CURRENT.md](../CURRENT.md) for the active priority.
