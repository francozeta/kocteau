import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getDiscoveryEntityPath } from "./navigation.ts";

describe("discovery entity navigation", () => {
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
