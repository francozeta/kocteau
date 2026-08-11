import assert from "node:assert/strict";
import test from "node:test";
import { curatorApplicationSchema } from "./validation/schemas";

const validApplication = {
  taste_focus: "Independent ambient and experimental music from Latin America.",
  motivation: "I want to connect overlooked regional releases with listeners who value context.",
  sample_links: ["https://kocteau.example/review"],
  availability: "weekly",
};

test("accepts a focused curator application", () => {
  assert.equal(curatorApplicationSchema.safeParse(validApplication).success, true);
});

test("rejects non-http work sample links", () => {
  const result = curatorApplicationSchema.safeParse({
    ...validApplication,
    sample_links: ["javascript:alert(1)"],
  });

  assert.equal(result.success, false);
});

test("deduplicates work sample links", () => {
  const result = curatorApplicationSchema.parse({
    ...validApplication,
    sample_links: [
      "https://kocteau.example/review",
      "https://kocteau.example/review",
    ],
  });

  assert.deepEqual(result.sample_links, ["https://kocteau.example/review"]);
});
