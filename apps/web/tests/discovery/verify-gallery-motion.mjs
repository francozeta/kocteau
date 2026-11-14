import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const browserName = process.env.GALLERY_BROWSER || "chromium";
assert.ok(["chromium", "webkit"].includes(browserName));
const engine = browserName === "webkit" ? webkit : chromium;
const target = new URL(
  process.env.GALLERY_URL || "http://localhost:3000/search",
);
const local = ["localhost", "127.0.0.1"].includes(target.hostname);
assert.ok(
  local || target.hostname.endsWith(".vercel.app"),
  "Use an isolated app or an authorized preview",
);
const width = Number(process.env.GALLERY_WIDTH || 390);
const height = Number(process.env.GALLERY_HEIGHT || 844);
const browser = await engine.launch({
  headless: process.env.GALLERY_HEADED !== "1",
  ...(browserName === "chromium" && process.env.GALLERY_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.GALLERY_CHROMIUM_EXECUTABLE }
    : {}),
});
const context = await browser.newContext({
  locale: "en-US",
  viewport: { width, height },
  deviceScaleFactor: 3,
  hasTouch: width < 768,
  isMobile: width < 768,
});
const page = await context.newPage();
const controlledClock = process.env.GALLERY_CONTROLLED_CLOCK === "1";
if (controlledClock) await page.clock.install();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.addInitScript(() => {
    const diagnostics = (window.galleryDiagnostics = {
      frames: 0,
      durations: [],
      endpoints: 0,
      maxEndpointError: 0,
      checkEndpoints: false,
    });
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      raf((time) => {
        const frames = diagnostics.frames;
        const start = performance.now();
        callback(time);
        if (diagnostics.frames !== frames && !diagnostics.checkEndpoints) {
          diagnostics.durations.push(performance.now() - start);
        }
      });
    const prototype = CanvasRenderingContext2D.prototype;
    const clear = prototype.clearRect;
    prototype.clearRect = function (...args) {
      if (this.canvas.hasAttribute("data-discovery-ink"))
        diagnostics.frames += 1;
      return clear.apply(this, args);
    };
    const paths = new WeakMap();
    for (const method of ["beginPath", "moveTo", "lineTo", "fill"]) {
      const original = prototype[method];
      prototype[method] = function (...args) {
        if (
          diagnostics.checkEndpoints &&
          this.canvas.hasAttribute("data-discovery-ink")
        ) {
          if (method === "beginPath") paths.set(this, []);
          else if (method === "moveTo" || method === "lineTo")
            paths.get(this)?.push(args);
          else if (method === "fill" && this.globalAlpha > 0.02) {
            const path = paths.get(this);
            if (path?.length >= 4) {
              const bounds = this.canvas.getBoundingClientRect();
              const anchors = [
                ...this.canvas.parentElement.querySelectorAll(
                  "[data-discovery-gallery-card]",
                ),
              ]
                .map((card) => card.firstElementChild.getBoundingClientRect())
                .map((rect) => [
                  rect.x + rect.width / 2 - bounds.x,
                  rect.y + rect.height / 2 - bounds.y,
                ]);
              const half = path.length / 2;
              for (const [a, b] of [
                [path[0], path.at(-1)],
                [path[half - 1], path[half]],
              ]) {
                const x = (a[0] + b[0]) / 2;
                const y = (a[1] + b[1]) / 2;
                const distance = Math.min(
                  ...anchors.map((p) => Math.hypot(p[0] - x, p[1] - y)),
                );
                diagnostics.maxEndpointError = Math.max(
                  diagnostics.maxEndpointError,
                  distance,
                );
                diagnostics.endpoints += 1;
              }
            }
          }
        }
        return original.apply(this, args);
      };
    }
  });
  // Renderer checks must not depend on recommendation provider availability.
  if (local)
    await page.route("**/api/discovery/map?**", (route) =>
      route.fulfill({ json: { groups: [] } }),
    );
  await page.goto(target.href, { waitUntil: "networkidle" });
  const gallery = page.locator("[data-discovery-gallery]");
  await gallery.waitFor();
  await page.waitForFunction(() => {
    const cards = [
      ...document.querySelectorAll("[data-discovery-gallery-card]"),
    ];
    const expected = matchMedia("(max-width: 767px)").matches ? 6 : 7;
    const canvas = document.querySelector("[data-discovery-ink]");
    const center = document.querySelector('[data-gallery-center="true"]');
    return (
      window.galleryDiagnostics.frames > 0 &&
      canvas.width ===
        Math.round(canvas.clientWidth * Math.min(devicePixelRatio, 2)) &&
      Number(center?.style.opacity) > 0.99 &&
      cards.length === expected &&
      cards.every((card) => card.getAttribute("aria-hidden") !== "true")
    );
  });

  async function rest() {
    await page.waitForFunction(
      () =>
        document.querySelector("[data-discovery-gallery]")?.dataset
          .galleryMotion === "rest",
    );
  }
  async function idle() {
    await rest();
    const before = await page.evaluate(() => window.galleryDiagnostics.frames);
    await page.waitForTimeout(450);
    assert.equal(
      await page.evaluate(() => window.galleryDiagnostics.frames),
      before,
      "Idle ink must not repaint",
    );
  }

  await idle();
  await page.evaluate(() => {
    window.galleryOriginalCards = [
      ...document.querySelectorAll("[data-discovery-gallery-card]"),
    ];
    window.galleryDiagnostics.checkEndpoints = true;
  });
  await gallery.focus();
  await gallery.evaluate(async (element) => {
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 120));
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
  });
  await idle();
  assert.equal(
    await page.evaluate(() =>
      window.galleryOriginalCards.every((card) => card.isConnected),
    ),
    true,
    "Reversing before exit finishes must preserve original card elements",
  );
  const endpoints = await page.evaluate(() => ({
    checked: window.galleryDiagnostics.endpoints,
    maxError: window.galleryDiagnostics.maxEndpointError,
  }));
  assert.ok(
    endpoints.checked >= 20,
    "Observe ink throughout the interrupted transition",
  );
  assert.ok(
    endpoints.maxError < 1,
    `Ink detached from artwork by ${endpoints.maxError}px`,
  );
  await page.evaluate(() => {
    window.galleryDiagnostics.checkEndpoints = false;
    window.galleryDiagnostics.durations = [];
  });

  const original = await page
    .locator('[data-gallery-center="true"]')
    .getAttribute("aria-label");
  const bounds = await gallery.boundingBox();
  const x = bounds.x + bounds.width * 0.45;
  const y = bounds.y + bounds.height * 0.53;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y + 2, { steps: 14 });
  await page.waitForFunction(
    () =>
      document.querySelector("[data-discovery-gallery]")?.dataset.dragging ===
      "true",
  );
  await page.waitForTimeout(1100);
  assert.equal(await gallery.getAttribute("data-gallery-composition"), "wheel");
  await page.mouse.move(x - 50, y, { steps: 12 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await idle();
  assert.equal(await gallery.getAttribute("data-dragging"), "false");
  assert.notEqual(
    await page
      .locator('[data-gallery-center="true"]')
      .getAttribute("aria-label"),
    original,
    "A completed swipe must move focus without activating music",
  );
  assert.equal(new URL(page.url()).pathname, "/search");
  const timings = await page.evaluate(() =>
    window.galleryDiagnostics.durations.sort((a, b) => a - b),
  );

  const preferenceStart = await page.evaluate(
    () => window.galleryDiagnostics.frames,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    (frames) => window.galleryDiagnostics.frames > frames,
    preferenceStart,
  );
  await idle();
  const reducedStart = await page.evaluate(
    () => window.galleryDiagnostics.frames,
  );
  await gallery.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  const reducedFrames =
    (await page.evaluate(() => window.galleryDiagnostics.frames)) -
    reducedStart;
  assert.ok(reducedFrames <= 2, "Reduced motion should resolve in one frame");
  await idle();

  // Offscreen interruption must pause and resume the same animation, not reset it.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.keyboard.press("ArrowLeft");
  await gallery.evaluate((element) => {
    element.style.transform = "translateX(200vw)";
  });
  await page.waitForTimeout(150);
  const offscreen = await page.evaluate(() => window.galleryDiagnostics.frames);
  await page.waitForTimeout(450);
  assert.equal(
    await page.evaluate(() => window.galleryDiagnostics.frames),
    offscreen,
  );
  await gallery.evaluate((element) => {
    element.style.transform = "";
  });
  await page.waitForFunction(
    (frames) => window.galleryDiagnostics.frames > frames,
    offscreen,
  );
  await idle();

  const dimensions = await page
    .locator("[data-discovery-ink]")
    .evaluate((canvas) => ({
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
    }));
  assert.ok(
    dimensions.width <= dimensions.cssWidth * 2 + 1 &&
      dimensions.height <= dimensions.cssHeight * 2 + 1,
    "Canvas resolution must remain bounded on a 3x phone display",
  );
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        browser: browserName,
        clock: controlledClock ? "controlled" : "native",
        viewport: { width, height },
        endpoints,
        idleRepaints: 0,
        reducedFrames,
        offscreenRepaints: 0,
        rendererFrameMs: controlledClock
          ? null
          : {
              p95: timings[Math.floor(timings.length * 0.95)],
              max: timings.at(-1),
            },
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  await browser.close();
}
