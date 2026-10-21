import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isStrongArtistSearchMatch,
  rankCatalogSearchResults,
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

  it("merges local and remote artist records with the same metadata", () => {
    const results = rankKocteauTrackSearchResults({
      query: "Radiohead",
      candidates: [
        candidate("artist-local", {
          type: "artist",
          title: "Radiohead",
          artist_name: null,
          entity_id: "local-artist",
          source: "local",
        }),
        candidate("artist-deezer", {
          type: "artist",
          title: " radiohead ",
          artist_name: null,
          source: "deezer",
        }),
      ],
    });

    assert.equal(results.length, 1);
    assert.equal(results[0]?.entity_id, "local-artist");
  });

  it("detects exact and partial artist intent without matching loose substrings", () => {
    assert.equal(isStrongArtistSearchMatch("The Cure", "The Cure"), true);
    assert.equal(isStrongArtistSearchMatch("cocteau tw", "Cocteau Twins"), true);
    assert.equal(isStrongArtistSearchMatch("cure", "The Cure"), false);
  });
});


describe("progressive catalog search", () => {
  it("keeps local results usable when the remote phase has no results", () => {
    const local = candidate("local", { source: "local", entity_id: "entity", title: "Radiohead" });
    const results = rankCatalogSearchResults({ query: "Radiohead", type: "all", candidates: [local] });
    assert.equal(results[0]?.entity_id, "entity");
    assert.equal(results[0]?.source_label, "Kocteau");
  });

  it("merges independently completed phases without losing local identity or remote metadata", () => {
    const local = candidate("123", { source: "local", entity_id: "local-id", title: "Radiohead", rank: null });
    const remote = candidate("123", { title: "Radiohead", album_provider_id: "album-1", rank: 500000 });
    const results = rankCatalogSearchResults({ query: "Radiohead", type: "track", candidates: [remote, local] });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.source, "local");
    assert.equal(results[0]?.entity_id, "local-id");
    assert.equal(results[0]?.album_provider_id, "album-1");
    assert.equal(results[0]?.rank, 500000);
  });

  it("preserves all-scope quotas and grouping after phase merging", () => {
    const candidates = (["artist", "album", "track"] as const).flatMap((type) =>
      Array.from({ length: 12 }, (_, index) =>
        candidate(type + index, { type, title: "Radiohead " + index }),
      ),
    );
    const results = rankCatalogSearchResults({ query: "Radiohead", type: "all", candidates });
    assert.deepEqual(results.map((result) => result.type), [
      ...Array(3).fill("artist"), ...Array(4).fill("album"), ...Array(8).fill("track"),
    ]);
  });

  it("does not let an early phase quota discard a later enriched match", () => {
    const local = Array.from({ length: 30 }, (_, index) =>
      candidate(String(index), { source: "starter", title: "Track", source_index: index }),
    );
    const remote = candidate("29", { title: "Track", entity_id: "existing", rank: 900000 });
    const merged = rankCatalogSearchResults({ query: "Track", type: "track", candidates: [...local, remote] });
    assert.equal(merged.length, 28);
    assert.equal(merged[0]?.provider_id, "29");
    assert.equal(merged[0]?.entity_id, "existing");
  });

  it("keeps identical provider IDs distinct across entity types", () => {
    const results = rankCatalogSearchResults({
      query: "Music",
      type: "all",
      candidates: [
        candidate("1", { type: "artist", title: "Music" }),
        candidate("1", { type: "album", title: "Music" }),
        candidate("1", { type: "track", title: "Music" }),
      ],
    });
    assert.equal(results.length, 3);
  });
});
