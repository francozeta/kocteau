import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type EntityCurationDraft = {
  entityId: string;
  suggestedTagSlugs: Record<string, string[]>;
  genreCandidatesForHumanReview?: string[];
  mainstreamScore?: number | null;
  discoveryFitScore?: number | null;
  confidence?: "low" | "medium" | "high" | null;
  curationNote?: string | null;
  rationale?: string | null;
};

export type EntityCurationOutput = {
  humanReviewed: false;
  reviewedBy?: string;
  reviewedAt?: string;
  source?: string;
  drafts: EntityCurationDraft[];
};

type AvailableTag = {
  slug: string;
  label?: string;
  description?: string | null;
};

type EntityCurationInput = {
  availableTags?: Record<string, AvailableTag[]>;
  entities?: unknown[];
};

const outputKinds = ["mood", "scene", "style", "era", "format"] as const;
const preferredKinds = ["era", "format", "mood", "scene", "style"] as const;

export function getRepoRoot() {
  return path.resolve(process.cwd(), "..", "..");
}

export function getEntityCurationPaths() {
  const repoRoot = getRepoRoot();
  const outDir = path.join(repoRoot, "tmp", "entity-curation");

  return {
    repoRoot,
    outDir,
    input: path.join(outDir, "draft-input.json"),
    prompt: path.join(outDir, "draft-prompt.md"),
    template: path.join(outDir, "draft-output-template.json"),
    output: path.join(outDir, "draft-output.json"),
  };
}

export async function loadEntityCurationPacket() {
  const paths = getEntityCurationPaths();
  const [inputText, prompt, template] = await Promise.all([
    readFile(paths.input, "utf8"),
    readFile(paths.prompt, "utf8"),
    readFile(paths.template, "utf8"),
  ]);
  const input = JSON.parse(inputText) as EntityCurationInput;

  return {
    paths,
    input,
    prompt,
    template,
    allowedTags: getAllowedTags(input),
  };
}

export function getAllowedTags(input: EntityCurationInput) {
  const allowed = new Map<string, Set<string>>();

  for (const [kind, tags] of Object.entries(input.availableTags ?? {})) {
    allowed.set(
      kind,
      new Set(Array.isArray(tags) ? tags.map((tag) => tag.slug).filter(Boolean) : []),
    );
  }

  return allowed;
}

export function normalizeDraftSignals(
  output: EntityCurationOutput,
  allowedTags: Map<string, Set<string>>,
) {
  for (const draft of output.drafts) {
    const selected: [string, string][] = [];

    for (const kind of preferredKinds) {
      const slugs = Array.isArray(draft.suggestedTagSlugs?.[kind])
        ? draft.suggestedTagSlugs[kind]
        : [];

      for (const slug of slugs) {
        if (typeof slug !== "string") {
          continue;
        }

        if (!allowedTags.get(kind)?.has(slug)) {
          continue;
        }

        if (selected.length >= 8) {
          break;
        }

        selected.push([kind, slug]);
      }
    }

    draft.suggestedTagSlugs = Object.fromEntries(
      outputKinds.map((kind) => [
        kind,
        selected
          .filter(([selectedKind]) => selectedKind === kind)
          .map(([, slug]) => slug),
      ]),
    );
  }

  return output;
}

export function assertEntityCurationOutput(output: EntityCurationOutput) {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    throw new Error("Draft output must be an object.");
  }

  if (output.humanReviewed !== false) {
    throw new Error("AI draft must leave humanReviewed as false.");
  }

  if (!Array.isArray(output.drafts)) {
    throw new Error("Draft output must include a drafts array.");
  }

  for (const draft of output.drafts) {
    if (!draft.entityId || typeof draft.entityId !== "string") {
      throw new Error("Each draft must include entityId.");
    }

    if (!draft.suggestedTagSlugs || typeof draft.suggestedTagSlugs !== "object") {
      throw new Error(`Draft ${draft.entityId} is missing suggestedTagSlugs.`);
    }

    if (draft.curationNote && draft.curationNote.length > 240) {
      throw new Error(`Draft ${draft.entityId} curationNote exceeds 240 characters.`);
    }
  }
}

export async function writeEntityCurationOutput(output: EntityCurationOutput) {
  const { paths, allowedTags } = await loadEntityCurationPacket();
  const normalized = normalizeDraftSignals(output, allowedTags);
  normalized.source = normalized.source || "eve:draft";
  assertEntityCurationOutput(normalized);

  await mkdir(path.dirname(paths.output), { recursive: true });

  let backupPath: string | null = null;

  if (existsSync(paths.output)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    backupPath = paths.output.replace(/\.json$/, `.backup-${stamp}.json`);
    await rename(paths.output, backupPath);
  }

  await writeFile(paths.output, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  return {
    outputPath: paths.output,
    backupPath,
    drafts: normalized.drafts.length,
  };
}
