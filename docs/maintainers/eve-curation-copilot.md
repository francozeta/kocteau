# Eve Curation Copilot

[Docs index](../README.md) | [Discovery and curation](../discovery-curation.md) | [Operations](../operations.md) | [Supabase workflow](./supabase-workflow.md)

Kocteau can use Eve as a local curation copilot without giving an agent direct production write access.

The current workflow is intentionally conservative:

```text
Supabase export -> Eve draft -> maintainer review -> SQL Editor patch
```

Eve can help draft tags, mainstream/discovery scores, and short maintainer notes. Kocteau still keeps human review as the final publishing step.

The export only includes entities with a real Kocteau curation signal: review activity, library intent, bookmark intent, starter context, or manual tags. A recently created track is not enough by itself. This keeps troll, novelty, or meme-only searches from entering the curation packet unless a human action gives them context.

## Hobby Guardrails

- Do not deploy this as a production Eve agent yet.
- Do not run it from cron or background workflows.
- Do not let it call Supabase with service-role credentials.
- Do not auto-purchase AI Gateway credits or enable automatic top-ups.
- Keep generated files under `tmp/`; they should not be committed.
- Run small batches first, such as 10-20 entities.

This keeps the workflow useful on a Vercel Hobby account and avoids another unexpected usage spike.

## Entity Curation Flow

1. Run the read-only export in the Supabase SQL Editor:

```sql
-- supabase/scripts/maintenance/entity-curation-draft-export.sql
```

2. Copy the JSON value from `entity_curation_export` into:

```text
tmp/entity-curation-export.json
```

3. Generate the curation packet:

```bash
pnpm curate:entity:draft -- --limit 20
```

This writes:

```text
tmp/entity-curation/draft-input.json
tmp/entity-curation/draft-prompt.md
tmp/entity-curation/draft-output-template.json
```

4. Ask the versioned Eve copilot to fill the draft.

For the interactive Eve app:

```bash
pnpm eve:curation:info
cd apps/curation-agent
pnpm dev
```

For the non-interactive local helper:

```bash
pnpm curate:entity:ai
```

Eve should return JSON only, using the template shape. The draft may include:

- non-genre tag slugs for `mood`, `scene`, `style`, `era`, and `format`
- genre candidates for human review
- `mainstreamScore`
- `discoveryFitScore`
- confidence
- a short maintainer-facing curation note

5. Review the output manually.

Save the reviewed JSON as:

```text
tmp/entity-curation/draft-output.json
```

Set:

```json
{
  "humanReviewed": true,
  "reviewedBy": "francozeta"
}
```

6. Generate the SQL patch:

```bash
pnpm curate:entity:sql
```

This writes:

```text
tmp/entity-curation/apply-entity-curation-drafts.sql
tmp/entity-curation/genre-candidates-for-review.md
tmp/entity-curation/curation-review-report.md
```

7. Read the report, then run the SQL patch in the Supabase SQL Editor.

The SQL inserts only non-genre tags into `entity_preference_tags`. It preserves existing `manual` tags and refuses unknown entity IDs or tag slugs.

The applied database source is `system`, because `entity_preference_tags.source` currently accepts only `manual`, `import`, `inferred`, or `system`. Keep the Eve provenance in the review report and maintainer workflow rather than widening that database constraint before the Studio UX is proven.

## Future Studio Direction

The long-term UI should feel like a curation desk, not an admin grid:

1. The curator selects a song.
2. Eve proposes tags, era, format, scores, and context.
3. The curator accepts, edits, or dismisses the suggestions.
4. New tags can be created from a simple client-like UI.
5. Approved metadata becomes normal Kocteau taste data.

The agent prepares the desk. The maintainer keeps taste authority.

## Versioned Agent

The tracked Eve app lives in:

```text
apps/curation-agent
```

It exposes local-only tools for reading the generated entity curation packet and writing
`tmp/entity-curation/draft-output.json`. It does not write to Supabase and it is not part
of the main web deployment path.

Useful commands:

```bash
pnpm eve:curation:info
pnpm eve:curation:typecheck
pnpm curate:entity:ai
```

`pnpm curate:entity:ai` requires `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN`. If neither is
available, run `pnpm exec eve link` from `apps/curation-agent` or set the key locally.
