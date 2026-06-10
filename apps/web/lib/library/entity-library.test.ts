import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  entityLibraryItemTypes,
  getNextEntityLibraryState,
  isEntityLibraryItemType,
} from "./entity-library.ts";

describe("entity library state", () => {
  it("accepts the supported library item types", () => {
    assert.deepEqual(entityLibraryItemTypes, ["listen_later", "review_later"]);
    assert.equal(isEntityLibraryItemType("listen_later"), true);
    assert.equal(isEntityLibraryItemType("review_later"), true);
    assert.equal(isEntityLibraryItemType("collection"), false);
  });

  it("updates only the requested item type", () => {
    assert.deepEqual(
      getNextEntityLibraryState(
        { listen_later: false, review_later: true },
        "listen_later",
        true,
      ),
      { listen_later: true, review_later: true },
    );

    assert.deepEqual(
      getNextEntityLibraryState(
        { listen_later: true, review_later: true },
        "review_later",
        false,
      ),
      { listen_later: true, review_later: false },
    );
  });
});
