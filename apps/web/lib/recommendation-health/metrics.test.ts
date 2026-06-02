import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatRecommendationReason,
  getRecommendationHealthDays,
  normalizeRecommendationHealthSnapshot,
} from "./metrics.ts";

test("normalizes aggregate recommendation health payloads for the studio UI", () => {
  const snapshot = normalizeRecommendationHealthSnapshot({
    window: {
      days: 30,
      startAt: "2026-05-01T00:00:00.000Z",
      endAt: "2026-06-01T00:00:00.000Z",
    },
    feed: {
      loads: "10",
      fallbacks: 2,
      fallbackRate: "0.2",
      reviewImpressions: 40,
      reviewOpens: 8,
      reviewOpenRate: 0.2,
      entityOpens: 5,
    },
    reasons: [
      { reason: "taste_match", impressions: 20, opens: 6, openRate: 0.3 },
      { reason: null, impressions: "3", opens: "1", openRate: "0.3333" },
    ],
    starter: {
      impressions: 12,
      passes: 4,
      passRate: 0.3333,
      reviewCtas: 3,
      reviewsPublished: 1,
      reviewConversionRate: 0.0833,
    },
    starterTracks: [
      {
        starterTrackId: "starter-1",
        providerId: "deezer-1",
        title: "Heaven or Las Vegas",
        artistName: "Cocteau Twins",
        impressions: 8,
        passes: 2,
        passRate: 0.25,
        reviewCtas: 2,
        reviewsPublished: 1,
        reviewConversionRate: 0.125,
      },
    ],
    tagCoverage: [
      {
        kind: "mood",
        taggedTracks: 6,
        tagCount: 8,
      },
    ],
    entities: [
      {
        entityId: "entity-1",
        provider: "deezer",
        providerId: "3135556",
        type: "track",
        title: "Cherry-coloured Funk",
        artistName: "Cocteau Twins",
        opens: 7,
      },
    ],
  });

  assert.equal(snapshot.window.days, 30);
  assert.equal(snapshot.feed.loads, 10);
  assert.equal(snapshot.feed.fallbackRate, 0.2);
  assert.equal(snapshot.reasons[0]?.reason, "taste_match");
  assert.equal(snapshot.reasons[1]?.reason, "unknown");
  assert.equal(snapshot.starterTracks[0]?.title, "Heaven or Las Vegas");
  assert.equal(snapshot.tagCoverage[0]?.kind, "mood");
  assert.equal(snapshot.tagCoverage[0]?.taggedTracks, 6);
  assert.equal(snapshot.entities[0]?.opens, 7);
});

test("chooses only supported recommendation health windows", () => {
  assert.equal(getRecommendationHealthDays("7"), 7);
  assert.equal(getRecommendationHealthDays("30"), 30);
  assert.equal(getRecommendationHealthDays("100"), 14);
  assert.equal(getRecommendationHealthDays(null), 14);
});

test("formats recommendation reasons for quiet editorial display", () => {
  assert.equal(formatRecommendationReason("taste_match"), "Taste match");
  assert.equal(formatRecommendationReason("author-affinity"), "Author affinity");
  assert.equal(formatRecommendationReason(null), "Unknown");
});
