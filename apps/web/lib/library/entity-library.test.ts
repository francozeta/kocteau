import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  entityLibraryItemTypes,
  getNextEntityLibraryState,
  isEntityLibraryItemType,
} from "./entity-library.ts";

describe("entity library state", () => {
  it("accepts the supported library item types", () => {
    assert.deepEqual(entityLibraryItemTypes, ["library"]);
    assert.equal(isEntityLibraryItemType("library"), true);
    assert.equal(isEntityLibraryItemType("listen_later"), false);
    assert.equal(isEntityLibraryItemType("review_later"), false);
    assert.equal(isEntityLibraryItemType("collection"), false);
  });

  it("updates only the requested item type", () => {
    assert.deepEqual(
      getNextEntityLibraryState(
        { library: false },
        "library",
        true,
      ),
      { library: true },
    );

    assert.deepEqual(
      getNextEntityLibraryState(
        { library: true },
        "library",
        false,
      ),
      { library: false },
    );
  });
});
