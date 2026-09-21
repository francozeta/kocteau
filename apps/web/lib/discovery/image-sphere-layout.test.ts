import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getImageSphereLayoutStyle } from "./image-sphere.ts";

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
