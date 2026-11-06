import assert from "node:assert/strict";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
async function inspect(path, accept) {
  const response = await fetch(base + path, { headers: accept ? { Accept: accept } : {}, redirect: "follow" });
  return { response, text: await response.text() };
}
function contentType(response, expected) {
  assert.match(response.headers.get("content-type") ?? "", expected);
}
function checkVary(response) {
  assert.match(response.headers.get("vary") ?? "", /(?:^|,)\s*Accept\s*(?:,|$)/i);
}

const mdHome = await inspect("/", "text/markdown");
assert.equal(mdHome.response.status, 200, "Markdown homepage status");
contentType(mdHome.response, /^text\/markdown/i);
checkVary(mdHome.response);
assert.ok(mdHome.text.length >= 500 && mdHome.text.startsWith("# Kocteau"));

const htmlHome = await inspect("/", "text/html");
assert.equal(htmlHome.response.status, 200, "HTML homepage status");
contentType(htmlHome.response, /^text\/html/i);
assert.match(htmlHome.text, /<h1\b/i);
assert.match(htmlHome.text, /<h2\b/i);
assert.match(htmlHome.text, /Music reviews from real listeners/i);

const missing = await inspect("/__agent-readiness-unknown-route", "text/markdown");
assert.equal(missing.response.status, 404);
contentType(missing.response, /^text\/markdown/i);
checkVary(missing.response);
assert.match(missing.text, /llms\.txt/);
assert.ok(missing.text.length >= 20);

const missingHtml = await inspect("/__agent-readiness-unknown-route", "text/html");
assert.equal(missingHtml.response.status, 404);
contentType(missingHtml.response, /^text\/html/i);

const openapi = await inspect("/openapi.json", "application/json");
assert.equal(openapi.response.status, 200);
contentType(openapi.response, /^application\/json/i);
const spec = JSON.parse(openapi.text);
assert.equal(spec.openapi, "3.1.0");
assert.ok(spec.paths["/api/search"]?.get);
assert.ok(spec.paths["/api/feed"]?.get);

const invalid = await inspect("/api/search?q=" + "x".repeat(81), "application/json");
assert.equal(invalid.response.status, 400);
contentType(invalid.response, /^application\/json/i);
const invalidError = JSON.parse(invalid.text);
for (const field of ["error", "code", "message", "hint"]) assert.ok(invalidError[field], field);

const missingApi = await inspect("/api/__agent-readiness-unknown-route", "application/json");
assert.equal(missingApi.response.status, 404);
contentType(missingApi.response, /^application\/json/i);
assert.equal(JSON.parse(missingApi.text).code, "API_ROUTE_NOT_FOUND");

const feed = await inspect("/api/feed?view=latest", "application/json");
assert.ok([200, 503].includes(feed.response.status), "Public feed must return data or a structured service error");
contentType(feed.response, /^application\/json/i);
const feedPayload = JSON.parse(feed.text);
if (feed.response.status === 200) {
  assert.ok(Array.isArray(feedPayload.feed));
} else {
  assert.equal(feedPayload.code, "FEED_UNAVAILABLE");
  assert.ok(feedPayload.hint);
  console.warn("Public feed is degraded; check whether the Kocteau database is active.");
}

for (const [path, contentPattern] of [
  ["/llms.txt", /When to use Kocteau/],
  ["/docs/llms.txt", /Kocteau Documentation/],
  ["/docs/api", /Kocteau API/],
  ["/docs/api/raw", /When to use this API/],
  ["/robots.txt", /User-agent/i],
  ["/sitemap.xml", /<urlset|<sitemapindex/i],
]) {
  const { response, text } = await inspect(path);
  assert.equal(response.status, 200, path);
  assert.match(text, contentPattern, path);
}
console.log("Verified public agent endpoints on", base);
