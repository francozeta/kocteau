import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import { createPublicReadFetch } from "./public-fetch.ts";

let server: Server;
let origin: string;
let active = 0;
let peak = 0;
let closed = 0;
const requests = new Map<string, number>();
before(async () => {
  server = createServer((req, res) => {
    requests.set(req.url!, (requests.get(req.url!) ?? 0) + 1);
    active++;
    peak = Math.max(peak, active);
    res.on("close", () => { active--; closed++; });
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/body") {
      res.writeHead(200);
      res.write("[");
    } else if (req.url === "/headers") {
      // Keep the connection open without sending any headers.
    } else if (req.url === "/slow") {
      setTimeout(() => res.end("[]"), 20);
    } else res.end("[]");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = "http://127.0.0.1:" + (server.address() as { port: number }).port;
});
after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("a public read deadline closes a stalled native response body", async () => {
  const read = createPublicReadFetch({ timeoutMs: 80 });
  const before = closed;
  await assert.rejects(read(origin + "/body"), { name: "TimeoutError" });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(closed > before, "the upstream connection must close after abort");
  assert.equal((await read(origin)).status, 200);
});

test("native header waits are bounded too", async () => {
  const read = createPublicReadFetch({ timeoutMs: 30 });
  await assert.rejects(read(origin + "/headers"), { name: "TimeoutError" });
  assert.equal((await read(origin)).status, 200);
});

test("concurrency and queue capacity remain bounded under a burst", async () => {
  const read = createPublicReadFetch({ concurrency: 2, maxPending: 3, timeoutMs: 500 });
  peak = 0;
  const results = await Promise.allSettled(Array.from({ length: 6 }, () => read(origin + "/slow")));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
  const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
  assert.equal(rejected.reason.name, "QuotaExceededError");
  assert.ok(peak <= 2);
});

test("cancelled queued work does not reach upstream and releases its queue entry", async () => {
  const read = createPublicReadFetch({ concurrency: 1, maxPending: 1, timeoutMs: 100 });
  const first = read(origin + "/body");
  const controller = new AbortController();
  const before = requests.get("/cancelled") ?? 0;
  const queued = read(origin + "/cancelled", { signal: controller.signal });
  controller.abort();
  await assert.rejects(queued, { name: "AbortError" });
  await new Promise((resolve) => setTimeout(resolve, 40));
  const next = read(origin);
  await assert.rejects(first, { name: "TimeoutError" });
  assert.equal((await next).status, 200);
  assert.equal(requests.get("/cancelled") ?? 0, before, "cancelled queued work must never reach upstream");
});

test("a pre-cancelled read never calls fetch", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response("[]"));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(createPublicReadFetch()("https://unused.test", { signal: controller.signal }));
  assert.equal(fetch.mock.callCount(), 0);
});
