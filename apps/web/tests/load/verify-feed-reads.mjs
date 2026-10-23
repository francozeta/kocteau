import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout as pause } from "node:timers/promises";

const privateDir = resolve(import.meta.dirname, "../../../../.codex-private/feed");
const fixture = JSON.parse(readFileSync(resolve(privateDir, "fixture.json"), "utf8"));
const trace = name => readFileSync(resolve(privateDir, name + ".jsonl"), "utf8")
  .trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
async function read(name, port, cookie, cursor) {
  const before = trace(name).length;
  const start = performance.now();
  const response = await fetch("http://127.0.0.1:" + port + "/api/feed?" +
    new URLSearchParams({ view: "for-you", ...(cursor ? { cursor } : {}) }), {
    headers: { Cookie: cookie }, signal: AbortSignal.timeout(10000),
  });
  const body = await response.json();
  await pause(30);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(body.requiresAuth, false);
  return { body, ms: Math.round(performance.now() - start), requests: trace(name).slice(before) };
}
const reports = [];
let targetVisible = false;
for (let user = 0; user < fixture.accounts.length; user++) {
  let cursor = null;
  for (let page = 0; page < 3; page++) {
    const baseline = await read("baseline", 3001, fixture.accounts[user].cookie, cursor);
    const candidate = await read("candidate", 3000, fixture.accounts[user].cookie, cursor);
    assert.deepEqual(candidate.body, baseline.body, "same cards, ranking, cursor and private flags");
    assert.equal(candidate.requests.length, 1);
    assert.equal(candidate.requests[0].operation, "/rest/v1/rpc/get_recommended_feed_bundle");
    for (const row of candidate.body.feed) {
      const selected = user === 0 && row.id === fixture.privateTarget;
      if (selected) targetVisible = true;
      assert.equal(row.viewer_has_liked, selected);
      assert.equal(row.viewer_has_bookmarked, selected);
    }
    reports.push({ user, page, reviews: candidate.body.feed.length, baselineRequests: baseline.requests.length,
      candidateRequests: candidate.requests.length, baselineMs: baseline.ms, candidateMs: candidate.ms });
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
assert.equal(trace("candidate").length, before, "guest makes no feed Data API request");
console.log(JSON.stringify({ comparisons: reports, guestRequiresAuth: true }));
