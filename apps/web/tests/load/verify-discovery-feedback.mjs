import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright");
const target = new URL(process.env.DISCOVERY_FEEDBACK_URL || "http://127.0.0.1:3002");
assert.equal(target.hostname, "127.0.0.1", "Design fixtures require loopback");
const browserName = process.env.DISCOVERY_FEEDBACK_BROWSER || "chromium";
assert(["chromium", "webkit"].includes(browserName));
const engine = browserName === "webkit" ? webkit : chromium;
const mobile = process.env.DISCOVERY_FEEDBACK_DESKTOP !== "1";
const browser = await engine.launch({
  headless: true,
  args: engine === chromium ? ["--no-sandbox"] : [],
});
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: "reduce",
});
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/aQAAAAASUVORK5CYII=", "base64");
await context.route("**/*", (route) => {
  const url = new URL(route.request().url());
  if (route.request().resourceType() === "image") {
    return route.fulfill({ contentType: "image/png", body: pixel });
  }
  return url.hostname === "127.0.0.1"
    ? route.continue()
    : route.fulfill({ status: 204 });
});
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const track = (id) => ({
  provider: "deezer",
  provider_id: String(id),
  type: "track",
  title: `Discovery fixture ${id}`,
  artist_name: "Fixture artist",
  cover_url: `https://cdn-images.dzcdn.net/images/cover/fixture-${id}/250x250-000000-80-0-0.jpg`,
  source: "deezer",
});
let searchResult = track(90909001);
let mode = "hold";
const held = [];
await page.route("**/api/search?**", (route) =>
  route.fulfill({ json: [searchResult] }),
);
await page.route("**/api/discovery/map?**", async (route) => {
  const url = new URL(route.request().url());
  const provider = url.searchParams.get("providerId");
  const lane = url.searchParams.get("lane");
  const outcome = mode === "hold"
    ? await new Promise((resolve) => held.push({ provider, lane, resolve }))
    : mode;
  const candidate = track(provider === "90909001" ? 90909002 : 90909004);
  try {
    await route.fulfill({
      status: outcome === "failure" ? 502 : 200,
      json: outcome === "success" ? {
        groups: [{
          id: "nearby",
          recommendations: [{ ...candidate, id: `fixture:${candidate.provider_id}`, score: 10, reason: "Fixture recommendation" }],
        }],
      } : { groups: [] },
    });
  } catch {
    // A superseded selection aborts its pending requests.
  }
});
const statusIs = (text) => page.waitForFunction((expected) =>
  document.querySelector('[data-discovery-feedback] [role="status"]')?.textContent === expected,
text);
const select = async (id) => {
  searchResult = track(id);
  const trigger = page.getByRole("button", { name: "Search music", exact: true });
  if (await trigger.isVisible()) await trigger.click();
  const input = page.locator("[data-global-search-input]:visible");
  await input.fill(searchResult.title);
  await page.getByRole("button", { name: new RegExp(searchResult.title) }).first().waitFor();
  await input.press("Enter");
  await page.waitForURL(new RegExp(`/search/track/[^/]+/${id}$`));
};
const release = (provider, lane, outcome) => {
  const request = held.find((item) => item.provider === String(provider) && item.lane === lane);
  assert(request, `Expected held ${lane} request for ${provider}`);
  request.resolve(outcome);
};
const waitForLanes = (id) => page.waitForFunction((provider) => {
  const state = window.history.state?.discovery?.session;
  return state?.frames[state.cursor]?.focus?.provider_id === String(provider);
}, id).then(async () => {
  const deadline = Date.now() + 5000;
  while (held.filter((item) => item.provider === String(id)).length < 2) {
    assert(Date.now() < deadline, "Both expansion lanes must start");
    await page.waitForTimeout(20);
  }
});

try {
  await page.goto(new URL("/search", target).href, { waitUntil: "domcontentloaded" });
  await page.locator("[data-global-search-input]:visible").waitFor();
  await statusIs("");
  await select(90909001);
  await waitForLanes(90909001);
  await statusIs("Finding related music…");
  const statusNode = await page.locator('[data-discovery-feedback] [role="status"]').elementHandle();
  release(90909001, "fast", "success");
  await statusIs("Looking for more music…");
  release(90909001, "deep", "empty");
  await statusIs("Choose another cover to keep exploring.");
  assert(await statusNode.evaluate((node) => node === document.querySelector('[data-discovery-feedback] [role="status"]')), "Live region stays mounted");

  mode = "empty";
  const nextCover = page.getByRole("button", { name: /Discovery fixture 90909002.*Find similar music/ });
  await nextCover.focus();
  await page.keyboard.press("Enter");
  await statusIs("No new music found. Try another cover or search.");
  assert.equal(await page.getByRole("button", { name: /Discovery fixture 90909001.*Find similar music/ }).count(), 1, "Retained covers must not count as new music");
  const emptyPath = new URL(page.url()).pathname;

  mode = "failure";
  await select(90909003);
  await statusIs("Couldn’t load new music.");
  const retry = page.getByRole("button", { name: "Retry discovery", exact: true });
  await retry.focus();
  assert(await retry.evaluate((node) => node.matches(":focus-visible")), "Retry has keyboard focus");
  mode = "hold";
  await page.keyboard.press("Enter");
  await waitForLanes(90909003);
  await statusIs("Finding related music…");
  assert(await statusNode.evaluate((node) => document.activeElement === node), "Retry keeps focus at the feedback location");
  release(90909003, "fast", "success");
  await statusIs("Looking for more music…");
  release(90909003, "deep", "failure");
  await statusIs("Some music couldn’t load.");
  assert.equal(await page.getByRole("button", { name: /Discovery fixture 90909004.*Find similar music/ }).count(), 1);

  await page.goBack();
  await page.waitForURL(new URL(emptyPath, target).href);
  await statusIs("No new music found. Try another cover or search.");
  mode = "success";
  await page.goForward();
  await statusIs("Choose another cover to keep exploring.");

  mode = "hold";
  await select(90909005);
  await waitForLanes(90909005);
  await select(90909006);
  await waitForLanes(90909006);
  release(90909006, "fast", "empty");
  release(90909006, "deep", "empty");
  await statusIs("No new music found. Try another cover or search.");
  release(90909005, "fast", "success");
  release(90909005, "deep", "success");
  await page.waitForTimeout(150);
  await statusIs("No new music found. Try another cover or search.");
  assert(new URL(page.url()).pathname.endsWith("/90909006"), "Superseded results cannot change the current selection");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: browserName, mobile, result: "passed", states: ["initial", "pending", "partial", "ready", "empty with retained covers", "failure", "retry focus", "partial failure", "Back/Forward", "interrupted selection"] }));
} finally {
  held.forEach((item) => item.resolve("empty"));
  await browser.close();
}
