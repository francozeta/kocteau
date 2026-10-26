import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const scriptSnapshot = (page) => page.evaluate(() => {
  const scripts = performance.getEntriesByType("resource")
    .filter((entry) => new URL(entry.name).pathname.endsWith(".js"));
  return {
    count: scripts.length,
    decodedBytes: scripts.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
    encodedBytes: scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
  };
});
const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = resolve(webRoot, "../..");
const require = createRequire(join(webRoot, "package.json"));
const { webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const target = process.env.KOCTEAU_BASE_URL;
assert.ok(target, "Set KOCTEAU_BASE_URL to the app origin to measure");
const targetUrl = new URL(target);
assert.ok(
  ["http:", "https:"].includes(targetUrl.protocol) &&
    !targetUrl.username &&
    !targetUrl.password &&
    targetUrl.pathname === "/" &&
    !targetUrl.search &&
    !targetUrl.hash,
  "Use an HTTP(S) app origin without credentials, query or path",
);
const base = targetUrl.origin;
const sampleCount = Number(process.env.KOCTEAU_JOURNEY_SAMPLES || 12);
assert.ok(
  Number.isInteger(sampleCount) && sampleCount >= 2 && sampleCount <= 24,
  "KOCTEAU_JOURNEY_SAMPLES must be between 2 and 24",
);
const evidence = join(repositoryRoot, ".codex-private/public-journey-baseline");
await mkdir(evidence, { recursive: true });
const out = join(evidence, "report.json");
const browser = await webkit.launch();
const results = [];
let pinnedReviewPath = process.env.KOCTEAU_REVIEW_PATH || null;
if (pinnedReviewPath)
  assert.ok(
    pinnedReviewPath.startsWith("/reviews/") && !/[?#]/.test(pinnedReviewPath),
    "Use a canonical relative review path",
  );
try {
  for (let sample = 0; sample < sampleCount; sample++) {
    const mobile = sample % 2 === 0;
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: "reduce",
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const missing = () =>
        page
          .getByText("This page could not be found.", { exact: true })
          .isVisible();
      let started = performance.now();
      const response = await page.goto(base + "/reviews", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      assert.equal(response.status(), 200);
      const review = pinnedReviewPath
        ? page
            .locator("a[href=" + JSON.stringify(pinnedReviewPath) + "]")
            .first()
        : page.locator('a[href^="/reviews/"]').first();
      await review.waitFor({ state: "visible" });
      const listReadyMs = Math.round(performance.now() - started);
      const navigation = await page.evaluate(() => {
        const n = performance.getEntriesByType("navigation")[0];
        return { ttfbMs: n ? Math.round(n.responseStart - n.startTime) : null };
      });
      await page.waitForLoadState("networkidle", { timeout: 30000 });
      const listScripts = await scriptSnapshot(page);
      const reviewHref = await review.getAttribute("href");
      pinnedReviewPath ||= new URL(reviewHref, base).pathname;
      started = performance.now();
      await review.click();
      await page.waitForURL(
        (url) => url.pathname === new URL(reviewHref, base).pathname,
      );
      await page
        .locator("#review-structured-data")
        .waitFor({ state: "attached" });
      await page
        .locator("article.kocteau-review-card")
        .first()
        .waitFor({ state: "visible" });
      assert.equal(await missing(), false);
      const reviewReadyMs = Math.round(performance.now() - started);
      await page.waitForLoadState("networkidle", { timeout: 30000 });
      const reviewScripts = await scriptSnapshot(page);
      const track = page.locator('a[href^="/tracks/"]').first();
      await track.waitFor({ state: "visible" });
      const trackHref = await track.getAttribute("href");
      started = performance.now();
      await track.click();
      await page.waitForURL(
        (url) => url.pathname === new URL(trackHref, base).pathname,
      );
      await page
        .locator("#track-structured-data")
        .waitFor({ state: "attached" });
      await page.locator("h1").first().waitFor({ state: "visible" });
      assert.equal(await missing(), false);
      const trackReadyMs = Math.round(performance.now() - started);
      await page.waitForLoadState("networkidle", { timeout: 30000 });
      started = performance.now();
      const trackScripts = await scriptSnapshot(page);
      started = performance.now();
      await page.goBack({ waitUntil: "domcontentloaded" });
      await page.waitForURL(
        (url) => url.pathname === new URL(reviewHref, base).pathname,
      );
      await page
        .locator("#review-structured-data")
        .waitFor({ state: "attached" });
      await page
        .locator("article.kocteau-review-card")
        .first()
        .waitFor({ state: "visible" });
      assert.equal(await missing(), false);
      const backReadyMs = Math.round(performance.now() - started);
      await page.waitForLoadState("networkidle", { timeout: 30000 });
      assert.deepEqual(errors, []);
      assert.equal(
        (await context.cookies()).some((cookie) =>
          cookie.name.includes("auth-token"),
        ),
        false,
      );
      const result = {
        sample,
        mobile,
        reviewPath: new URL(reviewHref, base).pathname,
        trackPath: new URL(trackHref, base).pathname,
        scripts: { list: listScripts, review: reviewScripts, track: trackScripts },
        timingsMs: {
          list: listReadyMs,
          review: reviewReadyMs,
          track: trackReadyMs,
          back: backReadyMs,
        },
        listTtfbMs: navigation.ttfbMs,
        listCache: response.headers()["x-vercel-cache"] ?? null,
        errors,
      };
      results.push(result);
      console.log(JSON.stringify(result));
    } finally {
      await context.close();
    }
  }
  const percentile = (values, p) =>
    values.sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * p) - 1)];
  const summary = Object.fromEntries(
    ["list", "review", "track", "back"].map((key) => {
      const values = results.map((r) => r.timingsMs[key]);
      return [
        key,
        {
          n: values.length,
          p50Ms: percentile([...values], 0.5),
          p95Ms: percentile([...values], 0.95),
          maxMs: Math.max(...values),
        },
      ];
    }),
  );
  await writeFile(
    out,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        target: base,
        environment: "one WebKit worker; new guest context per sample",
        limits:
          sampleCount +
          " sequential samples, alternating viewports. Controlled nearest-rank percentiles; not RUM, capacity, mobile network, physical iPhone or authenticated coverage. Origin cache coldness is not assumed.",
        summary,
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ summary }));
} catch (error) {
  await writeFile(
    out.replace(".json", "-partial.json"),
    JSON.stringify(
      { at: new Date().toISOString(), results, error: String(error) },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
