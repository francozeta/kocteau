import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = resolve(webRoot, "../..");
const require = createRequire(import.meta.url);
const { webkit } = require(process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright");
const review = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "A fixture listening note",
  body: "Synthetic review for isolated recovery verification.",
  rating: 4, likes_count: 0, comments_count: 0, created_at: "2026-10-23T00:00:00Z",
  entities: { id: "00000000-0000-4000-8000-000000000042", provider: "deezer", provider_id: "42", type: "track", title: "Fixture track", artist_name: "Fixture artist", cover_url: null, deezer_url: null },
  author: { id: "00000000-0000-4000-8000-000000000043", username: "fixture-listener", display_name: "Fixture listener", avatar_url: null },
};
const state = { fail: true, empty: false, reads: 0 };
const upstream = createServer((request, response) => {
  const path = new URL(request.url, "http://fixture.local").pathname;
  response.setHeader("Content-Type", "application/json");
  if (path === "/rest/v1/reviews") {
    state.reads++;
    response.statusCode = state.fail ? 503 : 200;
    response.end(JSON.stringify(state.fail ? { code: "TEST_UNAVAILABLE", message: "Isolated origin failure" } : state.empty ? [] : [review]));
  } else if (path === "/rest/v1/rpc/get_entity_review_summary") {
    response.end(JSON.stringify({ review_count: 1, average_rating: 4 }));
  } else response.end("[]");
});
upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
const root = join(repositoryRoot, ".plan/local");
await mkdir(root, { recursive: true });
const fixture = await mkdtemp(join(root, "review-recovery-"));
let child;
let browser;
let appUrl;
let output = "";
const results = [];
try {
  await cp(join(webRoot, "app"), join(fixture, "app"), { recursive: true });
  await symlink(join(webRoot, "node_modules"), join(fixture, "node_modules"), "dir");
  await symlink(join(webRoot, "public"), join(fixture, "public"), "dir");
  await symlink(join(webRoot, "postcss.config.mjs"), join(fixture, "postcss.config.mjs"));
  await writeFile(join(fixture, "package.json"), JSON.stringify({ name: "review-recovery-verification", private: true }));
  await writeFile(join(fixture, "tsconfig.json"), JSON.stringify({
    compilerOptions: { baseUrl: ".", paths: { "@/*": [relative(fixture, webRoot).replaceAll("\\", "/") + "/*"] } },
  }));
  await writeFile(join(fixture, "next.config.mjs"), "export default " + JSON.stringify({ devIndicators: false, turbopack: { root: repositoryRoot } }) + ";\n");
  await writeFile(join(fixture, "block-upstreams.mjs"), [
    "const nativeFetch = globalThis.fetch;",
    "globalThis.fetch = (input, init) => {",
    " const url = new URL(input instanceof Request ? input.url : String(input));",
    ' if (url.hostname !== "127.0.0.1") throw new Error("Blocked non-loopback fixture request");',
    " return nativeFetch(input, init);",
    "};",
  ].join("\n"));
  child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "0"], {
    cwd: fixture, detached: true, stdio: ["ignore", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:" + upstream.address().port,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "isolated-fixture-key",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_OPTIONS: "--import=" + join(fixture, "block-upstreams.mjs"),
    },
  });
  for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => { output = (output + chunk).slice(-16000); });
  const until = Date.now() + 45_000;
  while (true) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(output);
    appUrl ??= stripVTControlCharacters(output).match(/- Local:\s+(http:\/\/127\.0\.0\.1:\d+)/)?.[1];
    if (appUrl) {
      try {
        const response = await fetch(appUrl + "/favicon.ico", { signal: AbortSignal.timeout(2000) });
        await response.body?.cancel();
        break;
      } catch { /* Wait for the listener to serve. */ }
    }
    if (Date.now() > until) throw new Error("Next startup timed out\n" + output);
    await delay(200);
  }
  browser = await webkit.launch();
  const mobile = process.env.REVIEW_RECOVERY_DESKTOP !== "1";
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    return url.hostname === "127.0.0.1" || url.protocol === "about:" ? route.continue() : route.fulfill({ status: 204 });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(35_000);
  await page.goto(appUrl + "/reviews", { waitUntil: "domcontentloaded", timeout: 60_000 });
  const retry = page.getByRole("button", { name: "Retry reviews", exact: true });
  await retry.waitFor();
  assert.equal(await page.getByText("No public reviews yet.").count(), 0);
  results.push({ scenario: "a failed guest read shows recovery instead of empty reviews", originReads: state.reads });
  state.fail = false;
  await retry.click();
  await page.locator("article").first().waitFor();
  assert.ok((await page.locator('a[href^="/reviews/"]').count()) > 0);
  assert.equal(await retry.count(), 0);
  assert.equal(await context.cookies().then(c => c.some(x => x.name.includes("auth-token"))), false);
  results.push({ scenario: "manual retry recovers visible reviews without authentication", cards: await page.locator("article").count(), originReads: state.reads });
  state.fail = true;
  const failed = await context.request.get(appUrl + "/api/feed?view=latest&cursor=isolated-recovery");
  assert.equal(failed.status(), 503);
  assert.equal(failed.headers()["cache-control"], "private, no-store");
  assert.equal((await failed.json()).feed, undefined);
  results.push({ scenario: "API failure is non-cacheable HTTP 503" });
  state.fail = false;
  const recovered = await context.request.get(appUrl + "/api/feed?view=latest&cursor=isolated-recovery");
  assert.equal(recovered.status(), 200);
  assert.equal((await recovered.json()).feed.length, 1);
  state.fail = true;
  const warm = await context.request.get(appUrl + "/api/feed?view=latest&cursor=isolated-recovery");
  assert.equal(warm.status(), 200);
  assert.equal((await warm.json()).feed.length, 1);
  results.push({ scenario: "recovered API feed remains reusable during an origin outage" });
  state.fail = false;
  state.empty = true;
  const empty = await context.request.get(appUrl + "/api/feed?view=latest&cursor=isolated-empty");
  assert.equal(empty.status(), 200);
  assert.deepEqual((await empty.json()).feed, []);
  results.push({ scenario: "successful empty data remains HTTP 200" });
  console.log(JSON.stringify({ engine: "WebKit", mobile, results }, null, 2));
  await context.close();
} catch (error) {
  console.error(error);
  console.error(output.slice(-6500));
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (child && child.exitCode === null) {
    process.kill(-child.pid, "SIGTERM");
    await Promise.race([once(child, "exit"), delay(5000, undefined, { ref: false })]);
    if (child.exitCode === null) process.kill(-child.pid, "SIGKILL");
  }
  child?.stdout.destroy();
  child?.stderr.destroy();
  upstream.closeAllConnections();
  await new Promise(done => upstream.close(done));
  await rm(fixture, { recursive: true, force: true });
}
