import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getTrackRecommendationSeedLabel,
  selectTrackRecommendationGroups,
  type TrackRecommendationCandidate,
} from "./track-recommendation-ranking.ts";

function candidate(
  providerId: string,
  source: TrackRecommendationCandidate["source"],
  href = `/track/deezer/${providerId}`,
): TrackRecommendationCandidate {
  return {
    id: `${source}-${providerId}`,
    provider: "deezer",
    provider_id: providerId,
    type: "track",
    title: `Track ${providerId}`,
    artist_name: "Seed Artist",
    cover_url: null,
    deezer_url: null,
    href,
    reason: "Related lane, quieter profile.",
    source,
    sourceLabel: source === "editorial-fallback" ? "Curated" : "Related",
    score: 50,
  };
}

describe("track recommendation ranking", () => {
  it("uses the artist name as the Deezer seed label when available", () => {
    assert.equal(
      getTrackRecommendationSeedLabel({
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
        candidate("current", "related-seed"),
        candidate("same", "related-seed"),
      ],
      localSignalCandidates: [
        candidate("same", "local-signal", "/track/local-entity"),
        candidate("local-only", "local-signal", "/track/local-only"),
      ],
      editorialFallbackCandidates: [],
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

  it("uses editorial fallback when related candidates are empty", () => {
    const fallbackGroups = selectTrackRecommendationGroups({
      currentProviderId: "current",
      relatedCandidates: [],
      localSignalCandidates: [],
      editorialFallbackCandidates: [candidate("fallback", "editorial-fallback")],
      perGroupLimit: 6,
    });

    assert.equal(fallbackGroups.length, 1);
    assert.equal(fallbackGroups[0]?.id, "fallback");
    assert.deepEqual(
      fallbackGroups.flatMap((group) =>
        group.recommendations.map((track) => track.provider_id),
      ),
      ["fallback"],
    );

    const candidateGroups = selectTrackRecommendationGroups({
      currentProviderId: "current",
      relatedCandidates: [candidate("related", "related-seed")],
      localSignalCandidates: [],
      editorialFallbackCandidates: [candidate("fallback", "editorial-fallback")],
      perGroupLimit: 6,
    });

    assert.deepEqual(candidateGroups.map((group) => group.id), ["related"]);
    assert.deepEqual(
      candidateGroups.flatMap((group) => group.recommendations.map((track) => track.provider_id)),
      ["related"],
    );
  });
});
