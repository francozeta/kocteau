import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(repoRoot, args.input ?? "tmp/entity-curation-export.json");
const outDir = path.resolve(repoRoot, args.outDir ?? "tmp/entity-curation");
const limit = args.limit ? Number.parseInt(args.limit, 10) : null;

if (args.help) {
  printHelp();
  process.exit(0);
}

const rawInput = await fs.readFile(inputPath, "utf8");
const exportPayload = normalizeExport(JSON.parse(rawInput));
const entities = Array.isArray(exportPayload.entities) ? exportPayload.entities : [];
const curatedEntities = entities.map(normalizeEntity).filter(hasCurationSignal);
const selectedEntities =
  Number.isFinite(limit) && limit > 0 ? curatedEntities.slice(0, limit) : curatedEntities;

await fs.mkdir(outDir, { recursive: true });

const normalizedInput = {
  generatedAt: exportPayload.generatedAt ?? new Date().toISOString(),
  source: exportPayload.source ?? path.basename(inputPath),
  availableTags: normalizeAvailableTags(exportPayload.availableTags ?? {}),
  entities: selectedEntities,
};

const prompt = buildDraftPrompt(normalizedInput);
const template = buildOutputTemplate(normalizedInput.entities);

await fs.writeFile(
  path.join(outDir, "draft-input.json"),
  `${JSON.stringify(normalizedInput, null, 2)}\n`,
  "utf8",
);
await fs.writeFile(path.join(outDir, "draft-prompt.md"), prompt, "utf8");
await fs.writeFile(
  path.join(outDir, "draft-output-template.json"),
  `${JSON.stringify(template, null, 2)}\n`,
  "utf8",
);

console.log(`Entity curation draft packet created in ${path.relative(repoRoot, outDir)}.`);
console.log(`Entities included: ${normalizedInput.entities.length}`);
console.log(`Entities skipped without curation signal: ${entities.length - curatedEntities.length}`);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--input") {
      parsed.input = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--out-dir") {
      parsed.outDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      parsed.limit = argv[index + 1];
      index += 1;
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Usage:
  pnpm curate:entity:draft
  pnpm curate:entity:draft -- --input tmp/entity-curation-export.json --out-dir tmp/entity-curation --limit 12

Input:
  Copy the JSON value from supabase/scripts/maintenance/entity-curation-draft-export.sql
  into tmp/entity-curation-export.json.

Output:
  tmp/entity-curation/draft-input.json
  tmp/entity-curation/draft-prompt.md
  tmp/entity-curation/draft-output-template.json
