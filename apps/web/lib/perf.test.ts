import assert from "node:assert/strict";
import * as Sentry from "@sentry/nextjs";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import type { PublicReadObservation } from "./supabase/public-fetch.ts";

let perf: typeof import("./perf");
let now = 100_000;
type CapturedSpan = {
  op?: string;
  description?: string;
  span_id: string;
  parent_span_id?: string;
  trace_id?: string;
  data?: Record<string, unknown>;
  status?: string;
  start_timestamp: number;
  timestamp: number;
};
type CapturedTransaction = {
  transaction: string;
  contexts: { trace: { trace_id: string; span_id: string } };
  spans?: CapturedSpan[];
};
const transactions: CapturedTransaction[] = [];
async function capture(name: string, run: () => Promise<unknown>) {
  await Sentry.withIsolationScope(() =>
    Sentry.startSpan({ name, forceTransaction: true }, run),
  );
  await Sentry.flush(1_000);
  const transaction = transactions.findLast(
    (item) => item.transaction === name,
  );
  assert.ok(transaction, name);
  return transaction;
}

const originalVerbose = process.env.KOCTEAU_PERF_VERBOSE;
const originalLogs = process.env.KOCTEAU_PERF_LOGS;
before(async () => {
  Sentry.init({
    dsn: "https://public@example.invalid/1",
    defaultIntegrations: false,
    tracesSampleRate: 1,
    sendClientReports: false,
    transport: () => ({
      send: async (envelope: unknown) => {
        const [, items] = envelope as [
          unknown,
          Array<[{ type: string }, unknown]>,
        ];
        for (const [header, payload] of items) {
          if (header.type === "transaction")
            transactions.push(payload as CapturedTransaction);
        }
        return { statusCode: 200 };
      },
      flush: async () => true,
    }),
  });
  process.env.KOCTEAU_PERF_VERBOSE = "1";
  process.env.KOCTEAU_PERF_LOGS = "1";
  const hooks = registerHooks({
    resolve(specifier, context, next) {
      return specifier === "server-only"
        ? { url: "perf-test:empty", shortCircuit: true }
        : next(specifier, context);
    },
    load(url, context, next) {
      return url === "perf-test:empty"
        ? {
            format: "commonjs",
            source: "module.exports = {};",
            shortCircuit: true,
          }
        : next(url, context);
    },
  });
  try {
    perf = await import("./perf");
  } finally {
    hooks.deregister();
  }
});
after(async () => {
  await Sentry.close(1_000);
  if (originalVerbose === undefined) delete process.env.KOCTEAU_PERF_VERBOSE;
  else process.env.KOCTEAU_PERF_VERBOSE = originalVerbose;
  if (originalLogs === undefined) delete process.env.KOCTEAU_PERF_LOGS;
  else process.env.KOCTEAU_PERF_LOGS = originalLogs;
});
beforeEach(() => {
  now += 1_000;
});
const observation: PublicReadObservation = {
  operation: "entities",
  outcome: "http_error",
  phase: "complete",
  status: 503,
  queueMs: 0,
  headersMs: 20,
  bodyMs: 5,
  totalMs: 25,
  bytes: 2,
};

test("data read diagnostics bound burst log volume and count suppressed observations", (t) => {
  t.mock.method(Date, "now", () => now);
  const warn = t.mock.method(console, "warn", () => {});
  for (let i = 0; i < 100; i++) perf.reportPublicRead(observation);
  assert.equal(warn.mock.callCount(), 10);
  now += 1_000;
  perf.reportPublicRead(observation);
  assert.equal(warn.mock.callCount(), 11);
  const last = warn.mock.calls.at(-1)!.arguments[0] as Record<string, unknown>;
  assert.equal(last.event, "public_data_read");
  assert.equal(last.suppressed, 90);
  assert.equal(last.headers_ms, 20);
  assert.equal(last.body_ms, 5);
});

test("caller cancellation is diagnostic information rather than a failure warning", (t) => {
  t.mock.method(Date, "now", () => now);
  const warn = t.mock.method(console, "warn", () => {});
  const info = t.mock.method(console, "info", () => {});
  perf.reportPublicRead({
    ...observation,
    outcome: "cancelled",
    phase: "queue",
    status: null,
  });
  assert.equal(warn.mock.callCount(), 0);
  assert.equal(info.mock.callCount(), 1);
});

