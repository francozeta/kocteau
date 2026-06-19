import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(repoRoot, args.input ?? "tmp/entity-curation/draft-output.json");
const outputPath = path.resolve(
  repoRoot,
  args.output ?? "tmp/entity-curation/apply-entity-curation-drafts.sql",
);
const genreReviewPath = path.resolve(
  repoRoot,
  args.genreOutput ?? "tmp/entity-curation/genre-candidates-for-review.md",
);
const reviewReportPath = path.resolve(
  repoRoot,
  args.reviewOutput ?? "tmp/entity-curation/curation-review-report.md",
);
const tagInputPath = path.resolve(repoRoot, args.tagInput ?? "tmp/entity-curation/draft-input.json");
const maxSignals = parsePositiveInt(args.maxSignals, 8);
const sourceLabel = normalizeSourceLabel(args.source ?? "system");

if (args.help) {
  printHelp();
  process.exit(0);
}

let payload;

try {
  payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
} catch (error) {
  console.error(`Could not read ${path.relative(repoRoot, inputPath)}.`);
  console.error("This is expected right after running `pnpm curate:entity:draft`.");
  console.error(
    "Fill tmp/entity-curation/draft-output-template.json with Eve's reviewed JSON, then save it as tmp/entity-curation/draft-output.json."
  );
  console.error("Keep humanReviewed=true and reviewedBy set before generating SQL.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const drafts = normalizeDrafts(payload);
const reviewState = normalizeReviewState(payload);

if (drafts.length === 0) {
  console.error("No drafts found. Expected a JSON object with a non-empty `drafts` array.");
  process.exit(1);
}

let availableTags = null;
let safetyReport;

try {
  validateHumanReview(reviewState, Boolean(args.allowUnreviewed));
  safetyReport = validateDraftSafety(drafts, { maxSignals });
  availableTags = await validateDraftTagSlugs(drafts, tagInputPath, Boolean(args.tagInput));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, buildApplySql(drafts, reviewState, sourceLabel), "utf8");
await fs.writeFile(genreReviewPath, buildGenreReview(drafts, availableTags), "utf8");
await fs.writeFile(reviewReportPath, buildReviewReport(drafts, safetyReport, sourceLabel), "utf8");

console.log(`Created ${path.relative(repoRoot, outputPath)}.`);
console.log(`Created ${path.relative(repoRoot, genreReviewPath)}.`);
console.log(`Created ${path.relative(repoRoot, reviewReportPath)}.`);
console.log(`Drafts included: ${drafts.length}`);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--input") {
      parsed.input = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--output") {
      parsed.output = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--genre-output") {
      parsed.genreOutput = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--tag-input") {
      parsed.tagInput = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--review-output") {
      parsed.reviewOutput = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--max-signals") {
      parsed.maxSignals = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--allow-unreviewed") {
      parsed.allowUnreviewed = true;
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage:
  pnpm curate:entity:sql
  pnpm curate:entity:sql -- --input tmp/entity-curation/draft-output.json
  pnpm curate:entity:sql -- --tag-input tmp/entity-curation/draft-input.json
  pnpm curate:entity:sql -- --source system
  pnpm curate:entity:sql -- --allow-unreviewed

Input:
  tmp/entity-curation/draft-output.json

Output:
  tmp/entity-curation/apply-entity-curation-drafts.sql
  tmp/entity-curation/genre-candidates-for-review.md
  tmp/entity-curation/curation-review-report.md

The generated SQL:
  - inserts existing non-genre tags into entity_preference_tags
  - preserves existing manual tags
  - requires humanReviewed=true and reviewedBy unless --allow-unreviewed is passed
  - fails when an entity id or suggested tag slug is unknown
  - does not apply genre candidates automatically
  - writes entity_preference_tags.source as system by default because the
    current table constraint only allows manual, import, inferred, or system
`);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeSourceLabel(value) {
  const label = String(value ?? "").trim();
  const allowedSources = new Set(["manual", "import", "inferred", "system"]);

  if (!allowedSources.has(label)) {
    throw new Error("Source must be one of: manual, import, inferred, system.");
  }

  return label;
}

function normalizeReviewState(payload) {
  return {
    humanReviewed: payload?.humanReviewed === true || payload?.human_reviewed === true,
    reviewedBy: nullableString(payload?.reviewedBy ?? payload?.reviewed_by),
    reviewedAt: nullableString(payload?.reviewedAt ?? payload?.reviewed_at),
  };
}

function validateHumanReview(reviewState, allowUnreviewed) {
  if (allowUnreviewed) {
    return;
  }

  if (!reviewState.humanReviewed || !reviewState.reviewedBy) {
    throw new Error(
      [
        "Entity curation drafts must be human-reviewed before SQL is generated.",
        "Set humanReviewed to true and reviewedBy to the maintainer name in draft-output.json.",
        "Use --allow-unreviewed only for local fixture tests, not for Supabase Cloud patches.",
      ].join("\n"),
    );
  }
}

function validateDraftSafety(drafts, { maxSignals }) {
  const errors = [];
  const warnings = [];
  const validConfidence = new Set(["low", "medium", "high"]);

  for (const draft of drafts) {
    const signalCount = countSuggestedSignals(draft);

    if (signalCount > maxSignals) {
      errors.push(`${draft.entityId}: ${signalCount} non-genre signals exceeds max ${maxSignals}.`);
    }

    if (draft.confidence && !validConfidence.has(draft.confidence)) {
      errors.push(`${draft.entityId}: confidence must be low, medium, or high.`);
    }

    if (draft.mainstreamScore !== null && !isScore(draft.mainstreamScore)) {
      errors.push(`${draft.entityId}: mainstreamScore must be an integer from 0 to 100.`);
    }

    if (draft.discoveryFitScore !== null && !isScore(draft.discoveryFitScore)) {
      errors.push(`${draft.entityId}: discoveryFitScore must be an integer from 0 to 100.`);
    }

    if (draft.curationNote && draft.curationNote.length > 240) {
      errors.push(`${draft.entityId}: curationNote is ${draft.curationNote.length} characters; max is 240.`);
    }

    if (!draft.rationale) {
      warnings.push(`${draft.entityId}: rationale is empty.`);
    }

    if (
      signalCount === 0 &&
      draft.genreCandidatesForHumanReview.length === 0 &&
      draft.mainstreamScore === null &&
      draft.discoveryFitScore === null
    ) {
      warnings.push(`${draft.entityId}: draft has no tags, genre candidates, or scores.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Entity curation draft failed safety validation:\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }

  return {
    maxSignals,
    warnings,
  };
}

