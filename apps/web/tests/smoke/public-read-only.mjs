#!/usr/bin/env node
// Deliberately tiny read-only production smoke. NEVER add authenticated traffic,
// POST requests, crawls, parallelism, retries or load loops to this script.
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const base = new URL(process.env.KOCTEAU_SMOKE_URL || "https://kocteau.com");
if (base.protocol !== "https:" || !["kocteau.com", "www.kocteau.com"].includes(base.hostname)) {
  throw new Error("Public smoke only supports the canonical Kocteau domain");
}

const cases = [
  { path: "/robots.txt", mime: "text/plain", test: (s) => s.includes("OAI-SearchBot") && s.includes("ChatGPT-User") && s.includes("Sitemap:") },
  { path: "/sitemap.xml", mime: "xml", test: (s) => s.includes("<urlset") && s.includes("<loc>") && s.includes("https://kocteau.com/") },
  {
    path: "/",
    statuses: [200, 307],
    test: (s, response) =>
      response.status === 200
        ? response.headers.get("content-type")?.includes("text/html") && /<html/i.test(s) && s.includes("Kocteau")
        : new URL(response.headers.get("location") || "/", base).pathname === "/home",
  },
  { path: "/reviews", mime: "text/html", test: (s) => /<html/i.test(s) && /music reviews/i.test(s) },
  {
    // The smoke runs against production even during PR review: accept the
    // previous HTML until the redirect is deployed. Verify 308 on the preview
    // separately, and tighten the production expectation after rollout.
    path: "/track",
    statuses: [200, 308],
    test: (s, response) =>
      response.status === 308
        ? new URL(response.headers.get("location") || "/", base).pathname === "/reviews"
        : response.headers.get("content-type")?.includes("text/html") && /<html/i.test(s) && /track/i.test(s),
  },
];

let failures = 0;
for (const { path, mime, statuses, test } of cases) {
  const started = performance.now();
  try {
    const response = await fetch(new URL(path, base), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(25_000),
      headers: { "User-Agent": "KocteauPublicSmoke/1.0 (read-only; GitHub Actions)" },
    });
    // Header arrival is not browser paint or exact TTFB; the first chunk is
    // a closer approximation of the first response-body byte.
    const headersAt = performance.now();
    const contentType = response.headers.get("content-type") || "";
    // A single bounded body read: do not download unlimited user-generated markup.
    const maxBytes = 2_000_000;
    const reader = response.body?.getReader();
    let total = 0;
    let firstChunkAt = null;
    const chunks = [];
    if (reader) {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          firstChunkAt ??= performance.now();
          total += value.byteLength;
          if (total > maxBytes) throw new Error("Response exceeds smoke budget");
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    const completedAt = performance.now();
    const content = Buffer.concat(chunks).toString("utf8");
    const ok = (statuses ?? [200]).includes(response.status) && (!mime || contentType.includes(mime)) && test(content, response);
    console.log(JSON.stringify({
      path, status: response.status, mime: contentType.split(";")[0],
      decodedBytes: total,
      headersMs: Math.round(headersAt - started),
      firstBodyByteMs: firstChunkAt === null ? null : Math.round(firstChunkAt - started),
      bodyTransferMs: Math.round(completedAt - headersAt),
      elapsedMs: Math.round(completedAt - started),
      edgeCache: response.headers.get("x-vercel-cache"),
      edgeRequestId: response.headers.get("x-vercel-id"),
      serverTiming: response.headers.get("server-timing"),
      cacheControl: response.headers.get("cache-control"),
      ageSeconds: response.headers.get("age"),
      contentEncoding: response.headers.get("content-encoding"),
      advertisedContentLength: response.headers.get("content-length"),
      check: ok ? "PASS" : "FAIL",
    }));
    if (!ok) failures++;
  } catch (error) {
    console.error(JSON.stringify({
      path, check: "FAIL", elapsedMs: Math.round(performance.now() - started),
      reason: error instanceof Error ? error.message : String(error),
    }));
    failures++;
  }
}

assert.equal(failures, 0, `${failures} public smoke checks failed`);
