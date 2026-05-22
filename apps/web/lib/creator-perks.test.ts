import assert from "node:assert/strict";
import test from "node:test";
import {
  didUnlockCreatorPerkOnReview,
  getV0ReferralUrl,
} from "./creator-perks";

test("creator perk unlock is reported only for the first persisted review", () => {
  assert.equal(
    didUnlockCreatorPerkOnReview({
      hadPerkBefore: false,
      reviewId: "review-1",
      persistedFirstReviewId: "review-1",
    }),
    true,
  );

  assert.equal(
    didUnlockCreatorPerkOnReview({
      hadPerkBefore: true,
      reviewId: "review-1",
      persistedFirstReviewId: "review-1",
    }),
    false,
  );

  assert.equal(
    didUnlockCreatorPerkOnReview({
      hadPerkBefore: false,
      reviewId: "review-2",
      persistedFirstReviewId: "review-1",
    }),
    false,
  );
});

test("v0 referral url is read from server configuration", () => {
  assert.equal(
    getV0ReferralUrl({
      V0_REFERRAL_URL: " https://v0.app/ref/5APE6X ",
    }),
    "https://v0.app/ref/5APE6X",
  );

  assert.equal(
    getV0ReferralUrl({
      V0_REFERRAL_URL: "",
      NEXT_PUBLIC_V0_REFERRAL_URL: "https://v0.app/ref/public-fallback",
    }),
    "https://v0.app/ref/public-fallback",
  );

  assert.equal(getV0ReferralUrl({}), null);
});
