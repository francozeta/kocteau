import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getTrackRecommendationQueryLabel,
  selectTrackRecommendationGroups,
  type TrackRecommendationCandidate,
} from "./track-recommendation-ranking.ts";

function candidate(
  providerId: string,
  source: TrackRecommendationCandidate["source"],
  href = `/track/deezer/${providerId}`,
  artistName = "Nearby Artist",
  score = 50,
): TrackRecommendationCandidate {
  return {
    id: `${source}-${providerId}`,
    provider: "deezer",
    provider_id: providerId,
    type: "track",
    title: `Track ${providerId}`,
    artist_name: artistName,
    cover_url: null,
    deezer_url: null,
    href,
    reason: "Related lane, quieter profile.",
    source,
    sourceLabel:
      source === "local-signal"
        ? "Kocteau signal"
        : source === "deezer-deep-cut"
          ? "Deep cut"
          : "Nearby",
    score,
  };
}

describe("track recommendation ranking", () => {
  it("uses the artist name as the Deezer query label when available", () => {
    assert.equal(
      getTrackRecommendationQueryLabel({
        title: "The Cure",
        artistName: "Olivia Rodrigo",
      }),
      "Olivia Rodrigo",
    );
  });

  it("excludes the current track and prefers local Kocteau links for duplicates", () => {
    const groups = selectTrackRecommendationGroups({
      currentProviderId: "current",
      relatedCandidates: [
        candidate("current", "deezer-related"),
        candidate("same", "deezer-related"),
      ],
      localSignalCandidates: [
        candidate("same", "local-signal", "/track/local-entity"),
        candidate("local-only", "local-signal", "/track/local-only"),
      ],
      perGroupLimit: 6,
    });

    assert.deepEqual(
      groups[0]?.recommendations.map((track) => [track.provider_id, track.href]),
      [
        ["same", "/track/local-entity"],
        ["local-only", "/track/local-only"],
      ],
    );
  });

  it("does not fill track recommendations with editorial fallbacks", () => {
    const groups = selectTrackRecommendationGroups({
      currentProviderId: "current",
      relatedCandidates: [],
      localSignalCandidates: [],
      perGroupLimit: 6,
    });

    assert.deepEqual(groups, []);
  });

  it("keeps related candidates diverse before filling repeated artists", () => {
    const groups = selectTrackRecommendationGroups({
      currentProviderId: "current",
      relatedCandidates: [
        candidate("same-1", "deezer-related", "/track/deezer/same-1", "Same Artist", 100),
        candidate("same-2", "deezer-related", "/track/deezer/same-2", "Same Artist", 95),
        candidate("same-3", "deezer-related", "/track/deezer/same-3", "Same Artist", 90),
        candidate("other-1", "deezer-related", "/track/deezer/other-1", "Other Artist", 70),
      ],
      localSignalCandidates: [],
      perGroupLimit: 3,
    });

    assert.deepEqual(
      groups
        .find((group) => group.id === "nearby")
        ?.recommendations.map((track) => track.provider_id),
      ["same-1", "same-2", "other-1"],
    );
  });

  it("keeps same-catalog deep cuts in their own route", () => {
    const groups = selectTrackRecommendationGroups({
      currentProviderId: "current",
      relatedCandidates: [candidate("nearby", "deezer-related")],
      localSignalCandidates: [],
      deepCutCandidates: [candidate("album-cut", "deezer-deep-cut")],
      perGroupLimit: 2,
    });

    assert.equal(
      groups.find((group) => group.id === "deep-cut")?.recommendations[0]?.provider_id,
      "album-cut",
    );
    assert.equal(
      groups.find((group) => group.id === "nearby")?.recommendations[0]?.provider_id,
      "nearby",
    );
  });
});
