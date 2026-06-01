import assert from "node:assert/strict";
import test from "node:test";
import {
  analyticsEventTypes,
  getCanonicalAnalyticsEventType,
  isAllowedAnalyticsMetadataKey,
} from "./events.ts";

test("analytics event contract includes documented discovery events", () => {
  assert.ok(analyticsEventTypes.includes("feed_loaded"));
  assert.ok(analyticsEventTypes.includes("review_impression"));
  assert.ok(analyticsEventTypes.includes("review_open"));
  assert.ok(analyticsEventTypes.includes("review_read_50"));
  assert.ok(analyticsEventTypes.includes("review_read_90"));
  assert.ok(analyticsEventTypes.includes("entity_open"));
  assert.ok(analyticsEventTypes.includes("starter_impression"));
  assert.ok(analyticsEventTypes.includes("starter_review_published"));
});

test("legacy analytics event names normalize to the signal contract", () => {
  assert.equal(
    getCanonicalAnalyticsEventType("for_you_reviews_loaded"),
    "feed_loaded",
  );
  assert.equal(
    getCanonicalAnalyticsEventType("for_you_fallback"),
    "recommendation_fallback",
  );
  assert.equal(
    getCanonicalAnalyticsEventType("for_you_recommendation_action"),
    "starter_pass",
  );
  assert.equal(
    getCanonicalAnalyticsEventType("for_you_review_action"),
    "for_you_review_action",
  );
});

test("analytics metadata keys reject sensitive fields", () => {
  assert.equal(isAllowedAnalyticsMetadataKey("review_id"), true);
  assert.equal(isAllowedAnalyticsMetadataKey("matched_tag_count"), true);
  assert.equal(isAllowedAnalyticsMetadataKey("email"), false);
  assert.equal(isAllowedAnalyticsMetadataKey("ip_address"), false);
  assert.equal(isAllowedAnalyticsMetadataKey("ipaddress"), false);
  assert.equal(isAllowedAnalyticsMetadataKey("user-agent"), false);
  assert.equal(isAllowedAnalyticsMetadataKey("user_agent"), false);
  assert.equal(isAllowedAnalyticsMetadataKey("ReviewID"), false);
  assert.equal(isAllowedAnalyticsMetadataKey("raw_review_text"), false);
});
