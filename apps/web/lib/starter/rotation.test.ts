import assert from "node:assert/strict";
import test from "node:test";
import {
  createStarterRotationSeed,
  rotateStarterTracks,
} from "./rotation.ts";

const tracks = [
  { id: "starter-1", provider_id: "1001", title: "One" },
  { id: "starter-2", provider_id: "1002", title: "Two" },
  { id: "starter-3", provider_id: "1003", title: "Three" },
  { id: "starter-4", provider_id: "1004", title: "Four" },
  { id: "starter-5", provider_id: "1005", title: "Five" },
  { id: "starter-6", provider_id: "1006", title: "Six" },
];

test("starter track rotation is stable for the same seed", () => {
  const first = rotateStarterTracks(tracks, "2026-06-03:4");
  const second = rotateStarterTracks(tracks, "2026-06-03:4");

  assert.deepEqual(first.map((track) => track.id), second.map((track) => track.id));
});

test("starter track rotation does not mutate the source list", () => {
  const source = [...tracks];

  rotateStarterTracks(source, "2026-06-03:4");

  assert.deepEqual(source.map((track) => track.id), tracks.map((track) => track.id));
});

test("starter rotation seed changes every three UTC hours", () => {
  assert.equal(
    createStarterRotationSeed(new Date("2026-06-03T05:59:00Z")),
    "2026-06-03:1",
  );
  assert.equal(
    createStarterRotationSeed(new Date("2026-06-03T06:00:00Z")),
    "2026-06-03:2",
  );
});
