#!/usr/bin/env node
// Next.js streaming regression fixture. All data and HTTP stay on loopback;
// nothing is sent to production or to a real Supabase project.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(webRoot, "../..");
const require = createRequire(import.meta.url);
const root = join(repoRoot, ".plan/local");
await mkdir(root, { recursive: true });
const fixture = await mkdtemp(join(root, "reviews-stream-"));
let server;
let child;
let output = "";
let requested = false;
const waiting = [];
const result = { initialContentBeforeFeed: false, reviewsAfterFeed: false };
const local = relative(fixture, webRoot).replaceAll("\\", "/");

async function waitFor(test, label) {
  const deadline = Date.now() + 45_000;
  while (!test()) {
    if (Date.now() > deadline) throw new Error(label + "\n" + output);
    await delay(40);
  }
}
try {
  server = createServer((req, res) => {
    if (req.url !== "/feed") {
      res.writeHead(404);
      res.end();
      return;
    }
    requested = true;
    waiting.push(() => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        feed: [{
          id: "fixture-review", title: "Fixture review", body: "Fixture body",
          rating: 4, created_at: "2026-11-02T00:00:00Z",
          entities: { id: "fixture-track", title: "Fixture track" },
          author: { id: "fixture-author", username: "fixture-listener" },
        }],
      }));
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  await mkdir(join(fixture, "app"), { recursive: true });
  await mkdir(join(fixture, "stubs"), { recursive: true });
  await symlink(join(webRoot, "node_modules"), join(fixture, "node_modules"), "dir");
  await writeFile(join(fixture, "package.json"), JSON.stringify({ name: "reviews-stream-fixture", private: true }));
  await writeFile(join(fixture, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      baseUrl: ".",
      paths: {
        "@/components/feed/feed-loading-skeletons": ["./stubs/skeleton.tsx"],
        "@/components/reviews/review-route-cards-server": ["./stubs/card.tsx"],
        "@/components/shared/json-ld": ["./stubs/jsonld.tsx"],
        "@/lib/auth/server": ["./stubs/auth.ts"],
        "@/lib/metadata": ["./stubs/metadata.ts"],
        "@/lib/queries/feed": ["./stubs/feed.ts"],
        "@/lib/structured-data": ["./stubs/structured.ts"],
        "@/*": [local + "/*"],
      },
    },
  }));
  await writeFile(join(fixture, "next.config.mjs"),
    "export default " + JSON.stringify({ devIndicators: false, turbopack: { root: repoRoot } }) + ";");
  await writeFile(join(fixture, "app/layout.tsx"),
    "export default function Layout({children}) { return <html lang='en'><body>{children}</body></html>; }");
  await writeFile(join(fixture, "app/page.tsx"),
    (await readFile(join(webRoot, "app/(main)/reviews/page.tsx"), "utf8")));
  await writeFile(join(fixture, "stubs/skeleton.tsx"),
    "export function FeedReviewStackSkeleton(){return <div data-fixture='loading'>Loading reviews</div>}");
  await writeFile(join(fixture, "stubs/card.tsx"),
    "export function FeedReviewCard({review}){return <article data-fixture='review'>{review.title}</article>}");
  await writeFile(join(fixture, "stubs/jsonld.tsx"),
    "export default function JsonLd(){return <script type='application/ld+json' dangerouslySetInnerHTML={{__html:'{}'}}/>}");
  await writeFile(join(fixture, "stubs/auth.ts"),
    "import {cookies} from 'next/headers'; export async function getCurrentUserId(){await cookies(); return null;}");
  await writeFile(join(fixture, "stubs/metadata.ts"),
    "export function createPageMetadata(){return {title:'Fixture reviews'}}");
  await writeFile(join(fixture, "stubs/feed.ts"),
    "export async function getFeedPage(){return fetch(process.env.FIXTURE_FEED_URL,{cache:'no-store'}).then(r=>r.json())} export async function getFeedViewerState(){throw Error('Guest must not fetch private state')}");
  await writeFile(join(fixture, "stubs/structured.ts"),
    "export function buildReviewsPageJsonLd(){return {}}");

  child = spawn(process.execPath, [require.resolve("next/dist/bin/next"),
    "dev", "--hostname", "127.0.0.1", "--port", "0"], {
    cwd: fixture,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      FIXTURE_FEED_URL: "http://127.0.0.1:" + server.address().port + "/feed",
    },
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (part) => { output = (output + part).slice(-20_000); });
  }
  let appUrl;
  await waitFor(() => {
    appUrl ??= stripVTControlCharacters(output).match(/- Local:\s+(http:\/\/127\.0\.0\.1:\d+)/)?.[1];
    return Boolean(appUrl);
  }, "Fixture Next app did not start");

  // The origin intentionally does not release the feed until we have seen the
  // heading + loading state in the HTML stream.
  const responsePromise = fetch(appUrl + "/", { signal: AbortSignal.timeout(60_000) });
  await waitFor(() => requested, "The public feed read was never started");
  const response = await Promise.race([
    responsePromise,
    delay(15_000).then(() => { throw new Error("Headers blocked behind held public feed"); }),
  ]);
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  const firstDeadline = Date.now() + 15_000;
  while (!body.includes("Loading reviews") && Date.now() < firstDeadline) {
    const chunk = await Promise.race([
      reader.read(),
      delay(2_000).then(() => { throw new Error("Streaming blocked behind held public feed"); }),
    ]);
    assert.equal(chunk.done, false, "HTML completed without visible fallback");
    body += decoder.decode(chunk.value, { stream: true });
  }
  assert.ok(body.includes("Music reviews"), "Real heading must render while feed is delayed");
  assert.ok(body.includes("Loading reviews"), "Streaming fallback must render while feed is delayed");
  assert.ok(!body.includes("Fixture review"), "Private/list content must not appear before data arrives");
  result.initialContentBeforeFeed = true;
  waiting.forEach((release) => release());
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    body += decoder.decode(chunk.value, { stream: true });
  }
  result.reviewsAfterFeed = body.includes("Fixture review");
  assert.ok(result.reviewsAfterFeed, "The real review must arrive after the feed resumes");
  console.log(JSON.stringify({ result: "PASS", ...result }));
} finally {
  if (child?.pid) {
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
  }
  server?.closeAllConnections();
  await new Promise((resolve) => server?.close(resolve) ?? resolve());
  await rm(fixture, { recursive: true, force: true });
}
