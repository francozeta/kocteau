import assert from "node:assert/strict";
import test from "node:test";
import { readDiscoverySearchState } from "./search-state.ts";

const now = 1_800_000_000_000;
const snapshot = {
  account: "kocteau:discovery:v1:guest",
  path: "/search",
  savedAt: now,
  search: { query: "Slowdive", scope: "artist" },
};
const read = (
  value: unknown,
  time = now,
  account = snapshot.account,
  path = snapshot.path,
) => readDiscoverySearchState(value, time, account, path);

test("search drafts recover query and scope only for their account and history location", () => {
  assert.deepEqual(read(snapshot), snapshot.search);
  assert.equal(read(snapshot, now, "another-account"), null);
  assert.equal(read(snapshot, now, snapshot.account, "/search?q=other"), null);
});

test("search drafts reject expiry, future timestamps and malformed or oversized input", () => {
  assert.equal(read(snapshot, now + 9 * 3600_000), null);
  assert.equal(read(snapshot, now - 1), null);
  assert.equal(
    read({ ...snapshot, search: { query: "x".repeat(81), scope: "all" } }),
    null,
  );
  assert.equal(
    read({ ...snapshot, search: { query: "Slowdive", scope: "unknown" } }),
    null,
  );
  assert.equal(read(null), null);
  assert.equal(read("broken"), null);
});
