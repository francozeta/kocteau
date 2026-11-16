import assert from "node:assert/strict";
import test from "node:test";
import { discoveryCandidateRequest } from "./candidate-request.ts";
import type { DiscoverySeed } from "./seed.ts";

const seed: DiscoverySeed = {
  id: "source-1", entityId: null, provider_id: "123", type: "track",
  title: "Song", artist_name: "Artist", artist_provider_id: "45", cover_url: null,
};

test("candidate requests share keys across labels and local catalog identities", () => {
  const original = discoveryCandidateRequest(seed, "fast", 7);
  const renamed = discoveryCandidateRequest({
    ...seed, title: "Another label", artist_name: "Another artist label",
    entityId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", artist_provider_id: "99",
  }, "fast", 7);
  assert.deepEqual(renamed, original);
  assert.equal(original.url, "/api/discovery/map?providerId=123&seedType=track&lane=fast&variation=7");
});

test("album fallback identity is represented in both the request and Query key", () => {
  const album = { ...seed, type: "album" as const };
  const original = discoveryCandidateRequest(album, "deep", 2);
  const alternate = discoveryCandidateRequest({ ...album, artist_provider_id: "99" }, "deep", 2);
  assert.notDeepEqual(alternate.queryKey, original.queryKey);
  assert.notEqual(alternate.url, original.url);
  assert.match(original.url, /artistProviderId=45/);
  assert.notDeepEqual(original.queryKey, discoveryCandidateRequest(album, "fast", 2).queryKey);
  assert.notDeepEqual(original.queryKey, discoveryCandidateRequest(album, "deep", 3).queryKey);
});
