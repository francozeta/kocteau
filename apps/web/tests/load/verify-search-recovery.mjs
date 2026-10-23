import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const browserName = process.env.SEARCH_RECOVERY_BROWSER || "chromium";
assert(["chromium", "webkit"].includes(browserName));
const engine = browserName === "webkit" ? webkit : chromium;
const target = new URL(
  process.env.SEARCH_RECOVERY_URL || "http://127.0.0.1:3002",
);
assert.equal(target.hostname, "127.0.0.1", "Browser fixtures require loopback");
const baseline = process.env.SEARCH_RECOVERY_BASELINE === "1";
const mobile = process.env.SEARCH_RECOVERY_DESKTOP !== "1";
const browser = await engine.launch({
  headless: true,
  args: engine === chromium ? ["--no-sandbox"] : [],
});
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: "reduce",
});
await context.route("**/*", (route) => {
  const url = new URL(route.request().url());
  return url.hostname === "127.0.0.1" || url.protocol === "about:"
    ? route.continue()
    : route.fulfill({ status: 204 });
});
if (process.env.SEARCH_RECOVERY_COOKIE_FILE) {
  const cookie = JSON.parse(
    readFileSync(process.env.SEARCH_RECOVERY_COOKIE_FILE, "utf8"),
  ).cookie;
  assert.equal(typeof cookie, "string");
  await context.addCookies(
    cookie.split("; ").map((part) => {
      const split = part.indexOf("=");
      return {
        name: part.slice(0, split),
        value: part.slice(split + 1),
        url: target.origin,
      };
    }),
  );
}
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const searches = [];
const failed = [];
let mode = "empty";
const result = {
  provider: "deezer",
  provider_id: "909090",
  type: "artist",
  title: "Slowdive",
  artist_name: null,
  artist_provider_id: "909090",
  cover_url: null,
  deezer_url: "https://www.deezer.com/artist/909090",
  source: "deezer",
};
await page.route("**/api/search?**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  searches.push({
    q: url.searchParams.get("q"),
    source: url.searchParams.get("source"),
    at: Date.now(),
  });
  if (mode === "slow") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  try {
    if (mode === "fail")
      await route.fulfill({
        status: 502,
        json: { error: "Search temporarily unavailable" },
      });
    else
      await route.fulfill({
        status: 200,
        json: mode === "empty" ? [] : [result],
      });
  } catch {}
});
page.on("requestfailed", (request) => {
  if (request.url().includes("/api/search?")) failed.push(request.url());
});
await page.route("**/api/discovery/map?**", (route) =>
  route.fulfill({ status: 200, json: { groups: [] } }),
);
await page.goto(new URL("/search", target).href, {
  waitUntil: "domcontentloaded",
});
const input = page.locator("[data-global-search-input]:visible");
await input.waitFor();
if (process.env.SEARCH_RECOVERY_COOKIE_FILE) {
  await page.waitForFunction(() =>
    window.history.state?.discoverySearch?.account &&
    window.history.state.discoverySearch.account !== "kocteau:discovery:v1:guest");
}
await input.focus();
await input.pressSequentially("Slowdive", { delay: 150 });
await page.waitForTimeout(1200);
if (!baseline)
  assert.equal(
    searches.length,
    2,
    "Typing sends only the settled query to each source",
  );
console.log(
  JSON.stringify({
    stage: "typing",
    engine: browserName,
    mobile,
    baseline,
    requests: searches.length,
    queries: [...new Set(searches.map((r) => r.q))],
    value: await input.inputValue(),
  }),
);
await input.fill("");
await page.waitForTimeout(350);
mode = "slow";
searches.length = 0;
failed.length = 0;
await input.fill("Beach");
await page.waitForTimeout(450);
await input.pressSequentially("House", { delay: 150 });
await page.waitForTimeout(120);
if (!baseline)
  assert.equal(
    failed.length,
    2,
    "Changing input cancels both obsolete source requests immediately",
  );