test("sampled request traces join tasks and public HTTP phases without caller context", async (t) => {
  t.mock.method(console, "info", () => {});
  const transaction = await capture("fixture.request", async () => {
    const value = await perf.measureServerTask(
      "fixture.task",
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 25));
        perf.reportPublicRead({
          ...observation,
          outcome: "success",
          status: 200,
          queueMs: 4,
          headersMs: 19,
          bodyMs: 2,
          totalMs: 25,
        });
        return 42;
      },
      {
        query: "private-canary",
        viewerId: "private-canary",
        scope: "private-canary",
      },
    );
    assert.equal(value, 42);
  });
  const task = transaction.spans?.find(
    (span) => span.op === "kocteau.server.task",
  );
  const read = transaction.spans?.find(
    (span) => span.op === "kocteau.public_read",
  );
  assert.ok(task);
  assert.ok(read);
  assert.equal(task.parent_span_id, transaction.contexts.trace.span_id);
  assert.equal(read.parent_span_id, task.span_id);
  assert.equal(read.trace_id, transaction.contexts.trace.trace_id);
  assert.equal(read.data?.["kocteau.headers_ms"], 19);
  assert.equal(read.data?.["kocteau.timing_kind"], "http_round_trip");
  assert.equal(read.data?.["kocteau.execution"], "unknown");
  assert.ok(
    Math.abs((read.timestamp - read.start_timestamp) * 1_000 - 25) < 0.01,
  );
  assert.equal(JSON.stringify(transaction).includes("private-canary"), false);
});

test("a sampled trace retains fast reads even when diagnostic burst logs are suppressed", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const transaction = await capture("fixture.burst", () =>
    perf.measureServerTask("fixture.burst.task", async () => {
      for (let i = 0; i < 50; i++) perf.reportPublicRead(observation);
    }),
  );
  assert.equal(
    transaction.spans?.filter((span) => span.op === "kocteau.public_read")
      .length,
    50,
  );
  assert.ok(warn.mock.callCount() <= 10);
});

test("task tracing preserves the original rejection and marks failure", async (t) => {
  t.mock.method(console, "error", () => {});
  const failure = new Error("fixture failure");
  const transaction = await capture("fixture.failure", async () => {
    await assert.rejects(
      perf.measureServerTask("fixture.failed.task", async () => {
        throw failure;
      }),
      (error) => error === failure,
    );
  });
  const task = transaction.spans?.find(
    (span) => span.op === "kocteau.server.task",
  );
  assert.ok(task);
  assert.notEqual(task.status, "ok");
});

test("read timeouts and HTTP errors differ from intentional caller cancellation", async (t) => {
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "info", () => {});
  const transaction = await capture("fixture.outcomes", () =>
    perf.measureServerTask("fixture.outcomes.task", async () => {
      perf.reportPublicRead(observation);
      perf.reportPublicRead({
        ...observation,
        outcome: "timeout",
        phase: "headers",
        status: null,
      });
      perf.reportPublicRead({
        ...observation,
        outcome: "cancelled",
        phase: "queue",
        status: null,
      });
    }),
  );
  const reads =
    transaction.spans?.filter((span) => span.op === "kocteau.public_read") ??
    [];
  const http = reads.find(
    (span) => span.data?.["kocteau.outcome"] === "http_error",
  );
  const timeout = reads.find(
    (span) => span.data?.["kocteau.outcome"] === "timeout",
  );
  const cancelled = reads.find(
    (span) => span.data?.["kocteau.outcome"] === "cancelled",
  );
  assert.equal(http?.data?.["http.response.status_code"], 503);
  assert.notEqual(timeout?.status, "ok");
  assert.equal(timeout?.data?.["kocteau.phase"], "headers");
  assert.ok(cancelled);
  assert.equal(cancelled.status, "ok");
});

test("parallel request traces keep their own task and read parentage", async (t) => {
  t.mock.method(console, "info", () => {});
  const pair = await Promise.all(
    ["left", "right"].map((side) =>
      capture("fixture." + side, () =>
        perf.measureServerTask("fixture." + side + ".task", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          perf.reportPublicRead({
            ...observation,
            outcome: "success",
            status: 200,
          });
        }),
      ),
    ),
  );
  assert.notEqual(
    pair[0].contexts.trace.trace_id,
    pair[1].contexts.trace.trace_id,
  );
  for (const transaction of pair) {
    const task = transaction.spans?.find(
      (span) => span.op === "kocteau.server.task",
    );
    const read = transaction.spans?.find(
      (span) => span.op === "kocteau.public_read",
    );
    assert.ok(task);
    assert.ok(read);
    assert.equal(read.parent_span_id, task.span_id);
    assert.equal(read.trace_id, transaction.contexts.trace.trace_id);
  }
});

test("background calls without an active request do not create unrelated root traces", async (t) => {
  t.mock.method(console, "info", () => {});
  const before = transactions.length;
  assert.equal(
    await perf.measureServerTask("fixture.orphan", async () => 7),
    7,
  );
  perf.reportPublicRead({ ...observation, outcome: "success", status: 200 });
  await Sentry.flush(1_000);
  assert.equal(transactions.length, before);
});
