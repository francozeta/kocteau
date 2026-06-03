import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = join(import.meta.dirname, "..", "..", "..", "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");

function readFeedTuningMigration() {
  const migrationName = readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith("_feed_tuning_v1.sql"))
    .sort()
    .at(-1);

  assert.ok(migrationName, "Expected a feed_tuning_v1 migration.");

  const migrationPath = join(migrationsDir, migrationName);

  assert.ok(existsSync(migrationPath), `Missing migration at ${migrationPath}`);

  return readFileSync(migrationPath, "utf8");
}

test("feed tuning migration rewards written reviews without changing reason labels", () => {
  const migration = readFeedTuningMigration();

  assert.match(migration, /review_depth_score/i);
  assert.match(migration, /char_length\(trim\(coalesce\(r\.body, ''\)\)\) >= 120/i);
  assert.match(migration, /\+ d\.review_depth_score/i);
  assert.match(migration, /greatest\(0, r\.rating - 3\) \* 0\.22/i);
  assert.match(migration, /THEN 'entity_taste'/);
  assert.match(migration, /ELSE 'popular_recent'/);
});

test("feed tuning migration increases author and entity diversity pressure", () => {
  const migration = readFeedTuningMigration();

  assert.match(migration, /greatest\(d\.author_rank - 1, 0\) \* 0\.55/i);
  assert.match(migration, /greatest\(d\.entity_rank - 1, 0\) \* 0\.95/i);
  assert.match(migration, /ORDER BY \(scored\.base_score \+ scored\.review_depth_score\) DESC/i);
});
