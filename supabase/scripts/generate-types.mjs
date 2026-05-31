import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const supabaseBin =
  process.platform === "win32"
    ? resolve(repoRoot, "node_modules", "supabase", "bin", "supabase.exe")
    : resolve(repoRoot, "node_modules", "supabase", "bin", "supabase");

const result = spawnSync(
  supabaseBin,
  [
    "gen",
    "types",
    "--local",
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

const output = result.stdout.replace(/(?:\r?\n)+$/u, "\n");

writeFileSync(
  resolve(repoRoot, "apps", "web", "lib", "supabase", "database.types.ts"),
  output,
  "utf8",
);
