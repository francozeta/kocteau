import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getDiscoveryEntityPath, matchDiscoverySessionToPath } from "./navigation.ts";
import type { CanvasSession } from "./canvas.ts";
import { getDiscoverySeedPath } from "./seed.ts";

describe("discovery entity navigation", () => {
  it("gives each focused entity a stable discovery route", () => {
    assert.equal(
      getDiscoverySeedPath({
        provider_id: "6641748",
        title: "Love Is",
        type: "track",
      }),
      "/search/track/love-is/6641748",
    );

    assert.equal(
      getDiscoverySeedPath({
        provider_id: "302127",
        title: "Cocteau Twins",
        type: "artist",
      }),
      "/search/artist/cocteau-twins/302127",
    );
  });

  it("restores the canvas frame that belongs to the visible route", () => {
    const session: CanvasSession = {
      cursor: 1,
      frames: [
        { id: "root", focus: null, nodes: [], depth: 0, resolved: true },
        {
          id: "song",
          focus: {
            id: "6641748",
            entityId: null,
            provider_id: "6641748",
            type: "track",
            title: "Love Is",
            artist_name: "Gino Soccio",
            artist_provider_id: null,
            cover_url: null,
          },
          nodes: [],
          depth: 1,
          resolved: true,
        },
      ],
    };

    assert.equal(matchDiscoverySessionToPath(session, "/search")?.cursor, 0);
    assert.equal(
      matchDiscoverySessionToPath(session, "/search/track/love-is/6641748")?.cursor,
      1,
    );
    assert.equal(matchDiscoverySessionToPath(session, "/search/artist/other/1"), null);
  });

  it("opens database-backed results on their canonical Kocteau route", () => {
    assert.equal(
      getDiscoveryEntityPath({
        entityId: "e9cfe82b-5a2b-4324-9e85-a861fdbbddf4",
        providerId: "717273972",
        type: "track",
        title: "White Ferrari",
        artistName: "Frank Ocean",
      }),
      "/tracks/white-ferrari-frank-ocean/e9cfe82b5a2b",
    );

    assert.equal(
      getDiscoveryEntityPath({
        entityId: "a83f59be-c955-4ec1-91d6-a2eea0ff2ed1",
        providerId: "302127",
        type: "artist",
        title: "Cocteau Twins",
        artistName: null,
      }),
      "/artists/cocteau-twins/a83f59bec955",
    );
  });

  it("keeps unresolved catalog results on their canonical provider route", () => {
    assert.equal(
      getDiscoveryEntityPath({
        entityId: null,
        providerId: "717273972",
        type: "track",
        title: "White Ferrari",
        artistName: "Frank Ocean",
      }),
      "/track/deezer/717273972",
    );

    assert.equal(
      getDiscoveryEntityPath({
        entityId: null,
        providerId: "302127",
        type: "artist",
        title: "Cocteau Twins",
        artistName: null,
      }),
      "/artist/deezer/302127",
    );
  });
});
