import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import type { ProposalInput } from "./proposal-schema";
import { estimateScoutCeiling, sourceScoutOutputSchema, validateSourceScout } from "./source-scout-schema";
import { scoutPrompt, scoutSystem } from "./source-scout-runner";
import { scoutSource } from "./source-scout-sources";

const tag = "10000000-0000-4000-8000-000000000001";
const url = "https://pitchfork.com/reviews/albums/example/";
const input: ProposalInput = {
  purpose: "source_scout", identity: { id: "entity", provider_id: "1", title: "Track", artist_name: "Artist" },
  deterministic: { schemaVersion: 1, rulesVersion: "catalog-signals-v1",
    identity: { provider: "deezer", providerId: "1", type: "track", title: "Track", artistName: "Artist" }, signals: [] },
  evidence: [{ id: "observation", source: "deezer", source_entity_type: "track", source_entity_id: "1", status: "resolved",
    facts: { album_title: "Release" }, retrieved_at: "2026-09-30T00:00:00Z" }],
  vocabulary: [{ id: tag, label: "Warm", slug: "warm", kind: "mood" }],
};
const candidate = { tag_id: tag, source_url: url, matched_title: "Track", matched_artist: "Artist", scope: "track", reason: "Possible reading to inspect." };
const reading = { source_url: url, matched_title: "Track", matched_artist: "Artist", scope: "track" };
const output = { readings: [reading], candidates: [candidate], uncertainty: [] };

test("research leads need a consulted original URL and a matching scoped identity", () => {
  assert.equal(validateSourceScout(output, input, [url]).candidates.length, 1);
  assert.equal(validateSourceScout({ ...output, readings: [{ ...reading, scope: "release", matched_title: "Release" }],
    candidates: [{ ...candidate, scope: "release", matched_title: "Release" }] }, input, [url]).candidates[0].scope, "release");
  for (const bad of [
    { ...candidate, source_url: "https://pitchfork.com/reviews/albums/invented/" },
    { ...candidate, matched_artist: "Homonym" }, { ...candidate, matched_title: "Track (live)" },
    { ...candidate, scope: "release", matched_title: "Other release" },
    { ...candidate, tag_id: "10000000-0000-4000-8000-000000000002" },
    { ...candidate, approved: true },
  ]) assert.throws(() => validateSourceScout({ ...output, candidates: [bad] }, input, [url]));
  assert.throws(() => validateSourceScout(output, input, []));
  assert.throws(() => validateSourceScout({ ...output, readings: [] }, input, [url]));
  assert.throws(() => validateSourceScout({ ...output, candidates: [candidate, candidate] }, input, [url]));
});

test("unsafe URLs, unrelated hosts and search pages cannot become source links", () => {
  for (const unsafe of ["http://pitchfork.com/reviews/albums/example/", "https://pitchfork.com.evil.test/reviews/albums/example/",
    "https://someone@pitchfork.com/reviews/albums/example/", "https://pitchfork.com:444/reviews/albums/example/",
    "https://reddit.com/search?q=track", "https://daily.bandcamp.com/", "javascript:alert(1)"]) assert.equal(scoutSource(unsafe), null);
  assert.equal(scoutSource("https://www.reddit.com/r/music/comments/abc123/discussion/")?.evidenceClass, "community");
  assert.equal(scoutSource("https://old.reddit.com/r/music/comments/abc123/discussion/")?.evidenceClass, "community");
  assert.equal(scoutSource("https://daily.bandcamp.com/features/example")?.evidenceClass, "editorial");
  assert.equal(scoutSource("https://daily.bandcamp.com/about/contact"), null);
});

test("community and editorial lookup cannot silently borrow each other's citations", () => {
  const community = { ...input, source_class: "community" as const };
  assert.throws(() => validateSourceScout(output, community, [url]));
  const reddit = "https://www.reddit.com/r/music/comments/abc123/discussion/";
  const communityOutput = { ...output, readings: [{ ...reading, source_url: reddit }], candidates: [{ ...candidate, source_url: reddit }] };
  assert.equal(validateSourceScout(communityOutput, community, [reddit]).candidates.length, 1);
  assert.throws(() => validateSourceScout(communityOutput, input, [reddit]));
});

test("covered kinds and missing identity stay outside paid suggestions", () => {
  const covered = { ...input, deterministic: { ...input.deterministic, signals: [{ tagId: tag, kind: "mood" as const,
    origin: "external" as const, status: "suggested" as const, evidence: [] }] } };
  assert.throws(() => validateSourceScout(output, covered, [url]));
  assert.throws(() => validateSourceScout(output, { ...input, identity: { ...input.identity, artist_name: null } }, [url]));
  assert.deepEqual(validateSourceScout({ readings: [], candidates: [], uncertainty: ["No supported lead."] }, input, []).candidates, []);
});

test("research allowance includes one paid search and rejects expensive or oversized inputs", () => {
  assert.ok(estimateScoutCeiling(8_000, 0.0000001, 0.0000005) > 0.01);
  assert.ok(estimateScoutCeiling(8_000, 0.0000001, 0.0000005) < 0.02);
  for (const [bytes, inputPrice, outputPrice] of [[32_001, 0, 0], [1, NaN, 0], [1, 0, Infinity],
    [1, -1, 0], [1, 0.00001, 0], [32_000, 0.0000003, 0.000002]]) assert.throws(() => estimateScoutCeiling(bytes, inputPrice, outputPrice));
});

test("the provider schema stays compact while server validation enforces vocabulary and URLs", () => {
  const schema = JSON.stringify(z.toJSONSchema(sourceScoutOutputSchema(input)));
  assert.ok(!schema.includes('"format":"uri"'));
  assert.ok(!schema.includes(tag));
  assert.throws(() => validateSourceScout({ ...output, candidates: [{ ...candidate, source_url: "not a URL" }] }, input, ["not a URL"]));

  const manyTags: ProposalInput = { ...input, vocabulary: Array.from({ length: 300 }, (_, index) => ({
    id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    label: `Mood ${index + 1}`, slug: `mood-${index + 1}`, kind: "mood",
  })) };
  const bytes = Buffer.byteLength(scoutSystem + scoutPrompt(manyTags) + JSON.stringify(z.toJSONSchema(sourceScoutOutputSchema(manyTags))));
  assert.ok(bytes <= 32_000, `expected compact scout input, received ${bytes} bytes`);
  assert.doesNotThrow(() => estimateScoutCeiling(bytes, 0.0000001, 0.0000005));
});
