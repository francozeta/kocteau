import {
  advanceMotion,
  hashUnit,
  sampleInk,
  type GalleryPose,
  type MotionValue,
  type Point,
} from "@/lib/discovery/gallery-motion";

export type GalleryScene = {
  width: number;
  height: number;
  mobile: boolean;
  cardWidth: number;
  nodes: { id: string; pose: GalleryPose; wheel: GalleryPose }[];
  connections: { from: string; to: string }[];
};

const POSE_KEYS = ["x", "y", "scale", "rotation", "opacity"] as const;
type MovingPose = Record<keyof GalleryPose, MotionValue>;
type Connection = {
  from: string;
  to: string;
  c1: MovingPoint;
  c2: MovingPoint;
  salt: number;
  opacity: MotionValue;
};
type MovingPoint = { x: MotionValue; y: MotionValue };

function movingPose(pose: GalleryPose): MovingPose {
  return Object.fromEntries(
    POSE_KEYS.map((key) => [key, { value: pose[key], velocity: 0 }]),
  ) as MovingPose;
}

function movingPoint(point: Point): MovingPoint {
  return {
    x: { value: point.x, velocity: 0 },
    y: { value: point.y, velocity: 0 },
  };
}

function point(moving: MovingPoint): Point {
  return { x: moving.x.value, y: moving.y.value };
}

function controls(from: Point, to: Point, salt: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const bend = (salt > 0.5 ? 1 : -1) * Math.min(90, length * 0.24);
  return [
    {
      x: from.x + dx * 0.32 - (dy / length) * bend,
      y: from.y + dy * 0.32 + (dx / length) * bend,
    },
    {
      x: from.x + dx * 0.7 - (dy / length) * bend * 0.7,
      y: from.y + dy * 0.7 + (dx / length) * bend * 0.7,
    },
  ];
}

