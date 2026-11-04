import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const target = new URL(
  process.env.SEARCH_INTERFACE_URL || "http://127.0.0.1:3002",
);
assert.equal(
  target.hostname,
  "127.0.0.1",
  "Failure fixtures are loopback-only",
);
const browserName = process.env.SEARCH_INTERFACE_BROWSER || "chromium";
assert(["chromium", "webkit"].includes(browserName));
const mobile = process.env.SEARCH_INTERFACE_DESKTOP !== "1";
const baseline = process.env.SEARCH_INTERFACE_BASELINE === "1";
const reduced = process.env.SEARCH_INTERFACE_REDUCED === "1";
const engine = browserName === "webkit" ? webkit : chromium;
const browser = await engine.launch({
  args: engine === chromium ? ["--no-sandbox"] : [],
});
const context = await browser.newContext({
  viewport: mobile
    ? { width: 390, height: 844 }
    : { width: 1440, height: 1000 },
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: reduced ? "reduce" : "no-preference",
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

// Observe the real WebGL context without editing renderer code or frame timing.
await page.addInitScript(() => {
  window.__discoveryProbe = {
    draws: [],
    lastDraws: 0,
    frames: [],
    labelWrites: 0,
    contexts: 0,
  };
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
    const gl = original.call(this, kind, ...args);
    if (gl && ["webgl", "webgl2"].includes(kind) && !gl.__observed) {
      gl.__observed = true;
      const probe = window.__discoveryProbe;
      probe.contexts++;
      const clear = gl.clear.bind(gl);
      gl.clear = (...values) => {
        probe.draws.push(probe.lastDraws);
        probe.lastDraws = 0;
        probe.frames.push(performance.now());
        return clear(...values);
      };
      const draw = gl.drawElements.bind(gl);
      gl.drawElements = (...values) => {
        probe.lastDraws++;
        return draw(...values);
      };
    }
    return gl;
  };
});

await context.route("**/*", (route) => {
  const url = new URL(route.request().url());
  if (
    url.pathname.includes("/storage/v1/object/public/discovery/") ||
    url.hostname.endsWith("dzcdn.net")
  ) {
    const hue =
      [...url.pathname].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
    return route.fulfill({
      contentType: "image/svg+xml",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="hsl(${hue} 35% 35%)"/><circle cx="128" cy="128" r="82" fill="hsl(${hue} 45% 62%)"/><path d="M0 200L256 56V256H0" fill="#101010"/></svg>`,
    });
  }
  if (url.origin === target.origin) return route.continue();
  return route.fulfill({ status: 204 });
});
let searchMode = "results";
let discoveryFails = false;
const results = [
  "track",
  "album",
  "artist",
  "track",
  "track",
  "album",
  "artist",
].map((type, i) => ({
  provider: "deezer",
  provider_id: String(990001 + i),
  type,
  title:
    i === 0
      ? "A long musical title that needs room to wrap without moving the controls"
      : `Search fixture ${i + 1}`,
  artist_name: type === "artist" ? null : "Interface test artist",
  cover_url: `http://127.0.0.1:54321/storage/v1/object/public/discovery/search-${i}.svg`,
  entity_id: null,
  artist_provider_id: null,
  source: "deezer",
}));
await page.route("**/api/search?**", async (route) => {
  if (searchMode === "slow")
    await new Promise((resolve) => setTimeout(resolve, 900));
  return route.fulfill({
    status: searchMode === "fail" ? 502 : 200,
    json:
      searchMode === "fail"
        ? { error: "Fixture failure" }
        : searchMode === "empty"
          ? []
          : results,
  });
});
await page.route("**/api/discovery/map?**", (route) =>
  route.fulfill({
    status: discoveryFails ? 502 : 200,
    json: discoveryFails ? { error: "Fixture failure" } : { groups: [] },
  }),
);

try {
  await page.goto(new URL("/search", target).href, {
    waitUntil: "domcontentloaded",
  });
  const canvas = page.locator(
    '[aria-label="A draggable 3D sphere of music covers"] canvas',
  );
  await canvas.waitFor();
  await page.waitForFunction(() =>
    window.__discoveryProbe?.draws.some((n) => n >= 6),
  );
  await page.evaluate(() => {
    window.__originalCanvas = document.querySelector(
      '[aria-label="A draggable 3D sphere of music covers"] canvas',
    );
    new MutationObserver((records) => {
      window.__discoveryProbe.labelWrites += records.length;
    }).observe(
      document.querySelector(
        '[aria-label="A draggable 3D sphere of music covers"]',
      ),
      { subtree: true, attributes: true, attributeFilter: ["style"] },
    );
  });
  const labels = page.locator("[data-discovery-cover-label]");
  if (!baseline)
    assert.equal(await labels.count(), 0, "No captions before selection");
  await page.waitForTimeout(400);
  const idleWrites = await page.evaluate(
    () => window.__discoveryProbe.labelWrites,
  );
  if (!baseline) assert.equal(idleWrites, 0, "No label style work at rest");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  if (!baseline)
    assert.equal(await labels.count(), 0, "Hover is not selection");
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.55, {
    steps: 12,
  });
  await page.mouse.up();
  if (!baseline) assert.equal(await labels.count(), 0, "Drag does not select");

  const covers = page.locator(
    '[aria-label="Music covers in this discovery map"] button',
  );
  await covers.first().focus();
  if (!baseline)
    assert.equal(await labels.count(), 0, "Keyboard focus is not selection");
  await covers.first().press("Enter");
  await page.waitForTimeout(500);
  if (!baseline) {
    assert.equal(await labels.count(), 1);
    assert.match(await labels.innerText(), /Song/i);
    assert((await labels.getAttribute("style"))?.includes("translate3d"));
  }
  assert(
    await page.evaluate(
      () =>
        window.__originalCanvas ===
        document.querySelector(
          '[aria-label="A draggable 3D sphere of music covers"] canvas',
        ),
    ),
  );
  await page.goBack();
  await page.waitForTimeout(200);
  if (!baseline)
    assert.equal(await labels.count(), 0, "Back removes the caption");

  // Activate actual WebGL hit testing with pointer/touch, not a DOM cover button.
  let selected = false;
  for (const y of [0.3, 0.5, 0.7]) {
    for (const x of [0.25, 0.5, 0.75]) {
      if (mobile)
        await page.touchscreen.tap(
          box.x + box.width * x,
          box.y + box.height * y,
        );
      else
        await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
      await page.waitForTimeout(80);
      if (new URL(page.url()).pathname !== "/search") {
        selected = true;
        break;
      }
    }
    if (selected) break;
  }
  assert(selected, "Pointer/touch selects a cover through the renderer");
  if (!baseline) assert.equal(await labels.count(), 1);
  await page.goBack();
  await page.waitForTimeout(200);

  const input = page.locator("[data-global-search-input]:visible");
  searchMode = "slow";
  await input.fill("listening");
  await page.locator('[aria-label="Searching the catalog"]').waitFor();
  if (!baseline)
    assert.equal(
      await page
        .locator('[aria-label="Searching the catalog"] .animate-pulse')
        .count(),
      0,
    );
  await page
    .locator("[data-search-result]")
    .first()
    .waitFor()
    .catch((error) => {
      if (!baseline) throw error;
    });
  if (!baseline) {
    await input.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    const keyboardType = await page.evaluate(() =>
      document.activeElement.getAttribute("aria-label").split(" — ").at(-1),
    );
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    assert.match(await labels.innerText(), new RegExp(keyboardType, "i"));
    assert.equal(await labels.count(), 1);
    await page.goBack();
    await page.waitForTimeout(200);
    await input.fill("album selection");
    await page
      .getByRole("button", { name: /— Album$/i })
      .first()
      .click();
    assert.match(await labels.innerText(), /Album/i);
    await page.goBack();
    await page.waitForTimeout(200);
    await input.fill("artist selection");
    await page
      .getByRole("button", { name: /— Artist$/i })
      .first()
      .click();
    assert.match(await labels.innerText(), /Artist/i);
    assert(!/Interface test artist/.test(await labels.innerText()));
    await page.goBack();
    await page.waitForTimeout(200);
  }

  searchMode = "fail";
  await input.fill("failed query");
  await page
    .getByRole("button", { name: "Retry search", exact: true })
    .waitFor();
  searchMode = "results";
  await page.getByRole("button", { name: "Retry search", exact: true }).click();
  if (!baseline) await page.locator("[data-search-result]").first().waitFor();
  await input.press("Escape");
  if (!baseline) assert.equal(await labels.count(), 0);

  if (!baseline) {
    searchMode = "empty";
    await input.fill("unmatched fixture");
    await page
      .getByText("No matches. Try another name.", { exact: true })
      .waitFor();
    searchMode = "results";
    discoveryFails = true;
    await input.fill("connection failure");
    await page
      .getByRole("button", { name: new RegExp(results[0].title) })
      .click();
    await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
    assert.equal(await labels.count(), 1, "Failed expansion retains selection");
    discoveryFails = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page
      .getByRole("button", { name: "Retry", exact: true })
      .waitFor({ state: "hidden" });
    if (mobile)
      await page
        .getByRole("button", { name: "Back to all music", exact: true })
        .click();
    else await page.goBack();
    await page.waitForTimeout(200);
    assert.equal(await labels.count(), 0);
    assert(await canvas.isVisible());
  }

  // Every production renderer frame remains observable; no second WebGL context.
  const probe = await page.evaluate(() => {
    const p = window.__discoveryProbe;
    const durations = p.frames
      .slice(1)
      .map((t, i) => t - p.frames[i])
      .sort((a, b) => a - b);
    return {
      contexts: p.contexts,
      frames: durations.length,
      idleWrites: 0,
      frameMedian: durations[Math.floor(durations.length * 0.5)],
      frameP95: durations[Math.floor(durations.length * 0.95)],
      zeroDrawFramesAfterWarmup: p.draws.slice(10).filter((n) => n === 0)
        .length,
      labelWrites: p.labelWrites,
    };
  });
  probe.idleWrites = idleWrites;
  assert.equal(probe.contexts, 1);
  assert.equal(probe.zeroDrawFramesAfterWarmup, 0);
  assert.deepEqual(errors, []);
  const output = process.env.SEARCH_INTERFACE_OUTPUT;
  if (output) {
    mkdirSync(output, { recursive: true });
    await page.screenshot({
      path: `${output}/${browserName}-${mobile ? "mobile" : "desktop"}.png`,
    });
    writeFileSync(
      `${output}/${browserName}-${mobile ? "mobile" : "desktop"}.json`,
      JSON.stringify(probe, null, 2),
    );
  }
  console.log(
    JSON.stringify({ browserName, mobile, baseline, reduced, ...probe }),
  );
} finally {
  await browser.close();
}
