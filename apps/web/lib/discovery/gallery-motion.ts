export type Point = { x: number; y: number };
export type GalleryPose = Point & {
  scale: number;
  rotation: number;
  opacity: number;
};

export type MotionValue = { value: number; velocity: number };

// Exact critically damped integration: retargeting preserves both position and
// velocity, and 60/120 Hz displays follow the same trajectory without bounce.
export function advanceMotion(
  motion: MotionValue,
  target: number,
  seconds: number,
  frequency = 14,
) {
  const delta = motion.value - target;
  const momentum = motion.velocity + frequency * delta;
  const decay = Math.exp(-frequency * seconds);
  motion.value = target + (delta + momentum * seconds) * decay;
  motion.velocity = (motion.velocity - frequency * momentum * seconds) * decay;
  if (Math.abs(motion.value - target) < 0.001 && Math.abs(motion.velocity) < 0.01) {
    motion.value = target;
    motion.velocity = 0;
    return false;
  }
  return true;
}

export function hashUnit(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

export function shortestDistance(index: number, active: number, count: number) {
  const distance = (index - active + count) % count;
  return distance > count / 2 ? distance - count : distance;
}

const SLOTS = [
  { x: 0.79, y: 0.28, scale: 0.62, rotation: 3 },
  { x: 0.19, y: 0.29, scale: 0.60, rotation: -5 },
  { x: 0.74, y: 0.74, scale: 0.55, rotation: -5 },
  { x: 0.25, y: 0.73, scale: 0.56, rotation: 6 },
  { x: 0.88, y: 0.51, scale: 0.43, rotation: 4 },
  { x: 0.09, y: 0.54, scale: 0.43, rotation: -3 },
];

export function getGalleryPose(
  distance: number,
  mobile: boolean,
  viewport: { width: number; height: number },
  activeId: string,
): GalleryPose {
  const { width, height } = viewport;
  if (distance === 0) {
    return { x: width * 0.5, y: height * 0.47, scale: 1, rotation: 0, opacity: 1 };
  }
  const slotIndex = (Math.abs(distance) - 1) * 2 + (distance < 0 ? 1 : 0);
  const slot = SLOTS[slotIndex % SLOTS.length];
  return {
    x: width * (slot.x + (hashUnit(activeId + slotIndex + ":x") - 0.5) * 0.035),
    y: height * (slot.y + (hashUnit(activeId + slotIndex + ":y") - 0.5) * 0.03),
    scale: slot.scale * (mobile ? 0.94 : 1),
    rotation: slot.rotation + (hashUnit(activeId + slotIndex + ":r") - 0.5) * 4,
    opacity: Math.abs(distance) === 1 ? 0.85 : Math.abs(distance) === 2 ? 0.68 : 0.52,
  };
}

// The same material samples survive deformation. Noise lives along the stroke,
// never in time, so a stationary connection doesn't shimmer or crawl.
export function sampleInk(
  from: Point,
  control1: Point,
  control2: Point,
  to: Point,
  salt: number,
  count = 32,
) {
  const points: (Point & { radius: number })[] = [];
  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const inv = 1 - t;
    const tx = 3 * inv ** 2 * (control1.x - from.x) +
      6 * inv * t * (control2.x - control1.x) + 3 * t ** 2 * (to.x - control2.x);
    const ty = 3 * inv ** 2 * (control1.y - from.y) +
      6 * inv * t * (control2.y - control1.y) + 3 * t ** 2 * (to.y - control2.y);
    const length = Math.max(1, Math.hypot(tx, ty));
    const grain = Math.sin(t * 31 + salt) * Math.sin(Math.PI * t) * 0.65;
    points.push({
      x: inv ** 3 * from.x + 3 * inv ** 2 * t * control1.x +
        3 * inv * t ** 2 * control2.x + t ** 3 * to.x - ty / length * grain,
      y: inv ** 3 * from.y + 3 * inv ** 2 * t * control1.y +
        3 * inv * t ** 2 * control2.y + t ** 3 * to.y + tx / length * grain,
      radius: (0.12 + 1.7 * Math.sin(Math.PI * t) ** 0.7) *
        (0.85 + 0.15 * Math.sin(t * 19 + salt)),
    });
  }
  return points;
}
