import assert from "node:assert/strict";
import test from "node:test";
import { scoreAppleDeezerTrackMatch } from "./deezer-match";
import type { AppleMusicPlaylistTrack } from "./types";
import type { DeezerTrackResult } from "../deezer";

function appleTrack(
  overrides: Partial<AppleMusicPlaylistTrack> = {},
): AppleMusicPlaylistTrack {
  return {
    title: "Raver",
    artist: "Burial",
    album: "Untrue",
    durationMs: 299827,
    appleMusicUrl: "https://music.apple.com/pe/album/raver/893175779?i=893175801",
    appleMusicId: "893175801",
    artistAppleMusicId: "468355684",
    albumAppleMusicId: "893175779",
    position: 1,
    artwork: {
      url: null,
      templateUrl: null,
      width: null,
      height: null,
      bgColor: null,
      textColor1: null,
      textColor2: null,
    },
    ...overrides,
  };
}

function deezerTrack(overrides: Partial<DeezerTrackResult> = {}): DeezerTrackResult {
  return {
    provider: "deezer",
    provider_id: "123",
    type: "track",
    title: "Raver",
    artist_name: "Burial",
    artist_id: "468355684",
    artist_fan_count: 1000,
    cover_url: null,
    deezer_url: null,
    rank: 100000,
    ...overrides,
  };
}

test("scores exact title and artist matches as high confidence", () => {
  const result = scoreAppleDeezerTrackMatch(appleTrack(), deezerTrack());

  assert.equal(result.score, 1);
  assert.equal(result.titleScore, 1);
  assert.equal(result.artistScore, 1);
});

test("keeps version text from breaking otherwise clear matches", () => {
  const result = scoreAppleDeezerTrackMatch(
    appleTrack({ title: "Raver (Remastered)" }),
    deezerTrack({ title: "Raver" }),
  );

  assert.ok(result.score >= 0.95);
});

test("penalizes same title by a different artist", () => {
  const result = scoreAppleDeezerTrackMatch(
    appleTrack({ title: "Intro", artist: "The xx" }),
    deezerTrack({ title: "Intro", artist_name: "M83" }),
  );

  assert.ok(result.score < 0.8);
});
