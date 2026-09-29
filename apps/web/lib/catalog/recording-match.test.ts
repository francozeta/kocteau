import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCatalogText, normalizeIsrc, selectRecordingMatch, type RecordingCandidate } from "./recording-match";

const identity = { title: "Teardrop", artistName: "Massive Attack", isrc: "GBAAA9800322", durationSeconds: 327 };
const studio: RecordingCandidate = {
  id: "studio", title: "Teardrop", score: 100, length: 330026, isrcs: [identity.isrc],
  "artist-credit": [{ name: "Massive Attack" }],
};

test("ISRC and artist distinguish the studio recording from a score-100 live result", () => {
  const live = { ...studio, id: "live", disambiguation: "live, 1998, Royal Albert Hall", isrcs: [] };
  assert.equal(selectRecordingMatch([live, studio], identity)?.id, "studio");
  assert.equal(selectRecordingMatch([live], { ...identity, isrc: null }), null);
});
test("wrong artists, duration mismatches and missing ISRC evidence are rejected", () => {
  assert.equal(selectRecordingMatch([{ ...studio, "artist-credit": [{ name: "Fax" }] }], identity), null);
  assert.equal(selectRecordingMatch([{ ...studio, length: 400_000 }], identity), null);
  assert.equal(selectRecordingMatch([{ ...studio, isrcs: undefined }], identity), null);
  assert.equal(selectRecordingMatch([studio], { ...identity, artistName: null }), null);
});
test("ambiguous recordings are not resolved by array order or tag count", () => {
  assert.equal(selectRecordingMatch([studio, { ...studio, id: "duplicate" }], identity), null);
});
test("a differing combined artist credit is not treated as an exact match", () => {
  const duet = { ...studio, id: "duet", "artist-credit": [{ name: "Massive Attack", joinphrase: " & " }, { name: "Elizabeth Fraser" }] };
  assert.equal(selectRecordingMatch([duet, studio], identity), studio);
});
test("name matching preserves non-Latin names and normalizes ISRC punctuation", () => {
  assert.equal(normalizeCatalogText("愛のうた"), "愛のうた");
  assert.notEqual(normalizeCatalogText("愛のうた"), normalizeCatalogText("別の歌"));
  assert.equal(normalizeIsrc("gb-aaa-98-00322"), identity.isrc);
  assert.equal(normalizeIsrc("unknown"), null);
});