`);
}

function normalizeExport(payload) {
  if (typeof payload === "string") {
    return normalizeExport(JSON.parse(payload));
  }

  if (Array.isArray(payload)) {
    if (payload.length === 1 && payload[0]?.entity_curation_export) {
      return normalizeExport(payload[0].entity_curation_export);
    }

    return {
      entities: payload,
      availableTags: {},
    };
  }

  if (payload?.entity_curation_export) {
    return normalizeExport(payload.entity_curation_export);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Expected an entity curation export object or array.");
  }

  return payload;
}

function normalizeAvailableTags(availableTags) {
  return Object.fromEntries(
    Object.entries(availableTags).map(([kind, tags]) => [
      kind,
      Array.isArray(tags)
        ? tags.map((tag) => ({
            slug: String(tag.slug ?? ""),
            label: String(tag.label ?? tag.slug ?? ""),
            description: tag.description ? String(tag.description) : null,
          }))
        : [],
    ]),
  );
}

function normalizeTag(tag) {
  return {
    kind: String(tag.kind ?? ""),
    slug: String(tag.slug ?? ""),
    label: String(tag.label ?? tag.slug ?? ""),
    source: tag.source ? String(tag.source) : null,
    weight: typeof tag.weight === "number" && Number.isFinite(tag.weight) ? tag.weight : null,
  };
}

function normalizeEntity(entity) {
  return {
    entityId: String(entity.entityId ?? entity.entity_id ?? ""),
    provider: String(entity.provider ?? ""),
    providerId: String(entity.providerId ?? entity.provider_id ?? ""),
    type: String(entity.type ?? "track"),
    title: String(entity.title ?? ""),
    artistName: entity.artistName ?? entity.artist_name ?? null,
    deezerUrl: entity.deezerUrl ?? entity.deezer_url ?? null,
    currentTags: Array.isArray(entity.currentTags)
      ? entity.currentTags.map(normalizeTag)
      : [],
    starterTags: Array.isArray(entity.starterTags)
      ? entity.starterTags.map(normalizeTag)
      : [],
    missingSignals: Array.isArray(entity.missingSignals) ? entity.missingSignals : [],
    reviewCount: Number(entity.reviewCount ?? entity.review_count ?? 0),
    averageRating: entity.averageRating ?? entity.average_rating ?? null,
    bookmarkCount: Number(entity.bookmarkCount ?? entity.bookmark_count ?? 0),
    libraryCount: Number(entity.libraryCount ?? entity.library_count ?? 0),
    manualTagCount: Number(entity.manualTagCount ?? entity.manual_tag_count ?? 0),
    signalScore: Number(entity.signalScore ?? entity.signal_score ?? 0),
  };
}

function hasCurationSignal(entity) {
  return (
    entity.reviewCount > 0 ||
    entity.bookmarkCount > 0 ||
    entity.libraryCount > 0 ||
    entity.manualTagCount > 0 ||
    entity.starterTags.length > 0
  );
}

function buildDraftPrompt(input) {
  const availableTagText = Object.entries(input.availableTags)
    .map(([kind, tags]) => {
      const tagText = tags
        .map((tag) => `- ${tag.slug}: ${tag.label}${tag.description ? ` - ${tag.description}` : ""}`)
        .join("\n");
      return `### ${kind}\n${tagText || "- No tags exported."}`;
    })
    .join("\n\n");

  const entityText = input.entities
    .map((entity, index) => {
      const currentTags = entity.currentTags
        .map((tag) => `${tag.kind}:${tag.slug}`)
        .join(", ");
      const starterTags = entity.starterTags
        .map((tag) => `${tag.kind}:${tag.slug}`)
        .join(", ");

      return `### ${index + 1}. ${entity.title}${entity.artistName ? ` - ${entity.artistName}` : ""}
- entityId: ${entity.entityId}
- provider: ${entity.provider}
- providerId: ${entity.providerId}
- type: ${entity.type}
- deezerUrl: ${entity.deezerUrl ?? "unknown"}
- missingSignals: ${entity.missingSignals.join(", ") || "none"}
- currentTags: ${currentTags || "none"}
- starterTags: ${starterTags || "none"}
- reviewCount: ${entity.reviewCount}
- averageRating: ${entity.averageRating ?? "none"}
- bookmarkCount: ${entity.bookmarkCount}
- libraryCount: ${entity.libraryCount}
- manualTagCount: ${entity.manualTagCount}
- signalScore: ${entity.signalScore}`;
    })
    .join("\n\n");

  return `# Kocteau Entity Curation Draft Prompt

You are Kocteau's curation copilot. Help draft taste metadata for local music entities.

## Role

Kocteau is a human-led music review product. You are not deciding what is good or bad. You are helping a maintainer classify tracks so discovery can become more useful.

## Rules

- Return JSON only.
- Use only existing tag slugs from the available tag list.
- Do not auto-apply genre. You may suggest genre candidates, but mark them for human review.
- Do not mark the packet as reviewed. Leave humanReviewed false until a maintainer reviews it.
- Prefer mood, scene, style, era, and format before genre.
- Suggest at most eight non-genre signals per entity.
- Avoid obvious popularity worship. Known artists may still have deep cuts or strong contextual value.
- Treat novelty, troll, or meme-coded tracks cautiously. They should not get high discoveryFitScore unless the input shows real Kocteau curation intent.
- Use mainstreamScore from 0 to 100, where 100 means very commercially familiar.
- Use discoveryFitScore from 0 to 100, where 100 means especially useful for Kocteau discovery.
- Do not invent facts such as scenes, release years, or biographies if the input does not support them.
- Use confidence: "low", "medium", or "high".

## Output Shape

\`\`\`json
{
  "humanReviewed": false,
  "reviewedBy": "",
  "reviewedAt": "",
  "drafts": [
    {
      "entityId": "uuid",
      "suggestedTagSlugs": {
        "mood": ["slug"],
        "scene": ["slug"],
        "style": ["slug"],
        "era": ["slug"],
        "format": ["slug"]
      },
      "genreCandidatesForHumanReview": ["slug"],
      "mainstreamScore": 35,
      "discoveryFitScore": 82,
      "confidence": "medium",
      "curationNote": "short maintainer-facing note",
      "rationale": "one short sentence explaining the choices"
    }
  ]
}
\`\`\`

## Available Tags

${availableTagText}

## Entities

${entityText}
`;
}

function buildOutputTemplate(entities) {
  return {
    humanReviewed: false,
    reviewedBy: "",
    reviewedAt: "",
    drafts: entities.map((entity) => ({
      entityId: entity.entityId,
      suggestedTagSlugs: {
        mood: [],
        scene: [],
        style: [],
        era: [],
        format: [],
      },
      genreCandidatesForHumanReview: [],
      mainstreamScore: null,
      discoveryFitScore: null,
      confidence: "low",
      curationNote: "",
      rationale: "",
    })),
  };
}
