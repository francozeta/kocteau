import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("tsx/package.json"))("esbuild");
const { chromium, webkit } = require(process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright");
const web = fileURLToPath(new URL("../..", import.meta.url));
const engine = process.env.ACCOUNT_CACHE_BROWSER === "webkit" ? webkit : chromium;

// Exercise the real provider with an isolated auth event source and no Supabase.
const bundle = await build({
  stdin: {
    resolveDir: web,
    loader: "tsx",
    contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { useQueryClient } from '@tanstack/react-query';
      import Provider from './app/providers/react-query-provider';
      const serverAccount = new URLSearchParams(location.search).get('serverAccount');
      const accountId = serverAccount === 'guest' ? null : serverAccount || localStorage.getItem('fixture:account');
      sessionStorage.setItem('fixture:documents', String(Number(sessionStorage.getItem('fixture:documents') || 0) + 1));
      function Probe() {
        const client = useQueryClient();
        if (client.getQueryData(['viewer', 'saved-reviews']) === undefined)
          client.setQueryData(['viewer', 'saved-reviews'], [accountId || 'guest']);
        window.startRead = () => {
          client.fetchQuery({ queryKey: ['viewer', 'pending'], queryFn: ({signal}) => new Promise(() => {
            signal.addEventListener('abort', () => localStorage.setItem('fixture:aborted', 'yes'));
          }) }).catch(() => {});
        };
        return <div data-account={accountId || 'guest'}>{client.getQueryData(['viewer', 'saved-reviews']).join(',')}</div>;
      }
      createRoot(document.getElementById('app')).render(<Provider accountId={accountId}><Probe /></Provider>);
    `,
  },
  write: false,
  bundle: true,
  platform: "browser",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{
    name: "isolated-auth",
    setup(builder) {
      builder.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: "dynamic", namespace: "fixture" }));
      builder.onResolve({ filter: /^@\/lib\/supabase\/client$/ }, () => ({ path: "auth", namespace: "fixture" }));
      builder.onResolve({ filter: /^@\// }, ({ path: target }) => ({ path: path.join(web, target.slice(2) + ".ts") }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: target }) => ({
        loader: "js",
        contents: target === "dynamic" ? "export default () => () => null" : `
          const callbacks = new Set();
          const channel = new BroadcastChannel('fixture:auth');
          const notify = (accountId, event) => {
            localStorage.setItem('fixture:ready', 'yes');
            for (const callback of callbacks) callback(event, accountId ? {user: {id: accountId}} : null);
          };
          channel.onmessage = ({data}) => notify(data.accountId, data.event);
          window.emitAuth = (accountId, event, crossTab = false) => {
            if (accountId) localStorage.setItem('fixture:account', accountId);
            else localStorage.removeItem('fixture:account');
            if (crossTab) channel.postMessage({accountId, event});
            else notify(accountId, event);
          };
          export function supabaseBrowser() { return { auth: {
            onAuthStateChange(callback) {
              callbacks.add(callback);
              window.fixtureAuthReady = true;
              queueMicrotask(() => { if (callbacks.has(callback)) notify(localStorage.getItem('fixture:account'), 'INITIAL_SESSION'); });
              return {data: {subscription: {unsubscribe() {callbacks.delete(callback)}}}};
            }
          }}};
        `,
      }));
    },
  }],
});

const server = createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.url === "/fixture.js") {
    res.setHeader("Content-Type", "text/javascript");
    return res.end(bundle.outputFiles[0].text);
  }
  res.setHeader("Content-Type", "text/html");
  if (req.url === "/home") return res.end('<!doctype html><div id="public-home">Public home</div>');
  res.end('<!doctype html><div id="app"></div><script src="/fixture.js"></script>');
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await engine.launch({
  headless: true,
  ...(engine === chromium ? {
    args: ["--no-sandbox"],
    ...(process.env.ACCOUNT_CACHE_CHROMIUM_EXECUTABLE ? { executablePath: process.env.ACCOUNT_CACHE_CHROMIUM_EXECUTABLE } : {}),
  } : {}),
});
try {
  const context = await browser.newContext();
  await context.route("**/*", (route) => route.request().url().startsWith(baseUrl)
    ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => { errors.push(error.message); console.error(error.message); });
  await page.goto(baseUrl);
  await page.waitForFunction(() => window.fixtureAuthReady === true);
  await page.evaluate(() => {
    localStorage.setItem("fixture:account", "listener-a");
    localStorage.setItem("kocteau:pending-review-draft", "draft survives account cache cleanup");
  });
  const target = baseUrl + "/search?compose=1&draft=review#focus";
  await page.goto(target);
  await page.waitForSelector('[data-account="listener-a"]');
  await page.waitForFunction(() => window.fixtureAuthReady === true);
  const documents = await page.evaluate(() => sessionStorage.getItem("fixture:documents"));
  await page.evaluate(() => window.emitAuth("listener-a", "TOKEN_REFRESHED"));
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => sessionStorage.getItem("fixture:documents")), documents);
  await page.evaluate(() => window.startRead());
  await Promise.all([
    page.waitForEvent("load"),
    page.evaluate(() => { window.emitAuth("listener-b", "SIGNED_IN"); window.emitAuth("listener-b", "SIGNED_IN"); }),
  ]);
  assert.equal(page.url(), target);
  assert.equal(await page.locator('[data-account="listener-b"]').textContent(), "listener-b");
  assert.equal(await page.evaluate(() => localStorage.getItem("fixture:aborted")), "yes");
  assert.equal(Number(await page.evaluate(() => sessionStorage.getItem("fixture:documents"))), Number(documents) + 1);

  const otherTab = await context.newPage();
  await otherTab.goto(baseUrl);
  await otherTab.waitForSelector('[data-account="listener-b"]');
  await Promise.all([
    page.waitForURL(baseUrl + "/login"),
    otherTab.evaluate(() => window.emitAuth(null, "SIGNED_OUT", true)),
  ]);
  assert.equal(await page.locator('[data-account="guest"]').textContent(), "guest");
  assert.equal(await page.evaluate(() => localStorage.getItem("kocteau:pending-review-draft")), "draft survives account cache cleanup");
  assert.deepEqual(errors, []);
  await context.close();

  const mismatch = await browser.newContext();
  await mismatch.route("**/*", (route) => route.request().url().startsWith(baseUrl)
    ? route.continue() : route.abort());
  await mismatch.addInitScript(() => localStorage.setItem("fixture:account", "listener-a"));
  const mismatchPage = await mismatch.newPage();
  mismatchPage.setDefaultTimeout(10000);
  await mismatchPage.goto(baseUrl + "/search?serverAccount=guest");
  await mismatchPage.waitForURL(baseUrl + "/home");
  assert.equal(await mismatchPage.locator("#public-home").textContent(), "Public home");
  assert.equal(await mismatchPage.evaluate(() => sessionStorage.getItem("fixture:documents")), "2");
  await mismatch.close();
  console.log(JSON.stringify({ browser: engine === chromium ? "chromium" : "webkit", checks: ["same-account token refresh", "account replacement", "abort pending read", "single navigation", "URL preservation", "cross-tab sign-out", "guest cache", "draft storage", "bounded initial mismatch"] }));
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
