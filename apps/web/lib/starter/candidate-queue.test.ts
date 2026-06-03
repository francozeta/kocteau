import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  editorialCandidateStatuses,
  getEditorialCandidateStatusLabel,
  isEditorialCandidateDecisionStatus,
} from "./candidate-queue.ts";

describe("editorial candidate queue helpers", () => {
  it("keeps queue statuses ordered from active work to historical decisions", () => {
    assert.deepEqual(editorialCandidateStatuses, [
      "queued",
      "approved",
      "dismissed",
      "archived",
    ]);
  });

  it("separates active queued candidates from decision history", () => {
    assert.equal(isEditorialCandidateDecisionStatus("queued"), false);
    assert.equal(isEditorialCandidateDecisionStatus("approved"), true);
    assert.equal(isEditorialCandidateDecisionStatus("dismissed"), true);
    assert.equal(isEditorialCandidateDecisionStatus("archived"), true);
  });

  it("formats status labels for quiet Studio UI", () => {
    assert.equal(getEditorialCandidateStatusLabel("queued"), "Queued");
    assert.equal(getEditorialCandidateStatusLabel("approved"), "Approved");
    assert.equal(getEditorialCandidateStatusLabel("dismissed"), "Dismissed");
    assert.equal(getEditorialCandidateStatusLabel("archived"), "Archived");
  });
});
