import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(repoRoot, args.input ?? "tmp/starter-curation/draft-output.json");
const outputPath = path.resolve(
  repoRoot,
  args.output ?? "tmp/starter-curation/apply-starter-curation-drafts.sql",
);
const genreReviewPath = path.resolve(
  repoRoot,
  args.genreOutput ?? "tmp/starter-curation/genre-candidates-for-review.md",
);
const tagInputPath = path.resolve(repoRoot, args.tagInput ?? "tmp/starter-curation/draft-input.json");

if (args.help) {
  printHelp();
  process.exit(0);
}

let payload;

try {
  payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
} catch (error) {
  console.error(`Could not read ${path.relative(repoRoot, inputPath)}.`);
  console.error("Create this file by filling tmp/starter-curation/draft-output-template.json with approved drafts.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const drafts = normalizeDrafts(payload);

if (drafts.length === 0) {
  console.error("No drafts found. Expected a JSON object with a non-empty `drafts` array.");
  process.exit(1);
}

try {
  await validateDraftTagSlugs(drafts, tagInputPath, Boolean(args.tagInput));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, buildApplySql(drafts), "utf8");
await fs.writeFile(genreReviewPath, buildGenreReview(drafts), "utf8");

console.log(`Created ${path.relative(repoRoot, outputPath)}.`);
console.log(`Created ${path.relative(repoRoot, genreReviewPath)}.`);
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
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage:
  pnpm curate:starter:sql
  pnpm curate:starter:sql -- --input tmp/starter-curation/draft-output.json
  pnpm curate:starter:sql -- --tag-input tmp/starter-curation/draft-input.json

Input:
  tmp/starter-curation/draft-output.json

Output:
  tmp/starter-curation/apply-starter-curation-drafts.sql
  tmp/starter-curation/genre-candidates-for-review.md

The generated SQL:
  - updates prompt and editorial_note
  - inserts existing non-genre starter tags
  - preserves existing manual tags
  - validates suggested tag slugs against available tags by kind when draft-input.json exists
  - refuses to run when a starter track id or suggested tag slug is unknown
  - does not apply genre candidates automatically
`);
}

async function validateDraftTagSlugs(drafts, inputPath, isExplicitInput) {
  let inputPayload;

  try {
    inputPayload = JSON.parse(await fs.readFile(inputPath, "utf8"));
  } catch (error) {
    if (!isExplicitInput && error?.code === "ENOENT") {
      return;
    }

    throw new Error(
      `Could not read ${path.relative(repoRoot, inputPath)} for tag validation. ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const availableTags = inputPayload?.availableTags;

  if (!availableTags || typeof availableTags !== "object") {
    return;
  }

  const tagsByKind = new Map(
    Object.entries(availableTags).map(([kind, tags]) => [
      kind,
      new Set(Array.isArray(tags) ? tags.map((tag) => String(tag.slug ?? "").trim()).filter(Boolean) : []),
    ]),
  );

  const unknownTags = [];

  for (const draft of drafts) {
    for (const [kind, slugs] of Object.entries(draft.suggestedTagSlugs)) {
      const allowedSlugs = tagsByKind.get(kind);

      for (const slug of slugs) {
        if (!allowedSlugs?.has(slug)) {
          unknownTags.push(`${draft.starterTrackId}: ${kind}:${slug}`);
        }
      }
    }
  }

  if (unknownTags.length > 0) {
    throw new Error(
      `Draft contains tag slugs that are not available for their kind:\n${unknownTags
        .map((tag) => `- ${tag}`)
        .join("\n")}`,
    );
  }
}

function normalizeDrafts(payload) {
  const source = Array.isArray(payload) ? payload : payload?.drafts;

  if (!Array.isArray(source)) {
    return [];
  }

  return source.map((draft, index) => {
    const starterTrackId = String(draft.starterTrackId ?? draft.starter_track_id ?? "").trim();

    if (!starterTrackId) {
      throw new Error(`Draft at index ${index} is missing starterTrackId.`);
    }

    return {
      starterTrackId,
      prompt: nullableString(draft.prompt),
      editorialNote: nullableString(draft.editorialNote ?? draft.editorial_note),
      suggestedTagSlugs: normalizeSuggestedTagSlugs(draft.suggestedTagSlugs ?? draft.suggested_tag_slugs),
      genreCandidatesForHumanReview: normalizeStringArray(
        draft.genreCandidatesForHumanReview ?? draft.genre_candidates_for_human_review,
      ),
      confidence: nullableString(draft.confidence),
      rationale: nullableString(draft.rationale),
    };
  });
}

function normalizeSuggestedTagSlugs(value) {
  const allowedKinds = ["mood", "scene", "style", "era", "format"];
  const normalized = {};

  for (const kind of allowedKinds) {
    normalized[kind] = normalizeStringArray(value?.[kind]);
  }

  return normalized;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function nullableString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function buildApplySql(drafts) {
  const values = drafts.map(toDraftSqlValue).join(",\n");

  return `-- Apply approved starter curation drafts.
--
-- Generated by supabase/scripts/create-starter-curation-apply-sql.mjs.
-- Review before running in the Supabase SQL editor.
--
-- Safety rules:
-- - This script preserves existing starter tags.
-- - This script only adds non-genre tags from existing preference_tags.
-- - This script fails before writing if any starter track id or tag slug is unknown.
-- - Genre candidates are not applied automatically.

begin;

create temp table tmp_starter_curation_drafts (
  starter_track_id uuid primary key,
  prompt text,
  editorial_note text,
  mood_slugs text[] not null default '{}',
  scene_slugs text[] not null default '{}',
  style_slugs text[] not null default '{}',
  era_slugs text[] not null default '{}',
  format_slugs text[] not null default '{}',
  confidence text,
  rationale text
) on commit drop;

insert into tmp_starter_curation_drafts (
  starter_track_id,
  prompt,
  editorial_note,
  mood_slugs,
  scene_slugs,
  style_slugs,
  era_slugs,
  format_slugs,
  confidence,
  rationale
)
values
${values};

create temp table tmp_starter_curation_tag_rows on commit drop as
select *
from (
  select starter_track_id, 'mood'::public.preference_kind as kind, unnest(mood_slugs) as slug, 1.25::numeric as weight
  from tmp_starter_curation_drafts
  union all
  select starter_track_id, 'scene'::public.preference_kind as kind, unnest(scene_slugs) as slug, 1.25::numeric as weight
  from tmp_starter_curation_drafts
  union all
  select starter_track_id, 'style'::public.preference_kind as kind, unnest(style_slugs) as slug, 1.25::numeric as weight
  from tmp_starter_curation_drafts
  union all
  select starter_track_id, 'era'::public.preference_kind as kind, unnest(era_slugs) as slug, 1::numeric as weight
  from tmp_starter_curation_drafts
  union all
  select starter_track_id, 'format'::public.preference_kind as kind, unnest(format_slugs) as slug, 1::numeric as weight
  from tmp_starter_curation_drafts
) tag_rows
where nullif(btrim(slug), '') is not null;

do $$
begin
  if exists (
    select 1
    from tmp_starter_curation_drafts draft
    left join public.starter_tracks starter
      on starter.id = draft.starter_track_id
    where starter.id is null
  ) then
    raise exception 'Starter curation draft contains an unknown starter_track_id.';
  end if;

  if exists (
    select 1
    from tmp_starter_curation_tag_rows draft_tag
    left join public.preference_tags tag
      on tag.kind = draft_tag.kind
     and tag.slug = draft_tag.slug
    where tag.id is null
  ) then
    raise exception 'Starter curation draft contains an unknown preference tag slug.';
  end if;
end $$;

update public.starter_tracks starter
set
  prompt = coalesce(nullif(btrim(draft.prompt), ''), starter.prompt),
  editorial_note = coalesce(nullif(btrim(draft.editorial_note), ''), starter.editorial_note),
  updated_at = now()
from tmp_starter_curation_drafts draft
where starter.id = draft.starter_track_id
  and starter.is_active;

insert into public.starter_track_tags (
  starter_track_id,
  tag_id,
  weight
)
select
  draft_tag.starter_track_id,
  tag.id,
  draft_tag.weight
from tmp_starter_curation_tag_rows draft_tag
join public.preference_tags tag
  on tag.kind = draft_tag.kind
 and tag.slug = draft_tag.slug
join public.starter_tracks starter
  on starter.id = draft_tag.starter_track_id
where starter.is_active
on conflict (starter_track_id, tag_id)
do update set
  weight = greatest(public.starter_track_tags.weight, excluded.weight);

select
  draft.starter_track_id,
  starter.title,
  starter.artist_name,
  draft.confidence,
  draft.rationale,
  count(draft_tag.slug) as suggested_non_genre_tags
from tmp_starter_curation_drafts draft
join public.starter_tracks starter
  on starter.id = draft.starter_track_id
left join tmp_starter_curation_tag_rows draft_tag
  on draft_tag.starter_track_id = draft.starter_track_id
group by
  draft.starter_track_id,
  starter.title,
  starter.artist_name,
  draft.confidence,
  draft.rationale
order by
  starter.title;

commit;
`;
}

function toDraftSqlValue(draft) {
  return `  (${sqlString(draft.starterTrackId)}::uuid, ${sqlString(draft.prompt)}, ${sqlString(draft.editorialNote)}, ${sqlTextArray(draft.suggestedTagSlugs.mood)}, ${sqlTextArray(draft.suggestedTagSlugs.scene)}, ${sqlTextArray(draft.suggestedTagSlugs.style)}, ${sqlTextArray(draft.suggestedTagSlugs.era)}, ${sqlTextArray(draft.suggestedTagSlugs.format)}, ${sqlString(draft.confidence)}, ${sqlString(draft.rationale)})`;
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return `'${String(value).replace(/'/gu, "''")}'`;
}

function sqlTextArray(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return "ARRAY[]::text[]";
  }

  return `ARRAY[${values.map(sqlString).join(", ")}]::text[]`;
}

function buildGenreReview(drafts) {
  const rows = drafts
    .filter((draft) => draft.genreCandidatesForHumanReview.length > 0)
    .map((draft) => {
      return `## ${draft.starterTrackId}

- genre candidates: ${draft.genreCandidatesForHumanReview.join(", ")}
- confidence: ${draft.confidence ?? "unknown"}
- rationale: ${draft.rationale ?? "none"}
`;
    });

  return `# Genre Candidates For Human Review

These genre candidates were intentionally not applied to Supabase.
Review them manually in Starter Studio or create a separate human-approved SQL patch.

${rows.length > 0 ? rows.join("\n") : "No genre candidates were included in this draft output.\n"}
`;
}
