import assert from "node:assert/strict";
import test from "node:test";
import { canRunCatalogResearch, catalogSourceUrl, type CatalogResearch } from "./research-state";

const now = Date.parse("2026-09-28T12:00:00Z");
const job: NonNullable<CatalogResearch["job"]> = {
  id: "job", status: "pending", attempts: 0,
  next_attempt_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString(),
};
const source: CatalogResearch["sources"][number] = {
  id: "source", lookup: { researchVersion: 2 },
  source: "deezer", source_entity_type: "track", source_entity_id: "123",
  status: "no_match", facts: {}, match_score: null, retrieved_at: new Date(now).toISOString(),
};

test("new drafts and legacy completed jobs can request recorded evidence", () => {
  assert.equal(canRunCatalogResearch({ job: null, sources: [] }, now), true);
  assert.equal(canRunCatalogResearch({ job: { ...job, status: "complete" }, sources: [] }, now), true);
  assert.equal(canRunCatalogResearch({ job: { ...job, status: "complete" }, sources: [source] }, now), true);
  assert.equal(canRunCatalogResearch({ job: { ...job, status: "complete" }, sources: [source,
    { ...source, source: "musicbrainz", source_entity_type: "recording" },
  ] }, now), false);
  assert.equal(canRunCatalogResearch({ job: { ...job, status: "complete" }, sources: [
    { ...source, lookup: {} }, { ...source, source: "musicbrainz", lookup: {} },
  ] }, now), true);
});

test("UI retry availability respects backoff and attempt exhaustion", () => {
  assert.equal(canRunCatalogResearch({ job, sources: [] }, now), true);
  assert.equal(canRunCatalogResearch({ job: { ...job, next_attempt_at: new Date(now + 60_000).toISOString() }, sources: [] }, now), false);
  assert.equal(canRunCatalogResearch({ job: { ...job, attempts: 5 }, sources: [] }, now), false);
});

test("running jobs can only be resumed after the worker recovery window", () => {
  assert.equal(canRunCatalogResearch({ job: { ...job, status: "processing" }, sources: [] }, now), false);
  assert.equal(canRunCatalogResearch({ job: { ...job, status: "processing", updated_at: new Date(now - 16 * 60_000).toISOString() }, sources: [] }, now), true);
});

test("source links use allowlisted provider identities, never returned URLs", () => {
  assert.equal(catalogSourceUrl(source), "https://www.deezer.com/track/123");
  assert.equal(catalogSourceUrl({ ...source, source_entity_id: "https://untrusted.example" }), null);
  assert.equal(catalogSourceUrl({ ...source, source_entity_id: null }), null);
  const recording = { ...source, source: "musicbrainz", source_entity_type: "recording", source_entity_id: "10000000-0000-4000-8000-000000000001" };
  assert.equal(catalogSourceUrl(recording), "https://musicbrainz.org/recording/10000000-0000-4000-8000-000000000001");
  assert.equal(catalogSourceUrl({ ...recording, source_entity_type: "../redirect" }), null);
});
