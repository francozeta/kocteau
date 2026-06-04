import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isStrongArtistSearchMatch,
  rankKocteauTrackSearchResults,
  type KocteauTrackSearchCandidate,
} from "./kocteau-first.ts";

function candidate(
  providerId: string,
  overrides: Partial<KocteauTrackSearchCandidate> = {},
): KocteauTrackSearchCandidate {
  return {
    provider: "deezer",
    provider_id: providerId,
    type: "track",
    title: `Track ${providerId}`,
    artist_name: "Unknown Artist",
    cover_url: null,
    deezer_url: null,
    source: "deezer",
    source_index: 0,
    rank: 100,
    ...overrides,
  };
}

describe("kocteau-first search ranking", () => {
  it("prefers exact artist matches over unrelated exact title matches", () => {
    const results = rankKocteauTrackSearchResults({
      query: "The Cure",
      candidates: [
        candidate("olivia", {
          title: "the cure",
          artist_name: "Olivia Rodrigo",
          source: "deezer",
          rank: 900_000,
          source_index: 0,
        }),
        candidate("cure-1", {
          title: "Pictures of You",
          artist_name: "The Cure",
          source: "artist-match",
          rank: 300_000,
          source_index: 1,
        }),
      ],
    });

    assert.equal(results[0]?.provider_id, "cure-1");
    assert.equal(results[0]?.source_label, "Artist match");
  });

  it("deduplicates results and prefers Kocteau local links", () => {
    const results = rankKocteauTrackSearchResults({
      query: "Jamais Pars",
      candidates: [
        candidate("123", {
          title: "Jamais Pars",
          artist_name: "black tape for a blue girl",
          source: "deezer",
        }),
        candidate("123", {
          title: "Jamais Pars",
          artist_name: "black tape for a blue girl",
          entity_id: "local-entity",
          source: "local",
        }),
      ],
    });

    assert.equal(results.length, 1);
    assert.equal(results[0]?.entity_id, "local-entity");
    assert.equal(results[0]?.source_label, "Kocteau");
  });

  it("detects exact and partial artist intent without matching loose substrings", () => {
    assert.equal(isStrongArtistSearchMatch("The Cure", "The Cure"), true);
    assert.equal(isStrongArtistSearchMatch("cocteau tw", "Cocteau Twins"), true);
    assert.equal(isStrongArtistSearchMatch("cure", "The Cure"), false);
  });
});