function isScore(value) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function countSuggestedSignals(draft) {
  return Object.values(draft.suggestedTagSlugs).reduce(
    (count, slugs) => count + slugs.length,
    0,
  );
}

async function validateDraftTagSlugs(drafts, inputPath, isExplicitInput) {
  let inputPayload;

  try {
    inputPayload = JSON.parse(await fs.readFile(inputPath, "utf8"));
  } catch (error) {
    if (!isExplicitInput && error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  const availableTags = normalizeAvailableTags(inputPayload.availableTags ?? {});
  const availableEntityIds = new Set(
    Array.isArray(inputPayload.entities)
      ? inputPayload.entities.map((entity) => String(entity.entityId))
      : [],
  );
  const errors = [];

  for (const draft of drafts) {
    if (availableEntityIds.size > 0 && !availableEntityIds.has(draft.entityId)) {
      errors.push(`${draft.entityId}: entity id was not present in draft-input.json.`);
    }

    for (const [kind, slugs] of Object.entries(draft.suggestedTagSlugs)) {
      const allowedSlugs = availableTags[kind] ?? new Set();

      for (const slug of slugs) {
        if (!allowedSlugs.has(slug)) {
          errors.push(`${draft.entityId}: unknown ${kind} tag slug "${slug}".`);
        }
      }
    }

    const genreSlugs = availableTags.genre ?? new Set();

    for (const slug of draft.genreCandidatesForHumanReview) {
      if (!genreSlugs.has(slug)) {
        errors.push(`${draft.entityId}: unknown genre candidate slug "${slug}".`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Entity curation draft failed tag validation:\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
  }

  return availableTags;
}

function normalizeAvailableTags(availableTags) {
  return Object.fromEntries(
    Object.entries(availableTags).map(([kind, tags]) => [
      kind,
      new Set(Array.isArray(tags) ? tags.map((tag) => String(tag.slug ?? "")) : []),
    ]),
  );
}

function normalizeDrafts(payload) {
  const drafts = Array.isArray(payload) ? payload : payload?.drafts;

  if (!Array.isArray(drafts)) {
    return [];
  }

  return drafts.map((draft) => ({
    entityId: String(draft.entityId ?? draft.entity_id ?? ""),
    suggestedTagSlugs: normalizeSuggestedTagSlugs(draft.suggestedTagSlugs ?? draft.suggested_tag_slugs),
    genreCandidatesForHumanReview: uniqueStrings(
      draft.genreCandidatesForHumanReview ?? draft.genre_candidates_for_human_review,
    ),
    mainstreamScore: normalizeNullableScore(draft.mainstreamScore ?? draft.mainstream_score),
    discoveryFitScore: normalizeNullableScore(draft.discoveryFitScore ?? draft.discovery_fit_score),
    confidence: nullableString(draft.confidence),
    curationNote: nullableString(draft.curationNote ?? draft.curation_note),
    rationale: nullableString(draft.rationale),
  }));
}

function normalizeSuggestedTagSlugs(value) {
  const allowedKinds = ["mood", "scene", "style", "era", "format"];

  return Object.fromEntries(
    allowedKinds.map((kind) => [kind, uniqueStrings(value?.[kind])]),
  );
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function normalizeNullableScore(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.trunc(parsed) : value;
}

function nullableString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = String(value).trim();

  return stringValue.length > 0 ? stringValue : null;
}

function buildApplySql(drafts, reviewState, source) {
  const tagRows = drafts.flatMap((draft) =>
    Object.values(draft.suggestedTagSlugs).flatMap((slugs) =>
      slugs.map((slug) => ({
        entityId: draft.entityId,
        slug,
      })),
    ),
  );
  const uniqueEntityIds = Array.from(new Set(drafts.map((draft) => draft.entityId)));
  const entityValues = uniqueEntityIds.map((id) => `    (${sqlString(id)}::uuid)`).join(",\n");
  const tagValues = tagRows.length > 0
    ? tagRows
        .map((row) => `    (${sqlString(row.entityId)}::uuid, ${sqlString(row.slug)}::text)`)
        .join(",\n")
    : "    (NULL::uuid, NULL::text)";

  return `-- Kocteau entity curation drafts.
-- Reviewed by: ${reviewState.reviewedBy ?? "unknown"}
-- Reviewed at: ${reviewState.reviewedAt ?? new Date().toISOString()}
-- Source: ${source}
--
-- This script inserts non-genre entity tags only. Genre candidates are reviewed
-- in tmp/entity-curation/genre-candidates-for-review.md and are not applied here.

BEGIN;

DO $$
DECLARE
  missing_entities text;
  missing_tags text;
BEGIN
  WITH draft_entities(entity_id) AS (
    VALUES
${entityValues}
  )
  SELECT string_agg(draft_entities.entity_id::text, ', ' ORDER BY draft_entities.entity_id::text)
  INTO missing_entities
  FROM draft_entities
  LEFT JOIN public.entities entity
    ON entity.id = draft_entities.entity_id
  WHERE entity.id IS NULL;

  IF missing_entities IS NOT NULL THEN
    RAISE EXCEPTION 'Entity curation draft contains unknown entity ids: %', missing_entities;
  END IF;

  WITH requested_tags(entity_id, slug) AS (
    VALUES
${tagValues}
  )
  SELECT string_agg(DISTINCT requested_tags.slug, ', ' ORDER BY requested_tags.slug)
  INTO missing_tags
  FROM requested_tags
  LEFT JOIN public.preference_tags tag
    ON tag.slug = requested_tags.slug
    AND tag.kind IN ('mood', 'scene', 'style', 'era', 'format')
  WHERE requested_tags.slug IS NOT NULL
    AND tag.id IS NULL;

  IF missing_tags IS NOT NULL THEN
    RAISE EXCEPTION 'Entity curation draft contains unknown non-genre tag slugs: %', missing_tags;
  END IF;
END;
$$;

WITH requested_tags(entity_id, slug) AS (
  VALUES
${tagValues}
),
resolved_tags AS (
  SELECT
    requested_tags.entity_id,
    tag.id AS tag_id
  FROM requested_tags
  JOIN public.preference_tags tag
    ON tag.slug = requested_tags.slug
    AND tag.kind IN ('mood', 'scene', 'style', 'era', 'format')
  WHERE requested_tags.entity_id IS NOT NULL
    AND requested_tags.slug IS NOT NULL
)
INSERT INTO public.entity_preference_tags (
  entity_id,
  tag_id,
  weight,
  source
)
SELECT
  resolved_tags.entity_id,
  resolved_tags.tag_id,
  1.0,
  ${sqlString(source)}
FROM resolved_tags
ON CONFLICT (entity_id, tag_id)
DO UPDATE SET
  source = CASE
    WHEN public.entity_preference_tags.source = 'manual'
      THEN public.entity_preference_tags.source
    ELSE EXCLUDED.source
  END,
  weight = least(3, greatest(public.entity_preference_tags.weight, EXCLUDED.weight)),
  updated_at = now();

COMMIT;
`;
}

function buildGenreReview(drafts) {
  const lines = [
    "# Entity Genre Candidates For Human Review",
    "",
    "These genre suggestions were not applied to Supabase.",
    "",
  ];

  drafts.forEach((draft) => {
    if (draft.genreCandidatesForHumanReview.length === 0) {
      return;
    }

    lines.push(
      `## ${draft.entityId}`,
      "",
      ...draft.genreCandidatesForHumanReview.map((slug) => `- ${slug}`),
      "",
    );
  });

  if (lines.length === 4) {
    lines.push("No genre candidates were included.", "");
  }

  return `${lines.join("\n")}\n`;
}

function buildReviewReport(drafts, safetyReport, source) {
  const signalCounts = drafts.map(countSuggestedSignals);
  const totalSignals = signalCounts.reduce((sum, count) => sum + count, 0);
  const warnings = safetyReport.warnings;
  const lines = [
    "# Entity Curation Review Report",
    "",
    `Drafts: ${drafts.length}`,
    `Total non-genre signals: ${totalSignals}`,
    `Max non-genre signals per entity: ${safetyReport.maxSignals}`,
    `Source: ${source}`,
    "",
    "## Scores",
    "",
    ...drafts.map((draft) => (
      `- ${draft.entityId}: mainstream ${draft.mainstreamScore ?? "n/a"}, discovery ${draft.discoveryFitScore ?? "n/a"}, confidence ${draft.confidence ?? "n/a"}`
    )),
    "",
    "## Warnings",
    "",
  ];

  if (warnings.length === 0) {
    lines.push("No warnings.");
  } else {
    warnings.forEach((warning) => lines.push(`- ${warning}`));
  }

  lines.push("");

  return `${lines.join("\n")}\n`;
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}
