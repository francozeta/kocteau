import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isPublicReviewDisplayable,
  isPublicReviewIndexable,
} from "./public-content.ts";

describe("public review content curation", () => {
  it("hides reviews containing executable or embedded markup", () => {
    assert.equal(
      isPublicReviewDisplayable({ body: "<script>alert('test')</script>" }),
      false,
    );
    assert.equal(
      isPublicReviewDisplayable({ body: "<iframe src=\"https://example.com\" />" }),
      false,
    );
  });

  it("hides obvious low-signal test text", () => {
    assert.equal(
      isPublicReviewDisplayable({ title: "asdasd", body: "asdasdasdasdasd" }),
      false,
    );
  });

  it("keeps ordinary listening notes visible", () => {
    assert.equal(
      isPublicReviewDisplayable({
        title: "A quiet record for late nights",
        body: "The guitars keep opening up after the second chorus.",
      }),
      true,
    );
  });

  it("only marks substantial public notes as indexable", () => {
    assert.equal(
      isPublicReviewIndexable({ title: "Nice", body: "A good song." }),
      false,
    );
    assert.equal(
      isPublicReviewIndexable({
        title: "A quiet record for late nights",
        body: "The guitars keep opening up after the second chorus, while the vocal stays close and unguarded. It rewards another listen.",
      }),
      true,
    );
  });
});
