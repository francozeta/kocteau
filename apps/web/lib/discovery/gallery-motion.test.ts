import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceMotion,
  getGalleryPose,
  sampleInk,
  shortestDistance,
} from "./gallery-motion";

test("motion follows the same trajectory on 60 Hz and 120 Hz displays", () => {
  const sample = (rate: number) => {
    const motion = { value: 30, velocity: -12 };
    for (let frame = 0; frame < rate / 2; frame += 1)
      advanceMotion(motion, 480, 1 / rate);
    return motion;
  };
  const a = sample(60);
  const b = sample(120);
  assert.ok(Math.abs(a.value - b.value) < 1e-8);
  assert.ok(Math.abs(a.velocity - b.velocity) < 1e-8);
});

test("an interrupted movement retains its position and velocity at retarget time", () => {
  const motion = { value: 0, velocity: 0 };
  advanceMotion(motion, 400, 0.12);
  const before = { ...motion };
  advanceMotion(motion, -200, 0);
  assert.equal(motion.value, before.value);
  assert.equal(motion.velocity, before.velocity);
  for (let frame = 0; frame < 180; frame += 1)
    advanceMotion(motion, -200, 1 / 60);
  assert.deepEqual(motion, { value: -200, velocity: 0 });
});

test("a settled movement stops asking for frames and has no bounce from rest", () => {
  const motion = { value: 0, velocity: 0 };
  let previous = 0;
  let moving = true;
  for (let frame = 0; frame < 180; frame += 1) {
    moving = advanceMotion(motion, 100, 1 / 60);
    assert.ok(motion.value >= previous && motion.value <= 100);
    previous = motion.value;
  }
  assert.equal(moving, false);
});

test("catalog wrap preserves neighboring connections in both directions", () => {
  assert.equal(shortestDistance(0, 29, 30), 1);
  assert.equal(shortestDistance(29, 0, 30), -1);
  assert.equal(shortestDistance(0, 0, 1), 0);
});

test("a delayed frame catches up without numerical instability or slowing the animation clock", () => {
  const delayed = { value: 0, velocity: 0 };
  const regular = { ...delayed };
  advanceMotion(delayed, 300, 0.4);
  for (let frame = 0; frame < 24; frame += 1)
    advanceMotion(regular, 300, 1 / 60);
  assert.ok(Math.abs(delayed.value - regular.value) < 1e-8);
  assert.ok(Math.abs(delayed.velocity - regular.velocity) < 1e-8);
});

test("mobile artwork remains inside the canvas across the composed focus variants", () => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
  ]) {
    for (const composition of ["constellation", "loose"] as const) {
      for (const distance of [-2, -1, 0, 1, 2, 3]) {
        for (const id of ["track:1", "track:456", "album:90"]) {
          const pose = getGalleryPose(
            distance,
            true,
            viewport,
            id,
            composition,
          );
          const halfCover =
            (Math.min(viewport.width * 0.51, 218) * pose.scale) / 2;
          assert.ok(
            pose.x - halfCover >= 0 && pose.x + halfCover <= viewport.width,
          );
          assert.ok(
            pose.y - halfCover > 60 &&
              pose.y + halfCover + 24 < viewport.height - 110,
          );
        }
      }
    }
  }
});

test("ink remains finite when endpoints and controls overlap during a reversal", () => {
  const point = { x: 140, y: 240 };
  const points = sampleInk(point, point, point, point, 0.5);
  assert.ok(
    points.every(({ x, y, radius }) => Number.isFinite(x + y + radius)),
  );
  assert.deepEqual({ x: points[0].x, y: points[0].y }, point);
  assert.deepEqual({ x: points.at(-1)!.x, y: points.at(-1)!.y }, point);
});
