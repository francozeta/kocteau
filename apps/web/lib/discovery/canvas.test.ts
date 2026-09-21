import assert from "node:assert/strict";
import test from "node:test";
import {
  createCanvasFrame,
  evaluateCandidate,
  expandCanvasFrame,
  focusCanvasNode,
  rankDiscoveryCandidates,
  recordDiscoveryVisit,
  seedKey,
  PATH_LIMIT,
  type CanvasSession,
  type DiscoveryCandidate,
} from "./canvas.ts";
import {
  discoveryMemoryKey,
  parseCanvasSnapshot,
  readCanvasSession,
  readDiscoveryMemory,
} from "./memory.ts";
import type { DiscoverySeed } from "./seed.ts";

const now = 1_800_000_000_000;
function seed(id: number, artist = `Artist ${id}`): DiscoverySeed {
  return {
    id: String(id),
    entityId: null,
    provider_id: String(id),
    type: "track",
    title: `Track ${id}`,
    artist_name: artist,
    artist_provider_id: null,
    cover_url: `https://example.com/${id}.jpg`,
  };
}
function candidate(
  id: number,
  artist?: string,
  lane: DiscoveryCandidate["lane"] = "nearby",
): DiscoveryCandidate {
  return {
    seed: seed(id, artist),
    lane,
    reason: "Catalog connection",
    score: 5,
  };
}
function session(): CanvasSession {
  return {
    frames: [createCanvasFrame([seed(1), seed(2)], null, "origin")],
    cursor: 0,
  };
}

test("focusing a cover preserves the previous frame and opens a branch", () => {
  const original = session();
  const next = focusCanvasNode(original, seed(1), "a");
  assert.equal(next.frames[next.cursor].focus?.provider_id, "1");
  assert.equal(next.frames[next.cursor].depth, 0);
  assert.deepEqual(next.frames[0], original.frames[0]);
  assert.equal(focusCanvasNode(next, seed(1), "ignored"), next);
});

test("late candidates cannot replace another branch; expansion is idempotent", () => {
  const current = focusCanvasNode(session(), seed(1), "a");
  assert.equal(
    expandCanvasFrame(current, "stale", [candidate(3)], [], now),
    current,
  );
  const expanded = expandCanvasFrame(current, "a", [candidate(3)], [], now);
  assert.deepEqual(
    expandCanvasFrame(expanded, "a", [candidate(3)], [], now),
    expanded,
  );
  assert.equal(
    expanded.frames[1].nodes.find((node) => node.seed.provider_id === "3")
      ?.from,
    seedKey(seed(1)),
  );
});

test("backtracking retains its snapshot and branching discards forward frames", () => {
  const a = focusCanvasNode(session(), seed(1), "a");
  const b = focusCanvasNode(a, seed(2), "b");
  const branched = focusCanvasNode({ ...b, cursor: 1 }, seed(3), "c");
  assert.deepEqual(
    branched.frames.map((frame) => frame.id),
    ["origin", "a", "c"],
  );
  assert.equal(branched.frames[1], a.frames[1]);
});

test("candidate ranking retains lateral lanes and limits repeated artists and covers", () => {
  const candidates = [
    candidate(2, "Same"),
    candidate(3, "Same"),
    candidate(4, "Same"),
    candidate(5, "Unfamiliar", "left-field"),
    candidate(6, "Different", "deep-cut"),
    candidate(1),
  ];
  const ranked = rankDiscoveryCandidates(seed(1), candidates, [], now);
  assert.equal(
    ranked.filter((item) => item.seed.artist_name === "Same").length,
    2,
  );
  assert.equal(ranked[1].lane, "left-field");
  assert(!ranked.some((item) => item.seed.provider_id === "1"));
});

test("opening an artist changes ranking without requiring reviews or penalizing ignored covers", () => {
  const memory = recordDiscoveryVisit([], seed(50, "Familiar"), now);
  const familiar = candidate(3, "Familiar");
  const other = candidate(2, "Unfamiliar");
  assert.equal(
    rankDiscoveryCandidates(seed(1), [other, familiar], [], now)[0].seed
      .provider_id,
    "2",
  );
  assert.equal(
    rankDiscoveryCandidates(seed(1), [other, familiar], memory, now)[0].seed
      .provider_id,
    "3",
  );
  assert.equal(
    evaluateCandidate({
      seed: seed(1),
      candidate: other,
      context: { memory, now },
    }),
    evaluateCandidate({
      seed: seed(1),
      candidate: other,
      context: { memory: [], now },
    }),
  );
  const visited = recordDiscoveryVisit(memory, familiar.seed, now);
  assert(
    evaluateCandidate({
      seed: seed(1),
      candidate: familiar,
      context: { memory: visited, now },
    }) <
      evaluateCandidate({
        seed: seed(1),
        candidate: familiar,
        context: { memory, now },
      }),
  );
});

test("session and taste memory stay bounded", () => {
  let current = session();
  let memory = recordDiscoveryVisit([], seed(1), now);
  for (let id = 2; id <= 100; id++) {
    current = focusCanvasNode(current, seed(id), String(id));
    memory = recordDiscoveryVisit(memory, seed(id), now);
  }
  assert.equal(current.frames.length, PATH_LIMIT);
  assert.equal(memory.length, 80);
});

test("storage rejects corruption and expired sessions and separates accounts", () => {
  const snapshot = { savedAt: now, scope: "account-a", session: session() };
  assert.deepEqual(parseCanvasSnapshot(snapshot, now, "account-a"), session());
  assert.equal(parseCanvasSnapshot(snapshot, now, "account-b"), null);
  assert.equal(parseCanvasSnapshot(snapshot, now + 9 * 3600_000, "account-a"), null);
  assert.notEqual(discoveryMemoryKey("a"), discoveryMemoryKey("b"));
  assert.notEqual(discoveryMemoryKey(null), discoveryMemoryKey("a"));
  assert.equal(readCanvasSession("broken", now), null);
  assert.equal(
    readCanvasSession(
      JSON.stringify({ savedAt: now - 9 * 3600_000, session: session() }),
      now,
    ),
    null,
  );
  assert.equal(
    readCanvasSession(
      JSON.stringify({ savedAt: now, session: { ...session(), cursor: 500 } }),
      now,
    ),
    null,
  );
  assert.deepEqual(
    readCanvasSession(
      JSON.stringify({ savedAt: now, session: session() }),
      now,
    ),
    session(),
  );
  assert.deepEqual(
    readDiscoveryMemory(
      JSON.stringify([{ key: "x", artist: "x", count: 2, lastOpened: 0 }]),
      now,
    ),
    [],
  );
});
