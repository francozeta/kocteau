import assert from "node:assert/strict";
import test from "node:test";
import { studioModelConfig } from "./model-config";

test("a direct key selects the research model without depending on an expired gateway session", () => {
  assert.deepEqual(studioModelConfig({ OPENAI_KEY: "test-key", VERCEL_OIDC_TOKEN: "old-session", STUDIO_PROPOSAL_MODEL: "google/gemini-2.5-flash-lite" }),
    { provider: "openai", model: "gpt-6-luna", available: true });
});

test("explicit routing and the kill switch do not silently fall back", () => {
  assert.equal(studioModelConfig({ VERCEL_OIDC_TOKEN: "test-token", STUDIO_AI_PROVIDER: "gateway" })?.available, true);
  assert.equal(studioModelConfig({ OPENAI_API_KEY: "test-key", STUDIO_AI_PROVIDER: "gateway" })?.available, false);
  assert.equal(studioModelConfig({ AI_GATEWAY_API_KEY: "test-key", STUDIO_AI_PROVIDER: "openai" })?.available, false);
  assert.equal(studioModelConfig({ OPENAI_KEY: "test-key", STUDIO_PROPOSALS_ENABLED: "0" })?.available, false);
  assert.equal(studioModelConfig({ STUDIO_AI_PROVIDER: "invalid" }), null);
});
