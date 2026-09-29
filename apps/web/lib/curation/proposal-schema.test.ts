import assert from "node:assert/strict";
import test from "node:test";
import { estimateProposalCeiling, validateProposal, type ProposalInput } from "./proposal-schema";

const tag = "10000000-0000-4000-8000-000000000001";
const observation = "20000000-0000-4000-8000-000000000001";
const otherObservation = "20000000-0000-4000-8000-000000000002";
const input: ProposalInput = {
  identity: { id: "entity", provider_id: "1", title: "Track", artist_name: "Artist" },
  deterministic: {
    schemaVersion: 1, rulesVersion: "catalog-signals-v1",
    identity: { provider: "deezer", providerId: "1", type: "track", title: "Track", artistName: "Artist" },
    signals: [{ tagId: tag, kind: "genre", origin: "external", status: "suggested",
      evidence: [{ observationId: observation, field: "prominent_tags", value: "dream pop" }] }],
  },
  vocabulary: [{ id: tag, kind: "genre", label: "Dream pop", slug: "dream-pop" }],
  evidence: [
    { id: observation, source: "musicbrainz", source_entity_type: "recording", source_entity_id: observation,
      status: "resolved", facts: { prominent_tags: ["dream pop"] }, retrieved_at: "2026-09-28T00:00:00Z" },
    { id: otherObservation, source: "deezer", source_entity_type: "track", source_entity_id: "1",
      status: "resolved", facts: { release_date: "1991-01-01" }, retrieved_at: "2026-09-28T00:00:00Z" },
  ],
};
const result = { insights: [{ tag_id: tag, evidence_ids: [observation], rationale: "The matched recording lists dream pop." }], uncertainty: [] };

test("context may explain only existing source-backed signals", () => {
  assert.deepEqual(validateProposal(result, input), result);
  assert.deepEqual(validateProposal({ insights: [], uncertainty: ["No further context."] }, input).insights, []);
});

test("new tags, unrelated sources, duplicates and approval fields are rejected", () => {
  const insight = result.insights[0];
  for (const insights of [
    [{ ...insight, tag_id: "30000000-0000-4000-8000-000000000001" }],
    [{ ...insight, evidence_ids: [otherObservation] }],
    [{ ...insight, evidence_ids: [observation, observation] }],
    [insight, insight],
    [{ ...insight, approved: true }],
  ]) assert.throws(() => validateProposal({ ...result, insights }, input));
  assert.throws(() => validateProposal(result, { ...input, evidence: [{ ...input.evidence[0], status: "failed" }] }));
});

test("oversized inputs, unknown prices and expensive models fail before inference", () => {
  assert.ok(estimateProposalCeiling(12_000, 0.0000001, 0.0000004) < 0.02);
  for (const [bytes, inputPrice, outputPrice] of [
    [32_001, 0, 0], [100, NaN, 0], [100, 0, Infinity], [100, -1, 0],
    [100, 0.00001, 0], [100, 0, 0.00001],
  ]) assert.throws(() => estimateProposalCeiling(bytes, inputPrice, outputPrice));
});
