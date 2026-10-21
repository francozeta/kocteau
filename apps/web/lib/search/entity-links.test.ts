import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attachEntityIds } from "./entity-links.ts";

describe("catalog entity links", () => {
  it("keeps existing identities without a database lookup", async () => {
    let calls = 0;
    const input = [{ provider_id: "12", entity_id: "canonical-12" }];
    const results = await attachEntityIds(input, async () => {
      calls += 1;
      return new Map();
    });
    assert.deepEqual(results, input);
    assert.equal(calls, 0);
  });

  it("reuses a canonical result for an unlinked starter with the same identity", async () => {
    let calls = 0;
    const results = await attachEntityIds([
      { provider_id: "12", entity_id: "canonical-12", source: "local" },
      { provider_id: "12", source: "starter" },
    ], async () => {
      calls += 1;
      return new Map();
    });
    assert.equal(calls, 0);
    assert.deepEqual(results.map((result) => result.entity_id), ["canonical-12", "canonical-12"]);
  });

  it("looks up only sorted, distinct identities that are still unresolved", async () => {
    const requests: string[][] = [];
    const results = await attachEntityIds([
      { provider_id: "12", entity_id: "canonical-12" },
      { provider_id: "30" },
      { provider_id: "20" },
      { provider_id: "30" },
    ], async (ids) => {
      requests.push(ids);
      return new Map([["20", "canonical-20"], ["30", "canonical-30"]]);
    });
    assert.deepEqual(requests, [["20", "30"]]);
    assert.deepEqual(results.map((result) => result.entity_id),
      ["canonical-12", "canonical-30", "canonical-20", "canonical-30"]);
  });

  it("retains known links and candidates when the shared lookup fails", async (t) => {
    const warn = t.mock.method(console, "warn", () => {});
    const results = await attachEntityIds([
      { provider_id: "12", entity_id: "canonical-12" },
      { provider_id: "12" },
      { provider_id: "99" },
    ], async () => { throw new Error("database unavailable"); });
    assert.equal(results.length, 3);
    assert.deepEqual(results.map((result) => result.entity_id), ["canonical-12", "canonical-12", null]);
    assert.equal(warn.mock.callCount(), 1);
  });

  it("does not query the database for an empty candidate set", async () => {
    let calls = 0;
    const results = await attachEntityIds([], async () => {
      calls += 1;
      return new Map();
    });
    assert.deepEqual(results, []);
    assert.equal(calls, 0);
  });
});
