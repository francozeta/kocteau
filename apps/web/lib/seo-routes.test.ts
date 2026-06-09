import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildEntityCanonicalPath,
  buildEntityLegacyPath,
  buildReviewCanonicalPath,
  getEntitySlug,
  getShortRouteId,
  isSeoRouteId,
  slugifyForUrl,
} from "./seo-routes.ts";

describe("seo route helpers", () => {
  it("normalizes music names into stable URL slugs", () => {
    assert.equal(slugifyForUrl("Sueño & Noise / 2026"), "sueno-and-noise-2026");
    assert.equal(getEntitySlug(null), "music");
  });

  it("uses Kocteau entity IDs for canonical reviewed track URLs", () => {
    assert.equal(
      buildEntityCanonicalPath({
        id: "e9cfe82b-5a2b-4324-9e85-a861fdbbddf4",
        provider: "deezer",
        provider_id: "717273972",
        type: "track",
        title: "White Ferrari",
        artist_name: "Frank Ocean",
      }),
      "/tracks/white-ferrari-frank-ocean/e9cfe82b",
    );
  });

  it("keeps Deezer paths only for unresolved preview tracks", () => {
    assert.equal(
      buildEntityCanonicalPath({
        provider: "deezer",
        provider_id: "717273972",
        type: "track",
        title: "White Ferrari",
        artist_name: "Frank Ocean",
      }),
      "/track/deezer/717273972",
    );
  });

  it("builds review URLs around the reviewed music identity", () => {
    assert.equal(
      buildReviewCanonicalPath({
        id: "88a81fc1-173b-4909-adb6-e1010a55ae5a",
        entities: {
          id: "e9cfe82b-5a2b-4324-9e85-a861fdbbddf4",
          type: "track",
          title: "White Ferrari",
          artist_name: "Frank Ocean",
        },
      }),
      "/reviews/88a81fc1/white-ferrari-frank-ocean",
    );
  });

  it("accepts short route IDs for database-backed canonical URLs", () => {
    assert.equal(getShortRouteId("E9CFE82B-5A2B-4324-9E85-A861FDBBDDF4"), "e9cfe82b");
    assert.equal(isSeoRouteId("e9cfe82b"), true);
    assert.equal(isSeoRouteId("e9cfe82b-5a2b-4324-9e85-a861fdbbddf4"), true);
    assert.equal(isSeoRouteId("not-a-track"), false);
  });

  it("keeps legacy paths available for old internal references", () => {
    assert.equal(
      buildEntityLegacyPath({
        id: "e9cfe82b-5a2b-4324-9e85-a861fdbbddf4",
        type: "track",
        title: "White Ferrari",
      }),
      "/track/e9cfe82b-5a2b-4324-9e85-a861fdbbddf4",
    );
  });
});
