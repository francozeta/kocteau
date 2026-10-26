import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { startJourneyFixture } from "./fixtures/journey-tracing-upstreams.mjs";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = resolve(webRoot, "../..");
const require = createRequire(join(webRoot, "package.json"));
const baselineRef = process.env.CANONICAL_CACHE_BASELINE_REF || null;
const upstream = await startJourneyFixture();
upstream.state.headerDelayMs = 180;
const root = join(repositoryRoot, ".plan/local");
await mkdir(root, { recursive: true });
const fixture = await mkdtemp(join(root, "canonical-cache-"));
let app,
  appUrl,
  output = "";
const results = [];
const request = async (kind, id, method = "GET") => {
  const response = await fetch(
    appUrl + "/probe?" + new URLSearchParams({ kind, id }),
    {
      method,
      signal: AbortSignal.timeout(15000),
    },
  );
  return { status: response.status, data: await response.json() };
};
const check = async (label, kind, id, expected, status = 200) => {
  upstream.state.reads = 0;
  const started = performance.now();
  const response = await request(kind, id);
  assert.equal(response.status, status, output.slice(-1000));
  const row = {
    label,
    reads: upstream.state.reads,
    ms: Math.round(performance.now() - started),
  };
  results.push(row);
  if (!baselineRef) assert.equal(row.reads, expected, label);
  return response.data;
};
try {
  await mkdir(join(fixture, "app/probe"), { recursive: true });
  await symlink(
    join(webRoot, "node_modules"),
    join(fixture, "node_modules"),
    "dir",
  );
  await writeFile(
    join(fixture, "package.json"),
    JSON.stringify({ name: "canonical-cache-verification", private: true }),
  );
  const paths = {
    "@/*": [relative(fixture, webRoot).replaceAll("\\", "/") + "/*"],
  };
  if (baselineRef) {
    await mkdir(join(fixture, "baseline"));
    for (const name of ["reviews", "entities"]) {
      const text = execFileSync(
        "git",
        ["show", baselineRef + ":apps/web/lib/queries/" + name + ".ts"],
        { cwd: repositoryRoot, encoding: "utf8" },
      );
      await writeFile(join(fixture, "baseline", name + ".ts"), text);
      paths["@/lib/queries/" + name] = ["./baseline/" + name + ".ts"];
    }
  }
  await writeFile(
    join(fixture, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { baseUrl: ".", paths } }),
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
    join(fixture, "app/layout.js"),
    "export default function Layout({children}) {return <html><body>{children}</body></html>;}",
  );
  await writeFile(
    join(fixture, "app/probe/route.js"),
    [
      'import { getPublicReviewByRouteId } from "@/lib/queries/reviews";',
      'import { getEntityPageByRouteId } from "@/lib/queries/entities";',
      ...(!baselineRef
        ? [
            'import { expireCanonicalRouteReads } from "@/lib/queries/canonical-cache";',
          ]
        : []),
      'export const dynamic = "force-dynamic";',
      "export async function GET(req) { const p = new URL(req.url).searchParams; try {",
      ' const row = await (p.get("kind") === "review" ? getPublicReviewByRouteId(p.get("id")) : getEntityPageByRouteId(p.get("id")));',
      ' return Response.json(row); } catch { return Response.json({error:"source unavailable"}, {status:503}); }}',
      ...(!baselineRef
        ? [
            'export async function POST(req) {const p=new URL(req.url).searchParams; expireCanonicalRouteReads(p.get("kind"),p.get("id")); return Response.json({ok:true});}',
          ]
        : []),
    ].join("\n"),
  );
  app = spawn(
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
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "isolated-fixture-key",
        NEXT_PUBLIC_SENTRY_DSN: "",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [app.stdout, app.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk).slice(-16000);
    });
  const end = Date.now() + 60000;
  while (!appUrl) {
    if (app.exitCode !== null || app.signalCode !== null) throw Error(output);
    appUrl = stripVTControlCharacters(output).match(
      /- Local:\s+(http:\/\/127\.0\.0\.1:\d+)/,
    )?.[1];
    if (Date.now() > end) throw Error("Next startup timed out");
    await delay(100);
  }
  const review = upstream.reviews[0],
    entity = upstream.entity;
  assert.equal(
    (await check("review cold", "review", review.short_id, 1)).id,
    review.id,
  );
  assert.equal(
    (await check("review repeat", "review", review.short_id, 0)).id,
    review.id,
  );
  assert.equal(
    (await check("entity cold", "entity", entity.short_id, 1)).id,
    entity.id,
  );
  assert.equal(
    (await check("entity repeat", "entity", entity.short_id, 0)).id,
    entity.id,
  );
  upstream.state.fail = true;
  upstream.state.failTable = "reviews";
  await check(
    "warm review survives source failure",
    "review",
    review.short_id,
    0,
    baselineRef ? 503 : 200,
  );
  const coldReview = upstream.reviews[1];
  await check("cold failure", "review", coldReview.short_id, 1, 503);
  upstream.state.fail = false;
  assert.equal(
    (await check("failed fill recovers", "review", coldReview.short_id, 1)).id,
    coldReview.id,
  );
  await check("recovered repeat", "review", coldReview.short_id, 0);
  if (!baselineRef) {
    const legacy = review.short_id.slice(0, 8);
    await check("legacy fill", "review", legacy, 1);
    await check("UUID fill", "review", review.id, 1);
    review.body = "Edited source content";
    await request("review", review.id, "POST");
    for (const id of [review.short_id, legacy, review.id])
      assert.equal(
        (await check("edit invalidates " + id.length, "review", id, 1)).body,
        review.body,
      );
    upstream.reviews.splice(upstream.reviews.indexOf(review), 1);
    await request("review", review.id, "POST");
    for (const id of [review.short_id, legacy, review.id])
      assert.equal(
        await check("delete invalidates " + id.length, "review", id, 1),
        null,
      );
    await check("absence repeat", "review", review.short_id, 0);
    upstream.reviews.push(review);
    await request("review", review.id, "POST");
    assert.equal(
      (
        await check(
          "creation invalidates absence",
          "review",
          review.short_id,
          1,
        )
      ).id,
      review.id,
    );
    upstream.state.identityMode = "ambiguous";
    await request("review", review.id, "POST");
    assert.equal(
      await check("ambiguous legacy prefix", "review", legacy, 1),
      null,
    );
    upstream.state.identityMode = "normal";
    const entityLegacy = upstream.entity.short_id.slice(0, 8);
    await check("entity legacy fill", "entity", entityLegacy, 1);
    await check("entity UUID fill", "entity", upstream.entity.id, 1);
    upstream.entity.title = "Updated fixture track";
    await request("entity", upstream.entity.id, "POST");
    for (const id of [
      upstream.entity.short_id,
      entityLegacy,
      upstream.entity.id,
    ])
      assert.equal(
        (await check("entity update invalidates " + id.length, "entity", id, 1))
          .title,
        upstream.entity.title,
      );
  }
  const report = {
    at: new Date().toISOString(),
    mode: baselineRef ? "baseline" : "candidate",
    baselineRef,
    limits:
      "Isolated actual Next Data Cache; synthetic HTTP delays and origin counts, not production percentiles.",
    results,
  };
  const evidence = join(repositoryRoot, ".codex-private/navigation");
  await mkdir(evidence, { recursive: true });
  await writeFile(
    join(evidence, baselineRef ? "cache-before.json" : "cache-after.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  if (app && app.exitCode === null) {
    process.kill(-app.pid, "SIGTERM");
    await Promise.race([once(app, "exit"), delay(5000)]);
    if (app.exitCode === null) process.kill(-app.pid, "SIGKILL");
  }
  app?.stdout.destroy();
  app?.stderr.destroy();
  await upstream.close();
  await rm(fixture, { recursive: true, force: true });
}
