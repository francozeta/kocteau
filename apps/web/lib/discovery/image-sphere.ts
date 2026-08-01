import * as THREE from "three";

const RADIUS = 180;
const PLANE_SIZE = 50;
const AUTO_ROT_Y = 0.0005;
const AUTO_ROT_X = 0.0002;
const DRAG_EASE = 0.2;
const HOVER_SCALE = 1.2;
const SCALE_EASE = 0.1;
const OPACITY_EASE = 0.12;
const INERTIA_DECAY = 0.94;
const FLICK_SCALE = 0.9;
const CLICK_SLOP = 6;
const STALE_FADE_MS = 620;
const HOME_EASE = 0.075;
const ANCHOR_WORLD_Z = 72;
const ANCHOR_SCALE = 1.08;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function hashFraction(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4_294_967_295;
}

function getSphereHome(index: number, count: number, imageUrl: string) {
  const safeCount = Math.max(1, count);
  const vertical = 1 - (2 * (index + 0.5)) / safeCount;
  const ring = Math.sqrt(Math.max(0, 1 - vertical * vertical));
  const angle = GOLDEN_ANGLE * index + hashFraction(imageUrl) * 0.4;
  const radius = RADIUS + (hashFraction(`${imageUrl}:radius`) - 0.5) * 54;

  return new THREE.Vector3(
    radius * ring * Math.cos(angle),
    radius * vertical,
    radius * ring * Math.sin(angle),
  );
}

function createRoundedPlaneGeometry(width: number, height: number) {
  const radius = Math.min(width, height) * 0.035;
  const left = -width / 2;
  const right = width / 2;
  const bottom = -height / 2;
  const top = height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);

  const geometry = new THREE.ShapeGeometry(shape, 4);
  const positions = geometry.getAttribute("position");
  const uvs = new Float32Array(positions.count * 2);

  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = (positions.getX(index) - left) / width;
    uvs[index * 2 + 1] = (positions.getY(index) - bottom) / height;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

export type ImageSphereHoverPosition = {
  x: number;
  y: number;
};

export interface ImageSphereOptions {
  distance?: number;
  fov?: number;
  autoRotate?: boolean;
  anchorIndex?: number;
  onReady?: () => void;
  onHoverChange?: (
    index: number | null,
    position?: ImageSphereHoverPosition,
  ) => void;
  onHoverMove?: (position: ImageSphereHoverPosition) => void;
  onSelect?: (index: number) => void;
}

type PlaneMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

