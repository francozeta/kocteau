import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogSignalProposal, type CatalogEvidence, type CatalogIdentity, type SignalVocabularyTag } from "./signal-proposals";

const identity: CatalogIdentity = { provider: "deezer", providerId: "3129748", type: "track", title: "Teardrop", artistName: "Massive Attack" };
const vocabulary: SignalVocabularyTag[] = [
  { id: "trip", kind: "genre", slug: "trip-hop", label: "Trip hop" },
  { id: "electronic", kind: "genre", slug: "electronic", label: "Electronic" },
  { id: "dreamy", kind: "mood", slug: "dreamy", label: "Dreamy" },
  { id: "90s", kind: "era", slug: "1990s", label: "1990s" },
  { id: "20s", kind: "era", slug: "2020s", label: "2020s" },
  { id: "album", kind: "format", slug: "album-focused", label: "Album-focused" },
];
const track: CatalogEvidence = {
  id: "deezer-observation", source: "deezer", source_entity_type: "track", source_entity_id: identity.providerId,
  lookup: { ...identity, researchVersion: 2 }, status: "resolved", match_score: null,
  facts: { title: "Teardrop", album_id: "301773", release_date: "1998-04-20" }, retrieved_at: "2026-09-29T10:00:00Z",
};
const recording: CatalogEvidence = {
  ...track, id: "mb-observation", source: "musicbrainz", source_entity_type: "recording", source_entity_id: "recording-id",
  match_score: 100, facts: { matched_title: "Teardrop", matched_artist: "Massive Attack", match_method: "isrc",
    first_release_date: "1998-04-17", tags: ["house", "dreamy"], prominent_tags: ["electronic", "trip-hop", "trip hop", "unknown tag"] },
};
const album: CatalogEvidence = {
  ...track, id: "album-observation", source_entity_type: "album", source_entity_id: "301773",
  facts: { album_id: "301773", record_type: "album", tags: ["Electronic"] },
};

test("Teardrop gets existing signal IDs with versioned, source-linked evidence", () => {
  const result = buildCatalogSignalProposal(identity, [track, recording, album], vocabulary)!;
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.rulesVersion, "catalog-signals-v2");
  assert.deepEqual(result.signals.map((signal) => signal.tagId), ["electronic", "trip", "90s", "album"]);
  assert.ok(result.signals.every((signal) => signal.status === "suggested" && signal.evidence.length > 0));
  assert.equal(result.signals.find((signal) => signal.tagId === "trip")?.origin, "external");
  assert.equal(result.signals.find((signal) => signal.tagId === "90s")?.origin, "inferred");
  assert.equal(result.signals.find((signal) => signal.tagId === "90s")?.evidence[0].observationId, recording.id);
  assert.deepEqual(result.signals.find((signal) => signal.tagId === "90s")?.evidence[0], {
    observationId: recording.id, field: "first_release_date", value: "1998-04-17",
    evidenceClass: "inferred", sourceClass: "fact",
  });
});

test("mixed provider support retains each class without promoting it", () => {
  const result = buildCatalogSignalProposal(identity, [track, recording, album], vocabulary)!;
  assert.deepEqual(result.signals.find((signal) => signal.tagId === "electronic")?.evidence, [
    { observationId: recording.id, field: "prominent_tags", value: "electronic",
      evidenceClass: "community", sourceClass: "community" },
    { observationId: album.id, field: "tags", value: "Electronic",
      evidenceClass: "inferred", sourceClass: null },
  ]);
});

test("conflicting community and album labels remain separate suggestions", () => {
  const disputed = { ...album, facts: { ...album.facts as object, tags: ["trip-hop"] } };
  const result = buildCatalogSignalProposal(identity, [track, {
    ...recording, facts: { ...recording.facts as object, prominent_tags: ["electronic"] },
  }, disputed], vocabulary)!;
  assert.deepEqual(result.signals.filter((signal) => signal.kind === "genre").map((signal) => ({
    tagId: signal.tagId, evidenceClass: signal.evidence[0].evidenceClass,
  })), [
    { tagId: "electronic", evidenceClass: "community" },
    { tagId: "trip", evidenceClass: "inferred" },
  ]);
});
test("missing categories stay empty rather than deriving moods from genres", () => {
  const result = buildCatalogSignalProposal(identity, [track, recording], vocabulary)!;
  assert.equal(result.signals.some((signal) => ["mood", "scene", "style", "format"].includes(signal.kind)), false);
});
test("attributed mood tags keep their taxonomy kind", () => {
  const result = buildCatalogSignalProposal(identity, [track, { ...recording, facts: { ...recording.facts as object, prominent_tags: ["dreamy"] } }], vocabulary)!;
  assert.equal(result.signals[0].kind, "mood");
});
test("legacy, failed and mismatched identities cannot supply suggestions", () => {
  for (const invalid of [{ ...track, lookup: {} }, { ...track, status: "failed" }, { ...track, lookup: { ...identity, researchVersion: 2, providerId: "999" } }]) {
    assert.equal(buildCatalogSignalProposal(identity, [invalid, recording, album], vocabulary), null);
  }
  const result = buildCatalogSignalProposal(identity, [track, { ...recording, lookup: {} }], vocabulary)!;
  assert.deepEqual(result.signals.map((signal) => signal.tagId), ["90s"]);
});
test("another album cannot provide release format or genre", () => {
  const result = buildCatalogSignalProposal(identity, [track, { ...album, source_entity_id: "999" }], vocabulary)!;
  assert.deepEqual(result.signals.map((signal) => signal.tagId), ["90s"]);
});
test("original recording date takes precedence over a reissue date", () => {
  const reissue = { ...track, facts: { release_date: "2024-01-01" } };
  const result = buildCatalogSignalProposal(identity, [reissue, recording], vocabulary)!;
  assert.equal(result.signals.some((signal) => signal.tagId === "20s"), false);
  assert.equal(result.signals.some((signal) => signal.tagId === "90s"), true);
});
test("malformed fields and future dates yield an honest empty proposal", () => {
  const result = buildCatalogSignalProposal(identity, [{ ...track, facts: { release_date: "2099", tags: { secret: "value" } } }], vocabulary, 2026)!;
  assert.deepEqual(result.signals, []);
});
