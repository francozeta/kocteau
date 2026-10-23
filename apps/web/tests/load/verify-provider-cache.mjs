import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = resolve(webRoot, "../..");
const require = createRequire(import.meta.url);
const baseline = process.env.PROVIDER_CACHE_BASELINE === "1";
const state = { reads: 0, fail: false };
const upstream = createServer((request, response) => {
  const url = new URL(request.url, "http://fixture.local");
  if (url.pathname !== "/rest/v1/entities") {
    response.writeHead(404).end();
    return;
  }
  state.reads++;
  const id = url.searchParams.get("provider_id")?.replace(/^eq\./, "") ?? "";
  response.setHeader("Content-Type", "application/json");
  response.statusCode = state.fail ? 503 : 200;
  const data = id.startsWith("absent-") ? [] : [{
    id: "00000000-0000-4000-8000-000000000042",
    provider: "deezer",
    provider_id: id,
    type: "track",
    title: "Provider cache fixture",
    artist_name: "Fixture artist",
  }];
  response.end(JSON.stringify(state.fail
    ? { code: "TEST_UNAVAILABLE", message: "Isolated fixture failure" }
    : data));
});
const listen = async (server) => {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return server.address().port;
};
const upstreamPort = await listen(upstream);
const root = join(repositoryRoot, ".plan/local");
await mkdir(root, { recursive: true });
const fixture = await mkdtemp(join(root, "provider-cache-"));
let appUrl;
let child;
let output = "";
const results = [];
const request = async (query) => {
  const response = await fetch(appUrl + "/?" + new URLSearchParams(query), {
    signal: AbortSignal.timeout(45_000),
  });
  const html = await response.text();
  assert.equal(response.status, 200, output.slice(-4000));
  return html;
};
const checkReads = (scenario, expected) => {
  results.push({ scenario, originReads: state.reads });
  if (!baseline) assert.equal(state.reads, expected, scenario);
};
try {
  await mkdir(join(fixture, "app"));
  await symlink(join(webRoot, "node_modules"), join(fixture, "node_modules"), "dir");
  await writeFile(join(fixture, "package.json"), JSON.stringify({
    name: "provider-cache-verification", private: true,
  }));
  await writeFile(join(fixture, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      baseUrl: ".",
      paths: { "@/*": [relative(fixture, webRoot).replaceAll("\\", "/") + "/*"] },
    },
  }));
  await writeFile(join(fixture, "next.config.mjs"),
    "export default " + JSON.stringify({
      devIndicators: false, turbopack: { root: repositoryRoot },
    }) + ";\n");
  await writeFile(join(fixture, "app/layout.js"),
    "export default function Layout({children}) { return <html><body>{children}</body></html>; }\n");
  await writeFile(join(fixture, "app/page.js"), [
    'import { getEntityPageByProvider } from "@/lib/queries/entities";',
    'export const dynamic = "force-dynamic";',
    'export async function generateMetadata({searchParams}) {',
    ' const {id} = await searchParams;',
    ' const entity = await getEntityPageByProvider("deezer", "track", id);',
    ' return {title: entity?.title ?? "Missing fixture"};',
    '}',
    'export default async function Page({searchParams}) {',
    ' const {id, pageId} = await searchParams;',
    ' const entity = await getEntityPageByProvider("deezer", "track", pageId ?? id);',
    ' return <main>{entity?.title ?? "missing"}</main>;',
    '}',
  ].join("\n"));
  child = spawn(process.execPath, [
    require.resolve("next/dist/bin/next"), "dev",
    "--hostname", "127.0.0.1", "--port", "0",
  ], {
    cwd: fixture,
    detached: true,
    env: {
      PATH: process.env.PATH,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:" + upstreamPort,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "isolated-fixture-key",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk) => { output = (output + chunk).slice(-16_000); });
  }
  const readyUntil = Date.now() + 45_000;
  while (true) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error(output);
    appUrl ??= stripVTControlCharacters(output).match(/- Local:\s+(http:\/\/127\.0\.0\.1:\d+)/)?.[1];
    if (appUrl) {
      try {
        const response = await fetch(appUrl + "/favicon.ico", { signal: AbortSignal.timeout(2000) });
        await response.body?.cancel();
        break;
      } catch {
        // The listener can be announced before the app is ready to serve.
      }
    }
    if (Date.now() >= readyUntil) throw new Error("Next startup timed out\n" + output);
    await delay(200);
  }
  const key = randomUUID();
  state.reads = 0;
  const html = await request({ id: "found-" + key });
  assert.ok(html.includes("Provider cache fixture"));
  checkReads("metadata and page share a cold lookup", 1);

  state.reads = 0;
  await request({ id: "found-" + key });
  checkReads("a later request reuses the persistent cache", 0);

  state.reads = 0;
  await request({ id: "first-" + key, pageId: "second-" + key });
  checkReads("different identities remain independent", 2);

  state.reads = 0;
  state.fail = true;
  await request({ id: "recover-" + key });
  checkReads("a failed render shares one attempted lookup", 1);

  state.reads = 0;
  state.fail = false;
  const recovered = await request({ id: "recover-" + key });
  assert.ok(recovered.includes("Provider cache fixture"));
  checkReads("a new request recovers after the origin failure", 1);

  state.reads = 0;
  await request({ id: "absent-" + key });
  checkReads("successful absence is shared within the render", 1);
  state.reads = 0;
  await request({ id: "absent-" + key });
  checkReads("successful absence remains persistently cacheable", 0);

  console.log(JSON.stringify({ mode: baseline ? "baseline" : "assertions", results }, null, 2));
} finally {
  if (child && child.exitCode === null) {
    process.kill(-child.pid, "SIGTERM");
    await Promise.race([once(child, "exit"), delay(5000, undefined, { ref: false })]);
    if (child.exitCode === null) process.kill(-child.pid, "SIGKILL");
  }
  child?.stdout.destroy();
  child?.stderr.destroy();
  upstream.closeAllConnections();
  await new Promise((done) => upstream.close(done));
  await rm(fixture, { recursive: true, force: true });
}
