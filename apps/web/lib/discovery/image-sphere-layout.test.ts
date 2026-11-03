import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getImageSphereLayoutStyle,
  getImageSphereTargetScale,
} from "./image-sphere.ts";

describe("image sphere layout style", () => {
  it("keeps each cover's irregular layout stable across renders", () => {
    const first = getImageSphereLayoutStyle("https://example.com/cover-a.jpg");
    const second = getImageSphereLayoutStyle("https://example.com/cover-a.jpg");

    assert.deepEqual(first, second);
  });

  it("keeps visual variation inside restrained bounds", () => {
    const style = getImageSphereLayoutStyle("https://example.com/cover-b.jpg");

    assert.ok(style.scale >= 0.84 && style.scale <= 1.16);
    assert.ok(style.tilt >= -0.05 && style.tilt <= 0.05);
    assert.ok(style.verticalJitter >= -0.09 && style.verticalJitter <= 0.09);
    assert.ok(style.radiusJitter >= -36 && style.radiusJitter <= 36);
  });
});

describe("original Kocteau 3D scale", () => {
  it("uses the original depth gradient rather than capping background covers", () => {
    // RADIUS=180, depth scale moves from 0.68 to 1.10.
    assert.equal(getImageSphereTargetScale(-216, 1, false), 0.68);
    assert.equal(getImageSphereTargetScale(216, 1, false), 1.1);
    assert.ok(Math.abs(getImageSphereTargetScale(0, 1, false) - 0.89) < 1e-12);
    assert.equal(getImageSphereTargetScale(216, 1.16, false), 1.1 * 1.16);
    assert.equal(getImageSphereTargetScale(216, 0.84, false), 1.1 * 0.84);
  });

  it("reserves the original anchor emphasis without shrinking its neighbors", () => {
    const neighbor = getImageSphereTargetScale(90, 1.16, false);
    const anchor = getImageSphereTargetScale(90, 1, true);

    assert.ok(neighbor > getImageSphereTargetScale(90, 0.84, false));
    assert.equal(anchor, getImageSphereTargetScale(90, 1, false) * 1.08);
  });
});
