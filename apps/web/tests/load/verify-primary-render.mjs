import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import {
  cp,
  mkdtemp,
  mkdir,
  rm,
  symlink,
  writeFile,
  readFile,
} from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = resolve(webRoot, "../..");
const require = createRequire(import.meta.url);
const { webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const baselineRef = process.env.PRIMARY_RENDER_BASELINE_REF;
if (baselineRef && !/^[a-f0-9]{40}$/.test(baselineRef))
  throw new Error("Use a pinned baseline commit");
const source = async (path) =>
  baselineRef
    ? execFileSync("git", ["show", baselineRef + ":apps/web/" + path], {
        cwd: repositoryRoot,
        encoding: "utf8",
      })
    : readFile(join(webRoot, path), "utf8");
const review = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Fixture listening note",
  body: "Synthetic isolated review.",
  rating: 4,
  likes_count: 0,
  comments_count: 0,
  created_at: "2026-10-25T00:00:00Z",
  entities: {
    id: "00000000-0000-4000-8000-000000000042",
    provider: "deezer",
    provider_id: "42",
    type: "track",
    title: "Fixture track",
    artist_name: "Fixture artist",
    cover_url: null,
    deezer_url: null,
  },
  author: {
    id: "00000000-0000-4000-8000-000000000043",
    username: "fixture-listener",
    display_name: "Fixture listener",
    avatar_url: null,
  },
};
const tracks = Array.from({ length: 6 }, (_, i) => ({
  id: "fixture-pick-" + i,
  provider: "deezer",
  provider_id: String(42 + i),
  type: "track",
  title: "Fixture pick " + i,
  artist_name: "Fixture artist",
  cover_url: null,
  deezer_url: null,
  prompt: "An isolated prompt",
  editorial_note: null,
  collection_slug: "starter-picks",
  collection_title: "Starter picks",
  matched_tag_count: 0,
  score: 0,
}));
const state = {
  gateStarters: false,
  gateFeed: false,
  fail: false,
  empty: false,
  reads: [],
  pending: [],
};
const release = (kind) => {
  state[kind === "starters" ? "gateStarters" : "gateFeed"] = false;
  for (const item of state.pending.filter((x) => x.kind === kind)) item.send();
  state.pending = state.pending.filter((x) => x.kind !== kind);
};
const upstream = createServer((req, res) => {
  const url = new URL(req.url, "http://fixture.local");
  const kind = url.pathname === "/starters" ? "starters" : "feed";
  state.reads.push({
    kind,
    viewer: url.searchParams.get("viewer"),
    view: url.searchParams.get("view"),
  });
  const body =
    kind === "starters"
      ? state.fail
        ? []
        : tracks
      : {
          feed: state.empty ? [] : [review],
          activeUsers: [],
          nextCursor: null,
          view: url.searchParams.get("view") || "latest",
          requiresAuth: false,
        };
  const send = () => {
    res.statusCode = state.fail && kind === "starters" ? 503 : 200;
      res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };
  if (state[kind === "starters" ? "gateStarters" : "gateFeed"])
    state.pending.push({ kind, send });
  else send();
});
upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
const root = join(repositoryRoot, ".plan/local");
await mkdir(root, { recursive: true });
const fixture = await mkdtemp(join(root, "primary-render-"));
let child,
  browser,
  appUrl,
  output = "";