function paintInk(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  edge: Connection,
  opacity: number,
) {
  const points = sampleInk(
    from,
    point(edge.c1),
    point(edge.c2),
    to,
    edge.salt * 100,
  );
  ctx.beginPath();
  for (const side of [1, -1]) {
    for (let offset = 0; offset < points.length; offset += 1) {
      const index = side === 1 ? offset : points.length - 1 - offset;
      const sample = points[index];
      const before = points[Math.max(0, index - 1)];
      const after = points[Math.min(points.length - 1, index + 1)];
      const length = Math.max(
        1,
        Math.hypot(after.x - before.x, after.y - before.y),
      );
      const x =
        sample.x - ((after.y - before.y) / length) * sample.radius * side;
      const y =
        sample.y + ((after.x - before.x) / length) * sample.radius * side;
      if (offset === 0 && side === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.globalAlpha = opacity * 0.32;
  ctx.fill();
}

// DOM artwork and ink consume one set of screen coordinates in one RAF. React
// only reconciles music/focus changes; no layout reads occur in the frame loop.
export function createGalleryRenderer(
  host: HTMLDivElement,
  canvas: HTMLCanvasElement,
  elements: Map<string, HTMLButtonElement>,
  onRest: (ids: string[]) => void,
) {
  const ctx = canvas.getContext("2d");
  const poses = new Map<string, MovingPose>();
  const edges = new Map<string, Connection>();
  let connectionKeys = new Set<string>();
  let targets = new Map<string, GalleryPose>();
  let wheelTargets = new Map<string, GalleryPose>();
  const exits = new Map<string, GalleryPose>();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scene: GalleryScene = {
    width: 1,
    height: 1,
    mobile: false,
    cardWidth: 1,
    nodes: [],
    connections: [],
  };
  let drag = 0;
  let exploring = false;
  const wheelMix = { value: 0, velocity: 0 };
  let frame = 0;
  let lastTime = 0;
  let intersecting = true;
  let disposed = false;

  function render(time: number) {
    frame = 0;
    const seconds = Math.max(0, (time - lastTime) / 1000);
    lastTime = time;
    const instant = reducedMotion.matches;
    let moving = false;
    if (instant) {
      wheelMix.value = 0;
      wheelMix.velocity = 0;
    } else
      moving =
        advanceMotion(wheelMix, exploring ? 1 : 0, seconds, 16) || moving;
    for (const [id, pose] of poses) {
      const target = targets.get(id);
      const destination = target ?? exits.get(id);
      const wheel = wheelTargets.get(id);
      for (const key of POSE_KEYS) {
        let value = destination?.[key] ?? pose[key].value;
        if (target && wheel) {
          const angle = (drag / Math.max(scene.width, 1)) * 1.9;
          const cx = scene.width * 0.5;
          const cy = (scene.height - (scene.mobile ? 84 : 30)) * 0.5;
          const aspect =
            (scene.width * (scene.mobile ? 0.31 : 0.29)) /
            (scene.height * 0.22);
          let wheelValue = wheel[key];
          if (key === "x")
            wheelValue =
              cx +
              (wheel.x - cx) * Math.cos(angle) -
              (wheel.y - cy) * Math.sin(angle) * aspect;
          if (key === "y")
            wheelValue =
              cy +
              ((wheel.x - cx) * Math.sin(angle)) / aspect +
              (wheel.y - cy) * Math.cos(angle);
          value += (wheelValue - value) * wheelMix.value;
        }
        if (target && key === "x")
          value += drag * (0.45 + target.scale * 0.55) * (1 - wheelMix.value);
        if (target && key === "y") value += drag * (target.scale - 0.7) * 0.16;
        if (instant) {
          pose[key].value = value;
          pose[key].velocity = 0;
        } else moving = advanceMotion(pose[key], value, seconds) || moving;
      }
      const element = elements.get(id);
      if (element) {
        element.style.transform = `translate3d(${pose.x.value - scene.cardWidth / 2}px, ${pose.y.value - scene.cardWidth / 2}px, 0) rotate(${pose.rotation.value}deg) scale(${pose.scale.value})`;
        element.style.opacity = String(pose.opacity.value);
      }
    }

    if (ctx) {
      ctx.clearRect(0, 0, scene.width, scene.height);
      for (const [key, edge] of edges) {
        const targetOpacity = connectionKeys.has(key) ? 1 : 0;
        if (instant) {
          edge.opacity.value = targetOpacity;
          edge.opacity.velocity = 0;
        } else
          moving =
            advanceMotion(edge.opacity, targetOpacity, seconds, 18) || moving;
        const from = poses.get(edge.from);
        const to = poses.get(edge.to);
        if (!from || !to) continue;
        const opacity =
          Math.min(from.opacity.value, to.opacity.value) * edge.opacity.value;
        if (opacity < 0.002) continue;
        const a = point(from);
        const b = point(to);
        const [c1, c2] = controls(a, b, edge.salt);
        for (const [current, target] of [
          [edge.c1, c1],
          [edge.c2, c2],
        ] as const) {
          for (const key of ["x", "y"] as const) {
            if (instant) {
              current[key].value = target[key];
              current[key].velocity = 0;
            } else
              moving =
                advanceMotion(current[key], target[key], seconds, 18) || moving;
          }
        }
        paintInk(ctx, a, b, edge, opacity);
      }
    }
    if (moving) wake(false);
    else {
      for (const id of poses.keys()) {
        if (!targets.has(id)) {
          poses.delete(id);
          exits.delete(id);
        }
      }
      for (const key of edges.keys())
        if (!connectionKeys.has(key)) edges.delete(key);
      host.dataset.galleryMotion = "rest";
      onRest(scene.nodes.map((node) => node.id));
    }
  }

  function wake(resetTime = true) {
    if (disposed || frame || !intersecting || document.hidden) return;
    if (resetTime) lastTime = performance.now();
    if (resetTime) host.dataset.galleryMotion = "moving";
    frame = requestAnimationFrame(render);
  }

  function pause() {
    cancelAnimationFrame(frame);
    frame = 0;
    host.dataset.galleryMotion = "paused";
  }

  const observer = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    if (intersecting) wake();
    else pause();
  });
  observer.observe(host);
  const onVisibility = () => {
    if (document.hidden) pause();
    else wake();
  };
  const onMotionPreference = () => wake();
  const onTheme = () => {
    if (ctx) ctx.fillStyle = getComputedStyle(host).color;
    wake();
  };
  const themeObserver = new MutationObserver(onTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  document.addEventListener("visibilitychange", onVisibility);
  reducedMotion.addEventListener("change", onMotionPreference);

  return {
    setScene(next: GalleryScene) {
      const first = poses.size === 0;
      const anchor = poses.values().next().value;
      for (const node of next.nodes) {
        if (!poses.has(node.id)) {
          poses.set(
            node.id,
            movingPose(
              first
                ? node.pose
                : {
                    ...node.pose,
                    x: anchor?.x.value ?? node.pose.x,
                    y: anchor?.y.value ?? node.pose.y,
                    opacity: 0,
                  },
            ),
          );
        }
      }
      targets = new Map(next.nodes.map((node) => [node.id, node.pose]));
      wheelTargets = new Map(next.nodes.map((node) => [node.id, node.wheel]));
      for (const [id, pose] of poses) {
        if (targets.has(id)) exits.delete(id);
        else if (!exits.has(id))
          exits.set(id, {
            x: pose.x.value,
            y: pose.y.value,
            scale: pose.scale.value,
            rotation: pose.rotation.value,
            opacity: 0,
          });
      }
      scene = next;
      connectionKeys = new Set(
        scene.connections.map(({ from, to }) => from + ":" + to),
      );
      for (const edge of scene.connections) {
        const key = edge.from + ":" + edge.to;
        if (edges.has(key)) continue;
        const from = poses.get(edge.from);
        const to = poses.get(edge.to);
        if (!from || !to) continue;
        const salt = hashUnit(key);
        const [c1, c2] = controls(point(from), point(to), salt);
        edges.set(key, {
          ...edge,
          salt,
          c1: movingPoint(c1),
          c2: movingPoint(c2),
          opacity: { value: first ? 1 : 0, velocity: 0 },
        });
      }
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(scene.width * ratio);
      const height = Math.round(scene.height * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (ctx) ctx.fillStyle = getComputedStyle(host).color;
      wake();
    },
    setDrag(offset: number, active = false) {
      drag = offset;
      exploring = active;
      wake();
    },
    dispose() {
      disposed = true;
      pause();
      observer.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotion.removeEventListener("change", onMotionPreference);
    },
  };
}