console.log(
  JSON.stringify({
    stage: "cancellation",
    requests: searches.length,
    cancelled: failed.length,
    value: await input.inputValue(),
  }),
);
await input.fill("");
await page.waitForTimeout(350);
mode = "fail";
searches.length = 0;
await input.fill("Network fixture");
await page.waitForTimeout(4500);
const retry = page.getByRole("button", { name: "Retry search", exact: true });
console.log(
  JSON.stringify({
    stage: "error",
    requests: searches.length,
    query: await input.inputValue(),
    retry: await retry.count(),
    emptyCanvasText: await page
      .getByText("Search for music to start exploring.")
      .count(),
  }),
);
if (!baseline) {
  assert.equal(
    searches.length,
    2,
    "One request per source; failures do not retry automatically",
  );
  assert.equal(await input.inputValue(), "Network fixture");
  assert.equal(await retry.count(), 1);
  mode = "success";
  await retry.click();
  await page
    .getByRole("button", { name: /Slowdive.*Artist/ })
    .first()
    .waitFor();
  await page
    .getByRole("button", { name: /Slowdive.*Artist/ })
    .first()
    .click();
  await page.waitForURL(/\/search\/artist\//);
  assert.equal(
    await page.getByText("Search for music to start exploring.").count(),
    0,
  );
  await page.waitForTimeout(200);
  const selectionPath = new URL(page.url()).pathname;
  const selectedFrame = await page.evaluate(
    () =>
      window.history.state.discovery.session.frames.at(-1).focus.provider_id,
  );
  await page.goBack();
  await input.waitFor();
  await page.waitForTimeout(350);
  assert.equal(await input.inputValue(), "Network fixture");
  console.log(
    JSON.stringify({
      stage: "back-query",
      query: await input.inputValue(),
      selectionPath,
    }),
  );
  await page
    .getByRole("button", { name: /Slowdive.*Artist/ })
    .first()
    .click();
  await page.waitForURL(/\/search\/artist\//);
  await page.waitForTimeout(200);
  await page.waitForFunction(
    () => window.history.state.discovery.session.frames.at(-1).resolved,
  );
  const savedSession = await page.evaluate(
    () => window.history.state.discovery.session,
  );
  await page.goto("about:blank");
  await page.goBack({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  assert.equal(
    await page.getByText("Search for music to start exploring.").count(),
    0,
  );
  assert((await page.locator("[data-discovery-focus]").count()) > 0);
  assert.equal(
    await page.evaluate(
      () =>
        window.history.state.discovery.session.frames.at(-1).focus.provider_id,
    ),
    selectedFrame,
  );
  assert.deepEqual(
    await page.evaluate(() => window.history.state.discovery.session),
    savedSession,
  );
  console.log(
    JSON.stringify({
      stage: "document-return",
      path: new URL(page.url()).pathname,
      selected: true,
    }),
  );
  if (mobile)
    await page
      .getByRole("button", { name: "Search music", exact: true })
      .click();
  else await input.focus();
  mode = "fail";
  searches.length = 0;
  await input.fill("Keep canvas fixture");
  await retry.waitFor();
  assert.equal(await input.inputValue(), "Keep canvas fixture");
  assert.equal(
    await page.evaluate(
      () =>
        window.history.state.discovery.session.frames.at(-1).focus.provider_id,
    ),
    selectedFrame,
  );
  assert.equal(
    await page.getByText("Search for music to start exploring.").count(),
    0,
  );
  console.log(
    JSON.stringify({
      stage: "outage-keeps-canvas",
      requests: searches.length,
      queryPreserved: true,
      selectionPreserved: true,
    }),
  );
  await page.goBack();
  await input.waitFor();
  await page.waitForTimeout(350);
  assert.equal(await input.inputValue(), "Network fixture");
  await page.reload({ waitUntil: "domcontentloaded" });
  await input.waitFor();
  assert.equal(await input.inputValue(), "Network fixture");
  console.log(JSON.stringify({ stage: "reload-query", queryPreserved: true }));
  await context.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key.startsWith("kocteau:discovery"))
        throw new DOMException("Blocked storage", "SecurityError");
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("kocteau:discovery"))
        throw new DOMException("Blocked storage", "SecurityError");
      return set.call(this, key, value);
    };
  });
  mode = "success";
  await page.goto(new URL("/search?fixture=storage-disabled", target).href, {
    waitUntil: "domcontentloaded",
  });
  await input.waitFor();
  await input.fill("No storage fixture");
  await page
    .getByRole("button", { name: /Slowdive.*Artist/ })
    .first()
    .click();
  await page.waitForURL(/\/search\/artist\//);
  await page.waitForTimeout(200);
  await page.goBack();
  await input.waitFor();
  await page.waitForTimeout(350);
  assert.equal(await input.inputValue(), "No storage fixture");
  console.log(
    JSON.stringify({ stage: "storage-disabled", queryPreserved: true }),
  );
}
console.log(JSON.stringify({ stage: "browser-errors", errors }));
assert.deepEqual(errors, []);
await browser.close();
