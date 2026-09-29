import assert from "node:assert/strict";
import test from "node:test";
import { clearSignalSelection, createSignalSelection, selectedSignalIds, toggleSignal } from "./signal-selection";
import type { CatalogSignalProposal } from "./signal-proposals";

const proposal: CatalogSignalProposal = {
  schemaVersion: 1, rulesVersion: "catalog-signals-v1",
  identity: { provider: "deezer", providerId: "1", type: "track", title: "Track", artistName: "Artist" },
  signals: ["genre", "era"].map((tagId) => ({ tagId, kind: "genre", origin: "external", status: "suggested", evidence: [] })),
};
test("a new or untagged pick receives proposals without an Apply action", () => {
  assert.deepEqual([...selectedSignalIds(createSignalSelection(), proposal)], ["genre", "era"]);
});
test("existing curation stays authoritative on reopening", () => {
  assert.deepEqual([...selectedSignalIds(createSignalSelection(["human"]), proposal)], ["human"]);
});
test("late proposals retain manual additions; removed suggestions stay removed on retry", () => {
  const manual = toggleSignal(createSignalSelection(), "human", new Set());
  const selected = selectedSignalIds(manual, proposal);
  assert.deepEqual([...selected], ["human", "genre", "era"]);
  const corrected = toggleSignal(manual, "genre", selected);
  assert.deepEqual([...selectedSignalIds(corrected, structuredClone(proposal))], ["human", "era"]);
});
test("Clear remains empty when research finishes; another draft starts fresh", () => {
  assert.deepEqual([...selectedSignalIds(clearSignalSelection(), proposal)], []);
  assert.deepEqual([...selectedSignalIds(createSignalSelection(), proposal)], ["genre", "era"]);
});
test("manual choices take precedence at the twelve-signal limit", () => {
  const draft = { ...createSignalSelection(), chosen: Array.from({ length: 11 }, (_, index) => String(index)) };
  assert.equal(selectedSignalIds(draft, proposal).size, 12);
});
