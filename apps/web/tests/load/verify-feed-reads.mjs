import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as pause } from "node:timers/promises";

const privateDir = resolve(
  import.meta.dirname,
  "../../../../.codex-private/feed",
);
const fixture = JSON.parse(
  readFileSync(resolve(privateDir, "fixture.json"), "utf8"),
);
const trace = (name) =>
  readFileSync(resolve(privateDir, name + ".jsonl"), "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
async function read(name, port, cookie, cursor) {
  const before = trace(name).length;
  const start = performance.now();
  const response = await fetch(
    "http://127.0.0.1:" +
      port +
      "/api/feed?" +
      new URLSearchParams({ view: "for-you", ...(cursor ? { cursor } : {}) }),
    {
      headers: { Cookie: cookie },
      signal: AbortSignal.timeout(10000),
    },
  );
  const body = await response.json();
  const ms = Math.round(performance.now() - start);
  await pause(30);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(body.requiresAuth, false);
  return { body, ms, requests: trace(name).slice(before) };
}
async function waitForApp(port) {
  const deadline = Date.now() + 15_000;
  while (true) {
    try {
      const response = await fetch(
        "http://127.0.0.1:" + port + "/favicon.ico",
        {
          signal: AbortSignal.timeout(1000),
        },
      );
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // Readiness checks do not warm the authenticated feed route.
    }
    if (Date.now() >= deadline)
      throw new Error("Local app did not become ready on port " + port);
    await pause(100);
  }
}
await Promise.all([waitForApp(3000), waitForApp(3001)]);
const reports = [];
let targetVisible = false;
for (let user = 0; user < fixture.accounts.length; user++) {
  let cursor = null;
  for (let page = 0; page < 3; page++) {
    const baseline = await read(
      "baseline",
      3001,
      fixture.accounts[user].cookie,
      cursor,
    );
    const candidate = await read(
      "candidate",
      3000,
      fixture.accounts[user].cookie,
      cursor,
    );
    assert.deepEqual(
      candidate.body,
      baseline.body,
      "same cards, ranking, cursor and private flags",
    );
    assert.equal(candidate.requests.length, 1);
    assert.equal(
      candidate.requests[0].operation,
      "/rest/v1/rpc/get_recommended_feed_bundle",
    );
    for (const row of candidate.body.feed) {
      const selected = user === 0 && row.id === fixture.privateTarget;
      if (selected) targetVisible = true;
      assert.equal(row.viewer_has_liked, selected);
      assert.equal(row.viewer_has_bookmarked, selected);
    }
    reports.push({
      user,
      page,
      reviews: candidate.body.feed.length,
      baselineRequests: baseline.requests.length,
      candidateRequests: candidate.requests.length,
      baselineMs: baseline.ms,
      candidateMs: candidate.ms,
    });
    cursor = baseline.body.nextCursor;
    if (!cursor) break;
  }
}
assert(targetVisible, "the selected private-state fixture must be visible");
const before = trace("candidate").length;
const guest = await fetch("http://127.0.0.1:3000/api/feed?view=for-you", {
  signal: AbortSignal.timeout(10_000),
});
const guestBody = await guest.json();
assert.equal(guest.status, 200);
assert.equal(guest.headers.get("cache-control"), "private, no-store");
assert.equal(guestBody.requiresAuth, true);
assert.deepEqual(guestBody.feed, []);
assert.equal(
  trace("candidate").length,
  before,
  "guest makes no feed Data API request",
);
const failures = [];
const faultFile = process.env.FEED_READ_FAULT_FILE;
if (faultFile) {
  assert.equal(resolve(faultFile), resolve(privateDir, "fault.json"));
  try {
    for (const [mode, expectedCalls] of [
      ["unavailable", 1],
      ["denied", 1],
      ["fallback-unavailable", 2],
    ]) {
      writeFileSync(faultFile, JSON.stringify({ mode }), { mode: 0o600 });
      const before = trace("candidate").length;
      const response = await fetch(
        "http://127.0.0.1:3000/api/feed?view=for-you",
        {
          headers: { Cookie: fixture.accounts[0].cookie },
          signal: AbortSignal.timeout(10_000),
        },
      );
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
      assert.equal(response.headers.get("retry-after"), "5");
      assert.equal((await response.json()).feed, undefined);
      const attempts = trace("candidate").length - before;
      assert.equal(attempts, expectedCalls);
      failures.push({
        mode,
        status: response.status,
        originAttempts: attempts,
      });
    }
    writeFileSync(faultFile, JSON.stringify({ mode: "missing" }), {
      mode: 0o600,
    });
    const fallback = await read(
      "candidate",
      3000,
      fixture.accounts[0].cookie,
      null,
    );
    assert.equal(fallback.body.feed.length, 8);
    assert.equal(fallback.requests.length, 3);
    failures.push({
      mode: "missing",
      status: 200,
      originAttempts: fallback.requests.length,
    });
  } finally {
    unlinkSync(faultFile);
  }
}
console.log(
  JSON.stringify({
    phase: process.env.FEED_READ_MEASUREMENT_PHASE ?? "unspecified",
    comparisons: reports,
    guestRequiresAuth: true,
    failures,
  }),
);
