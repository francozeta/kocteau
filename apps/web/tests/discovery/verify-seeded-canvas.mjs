import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const target = new URL(
  process.env.GALLERY_URL || "http://localhost:3000/search",
);
assert.ok(
  ["localhost", "127.0.0.1"].includes(target.hostname),
  "This check supplies isolated recommendation fixtures",
);
const browserName = process.env.GALLERY_BROWSER || "chromium";
const browser = await (browserName === "webkit" ? webkit : chromium).launch({
  headless: process.env.GALLERY_HEADED !== "1",
  ...(browserName === "chromium" && process.env.GALLERY_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.GALLERY_CHROMIUM_EXECUTABLE }
    : {}),
});
try {
  for (const viewport of [
    { width: 1440, height: 950 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      isMobile: viewport.width < 768,
      hasTouch: viewport.width < 768,
      locale: "en-US",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.headerMaximum = {
        identity: 0,
        input: 0,
        mobile: 0,
        actions: 0,
        canvases: 0,
      };
      const sample = () => {
        for (const [key, selector] of Object.entries({
          identity: "[data-kocteau-search-desktop-identity-slot] > nav",
          input: "[data-kocteau-search-header-slot] input",
          mobile: "[data-kocteau-search-mobile-header-slot] > nav",
          actions: "[data-kocteau-search-desktop-actions-slot] > div",
          canvases: "[data-discovery-gallery]",
        }))
          window.headerMaximum[key] = Math.max(
            window.headerMaximum[key],
            document.querySelectorAll(selector).length,
          );
      };
      document.addEventListener("DOMContentLoaded", () => {
        new MutationObserver(sample).observe(document.body, {
          childList: true,
          subtree: true,
        });
        sample();
      });
    });
    let initialSeeds = [];
    let mode = "success";
    const requests = [];
    await page.route("**/api/discovery/map?**", async (route) => {
      const params = new URL(route.request().url()).searchParams;
      requests.push({
        seed: params.get("providerId"),
        lane: params.get("lane"),
        variation: params.get("variation"),
      });
      if (mode === "failure")
        return route.fulfill({
          status: 503,
          json: { error: "Fixture provider unavailable" },
        });
      const base = Number(params.get("providerId")) % 100_000;
      const covers = initialSeeds.filter(
        (seed) => seed.provider_id !== params.get("providerId"),
      );
      const recommendations = Array.from({ length: 8 }, (_, index) => ({
        id: `deezer-discovery:${2_000_000_000 + base * 10 + index}`,
        provider: "deezer",
        provider_id: String(2_000_000_000 + base * 10 + index),
        type: "track",
        title: `Seed ${params.get("providerId")} neighbor ${index}`,
        artist_name: `Related artist ${index}`,
        cover_url: covers[index]?.cover_url,
        deezer_url: null,
        href: "/search",
        reason: "Isolated seed-specific fixture",
        source: "deezer-related",
        sourceLabel: "Nearby",
        score: 50 + index,
      }));
      await new Promise((resolve) =>
        setTimeout(resolve, params.get("lane") === "fast" ? 80 : 250),
      );
      await route.fulfill({
        json: {
          groups: [
            {
              id: "nearby",
              label: "Nearby",
              shortLabel: "Nearby",
              description: "Fixture",
              recommendations,
            },
          ],
        },
      });
    });
    await page.goto(target.href, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () =>
        window.history.state?.discovery?.session?.frames[0]?.nodes.length >= 8,
    );
    initialSeeds = await page.evaluate(() =>
      window.history.state.discovery.session.frames[0].nodes.map(
        (node) => node.seed,
      ),
    );
    const initialIds = initialSeeds.map((seed) => seed.provider_id);
    const initialGallery = await page
      .locator("[data-discovery-gallery]")
      .elementHandle();
    async function settle() {
      await page.waitForFunction(
        () =>
          document.querySelector("[data-discovery-gallery]")?.dataset
            .galleryMotion === "rest",
      );
    }
    async function snapshot() {
      return page.evaluate(() => {
        const session = window.history.state.discovery.session;
        return session.frames[session.cursor];
      });
    }
    async function expanded() {
      await page.waitForFunction(() => {
        const session = window.history.state?.discovery?.session;
        return session?.frames[session.cursor].resolved;
      });
      await settle();
      return snapshot();
    }
    await settle();
    await page.locator('[data-gallery-center="true"]').click();
    const a = await expanded();
    assert.ok(a.nodes.length >= 6);
    assert.ok(
      a.nodes.every((node) => !initialIds.includes(node.seed.provider_id)),
    );
    assert.ok(
      a.nodes.every(
        (node) => node.from === `deezer:${a.focus.type}:${a.focus.provider_id}`,
      ),
    );
    assert.equal(
      await initialGallery.evaluate(
        (element) =>
          element === document.querySelector("[data-discovery-gallery]"),
      ),
      true,
      "Seed navigation must retain one live gallery instead of duplicating route owners",
    );
    const side = page
      .locator(
        '[data-gallery-center="false"][data-discovery-gallery-card]:not([aria-hidden])',
      )
      .first();
    await side.click();
    await settle();
    await page.locator('[data-gallery-center="true"]').click();
    const b = await expanded();
    assert.notEqual(a.focus.provider_id, b.focus.provider_id);
    assert.notDeepEqual(
      a.nodes.map((node) => node.seed.provider_id),
      b.nodes.map((node) => node.seed.provider_id),
    );
    assert.ok(
      b.nodes.every((node) => !initialIds.includes(node.seed.provider_id)),
    );
    const callsBeforeHistory = requests.length;
    for (let count = 0; count < 3; count += 1) {
      await page.goBack();
      await page.waitForTimeout(65);
      await page.goForward();
      await page.waitForTimeout(65);
    }
    await settle();
    assert.equal(
      requests.length,
      callsBeforeHistory,
      "Back/Forward restores each frozen candidate pool",
    );
    assert.deepEqual((await snapshot()).nodes, b.nodes);

    mode = "failure";
    await page
      .locator(
        '[data-gallery-center="false"][data-discovery-gallery-card]:not([aria-hidden])',
      )
      .first()
      .click();
    await settle();
    await page.locator('[data-gallery-center="true"]').click();
    await page
      .getByRole("button", { name: "Some paths couldn’t load. Retry" })
      .waitFor();
    await settle();
    assert.deepEqual(
      (await snapshot()).nodes,
      [],
      "Provider failure must not reintroduce starters or another song's neighbors",
    );
    mode = "success";
    await page
      .getByRole("button", { name: "Some paths couldn’t load. Retry" })
      .click();
    const recovered = await expanded();
    assert.ok(recovered.nodes.length >= 6);
    assert.ok(
      recovered.nodes.every(
        (node) => !initialIds.includes(node.seed.provider_id),
      ),
    );
    const maximum = await page.evaluate(() => window.headerMaximum);
    assert.ok(
      Object.values(maximum).every((count) => count <= 1),
      JSON.stringify(maximum),
    );
    assert.ok(
      requests.every(
        (request) =>
          Number(request.variation) >= 0 && Number(request.variation) < 16,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        browser: browserName,
        viewport,
        headerMaximum: maximum,
        seedsIsolated: true,
        historyRestored: true,
        failureRecovery: true,
      }),
    );
    await context.close();
  }
} finally {
  await browser.close();
}
