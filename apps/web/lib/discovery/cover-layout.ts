export type CoverBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type CoverLabelSize = { width: number; height: number };
export type CoverLabelInsets = { top: number; bottom: number };

export function projectCoverBounds({
  x,
  y,
  depth,
  width,
  height,
  tilt,
  viewport,
  fov,
}: {
  x: number;
  y: number;
  depth: number;
  width: number;
  height: number;
  tilt: number;
  viewport: { width: number; height: number };
  fov: number;
}): CoverBounds {
  const pixelsPerUnit =
    viewport.height /
    (2 * Math.max(1, depth) * Math.tan((fov * Math.PI) / 360));
  const cosine = Math.abs(Math.cos(tilt));
  const sine = Math.abs(Math.sin(tilt));
  const halfWidth = ((width * cosine + height * sine) * pixelsPerUnit) / 2;
  const halfHeight = ((height * cosine + width * sine) * pixelsPerUnit) / 2;
  const centerX = viewport.width / 2 + x * pixelsPerUnit;
  const centerY = viewport.height / 2 - y * pixelsPerUnit;

  return {
    left: centerX - halfWidth,
    right: centerX + halfWidth,
    top: centerY - halfHeight,
    bottom: centerY + halfHeight,
  };
}

function intersects(a: CoverBounds, b: CoverBounds) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

export function placeCoverLabel({
  cover,
  label,
  viewport,
  foreground,
  occluders = [],
  obstacles = [],
  insets = { top: 0, bottom: 0 },
}: {
  cover: CoverBounds;
  label: CoverLabelSize;
  viewport: { width: number; height: number };
  foreground?: { cover: CoverBounds; label: CoverBounds };
  occluders?: CoverBounds[];
  obstacles?: CoverBounds[];
  insets?: CoverLabelInsets;
}) {
  const centerX = (cover.left + cover.right) / 2;
  const x = Math.max(
    label.width / 2 + 8,
    Math.min(viewport.width - label.width / 2 - 8, centerX),
  );
  let visible =
    centerX > 0 &&
    centerX < viewport.width &&
    cover.bottom > 0 &&
    cover.top < viewport.height;
  const blocks = [...occluders, ...obstacles];
  visible &&= !occluders.some(
    (other) =>
      cover.left >= other.left &&
      cover.right <= other.right &&
      cover.top >= other.top &&
      cover.bottom <= other.bottom,
  );

  if (foreground) {
    const covered =
      cover.left >= foreground.cover.left &&
      cover.right <= foreground.cover.right &&
      cover.top >= foreground.cover.top &&
      cover.bottom <= foreground.cover.bottom;
    visible &&= !covered;
    blocks.push({
      left: Math.min(foreground.cover.left, foreground.label.left) - 8,
      right: Math.max(foreground.cover.right, foreground.label.right) + 8,
      top: foreground.cover.top - 8,
      bottom: foreground.label.bottom + 8,
    });
  }
  const middleY = (cover.top + cover.bottom - label.height) / 2;
  const candidates = [
    { x, y: cover.bottom + 8, placement: "bottom" },
    { x, y: cover.top - label.height - 8, placement: "top" },
    { x: cover.right + 8 + label.width / 2, y: middleY, placement: "right" },
    { x: cover.left - 8 - label.width / 2, y: middleY, placement: "left" },
  ] as const;
  const chosen = candidates.find((candidate) => {
    const bounds = {
      left: candidate.x - label.width / 2,
      right: candidate.x + label.width / 2,
      top: candidate.y,
      bottom: candidate.y + label.height,
    };
    return (
      bounds.left >= 8 &&
      bounds.right <= viewport.width - 8 &&
      bounds.top >= insets.top &&
      bounds.bottom <= viewport.height - insets.bottom &&
      !blocks.some((block) => intersects(bounds, block))
    );
  });
  return { ...(chosen ?? candidates[0]), visible: visible && Boolean(chosen) };
}
