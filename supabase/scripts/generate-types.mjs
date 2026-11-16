import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const supabaseScript = resolve(
  repoRoot,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const supabaseLegacyBin =
  process.platform === "win32"
    ? resolve(repoRoot, "node_modules", "supabase", "bin", "supabase.exe")
    : resolve(repoRoot, "node_modules", "supabase", "bin", "supabase");
const command = existsSync(supabaseScript) ? process.execPath : supabaseLegacyBin;
const commandArgs = existsSync(supabaseScript) ? [supabaseScript] : [];
const isLinked = process.argv.includes("--linked");
const isLocal = process.argv.includes("--local");
const sourceFlag = isLinked && !isLocal ? "--linked" : "--local";

const result = spawnSync(
  command,
  [
    ...commandArgs,
    "gen",
    "types",
    sourceFlag,
    "--lang=typescript",
    "--schema",
    "public,storage,graphql_public",
  ],
  {
    encoding: "utf8",
    cwd: repoRoot,
  },
);

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

// SQL-function metadata omits nullable aggregate, review text and catalog results.
const output = result.stdout
  .replace(/\r\n/gu, "\n")
  .replace(
    /(get_entity_review_summary: \{[\s\S]*?average_rating:) number(?: \| null)?/u,
    "$1 number | null",
  )
  .replace(
    /(get_recommended_feed_bundle: \{[\s\S]*?body:) string(?: \| null)?/u,
    "$1 string | null",
  )
  .replace(
    /(get_recommended_feed_bundle: \{[\s\S]*?title:) string(?: \| null)?/u,
    "$1 string | null",
  )
  .replace(
    /      search_local_(?:artists|entities|starter_tracks): \{[\s\S]*?\n      \}/gu,
    (block) => block.replace(
      /^(          (?:artist_name|artist_type|country_code|cover_url|deezer_url|disambiguation|first_release_date|image_url|record_type|release_date): string)(?: \| null)?$/gmu,
      "$1 | null",
    ),
  )
  .replace(/(?:\n)+$/u, "\n");

writeFileSync(
  resolve(repoRoot, "apps", "web", "lib", "supabase", "database.types.ts"),
  output,
  "utf8",
);
