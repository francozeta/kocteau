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
const FOCUS_EASE = 0.14;
const FOCUS_DISTANCE = 300;
const FOCUS_FILL = 0.62;
const FOCUS_WIDTH_FILL = 0.74;
const BACKDROP_DIM = 0.16;
const STALE_FADE_MS = 420;

export type ImageSphereHoverPosition = {
  x: number;
  y: number;
};

export interface ImageSphereOptions {
  distance?: number;
  fov?: number;
  autoRotate?: boolean;
  initialFocusIndex?: number;
  hideFocusedPlane?: boolean;
  onHoverChange?: (
    index: number | null,
    position?: ImageSphereHoverPosition,
  ) => void;
  onFocusChange?: (index: number | null) => void;
  onSelect?: (index: number) => void;
}

type PlaneMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

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
  private focused: PlaneMesh | null = null;
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
  private initialFocusIndex?: number;
  private hideFocusedPlane: boolean;
  private onHoverChange?: ImageSphereOptions["onHoverChange"];
  private onFocusChange?: (index: number | null) => void;
  private onSelect?: (index: number) => void;

  constructor(
    host: HTMLElement,
    imageUrls: string[],
    options: ImageSphereOptions = {},
  ) {
    this.host = host;
    this.autoRotate = options.autoRotate ?? true;
    this.initialFocusIndex = options.initialFocusIndex;
    this.hideFocusedPlane = options.hideFocusedPlane ?? false;
    this.onHoverChange = options.onHoverChange;
    this.onFocusChange = options.onFocusChange;
    this.onSelect = options.onSelect;
    const width = host.clientWidth || 1;
    const height = host.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

    this.updateImages(imageUrls, {
      initialFocusIndex: this.initialFocusIndex,
    });
    this.bindEvents();
  }

  updateImages(
    urls: string[],
    { initialFocusIndex }: { initialFocusIndex?: number } = {},
  ) {
    if (this.disposed) {
      return;
    }

    const generation = ++this.imageGeneration;
    this.initialFocusIndex = initialFocusIndex;
    const nextUrls = Array.from(new Set(urls));
    const nextUrlSet = new Set(nextUrls);
    const reusableByUrl = new Map<string, PlaneMesh>();

    for (const plane of this.planes) {
      const imageUrl = plane.userData.imageUrl as string | undefined;

      if (imageUrl && nextUrlSet.has(imageUrl) && !reusableByUrl.has(imageUrl)) {
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
      reusable.userData.removalTimer = undefined;
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

      if (plane === this.focused) {
        this.focused = null;
        this.onFocusChange?.(null);
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

        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        const image = texture.image as { width?: number; height?: number };
        const aspect = (image.width || 1) / (image.height || 1);
        const geometry = new THREE.PlaneGeometry(
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
          focus: 0,
          aspect,
          imageUrl: url,
          stale: false,
        };
        material.opacity = 0;

        const phi = (Math.random() * 2 - 1) * Math.PI;
        const theta = Math.random() * Math.PI * 2;
        const radius = RADIUS + (Math.random() - 0.5) * 80;

        plane.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
        );
        plane.userData.home = plane.position.clone();
        this.group.add(plane);
        this.planes.push(plane);

        if (index === initialFocusIndex) {
          this.focused = plane;
          plane.userData.focus = 1;
          this.centerPos.set(0, 0, this.camera.position.z - FOCUS_DISTANCE);
          this.tmpPos.copy(this.centerPos);
          this.group.worldToLocal(this.tmpPos);
          plane.position.copy(this.tmpPos);
          this.onFocusChange?.(index);
        }

        if (!this.running) {
          this.renderStill();
        }
      });
    });

    if (this.focused) {
      this.onFocusChange?.(this.focused.userData.index as number);
    }
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

      if (this.focused) {
        this.focused = hit === this.focused ? null : hit;
      } else {
        this.focused = hit;
      }

      this.onFocusChange?.(
        this.focused ? (this.focused.userData.index as number) : null,
      );
    };
    const onLeave = () => {
      release();
      this.mouse.set(-2, -2);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !this.focused) {
        return;
      }

      this.focused = null;
      this.onFocusChange?.(null);
    };

    window.addEventListener("keydown", onKey);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    host.addEventListener("pointerleave", onLeave);
    this.cleanup.push(() => {
      window.removeEventListener("keydown", onKey);
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
    const distance = Math.max(1, this.camera.position.distanceTo(this.worldPos));
    const viewHeight =
      2 * distance * Math.tan((this.camera.fov * Math.PI) / 360);
    const planeHeight = PLANE_SIZE * plane.scale.y;
    const pixelHeight = (planeHeight / viewHeight) * rect.height;
    this.tmpPos.copy(this.worldPos).project(this.camera);

    return {
      x: ((this.tmpPos.x + 1) / 2) * rect.width,
      y: ((1 - this.tmpPos.y) / 2) * rect.height + pixelHeight / 2 + 10,
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

    if (this.autoRotate && !this.dragging && !this.hovered && !this.focused) {
      this.baseRotationY += AUTO_ROT_Y;
      this.baseRotationX += AUTO_ROT_X;
    }

    this.currentRotationX +=
      (this.rotationX - this.currentRotationX) * DRAG_EASE;
    this.currentRotationY +=
      (this.rotationY - this.currentRotationY) * DRAG_EASE;
    this.group.rotation.x =
      this.baseRotationX + this.currentRotationX * 0.002;
    this.group.rotation.y =
      this.baseRotationY + this.currentRotationY * 0.002;

    if (!this.dragging && !this.focused) {
      this.hoverDetection();
    } else if (this.focused && this.hovered) {
      this.hovered.userData.isHovered = false;
      this.hovered = null;
      this.onHoverChange?.(null);
    }

    const anyFocused = this.focused !== null;
    this.centerPos.set(0, 0, this.camera.position.z - FOCUS_DISTANCE);
    const viewHeight =
      2 *
      FOCUS_DISTANCE *
      Math.tan((this.camera.fov * Math.PI) / 360);
    const viewWidth = viewHeight * this.camera.aspect;
    const focusScale =
      Math.min(viewHeight * FOCUS_FILL, viewWidth * FOCUS_WIDTH_FILL) /
      PLANE_SIZE;
    this.invQuat.copy(this.group.quaternion).invert();

    for (const plane of this.planes) {
      plane.quaternion.copy(this.invQuat);
      const focusTarget = plane === this.focused ? 1 : 0;
      const focus =
        plane.userData.focus +
        (focusTarget - plane.userData.focus) * FOCUS_EASE;
      plane.userData.focus = focus;

      if (focus > 0.0005) {
        this.tmpPos.copy(this.centerPos);
        this.group.worldToLocal(this.tmpPos);
        plane.position.copy(plane.userData.home).lerp(this.tmpPos, focus);
      } else if (
        plane.position.x !== plane.userData.home.x ||
        plane.position.z !== plane.userData.home.z
      ) {
        plane.position.copy(plane.userData.home);
      }

      plane.getWorldPosition(this.worldPos);
      const depth = this.worldPos.z;
      const depthScale = 0.8 + depth / 2000;
      let targetScale = plane.userData.isHovered
        ? depthScale * HOVER_SCALE
        : depthScale;
      targetScale = targetScale + (focusScale - targetScale) * focus;
      const scale =
        plane.scale.x + (targetScale - plane.scale.x) * SCALE_EASE;
      plane.scale.set(scale, scale, scale);

      let targetOpacity = plane.userData.stale ? 0 : 1;

      if (anyFocused && !plane.userData.stale) {
        targetOpacity = BACKDROP_DIM + (1 - BACKDROP_DIM) * focus;

        if (plane === this.focused && this.hideFocusedPlane) {
          targetOpacity = 0;
        }
      }

      const opacity =
        plane.userData.opacity +
        (targetOpacity - plane.userData.opacity) * OPACITY_EASE;
      plane.userData.opacity = opacity;
      plane.material.opacity = opacity;
      plane.renderOrder = focus > 0.5 ? 1 : 0;
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  renderStill() {
    this.invQuat.copy(this.group.quaternion).invert();

    for (const plane of this.planes) {
      plane.quaternion.copy(this.invQuat);
      plane.getWorldPosition(this.worldPos);
      const depthScale = 0.8 + this.worldPos.z / 2000;
      plane.scale.set(depthScale, depthScale, depthScale);
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
