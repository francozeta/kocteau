import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getStarterContextKey,
  getStarterRailQueryPath,
  getStarterSurfaceFromPathname,
  isStarterSurface,
} from "./surface.ts";

describe("starter rail surface helpers", () => {
  it("maps primary app routes to editorial starter surfaces", () => {
    assert.equal(getStarterSurfaceFromPathname("/"), "home");
    assert.equal(getStarterSurfaceFromPathname("/track/3135556"), "track");
    assert.equal(getStarterSurfaceFromPathname("/u/kocteau"), "profile");
    assert.equal(getStarterSurfaceFromPathname("/reviews/review-1"), "review");
    assert.equal(getStarterSurfaceFromPathname("/search"), "search");
    assert.equal(getStarterSurfaceFromPathname("/library"), "library");
    assert.equal(getStarterSurfaceFromPathname("/saved"), "saved");
    assert.equal(getStarterSurfaceFromPathname("/studio/health"), "studio");
    assert.equal(getStarterSurfaceFromPathname("/notifications"), "notifications");
    assert.equal(getStarterSurfaceFromPathname("/activity"), "activity");
    assert.equal(getStarterSurfaceFromPathname("/unknown/place"), "app");
  });

  it("builds stable context keys from the route shape", () => {
    assert.equal(getStarterContextKey("/"), "home");
    assert.equal(getStarterContextKey("/track/3135556"), "track:3135556");
    assert.equal(getStarterContextKey("/u/kocteau"), "profile:kocteau");
    assert.equal(getStarterContextKey("/reviews/review-1"), "review:review-1");
    assert.equal(getStarterContextKey("/studio/health"), "studio:health");
    assert.equal(getStarterContextKey(null), "app");
  });

  it("validates API surface values", () => {
    assert.equal(isStarterSurface("profile"), true);
    assert.equal(isStarterSurface("starter-picks"), false);
    assert.equal(isStarterSurface(null), false);
  });

  it("creates the client API path for the active rail", () => {
    assert.equal(
      getStarterRailQueryPath("/u/kocteau"),
      "/api/starter/rail?surface=profile&context=profile%3Akocteau",
    );
  });
});
