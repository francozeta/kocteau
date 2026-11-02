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
  { path: "/", mime: "text/html", test: (s) => /<html/i.test(s) && s.includes("Kocteau") },
  { path: "/reviews", mime: "text/html", test: (s) => /<html/i.test(s) && /music reviews/i.test(s) },
  { path: "/track", mime: "text/html", test: (s) => /<html/i.test(s) && /track/i.test(s) },
];

let failures = 0;
for (const { path, mime, test } of cases) {
  const started = performance.now();
  try {
    const response = await fetch(new URL(path, base), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(25_000),
      headers: { "User-Agent": "KocteauPublicSmoke/1.0 (read-only; GitHub Actions)" },
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") || "";
    // A single bounded body read: do not download unlimited user-generated markup.
    const maxBytes = 2_000_000;
    const reader = response.body?.getReader();
    let total = 0;
    const chunks = [];
    if (reader) {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          total += value.byteLength;
          if (total > maxBytes) throw new Error("Response exceeds smoke budget");
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
    }
    const content = Buffer.concat(chunks).toString("utf8");
    const ok = response.status === 200 && contentType.includes(mime) && test(content);
    console.log(JSON.stringify({
      path, status: response.status, mime: contentType.split(";")[0],
      bytes: total, elapsedMs: Math.round(performance.now() - started),
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
