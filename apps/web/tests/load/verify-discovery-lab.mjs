import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("tsx/package.json"))("esbuild");
const { chromium, webkit } = require(process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright");
const web = fileURLToPath(new URL("../..", import.meta.url));
const engine = process.env.DISCOVERY_LAB_BROWSER === "webkit" ? webkit : chromium;

// Real lab component and rankers; isolated public endpoint fixtures, no auth/DB/provider access.
const bundle = await build({
  stdin: {
    resolveDir: web,
    loader: "tsx",
    contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import Lab from './components/studio/discovery-ranking-lab';
      createRoot(document.getElementById('app')).render(<Lab />);
    `,
  },
  tsconfig: path.join(web, "tsconfig.json"),
  write: false,
  bundle: true,
  platform: "browser",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{
    name: "isolated-next-image",
    setup(builder) {
      builder.onResolve({ filter: /^next\/image$/ }, () => ({ path: "image", namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
        loader: "js",
        resolveDir: web,
        contents: `import React from 'react'; export default function Image({src,alt,className}) {return React.createElement('img',{src,alt,className})}`,
      }));
    },
  }],
});

const tracks = [123, 124].map((id) => ({
  provider: "deezer", provider_id: String(id), type: "track", title: `Fixture seed ${id}`,
  artist_name: "Fixture artist", artist_provider_id: "9", cover_url: `/covers/${id}.svg`, deezer_url: null,
}));
const requests = [];
const delayed = [];
let onDelayed;
let mode = "partial";
function pool(seed, variation) {
  return {
    seedProviderId: seed,
    variation: Number(variation),
    partial: mode === "partial",
    groups: [{
      id: "nearby", label: "Nearby", shortLabel: "Nearby", description: "Fixture candidates",
      recommendations: Array.from({ length: 10 }, (_, index) => ({
        id: `deezer-discovery:${200 + index}`, provider: "deezer", provider_id: String(200 + index),
        type: "track", title: `Fixture candidate ${index}`, artist_name: `Artist ${index < 3 ? 10 : index + 10}`,
        artist_provider_id: String(index < 3 ? 10 : index + 10), cover_url: `/covers/${200 + index}.svg`,
        deezer_url: null, href: `/track/deezer/${200 + index}`, reason: "Fixture source",
        source: "deezer-related", sourceLabel: "Nearby", score: 80 - index,
      })),
    }],
  };
}
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://fixture.invalid");
  res.setHeader("Cache-Control", "no-store");
  if (url.pathname === "/fixture.js") {
    res.setHeader("Content-Type", "text/javascript");
    return res.end(bundle.outputFiles[0].text);
  }
  if (url.pathname.startsWith("/covers/")) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#242424"/></svg>');
  }
  if (url.pathname === "/api/search") {
    requests.push(url);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Kocteau-Search-Status", "degraded");
    return res.end(JSON.stringify(tracks));
  }
  if (url.pathname === "/api/discovery/map") {
    requests.push(url);
    res.setHeader("Content-Type", "application/json");
    if (mode === "failure") {
      res.statusCode = 503;
      return res.end(JSON.stringify({ error: "Fixture provider unavailable." }));
    }
    const response = JSON.stringify(pool(url.searchParams.get("providerId"), url.searchParams.get("variation")));
    if (mode === "delayed") {
      delayed.push(() => res.end(response));
      onDelayed?.();
      return;
    }
    return res.end(response);
  }
  res.setHeader("Content-Type", "text/html");
  res.end('<!doctype html><div id="app"></div><script src="/fixture.js"></script>');
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await engine.launch({
  headless: true,
  ...(engine === chromium ? { args: ["--no-sandbox"] } : {}),
});
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, acceptDownloads: true });
  await context.route("**/*", (route) => route.request().url().startsWith(baseUrl) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(baseUrl);
  await page.getByRole("heading", { name: "Discovery lab", exact: true }).waitFor();
  assert.equal(requests.length, 0, "opt-in comparison must not fetch until asked");
  await page.evaluate(() => localStorage.setItem("listener-memory-fixture", "untouched"));
  await page.getByLabel("Track or artist").fill("Fixture");
  await page.getByRole("button", { name: "Find tracks", exact: true }).click();
  await page.getByText("Search status: degraded.", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Compare Fixture seed 123 by Fixture artist", exact: true }).click();
  await page.getByRole("heading", { name: "Current", exact: true }).waitFor();
  await page.getByText("Partial pool:", { exact: false }).waitFor();
  assert.equal(requests.filter((url) => url.pathname === "/api/discovery/map").length, 1);
  assert.equal(requests.at(-1).searchParams.get("lane"), "full");
  const beforeChange = requests.length;
  await page.getByLabel("MMR relevance weight").selectOption("0.4");
  await page.getByRole("heading", { name: "MMR (λ = 0.4)", exact: true }).waitFor();
  assert.equal(requests.length, beforeChange, "changing lambda must reuse the same pool");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export snapshot JSON" }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  let exported = "";
  for await (const chunk of stream) exported += chunk.toString();
  const snapshot = JSON.parse(exported);
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.partial, true);
  assert.equal(snapshot.lambda, 0.4);
  assert.equal(snapshot.input.provenance, "public-snapshot");
  assert.deepEqual(snapshot.input.memory, []);
  assert.deepEqual(snapshot.input.features, {});
  assert.equal(snapshot.input.seed.provider_id, "123");
  const allowedKeys = new Set(snapshot.input.candidates.map((item) => `deezer:track:${item.seed.provider_id}`));
  assert.deepEqual(Object.keys(snapshot.selected), ["current", "control", "mmr"]);
  for (const selection of Object.values(snapshot.selected)) {
    assert.equal(selection.length, 6);
    assert.ok(selection.every((key) => allowedKeys.has(key)));
  }

  mode = "failure";
  await page.getByRole("button", { name: "Compare Fixture seed 124 by Fixture artist", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Fixture provider unavailable." }).waitFor();
  assert.match(await page.locator("#lab-snapshot-title").textContent(), /Fixture seed 123/);
  mode = "valid";
  await page.getByRole("button", { name: "Retry Fixture seed 124", exact: true }).click();
  await page.locator("#lab-snapshot-title").filter({ hasText: "Fixture seed 124" }).waitFor();

  mode = "delayed";
  const delayedReceived = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Fixture pool request did not arrive")), 10000);
    onDelayed = () => { clearTimeout(timer); resolve(); };
  });
  await page.getByRole("button", { name: "Compare Fixture seed 123 by Fixture artist", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).waitFor();
  await delayedReceived;
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByText("Request cancelled.", { exact: false }).waitFor();
  mode = "valid";
  await page.getByRole("button", { name: "Compare Fixture seed 124 by Fixture artist", exact: true }).click();
  await page.getByRole("button", { name: "Refresh this pool", exact: true }).waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.body.textContent.includes("Loading one pool"));
  for (const respond of delayed.splice(0)) respond();
  assert.match(await page.locator("#lab-snapshot-title").textContent(), /Fixture seed 124/);
  assert.equal(await page.evaluate(() => localStorage.getItem("listener-memory-fixture")), "untouched");
  assert.deepEqual(errors, []);
  await context.close();
  console.log("Discovery lab fixture passed: opt-in retrieval, same-pool panels, degraded/partial sources, export, retry, cancellation, unchanged listener storage.");
} finally {
  for (const respond of delayed.splice(0)) respond();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
