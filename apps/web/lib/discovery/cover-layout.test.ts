import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PerspectiveCamera, Vector3 } from "three";
import { placeCoverLabel, projectCoverBounds } from "./cover-layout";

describe("cover caption projection", () => {
  it("matches the painted corners, including off-axis and tilted covers", () => {
    const viewport = { width: 1200, height: 800 };
    const camera = new PerspectiveCamera(
      25,
      viewport.width / viewport.height,
      0.1,
      2000,
    );
    camera.position.z = 545;
    camera.updateMatrixWorld();
    const tilt = 0.04;
    for (const position of [
      { x: 0, y: 0, z: 72 },
      { x: 160, y: 95, z: 200 },
    ]) {
      const actual = projectCoverBounds({
        ...position,
        depth: camera.position.z - position.z,
        width: 50,
        height: 50,
        tilt,
        viewport,
        fov: camera.fov,
      });
      const corners = [-25, 25].flatMap((x) =>
        [-25, 25].map((y) => {
          const point = new Vector3(
            position.x + x * Math.cos(tilt) - y * Math.sin(tilt),
            position.y + x * Math.sin(tilt) + y * Math.cos(tilt),
            position.z,
          ).project(camera);
          return {
            x: ((point.x + 1) * viewport.width) / 2,
            y: ((1 - point.y) * viewport.height) / 2,
          };
        }),
      );
      assert(
        Math.abs(actual.bottom - Math.max(...corners.map((p) => p.y))) < 0.001,
      );
      assert(
        Math.abs(actual.left - Math.min(...corners.map((p) => p.x))) < 0.001,
      );
      assert(
        Math.abs(actual.right - Math.max(...corners.map((p) => p.x))) < 0.001,
      );
    }
  });

  it("does not shrink a caption's cover estimate just because it moves sideways", () => {
    const cover = {
      x: 0,
      y: 0,
      depth: 400,
      width: 50,
      height: 50,
      tilt: 0,
      viewport: { width: 1200, height: 800 },
      fov: 25,
    };
    const center = projectCoverBounds(cover);
    const edge = projectCoverBounds({ ...cover, x: 250 });
    assert.equal(center.bottom - center.top, edge.bottom - edge.top);
  });
});

describe("cover labels around the current music", () => {
  const viewport = { width: 390, height: 844 };
  const label = { width: 128, height: 32 };
  const foreground = {
    cover: { left: 120, right: 280, top: 160, bottom: 320 },
    label: { left: 100, right: 300, top: 328, bottom: 390 },
  };

  it("does not put a hidden cover's name on top of the current artwork", () => {
    const result = placeCoverLabel({
      viewport,
      label,
      foreground,
      cover: { left: 180, right: 240, top: 190, bottom: 250 },
    });
    assert.equal(result.visible, false);
  });

  it("keeps a visible neighbour's caption by moving it above its own cover", () => {
    const cover = { left: 200, right: 300, top: 80, bottom: 180 };
    const result = placeCoverLabel({ viewport, label, foreground, cover });
    assert.equal(result.visible, true);
    assert(result.y + label.height < cover.top);
    assert.equal(result.x, (cover.left + cover.right) / 2);
  });

  it("keeps edge captions inside the viewport", () => {
    const result = placeCoverLabel({
      viewport,
      label,
      cover: { left: -20, right: 40, top: 100, bottom: 160 },
    });
    assert.equal(result.visible, true);
    assert(result.x - label.width / 2 >= 8);
  });

  it("does not leave orphan captions for offscreen covers", () => {
    const result = placeCoverLabel({
      viewport,
      label,
      cover: { left: 50, right: 100, top: -100, bottom: -1 },
    });
    assert.equal(result.visible, false);
  });

  it("avoids foreground artwork before a seed has been selected", () => {
    const cover = { left: 136, right: 207, top: 94, bottom: 165 };
    const result = placeCoverLabel({
      viewport,
      label,
      cover,
      occluders: [{ left: 158, right: 358, top: 198, bottom: 398 }],
    });
    assert.equal(result.visible, true);
    assert(result.y + label.height < cover.top);
  });

  it("avoids a previously placed caption without moving its cover", () => {
    const cover = { left: 40, right: 100, top: 100, bottom: 160 };
    const original = { ...cover };
    const result = placeCoverLabel({
      viewport,
      label,
      cover,
      obstacles: [{ left: 8, right: 150, top: 160, bottom: 220 }],
    });
    assert.equal(result.visible, true);
    assert(result.y + label.height < cover.top);
    assert.deepEqual(cover, original);
  });

  it("uses a nearby side position instead of placing text under the mobile header", () => {
    const cover = { left: 136, right: 207, top: 94, bottom: 165 };
    const result = placeCoverLabel({
      viewport,
      label,
      cover,
      insets: { top: 80, bottom: 112 },
      occluders: [{ left: 158, right: 358, top: 198, bottom: 398 }],
    });
    assert.equal(result.visible, true);
    assert.equal(result.placement, "right");
    assert(result.x - label.width / 2 > cover.right);
    assert(result.y >= 80);
  });
});
