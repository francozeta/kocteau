import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Search interface exploration preserves the production renderer byte for byte", () => {
  // Production/main 8587fea. Changing this pin requires a separate spatial review.
  const source = readFileSync(new URL("./image-sphere.ts", import.meta.url));
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    "96903a431f59b379207de9ef6c22d2e6494c6b7670f5e8b50accec98a961ce67",
  );
});