const results = [];
async function waitForOrigin(predicate) {
  const deadline = Date.now() + 45000;
  while (!predicate()) {
    if (Date.now() > deadline)
      throw new Error("Fixture origin was not called\n" + output);
    await delay(20);
  }
}
try {
  for (const path of ["app/feed", "app/api/feed", "app/login", "stubs"])
    await mkdir(join(fixture, path), { recursive: true });
  await symlink(
    join(webRoot, "node_modules"),
    join(fixture, "node_modules"),
    "dir",
  );
  await symlink(join(webRoot, "public"), join(fixture, "public"), "dir");
  await symlink(
    join(webRoot, "postcss.config.mjs"),
    join(fixture, "postcss.config.mjs"),
  );
  await writeFile(
    join(fixture, "package.json"),
    JSON.stringify({ name: "primary-render-verification", private: true }),
  );
  const local = relative(fixture, webRoot).replaceAll("\\", "/");
  await writeFile(
    join(fixture, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/lib/auth/server": ["./stubs/auth.ts"],
          "@/lib/queries/feed": ["./stubs/feed.ts"],
          "@/lib/queries/starter": ["./stubs/starter.ts"],
          "@/components/landing/guest-home": ["./stubs/guest-home.tsx"],
          "@/*": [local + "/*"],
        },
      },
    }),
  );
  await writeFile(
    join(fixture, "next.config.mjs"),
    "export default " +
      JSON.stringify({
        devIndicators: false,
        turbopack: { root: repositoryRoot },
      }) +
      ";",
  );
  await writeFile(
    join(fixture, "app/feed/page.tsx"),
    await source("app/(main)/feed/page.tsx"),
  );
  await writeFile(
    join(fixture, "app/page.tsx"),
    (await source("app/(home)/page.tsx")).replace(
      "export const revalidate = 300;",
      'export const dynamic = "force-dynamic";',
    ),
  );
  await writeFile(
    join(fixture, "stubs/guest-home.tsx"),
    await source("components/landing/guest-home.tsx"),
  );
  await writeFile(
    join(fixture, "app/globals.css"),
    '@import "' +
      webRoot +
      '/app/globals.css";\n@source "' +
      webRoot +
      '/components";\n@source "' +
      webRoot +
      '/app";',
  );
  await writeFile(
    join(fixture, "app/providers.tsx"),
    '"use client";\nimport {useState} from "react"; import {QueryClient,QueryClientProvider} from "@tanstack/react-query"; export default function Providers({children}) { const [client]=useState(()=>new QueryClient()); return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }',
  );
  await writeFile(
    join(fixture, "app/layout.tsx"),
    'import "./globals.css"; import Providers from "./providers"; export default function Layout({children}) { return <html className="dark"><body><Providers><div data-kocteau-scroll-main>{children}</div></Providers></body></html>; }',
  );
  await writeFile(
    join(fixture, "app/login/page.tsx"),
    "export default function Page(){ return <h1>Fixture login</h1>; }",
  );
  await writeFile(
    join(fixture, "stubs/auth.ts"),
    [
      'import {cookies} from "next/headers";',
      'export async function getCurrentUserId(){ return (await cookies()).get("fixture-viewer")?.value ?? null; }',
      'export async function getCurrentViewerProfile(){ const id=await getCurrentUserId(); return id ? {id, username:"fixture-viewer", display_name:"Fixture viewer", avatar_url:null} : null; }',
    ].join("\n"),
  );
  await writeFile(
    join(fixture, "stubs/feed.ts"),
    [
      'export async function getFeedPage({view="latest",viewerId=null}={}){ return fetch(process.env.FIXTURE_ORIGIN+"/feed?"+new URLSearchParams({view,viewer:viewerId??"guest"}),{cache:"no-store"}).then(r=>r.json()); }',
      'export async function getFeedViewerState(viewerId,ids){ return {likedReviewIds:new Set(viewerId==="viewer-a"?ids:[]),bookmarkedReviewIds:new Set()}; }',
      'export async function getFeedPageBundle(viewerId,view="latest",options={}){const page=await getFeedPage({view,viewerId,...options});return {...page,...await getFeedViewerState(viewerId,page.feed.map(review=>review.id))};}',
    ].join("\n"),
  );
  await writeFile(
    join(fixture, "stubs/starter.ts"),
    [
      'export async function getStarterTracksForSurface({viewerId}) {return fetch(process.env.FIXTURE_ORIGIN+"/starters?viewer="+viewerId,{cache:"no-store"}).then(r=>r.ok?r.json():[]);}',
      'export async function getPublicStarterTracks(){return getStarterTracksForSurface({viewerId:"guest"});}',
    ].join("\n"),
  );
  await writeFile(
    join(fixture, "app/api/feed/route.ts"),
    'import {getFeedPage} from "@/lib/queries/feed"; import {getCurrentUserId} from "@/lib/auth/server"; export async function GET(req){ const url=new URL(req.url);return Response.json(await getFeedPage({view:url.searchParams.get("view")??"for-you",viewerId:await getCurrentUserId()})); }',
  );
  await writeFile(
    join(fixture, "block-upstreams.mjs"),
    [
      "const nativeFetch=globalThis.fetch;",
      'globalThis.fetch=(input,init)=>{const url=new URL(input instanceof Request?input.url:String(input)); if(url.hostname!=="127.0.0.1") throw new Error("Blocked non-loopback fixture request"); return nativeFetch(input,init);};',
    ].join("\n"),
  );
  child = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
    ],
    {
      cwd: fixture,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:" + upstream.address().port,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "isolated-fixture-key",
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
        NEXT_TELEMETRY_DISABLED: "1",
        FIXTURE_ORIGIN: "http://127.0.0.1:" + upstream.address().port,
        NODE_OPTIONS: "--import=" + join(fixture, "block-upstreams.mjs"),
      },
    },
  );
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (x) => {
      output = (output + x).slice(-16000);
    });
  const until = Date.now() + 45000;
  while (true) {
    if (child.exitCode !== null || child.signalCode !== null)
      throw Error(output);
    appUrl ??= stripVTControlCharacters(output).match(
      /- Local:\s+(http:\/\/127\.0\.0\.1:\d+)/,
    )?.[1];
    if (appUrl) {
      try {
        const r = await fetch(appUrl + "/favicon.ico", {
          signal: AbortSignal.timeout(2000),
        });
        await r.body?.cancel();
        break;
      } catch {}
    }
    if (Date.now() > until) throw Error("Next startup timeout\n" + output);
    await delay(100);
  }
  browser = await webkit.launch();
  for (const mobile of [true, false]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: "reduce",
    });
    await context.addCookies([
      { name: "fixture-viewer", value: "viewer-a", url: appUrl },
    ]);
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (
        url.hostname !== "127.0.0.1" ||
        url.pathname.startsWith("/api/analytics")
      )
        return route.fulfill({ status: 204 });
      return route.continue();
    });
    console.log("Checking", mobile ? "mobile" : "desktop");
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    const hydrationErrors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (message) => {
      if (/hydration|hydrated|did not match/i.test(message.text())) hydrationErrors.push(message.text());
    });
    await page.goto(appUrl + "/feed", {
      waitUntil: "networkidle",
      timeout: 90000,
    });
    await page.locator(".kocteau-review-card-list-item").first().waitFor();
    await page.goto("about:blank");
    state.reads = [];
    state.gateStarters = true;
    const nav = page.goto(appUrl + "/feed", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await waitForOrigin(() => state.reads.some((x) => x.kind === "starters"));
    await delay(1000);
    const readyBeforeStarters =
      (await page.locator(".kocteau-review-card-list-item").count()) > 0;
    assert.equal(
      readyBeforeStarters,
      !baselineRef,
      "ready reviews must not await starter data",
    );
    const before = readyBeforeStarters
      ? await page
          .locator(".kocteau-review-card-list-item")
          .first()
          .boundingBox()
      : null;
    const pendingReads = state.reads.filter(
      (x) => x.kind === "starters",
    ).length;
    release("starters");
    await nav;
    await page
      .getByRole("link", {
        name: /Start a discovery route from Fixture pick 1/,
      })
      .first()
      .waitFor();
    await delay(100);
    const after = await page
      .locator(".kocteau-review-card-list-item")
      .first()
      .boundingBox();
    if (before)
      assert.ok(
        Math.abs(before.y - after.y) < 3,
        "starter arrival must preserve the review's vertical position",
      );
    assert.equal(pendingReads, 1, "all starter slots share one server read");
    results.push({
      mobile,
      scenario: "ready feed with held editorial read",
      readyBeforeStarters,
      starterReads: pendingReads,
      reviewShiftPx: before
        ? Math.round((after.y - before.y) * 100) / 100
        : null,
    });
    for (const [label, view] of [["Following", "following"], ["Trending", "top-rated"], ["For You", "for-you"]]) {
      await page.getByRole("link", { name: label, exact: true }).click();
      assert.equal(await page.getByRole("link", { name: label, exact: true }).getAttribute("aria-current"), "page");
      await page.locator(".kocteau-review-card-list-item").first().waitFor();
      assert.equal(new URL(page.url()).searchParams.get("view") ?? "for-you", view);
    }
    results.push({ mobile, scenario: "For You, Following and Trending retain their navigation and content" });
    state.fail = true;
    await page.goto(appUrl + "/feed", { waitUntil: "networkidle" });
    assert.equal(
      await page.locator(".kocteau-review-card-list-item").count(),
      1,
    );
    state.fail = false;
    state.empty = true;
    await page.goto(appUrl + "/feed", { waitUntil: "networkidle" });
    await page.getByText("Pick your next review", { exact: true }).waitFor();
    assert.equal(
      await page.getByText("No picks yet", { exact: true }).count(),
      0,
    );
    results.push({
      mobile,
      scenario:
        "optional empty/failure fallback and sparse feed preserve content",
    });
    state.empty = false;
    await page.goto(appUrl + "/", { waitUntil: "networkidle", timeout: 90000 });
    await page.goto("about:blank");
    state.reads = [];
    state.gateFeed = true;
    state.gateStarters = true;
    const homeNav = page.goto(appUrl + "/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await waitForOrigin(() => state.reads.length >= 2);
    await delay(1000);
    const heroBeforeData =
      (await page
        .getByRole("heading", { name: "Keep what the music left behind." })
        .count()) > 0;
    assert.equal(
      heroBeforeData,
      !baselineRef,
      "the landing introduction must not wait for origin data",
    );
    release("feed");
    if (!baselineRef)
      await page
        .locator("#home-structured-data")
        .waitFor({ state: "attached" });
    release("starters");
    await homeNav;
    await page
      .locator("#recent-reviews a[href^='/reviews/']")
      .first()
      .waitFor();
    assert.equal(state.reads.filter((x) => x.kind === "starters").length, 1);
    results.push({
      mobile,
      scenario:
        "public landing hero and review content are independent of picks",
      heroBeforeData,
      starterReads: 1,
    });
    assert.deepEqual(errors, []);
    if (!baselineRef) assert.deepEqual(hydrationErrors, []);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      "no horizontal overflow",
    );
    await context.clearCookies();
    await page.goto(appUrl + "/feed", { waitUntil: "domcontentloaded" });
    assert.ok(page.url().includes("/login?next=/feed"));
    results.push({
      mobile,
      scenario: "unauthenticated feed still redirects to login",
    });
    await context.close();
  }
  console.log(
    JSON.stringify(
      { mode: baselineRef ?? "working tree", engine: "WebKit", results },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  console.error(output.slice(-7000));
  process.exitCode = 1;
} finally {
  release("feed");
  release("starters");
  await browser?.close();
  if (child && child.exitCode === null) {
    process.kill(-child.pid, "SIGTERM");
    await Promise.race([
      once(child, "exit"),
      delay(5000, undefined, { ref: false }),
    ]);
    if (child.exitCode === null) process.kill(-child.pid, "SIGKILL");
  }
  child?.stdout.destroy();
  child?.stderr.destroy();
  upstream.closeAllConnections();
  await new Promise((done) => upstream.close(done));
  await rm(fixture, { recursive: true, force: true });
}
