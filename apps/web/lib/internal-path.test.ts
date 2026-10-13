import assert from "node:assert/strict";
import test from "node:test";
import { appendInternalNext, safeInternalPath } from "./internal-path";

test("internal return paths preserve queries and fragments", () => {
  for (const path of ["/", "/feed?compose=1&draft=review", "/search?q=sea#results"]) {
    assert.equal(safeInternalPath(path), path);
    assert.equal(new URL(path, "https://kocteau.local").origin, "https://kocteau.local");
  }
  assert.equal(
    appendInternalNext("/onboarding", "/feed?compose=1&draft=review"),
    "/onboarding?next=%2Ffeed%3Fcompose%3D1%26draft%3Dreview",
  );
});

test("internal return paths reject external and browser-normalized redirects", () => {
  for (const path of [
    null, undefined, "", "feed", "https://example.com", "//example.com",
    "/\\example.com", "/\t/example.com", "/\n/example.com", "/.//example.com",
  ]) {
    assert.equal(safeInternalPath(path), null, String(path));
    assert.equal(appendInternalNext("/login", path), "/login");
  }
});
