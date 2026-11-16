import assert from "node:assert/strict";
import test from "node:test";
import { rankDiscoveryCandidates, seedKey } from "./canvas";
import { createDiscoveryLabSnapshot, type DiscoveryLabPool } from "./lab-snapshot";
import { rankMmr } from "./mmr";
import type { DiscoverySeed } from "./seed";

const seed: DiscoverySeed = {
  id: "deezer:track:123", entityId: null, provider_id: "123", type: "track",
  title: "Fixture seed", artist_name: "Fixture artist", artist_provider_id: "9",
  cover_url: "https://example.invalid/seed.jpg",
};
function pool(partial = false): DiscoveryLabPool {
  return {
    seedProviderId: "123", variation: 3, partial,
    groups: [{
      id: "nearby", label: "Nearby", shortLabel: "Nearby", description: "Fixture group",
      recommendations: Array.from({ length: 8 }, (_, index) => ({
        id: `deezer-discovery:${200 + index}`, provider: "deezer", provider_id: String(200 + index),
        type: "track", title: `Fixture ${index}`, artist_name: `Artist ${index}`,
        artist_provider_id: String(10 + index), cover_url: `https://example.invalid/${index}.jpg`,
        deezer_url: null, href: `/track/deezer/${200 + index}`, reason: "Fixture evidence",
        source: "deezer-related", sourceLabel: "Nearby", score: 60 + index,
      })),
    }],
  };
}

test("one frozen public snapshot provides replayable identical inputs to every method", () => {
  const source = pool(true);
  const snapshot = createDiscoveryLabSnapshot(seed, source, 1_700_000_000_000, 3);
  const encoded = JSON.stringify(snapshot);
  source.groups[0].recommendations[0].title = "Changed after capture";
  assert.equal(JSON.stringify(snapshot), encoded);
  assert.equal(snapshot.partial, true);
  assert.deepEqual(snapshot.input.memory, []);
  assert.deepEqual(snapshot.input.features, {});
  assert.equal(Object.isFrozen(snapshot.input.candidates[0].seed), true);
  const replay = JSON.parse(encoded).input;
  const keys = (items: ReturnType<typeof rankMmr>) => items.map((item) => seedKey(item.seed));
  for (const input of [snapshot.input, replay]) {
    assert.deepEqual(keys(rankMmr(input)), keys(rankMmr(snapshot.input)));
    assert.deepEqual(keys(rankMmr(input, { lambda: 1 })), keys(rankMmr(snapshot.input, { lambda: 1 })));
    assert.deepEqual(
      keys(rankDiscoveryCandidates(input.seed, [...input.candidates], [...input.memory], input.now, input.variation)),
      keys(rankDiscoveryCandidates(snapshot.input.seed, [...snapshot.input.candidates], [], snapshot.input.now, snapshot.input.variation)),
    );
  }
});

test("mismatched seed/variation cannot be labelled as a valid comparison", () => {
  assert.throws(() => createDiscoveryLabSnapshot(seed, { ...pool(), seedProviderId: "999" }, 1, 3), /did not match/);
  assert.throws(() => createDiscoveryLabSnapshot(seed, pool(), 1, 4), /did not match/);
  assert.throws(() => createDiscoveryLabSnapshot(seed, pool(), NaN, 3), /invalid/);
  assert.throws(() => createDiscoveryLabSnapshot(seed, { ...pool(), variation: 16 }, 1, 16), /invalid/);
});

test("an empty or partial pool remains honest rather than falling back to Starter", () => {
  const snapshot = createDiscoveryLabSnapshot(seed, { ...pool(true), groups: [] }, 1, 3);
  assert.equal(snapshot.partial, true);
  assert.deepEqual(snapshot.input.candidates, []);
  assert.deepEqual(rankMmr(snapshot.input), []);
  assert.deepEqual(rankDiscoveryCandidates(seed, [], [], snapshot.input.now, snapshot.input.variation), []);
});
