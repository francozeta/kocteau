import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const target = new URL(
  process.env.DISCOVERY_CANVAS_URL || "http://127.0.0.1:3005",
);
assert.equal(target.hostname, "127.0.0.1", "Canvas fixtures require loopback");
const mobile = process.env.DISCOVERY_CANVAS_DESKTOP !== "1";
const seed = (index) => ({
  id: `canvas-fixture-${index}`,
  provider: "deezer",
  entityId: null,
  provider_id: String(90909100 + index),
  type: "track",
  title:
    index === 0
      ? "A deliberately long music title with enough words to test the selected caption"
      : `Canvas fixture ${index}`,
  artist_name: `Fixture artist ${index}`,
  artist_provider_id: null,
  deezer_url: null,
  cover_url: `https://cdn-images.dzcdn.net/images/cover/canvas-fixture-${index}/250x250-000000-80-0-0.jpg`,
});

async function openCanvas(browser) {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 },
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    (seeds) => {
      sessionStorage.setItem(
        "kocteau:discovery:v1:guest:session",
        JSON.stringify({
          scope: "kocteau:discovery:v1:guest:canvas",
          savedAt: Date.now(),
          session: {
            frames: [
              {
                id: "canvas-fixture",
                focus: null,
                depth: 0,
                resolved: false,
                nodes: seeds.map((seed) => ({
                  seed,
                  from: null,
                  reason: "Starting point",
                  depth: 0,
                })),
              },
            ],
            cursor: 0,
          },
        }),
      );
    },
    Array.from({ length: 16 }, (_, index) => seed(index)),
  );
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.resourceType() === "image") {
      return route.fulfill({
        contentType: "image/svg+xml",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#666"/></svg>',
      });
    }
    return url.hostname === "127.0.0.1"
      ? route.continue()
      : route.fulfill({ status: 204 });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/discovery/map?**", (route) =>
    route.fulfill({
      json: {
        groups: [
          {
            id: "nearby",
            recommendations: Array.from({ length: 12 }, (_, index) => ({
              ...seed(index + 20),
              score: 20,
              source: "deezer-related",
              reason: "Fixture recommendation",
            })),
          },
        ],
      },
    }),
  );
  await page.goto(new URL("/search", target).href, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(
    () =>
      window.history.state?.discovery?.session?.frames[0]?.id ===
      "canvas-fixture",
  );
  return { context, page, errors };
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const { context, page, errors } = await openCanvas(browser);
  const title = seed(0).title;
  const first = page.getByRole("button", {
    name: `${title} by Fixture artist 0 — Find similar music`,
    exact: true,
  });
  await first.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/90909100$/);
  await page.waitForFunction(() => {
    const label = document.querySelector(
      '[data-discovery-cover-label][data-current="true"]',
    );
    return (
      label?.getAttribute("data-visible") === "true" &&
      document.querySelectorAll(
        '[data-discovery-cover-label][data-visible="true"]',
      ).length > 1
    );
  });
  await page.waitForTimeout(250);
  const caption = page.locator(
    '[data-discovery-cover-label][data-current="true"]',
  );
  assert.equal(
    await caption.evaluate((node) => getComputedStyle(node).textAlign),
    "start",
    "A reused background caption must adopt the current music's alignment",
  );
  assert((await caption.textContent()).includes(title));
  const identity = page.locator("[data-discovery-focus]:visible");
  assert(
    (await identity.first().getAttribute("aria-label")).includes(title),
    "Full identity remains accessible beyond the clamped caption",
  );
  const transforms = () =>
    page
      .locator("[data-discovery-cover-label]")
      .evaluateAll((labels) => labels.map((label) => label.style.transform));
  const still = await transforms();
  await page.waitForTimeout(150);
  assert.deepEqual(
    await transforms(),
    still,
    "Reduced motion has no automatic rotation",
  );
  await page.evaluate(() => document.activeElement?.blur());

  const canvas = page.locator(
    '[aria-label="A draggable 3D sphere of music covers"] canvas',
  );
  const bounds = await canvas.boundingBox();
  assert(bounds && bounds.width > 0);
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const current = () =>
    page.evaluate(() => {
      const session = history.state.discovery.session;
      return {
        providerId: session.frames[session.cursor].focus.provider_id,
        cursor: session.cursor,
      };
    });
  const before = await current();
  if (mobile) await page.touchscreen.tap(center.x, center.y);
  else await page.mouse.click(center.x, center.y);
  assert.deepEqual(
    await current(),
    before,
    "The visible current cover must win over music painted behind it",
  );
  if (mobile) await page.touchscreen.tap(center.x + 50, center.y - 50);
  else await page.mouse.click(center.x + 50, center.y - 50);
  assert.deepEqual(
    await current(),
    before,
    "The current artwork's upper-right area must also select the visible music",
  );

  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.mouse.move(center.x + 70, center.y + 35, { steps: 10 });
  await page.mouse.up();
  assert.deepEqual(await current(), before, "A drag must not select music");
  const another = page
    .locator(
      '[aria-label="Music covers in this discovery map"] button:not([aria-current])',
    )
    .first();
  await another.focus();
  assert(await another.evaluate((node) => node.matches(":focus-visible")));
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const session = history.state.discovery.session;
    return session.frames[session.cursor].focus.provider_id !== "90909100";
  });
  await page.goBack();
  await page.waitForURL(/\/90909100$/);
  await caption.waitFor();
  assert((await caption.textContent()).includes(title));
  const depthBefore = await page.evaluate(
    () => history.state.discovery.historyDepth,
  );
  await another.focus();
  await another.click();
  await page.waitForFunction(() => {
    const session = history.state.discovery.session;
    return session.frames[session.cursor].focus.provider_id !== "90909100";
  });
  assert.equal(
    await page.evaluate(() => history.state.discovery.historyDepth),
    depthBefore + 1,
    "Clicking a native cover control must not also trigger the sphere gesture",
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.route("**/api/search?**", (route) =>
    route.fulfill({
      json: [
        {
          ...seed(99),
          cover_url: null,
          source: "deezer",
        },
      ],
    }),
  );
  const searchTrigger = page.getByRole("button", {
    name: "Search music",
    exact: true,
  });
  if (await searchTrigger.isVisible()) await searchTrigger.click();
  const input = page.locator("[data-global-search-input]:visible");
  await input.fill(seed(99).title);
  await page
    .getByRole("button", { name: new RegExp(seed(99).title) })
    .first()
    .waitFor();
  await input.press("Enter");
  await page.waitForURL(/\/90909199$/);
  await page.waitForTimeout(350);
  assert.equal(
    await caption.count(),
    0,
    "A seed without artwork must not label a different cover as current",
  );
  const firstBackgroundX = await page
    .locator("[data-discovery-cover-label]")
    .first()
    .evaluate((label) =>
      Number(label.style.transform.match(/translate3d\(([^p]+)px/)[1]),
    );
  assert(
    Math.abs(firstBackgroundX - bounds.width / 2) > 1,
    "Missing artwork must not turn the first retained cover into the center anchor",
  );
  assert.deepEqual(errors, []);
  await context.close();
} finally {
  await browser.close();
}

const fallbackBrowser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-webgl"],
});
try {
  const { context, page, errors } = await openCanvas(fallbackBrowser);
  const first = page.getByRole("button", {
    name: `${seed(0).title} by Fixture artist 0 — Find similar music`,
    exact: true,
  });
  await page.waitForFunction(() => {
    const button = document.querySelector(
      '[aria-label="Music covers in this discovery map"] button',
    );
    return button && button.getBoundingClientRect().width > 40;
  });
  await first.click();
  await page.waitForURL(/\/90909100$/);
  assert.deepEqual(
    errors,
    [],
    "WebGL failure must leave native selection usable",
  );
  await context.close();
} finally {
  await fallbackBrowser.close();
}
console.log(
  JSON.stringify({
    mobile,
    result: "passed",
    states: [
      "long identity",
      "rendered covers",
      "reduced motion",
      "paint-order pointer selection",
      "drag",
      "keyboard",
      "Back",
      "missing artwork",
      "WebGL fallback",
    ],
  }),
);
