import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(repoRoot, args.input ?? "tmp/starter-curation-export.json");
const outDir = path.resolve(repoRoot, args.outDir ?? "tmp/starter-curation");
const limit = args.limit ? Number.parseInt(args.limit, 10) : null;

if (args.help) {
  printHelp();
  process.exit(0);
}

const rawInput = await fs.readFile(inputPath, "utf8");
const exportPayload = normalizeExport(JSON.parse(rawInput));
const tracks = Array.isArray(exportPayload.tracks) ? exportPayload.tracks : [];
const selectedTracks = Number.isFinite(limit) && limit > 0 ? tracks.slice(0, limit) : tracks;

await fs.mkdir(outDir, { recursive: true });

const normalizedInput = {
  generatedAt: exportPayload.generatedAt ?? new Date().toISOString(),
  source: exportPayload.source ?? path.basename(inputPath),
  availableTags: normalizeAvailableTags(exportPayload.availableTags ?? {}),
  tracks: selectedTracks.map(normalizeTrack),
};

const prompt = buildDraftPrompt(normalizedInput);
const template = buildOutputTemplate(normalizedInput.tracks);

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

console.log(`Starter curation draft packet created in ${path.relative(repoRoot, outDir)}.`);
console.log(`Tracks included: ${normalizedInput.tracks.length}`);

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
  pnpm curate:starter:draft
  pnpm curate:starter:draft -- --input tmp/starter-curation-export.json --out-dir tmp/starter-curation --limit 12

Input:
  Copy the JSON value from supabase/scripts/maintenance/starter-curation-draft-export.sql
  into tmp/starter-curation-export.json.

Output:
  tmp/starter-curation/draft-input.json
  tmp/starter-curation/draft-prompt.md
  tmp/starter-curation/draft-output-template.json
`);
}

function normalizeExport(payload) {
  if (typeof payload === "string") {
    return normalizeExport(JSON.parse(payload));
  }

  if (Array.isArray(payload)) {
    if (payload.length === 1 && payload[0]?.starter_curation_export) {
      return normalizeExport(payload[0].starter_curation_export);
    }

    return {
      tracks: payload,
      availableTags: {},
    };
  }

  if (payload?.starter_curation_export) {
    return normalizeExport(payload.starter_curation_export);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("Expected a starter curation export object or array.");
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

function normalizeTrack(track) {
  return {
    starterTrackId: String(track.starterTrackId ?? track.starter_track_id ?? ""),
    providerId: String(track.providerId ?? track.provider_id ?? ""),
    title: String(track.title ?? ""),
    artistName: track.artistName ?? track.artist_name ?? null,
    deezerUrl: track.deezerUrl ?? track.deezer_url ?? null,
    currentPrompt: track.currentPrompt ?? track.prompt ?? null,
    currentEditorialNote: track.currentEditorialNote ?? track.editorial_note ?? null,
    currentTags: Array.isArray(track.currentTags) ? track.currentTags : [],
    missingSignals: Array.isArray(track.missingSignals) ? track.missingSignals : [],
  };
}

function buildDraftPrompt(input) {
  const availableTagText = Object.entries(input.availableTags)
    .map(([kind, tags]) => {
      const tagText = tags
        .map((tag) => `- ${tag.slug}: ${tag.label}${tag.description ? ` — ${tag.description}` : ""}`)
        .join("\n");
      return `### ${kind}\n${tagText || "- No tags exported."}`;
    })
    .join("\n\n");

  const trackText = input.tracks
    .map((track, index) => {
      const currentTags = track.currentTags
        .map((tag) => `${tag.kind}:${tag.slug}`)
        .join(", ");

      return `### ${index + 1}. ${track.title}${track.artistName ? ` — ${track.artistName}` : ""}
- starterTrackId: ${track.starterTrackId}
- providerId: ${track.providerId}
- deezerUrl: ${track.deezerUrl ?? "unknown"}
- missingSignals: ${track.missingSignals.join(", ") || "none"}
- currentTags: ${currentTags || "none"}
- currentPrompt: ${track.currentPrompt ?? "none"}
- currentEditorialNote: ${track.currentEditorialNote ?? "none"}`;
    })
    .join("\n\n");

  return `# Starter Curation Draft Prompt

You are helping Kocteau draft missing starter pick metadata.

## Rules

- Return JSON only.
- Use only existing tag slugs from the available tag list.
- Do not auto-apply genre. You may suggest genre candidates, but mark them for human review.
- Keep prompts short: one question, 80 characters or fewer when possible.
- Keep editorial notes short: one sentence, calm and music-native.
- Favor non-mainstream framing. Familiar artists should usually be treated as deep cuts, contrast picks, or familiar entry points.
- Do not invent facts such as release years, scenes, or obscure biographical claims if the input does not support them.
- Use confidence: "low", "medium", or "high".

## Output Shape

\`\`\`json
{
  "drafts": [
    {
      "starterTrackId": "uuid",
      "prompt": "question for the listener",
      "editorialNote": "short Kocteau curator note",
      "suggestedTagSlugs": {
        "mood": ["slug"],
        "scene": ["slug"],
        "style": ["slug"],
        "era": ["slug"],
        "format": ["slug"]
      },
      "genreCandidatesForHumanReview": ["slug"],
      "confidence": "medium",
      "rationale": "one short sentence explaining the choices"
    }
  ]
}
\`\`\`

## Available Tags

${availableTagText}

## Tracks

${trackText}
`;
}

function buildOutputTemplate(tracks) {
  return {
    drafts: tracks.map((track) => ({
      starterTrackId: track.starterTrackId,
      prompt: "",
      editorialNote: "",
      suggestedTagSlugs: {
        mood: [],
        scene: [],
        style: [],
        era: [],
        format: [],
      },
      genreCandidatesForHumanReview: [],
      confidence: "low",
      rationale: "",
    })),
  };
}