export class ImageSphere {
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private planes: PlaneMesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-2, -2);
  private hovered: PlaneMesh | null = null;
  private rotationX = 0;
  private rotationY = 0;
  private currentRotationX = 0;
  private currentRotationY = 0;
  private baseRotationX = 0;
  private baseRotationY = 0;
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private velX = 0;
  private velY = 0;
  private lastDX = 0;
  private lastDY = 0;
  private invQuat = new THREE.Quaternion();
  private worldPos = new THREE.Vector3();
  private centerPos = new THREE.Vector3();
  private tmpPos = new THREE.Vector3();
  private raf = 0;
  private running = false;
  private disposed = false;
  private imageGeneration = 0;
  private ro?: ResizeObserver;
  private cleanup: Array<() => void> = [];
  private removalTimers = new Set<ReturnType<typeof setTimeout>>();
  private autoRotate: boolean;
  private anchorIndex?: number;
  private readyNotified = false;
  private onReady?: () => void;
  private onHoverChange?: ImageSphereOptions["onHoverChange"];
  private onHoverMove?: ImageSphereOptions["onHoverMove"];
  private onSelect?: (index: number) => void;

  constructor(
    host: HTMLElement,
    imageUrls: string[],
    options: ImageSphereOptions = {},
  ) {
    this.host = host;
    this.autoRotate = options.autoRotate ?? true;
    this.anchorIndex = options.anchorIndex;
    this.onReady = options.onReady;
    this.onHoverChange = options.onHoverChange;
    this.onHoverMove = options.onHoverMove;
    this.onSelect = options.onSelect;
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, width < 640 ? 1.5 : 2);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);
    const canvas = this.renderer.domElement;

    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      zIndex: "1",
      cursor: "grab",
      touchAction: "none",
    });
    host.appendChild(canvas);

    this.camera = new THREE.PerspectiveCamera(
      options.fov ?? 25,
      width / height,
      0.1,
      2000,
    );
    this.camera.position.z = options.distance ?? 520;
    this.scene.add(this.group);

    this.updateImages(imageUrls, { anchorIndex: this.anchorIndex });
    this.bindEvents();
  }

  updateImages(urls: string[], { anchorIndex }: { anchorIndex?: number } = {}) {
    if (this.disposed) {
      return;
    }

    const generation = ++this.imageGeneration;
    this.anchorIndex = anchorIndex;
    const nextUrls = Array.from(new Set(urls));
    const nextUrlSet = new Set(nextUrls);
    const reusableByUrl = new Map<string, PlaneMesh>();

    if (this.hovered) {
      this.hovered.userData.isHovered = false;
      this.hovered = null;
      this.onHoverChange?.(null);
    }

    for (const plane of this.planes) {
      const imageUrl = plane.userData.imageUrl as string | undefined;

      if (
        imageUrl &&
        nextUrlSet.has(imageUrl) &&
        !reusableByUrl.has(imageUrl)
      ) {
        reusableByUrl.set(imageUrl, plane);
      }
    }

    nextUrls.forEach((url, index) => {
      const reusable = reusableByUrl.get(url);

      if (!reusable) {
        return;
      }

      const removalTimer = reusable.userData.removalTimer as
        | ReturnType<typeof setTimeout>
        | undefined;

      if (removalTimer) {
        clearTimeout(removalTimer);
        this.removalTimers.delete(removalTimer);
      }

      reusable.userData.index = index;
      reusable.userData.stale = false;
      reusable.userData.isAnchor = index === anchorIndex;
      reusable.userData.removalTimer = undefined;
      reusable.userData.homeTarget =
        index === anchorIndex
          ? undefined
          : getSphereHome(index, nextUrls.length, url);
    });

    for (const plane of this.planes) {
      const imageUrl = plane.userData.imageUrl as string | undefined;

      if (imageUrl && reusableByUrl.get(imageUrl) === plane) {
        continue;
      }

      plane.userData.stale = true;
      plane.userData.isHovered = false;

      if (plane === this.hovered) {
        this.hovered = null;
        this.onHoverChange?.(null);
      }

      const removalTimer = setTimeout(() => {
        this.removalTimers.delete(removalTimer);

        if (!plane.userData.stale || this.disposed) {
          return;
        }

        this.removePlane(plane);
      }, STALE_FADE_MS);

      plane.userData.removalTimer = removalTimer;
      this.removalTimers.add(removalTimer);
    }

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    nextUrls.forEach((url, index) => {
      if (reusableByUrl.has(url)) {
        return;
      }

      loader.load(url, (texture) => {
        if (this.disposed || generation !== this.imageGeneration) {
          texture.dispose();
          return;
        }

        texture.anisotropy = Math.min(
          this.renderer.capabilities.getMaxAnisotropy(),
          4,
        );
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const image = texture.image as { width?: number; height?: number };
        const aspect = (image.width || 1) / (image.height || 1);
        const geometry = createRoundedPlaneGeometry(
          PLANE_SIZE * aspect,
          PLANE_SIZE,
        );
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });

        material.depthWrite = false;
        const plane = new THREE.Mesh(geometry, material) as PlaneMesh;
        plane.userData = {
          index,
          isHovered: false,
          opacity: 0,
          aspect,
          imageUrl: url,
          stale: false,
          isAnchor: index === anchorIndex,
        };
        material.opacity = 0;

        const home =
          index === anchorIndex
            ? new THREE.Vector3(0, 0, ANCHOR_WORLD_Z)
            : getSphereHome(index, nextUrls.length, url);

        plane.position.copy(home);
        plane.userData.home = plane.position.clone();
        plane.userData.homeTarget = home.clone();
        this.group.add(plane);
        this.planes.push(plane);

        if (!this.running) {
          this.renderStill();
        }

        if (!this.readyNotified) {
          this.readyNotified = true;
          this.onReady?.();
        }
      });
    });
  }

  private removePlane(plane: PlaneMesh) {
    const index = this.planes.indexOf(plane);

    if (index >= 0) {
      this.planes.splice(index, 1);
    }

    this.group.remove(plane);
    plane.geometry.dispose();
    plane.material.map?.dispose();
    plane.material.dispose();
  }

  private bindEvents() {
    const host = this.host;
    const localMouse = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    let downX = 0;
    let downY = 0;
    const onDown = (event: PointerEvent) => {
      this.dragging = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
      downX = event.clientX;
      downY = event.clientY;
      this.velX = 0;
      this.velY = 0;
      this.lastDX = 0;
      this.lastDY = 0;
      this.renderer.domElement.style.cursor = "grabbing";
      this.renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      localMouse(event.clientX, event.clientY);

      if (!this.dragging) {
        return;
      }

      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;
      this.rotationY += deltaX;
      this.rotationX -= deltaY;
      this.lastDX = deltaX;
      this.lastDY = deltaY;
      this.startX = event.clientX;
      this.startY = event.clientY;
    };
    const release = () => {
      if (!this.dragging) {
        return;
      }

      this.dragging = false;
      this.velY = this.lastDX * FLICK_SCALE;
      this.velX = -this.lastDY * FLICK_SCALE;
      this.renderer.domElement.style.cursor = "grab";
    };
    const onUp = (event: PointerEvent) => {
      const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
      release();

      if (moved > CLICK_SLOP || !this.running) {
        return;
      }

      this.velX = 0;
      this.velY = 0;
      localMouse(event.clientX, event.clientY);
      const hit = this.pick();

      if (hit) {
        this.onSelect?.(hit.userData.index as number);
      }
    };
    const onLeave = () => {
      release();
      this.mouse.set(-2, -2);
    };
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    host.addEventListener("pointerleave", onLeave);
    this.cleanup.push(() => {
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointerleave", onLeave);
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
  }

  private resize() {
    if (this.disposed) {
      return;
    }

    const width = this.host.clientWidth;
    const height = this.host.clientHeight;

    if (!width || !height) {
      return;
    }

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private pick(): PlaneMesh | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster
      .intersectObjects(this.planes, false)
      .filter((hit) => !hit.object.userData.stale);

    return (hits.length > 0 ? hits[0].object : null) as PlaneMesh | null;
  }

  private getHoverPosition(plane: PlaneMesh): ImageSphereHoverPosition {
    const rect = this.host.getBoundingClientRect();
    plane.getWorldPosition(this.worldPos);
    const distance = Math.max(
      1,
      this.camera.position.distanceTo(this.worldPos),
    );
    const viewHeight =
      2 * distance * Math.tan((this.camera.fov * Math.PI) / 360);
    const planeHeight = PLANE_SIZE * plane.scale.y;
    const pixelHeight = (planeHeight / viewHeight) * rect.height;
    this.tmpPos.copy(this.worldPos).project(this.camera);

    const x = ((this.tmpPos.x + 1) / 2) * rect.width;
    const y = ((1 - this.tmpPos.y) / 2) * rect.height + pixelHeight / 2 + 10;

    return {
      x: THREE.MathUtils.clamp(x, 88, Math.max(88, rect.width - 88)),
      y: THREE.MathUtils.clamp(y, 8, Math.max(8, rect.height - 48)),
    };
  }

  private hoverDetection() {
    const next = this.pick();

    if (next === this.hovered) {
      return;
    }

    if (this.hovered) {
      this.hovered.userData.isHovered = false;
    }

    this.hovered = next;

    if (this.hovered) {
      this.hovered.userData.isHovered = true;
    }

    this.onHoverChange?.(
      this.hovered ? (this.hovered.userData.index as number) : null,
      this.hovered ? this.getHoverPosition(this.hovered) : undefined,
    );
  }

  start() {
    if (this.running || this.disposed) {
      return;
    }

    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;

    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }

    this.raf = 0;
  }

  private loop = () => {
    if (!this.running) {
      return;
    }

    if (!this.dragging && (this.velX !== 0 || this.velY !== 0)) {
      this.rotationY += this.velY;
      this.rotationX -= this.velX;
      this.velX *= INERTIA_DECAY;
      this.velY *= INERTIA_DECAY;

      if (Math.abs(this.velX) < 0.01) this.velX = 0;
      if (Math.abs(this.velY) < 0.01) this.velY = 0;
    }

    if (this.autoRotate && !this.dragging && !this.hovered) {
      this.baseRotationY += AUTO_ROT_Y;
      this.baseRotationX += AUTO_ROT_X;
    }

    this.currentRotationX +=
      (this.rotationX - this.currentRotationX) * DRAG_EASE;
    this.currentRotationY +=
      (this.rotationY - this.currentRotationY) * DRAG_EASE;
    this.group.rotation.x = this.baseRotationX + this.currentRotationX * 0.002;
    this.group.rotation.y = this.baseRotationY + this.currentRotationY * 0.002;

    if (!this.dragging) {
      this.hoverDetection();
    }

    this.invQuat.copy(this.group.quaternion).invert();

    for (const plane of this.planes) {
      const home = plane.userData.home as THREE.Vector3;
      const homeTarget = plane.userData.homeTarget as THREE.Vector3 | undefined;
      const isAnchor = plane.userData.isAnchor === true;

      if (isAnchor) {
        this.centerPos.set(0, 0, ANCHOR_WORLD_Z);
        this.tmpPos.copy(this.centerPos);
        this.group.worldToLocal(this.tmpPos);
        home.lerp(this.tmpPos, HOME_EASE);
      } else if (homeTarget) {
        home.lerp(homeTarget, HOME_EASE);
      }

      plane.quaternion.copy(this.invQuat);
      if (
        plane.position.x !== home.x ||
        plane.position.y !== home.y ||
        plane.position.z !== home.z
      ) {
        plane.position.copy(home);
      }

      plane.getWorldPosition(this.worldPos);
      const depth = this.worldPos.z;
      const depthScale = 0.8 + depth / 2000;
      let targetScale = plane.userData.isHovered
        ? depthScale * HOVER_SCALE
        : depthScale;

      if (isAnchor) {
        targetScale *= ANCHOR_SCALE;
      }

      const scale = plane.scale.x + (targetScale - plane.scale.x) * SCALE_EASE;
      plane.scale.set(scale, scale, scale);

      const targetOpacity = plane.userData.stale ? 0 : 1;

      const opacityEase = plane.userData.stale ? 0.065 : OPACITY_EASE;
      const opacity =
        plane.userData.opacity +
        (targetOpacity - plane.userData.opacity) * opacityEase;
      plane.userData.opacity = opacity;
      plane.material.opacity = opacity;
      plane.renderOrder = isAnchor ? 1 : 0;
    }

    if (this.hovered && !this.hovered.userData.stale) {
      this.onHoverMove?.(this.getHoverPosition(this.hovered));
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  renderStill() {
    this.invQuat.copy(this.group.quaternion).invert();

    for (const plane of this.planes) {
      if (plane.userData.isAnchor === true) {
        this.centerPos.set(0, 0, ANCHOR_WORLD_Z);
        this.tmpPos.copy(this.centerPos);
        this.group.worldToLocal(this.tmpPos);
        plane.position.copy(this.tmpPos);
      }

      plane.quaternion.copy(this.invQuat);
      plane.getWorldPosition(this.worldPos);
      const depthScale = 0.8 + this.worldPos.z / 2000;
      const scale =
        plane.userData.isAnchor === true
          ? depthScale * ANCHOR_SCALE
          : depthScale;
      plane.scale.set(scale, scale, scale);
      plane.userData.opacity = 1;
      plane.material.opacity = 1;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.disposed = true;
    this.stop();
    this.cleanup.forEach((cleanup) => cleanup());
    this.ro?.disconnect();
    this.removalTimers.forEach((timer) => clearTimeout(timer));
    this.removalTimers.clear();

    [...this.planes].forEach((plane) => this.removePlane(plane));

    this.renderer.dispose();
    this.renderer.forceContextLoss();
    const canvas = this.renderer.domElement;
    canvas.parentNode?.removeChild(canvas);
  }
}
