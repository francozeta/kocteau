import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, test } from "node:test";
import { createPublicReadFetch, type PublicReadObservation } from "./public-fetch.ts";

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
    } else if (req.url === "/unavailable") {
      res.writeHead(503);
      res.end("[]");
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
  const observations: PublicReadObservation[] = [];
  const read = createPublicReadFetch({ timeoutMs: 80, onRead: (read) => observations.push(read) });
  await read(origin);
  observations.length = 0;
  const before = closed;
  await assert.rejects(read(origin + "/body"), { name: "TimeoutError" });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(closed > before, "the upstream connection must close after abort");
  assert.equal(observations[0]?.phase, "body");
  assert.equal(observations[0]?.outcome, "timeout");
  assert.equal(observations[0]?.status, 200);
  assert.ok(observations[0]!.bodyMs > 0);
  assert.equal((await read(origin)).status, 200);
});

test("native header waits are bounded too", async () => {
  const observations: PublicReadObservation[] = [];
  const read = createPublicReadFetch({ timeoutMs: 30, onRead: (read) => observations.push(read) });
  await assert.rejects(read(origin + "/headers"), { name: "TimeoutError" });
  assert.equal(observations[0]?.phase, "headers");
  assert.equal(observations[0]?.outcome, "timeout");
  assert.equal(observations[0]?.status, null);
  assert.equal(observations[0]?.bodyMs, 0);
  assert.equal((await read(origin)).status, 200);
});

test("concurrency and queue capacity remain bounded under a burst", async () => {
  const observations: PublicReadObservation[] = [];
  const read = createPublicReadFetch({ concurrency: 2, maxPending: 3, timeoutMs: 500, onRead: (read) => observations.push(read) });
  peak = 0;
  const results = await Promise.allSettled(Array.from({ length: 6 }, () => read(origin + "/slow")));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
  const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
  assert.equal(rejected.reason.name, "QuotaExceededError");
  assert.ok(peak <= 2);
  const overflow = observations.find((read) => read.outcome === "queue_full");
  assert.equal(overflow?.phase, "queue");
  assert.equal(overflow?.headersMs, 0);
  assert.equal(overflow?.bodyMs, 0);
  assert.ok(observations.some((read) => read.outcome === "success" && read.queueMs > 0));
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

test("read diagnostics expose phases and size without URL or query values", async () => {
  const observations: PublicReadObservation[] = [];
  const read = createPublicReadFetch({ onRead: (read) => observations.push(read) });
  await read(origin + "/rest/v1/entities?email=listener@example.test&token=private-secret");
  assert.equal(observations[0]?.operation, "entities");
  assert.equal(observations[0]?.outcome, "success");
  assert.equal(observations[0]?.phase, "complete");
  assert.equal(observations[0]?.bytes, 2);
  assert.doesNotMatch(JSON.stringify(observations), /listener|example|private-secret|token|email/);
  const { queueMs, headersMs, bodyMs, totalMs } = observations[0]!;
  assert.ok(Math.abs(queueMs + headersMs + bodyMs - totalMs) < 0.01);
});

test("HTTP failures retain their status after the body has been consumed", async () => {
  const observations: PublicReadObservation[] = [];
  const read = createPublicReadFetch({ onRead: (read) => observations.push(read) });
  const response = await read(origin + "/unavailable");
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), []);
  assert.equal(observations[0]?.outcome, "http_error");
  assert.equal(observations[0]?.phase, "complete");
  assert.equal(observations[0]?.status, 503);
});

test("a failed telemetry callback cannot change a result or retain a read slot", async () => {
  const read = createPublicReadFetch({
    concurrency: 1, maxPending: 1,
    onRead() { throw new Error("fixture observer unavailable"); },
  });
  assert.deepEqual((await Promise.all([read(origin), read(origin)])).map((r) => r.status), [200, 200]);
});
