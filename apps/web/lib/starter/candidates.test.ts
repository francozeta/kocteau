import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildStarterCandidateTracks,
  getStarterCandidateTier,
} from "./candidates.ts";

const baseTrack = {
  provider: "deezer" as const,
  provider_id: "track-1",
  type: "track" as const,
  title: "Sea Signal",
  artist_name: "Low Tide",
  cover_url: "https://example.com/cover.jpg",
  deezer_url: "https://www.deezer.com/track/1",
  rank: 180_000,
  artist_id: "artist-1",
  artist_fan_count: 12_000,
};

describe("starter candidate helpers", () => {
  it("filters obvious mainstream tracks from related seed mode", () => {
    const candidates = buildStarterCandidateTracks({
      source: "related-seed",
      seedLabel: "Cocteau Twins",
      tracks: [
        baseTrack,
        {
          ...baseTrack,
          provider_id: "track-2",
          title: "Arena Single",
          artist_name: "Chart Giant",
          rank: 940_000,
          artist_fan_count: 2_300_000,
        },
      ],
      existingProviderIds: new Set(),
    });

    assert.deepEqual(
      candidates.map((candidate) => candidate.provider_id),
      ["track-1"],
    );
    assert.equal(candidates[0]?.tier, "emerging");
    assert.match(candidates[0]?.reason ?? "", /related to Cocteau Twins/i);
  });

  it("allows famous artists when the track is framed as a deep cut", () => {
    const candidates = buildStarterCandidateTracks({
      source: "deep-cut",
      seedLabel: "Michael Jackson",
      tracks: [
        {
          ...baseTrack,
          provider_id: "track-3",
          title: "Quiet Album Track",
          artist_name: "Michael Jackson",
          rank: 145_000,
          artist_fan_count: 5_000_000,
        },
      ],
      existingProviderIds: new Set(),
    });

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]?.tier, "deep-cut");
    assert.equal(candidates[0]?.source_label, "Deep cut");
    assert.match(candidates[0]?.reason ?? "", /less obvious/i);
  });

  it("deduplicates candidates and excludes active starter picks", () => {
    const candidates = buildStarterCandidateTracks({
      source: "related-seed",
      seedLabel: "Slowdive",
      tracks: [
        baseTrack,
        { ...baseTrack, provider_id: "track-1", title: "Duplicate" },
        { ...baseTrack, provider_id: "track-4", title: "Already Curated" },
      ],
      existingProviderIds: new Set(["track-4"]),
    });

    assert.deepEqual(
      candidates.map((candidate) => candidate.provider_id),
      ["track-1"],
    );
  });

  it("uses Deezer rank and artist fan count to describe the candidate tier", () => {
    assert.equal(
      getStarterCandidateTier({ rank: 85_000, artist_fan_count: 4_000 }),
      "emerging",
    );
    assert.equal(
      getStarterCandidateTier({ rank: 390_000, artist_fan_count: 120_000 }),
      "undercovered",
    );
    assert.equal(
      getStarterCandidateTier({ rank: 950_000, artist_fan_count: 3_000_000 }),
      "obvious",
    );
  });
});
