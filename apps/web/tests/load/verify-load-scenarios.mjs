import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const k6 = process.env.K6_EXECUTABLE || "k6";
const suite = fileURLToPath(new URL("./kocteau.js", import.meta.url));
const trackPath = "/tracks/fixture-track-fixture-artist-123456789abc";
const landing = "<h1><span>Keep</span> what the music left behind.</h1>";
const feed = '<div class="kocteau-feed-tabs"><a href="/" aria-current="page">For You</a></div>';
const track = '<h1>Fixture track</h1><script id="track-structured-data" type="application/ld+json">{"@type":"MusicRecording"}</script>';
const cases = ["healthy", "wrong_landing", "wrong_feed", "wrong_track", "expired_session", "wrong_redirect"];

for (const scenario of cases) {
  const observed = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    observed.push({ path: request.url, authenticated: Boolean(request.headers.cookie) });
    const redirect = (status, location) => response.writeHead(status, { Location: location }).end();
    if (request.url === "/") return redirect(307, "/home");
    if (url.pathname === "/feed") {
      return redirect(scenario === "wrong_redirect" ? 307 : 308, "/?view=for-you");
    }
    if (url.pathname === "/sitemap.xml") {
      response.writeHead(200, { "Content-Type": "application/xml" });
      return response.end(`<urlset><url><loc>http://127.0.0.1${trackPath}</loc></url></urlset>`);
    }
    if (url.pathname === "/api/search") {
      response.writeHead(200, {
        "Content-Type": "application/json",
        "X-Kocteau-Search-Status": "fresh",
        "Server-Timing": "local;dur=1, total;dur=1",
      });
      return response.end('[{"provider_id":"fixture"}]');
    }
    if (request.url === "/?view=for-you" && scenario === "expired_session") {
      return redirect(307, "/login");
    }
    response.writeHead(200, { "Content-Type": "text/html" });
    if (url.pathname === "/home") {
      return response.end(scenario === "wrong_landing" ? "<h1>Log in</h1>" : landing);
    }
    if (request.url === "/?view=for-you") {
      // Marketing copy may mention For You; only the active real feed tab qualifies.
      return response.end(scenario === "wrong_feed" ? "<h1>For You preview</h1>" : feed);
    }
    if (url.pathname === trackPath) {
      return response.end(scenario === "wrong_track" ? "<h1>Not found</h1>" : track);
    }
    return response.end("<h1>Search</h1>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const result = await runK6(`http://127.0.0.1:${server.address().port}`);
    assert.equal(result.code === 0, scenario === "healthy", `${scenario}: unexpected exit ${result.code}\n${result.output}`);
    if (scenario === "wrong_redirect") {
      assert.equal(observed.some(({ path }) => path === "/home"), false, "failed compatibility must stop before timed surfaces");
    } else {
      assert.ok(observed.some(({ path }) => path === "/home"), "measure the canonical public landing");
      assert.ok(observed.some(({ path, authenticated }) => path === "/?view=for-you" && authenticated), "measure the canonical authenticated feed");
      assert.ok(observed.some(({ path }) => path === trackPath), "discover the compact canonical track from the sitemap");
    }
    console.log(`${scenario}: ${scenario === "healthy" ? "accepted" : "rejected"}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function runK6(baseUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn(k6, ["run", "--quiet", suite], {
      env: {
        PATH: process.env.PATH,
        K6_PROFILE: "smoke",
        K6_BASE_URL: baseUrl,
        K6_AUTH_COOKIE: "sb-fixture=local-only",
        K6_SEARCH_SOURCE: "local",
        K6_SEARCH_REQUIRE_MATCHES: "1",
        K6_NO_USAGE_REPORT: "true",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
  });
}
