import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateText } from "ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const paths = {
  input: path.join(repoRoot, "tmp", "entity-curation", "draft-input.json"),
  prompt: path.join(repoRoot, "tmp", "entity-curation", "draft-prompt.md"),
  template: path.join(repoRoot, "tmp", "entity-curation", "draft-output-template.json"),
  output: path.join(repoRoot, "tmp", "entity-curation", "draft-output.json"),
};

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
  }
}

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);

  throw new Error("AI response did not contain a JSON object.");
}

function parseArgs(argv) {
  const args = {
    model: process.env.KOCTEAU_AI_MODEL || "anthropic/claude-haiku-4.5",
    force: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--force") {
      args.force = true;
      continue;
    }

    if (arg === "--model") {
      args.model = argv[++index];
      continue;
    }

    if (arg.startsWith("--model=")) {
      args.model = arg.slice("--model=".length);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return args;
}

function assertOutputShape(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Draft output must be an object.");
  }

  if (value.humanReviewed !== false) {
    throw new Error("AI draft must leave humanReviewed as false.");
  }

  if (!Array.isArray(value.drafts)) {
    throw new Error("Draft output must include a drafts array.");
  }

  for (const draft of value.drafts) {
    if (!draft.entityId || typeof draft.entityId !== "string") {
      throw new Error("Each draft must include entityId.");
    }

    if (!draft.suggestedTagSlugs || typeof draft.suggestedTagSlugs !== "object") {
      throw new Error(`Draft ${draft.entityId} is missing suggestedTagSlugs.`);
    }
  }
}

function getAllowedTags(input) {
  const allowed = new Map();

  for (const [category, tags] of Object.entries(input.availableTags || {})) {
    allowed.set(
      category,
      new Set(Array.isArray(tags) ? tags.map((tag) => tag.slug) : []),
    );
  }

  return allowed;
}

function normalizeDraftSignals(value, allowedTags) {
  const preferredOrder = ["era", "format", "mood", "scene", "style"];
  const outputOrder = ["mood", "scene", "style", "era", "format"];

  for (const draft of value.drafts) {
    const selected = [];

    for (const category of preferredOrder) {
      const slugs = Array.isArray(draft.suggestedTagSlugs?.[category])
        ? draft.suggestedTagSlugs[category]
        : [];

      for (const slug of slugs) {
        if (typeof slug !== "string") continue;
        if (!allowedTags.get(category)?.has(slug)) continue;
        if (selected.length >= 8) break;
        selected.push([category, slug]);
      }
    }

    draft.suggestedTagSlugs = Object.fromEntries(
      outputOrder.map((category) => [
        category,
        selected
          .filter(([selectedCategory]) => selectedCategory === category)
          .map(([, slug]) => slug),
      ]),
    );
  }

  return value;
}

loadEnvFile(path.join(appRoot, ".env.local"));
loadEnvFile(path.join(repoRoot, "apps", "web", ".env.local"));
loadEnvFile(path.join(repoRoot, ".env.local"));

if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
  throw new Error(
    "Missing AI Gateway credentials. Set AI_GATEWAY_API_KEY or run `pnpm exec eve link` in apps/curation-agent.",
  );
}

for (const filePath of [paths.prompt, paths.input, paths.template]) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Run pnpm curate:entity:draft first.`);
  }
}

const args = parseArgs(process.argv.slice(2));
const input = JSON.parse(readFileSync(paths.input, "utf8"));
const allowedTags = getAllowedTags(input);
const prompt = readFileSync(paths.prompt, "utf8");
const template = readFileSync(paths.template, "utf8");

const fullPrompt = `${prompt}

## Output Template

Fill this exact JSON template. Preserve humanReviewed as false. Return JSON only.

${template}`;

console.log(`Drafting entity curation metadata with ${args.model}...`);

const result = await generateText({
  model: args.model,
  prompt: fullPrompt,
  temperature: 0.2,
  maxOutputTokens: 12000,
});

const parsed = normalizeDraftSignals(JSON.parse(extractJson(result.text)), allowedTags);
parsed.source = "eve:draft";
assertOutputShape(parsed);

mkdirSync(path.dirname(paths.output), { recursive: true });

if (existsSync(paths.output)) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = paths.output.replace(/\.json$/, `.backup-${stamp}.json`);
  if (!args.force) {
    renameSync(paths.output, backupPath);
    console.log(`Existing draft-output.json moved to ${backupPath}`);
  }
}

writeFileSync(paths.output, `${JSON.stringify(parsed, null, 2)}\n`);

console.log(`Wrote ${paths.output}`);
console.log(`Drafts included: ${parsed.drafts.length}`);
console.log("Review it manually, then set humanReviewed true before running pnpm curate:entity:sql.");
