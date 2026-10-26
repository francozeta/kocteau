import "server-only";
import * as Sentry from "@sentry/nextjs";
import type { PublicReadObservation } from "@/lib/supabase/public-fetch";

const DEFAULT_SLOW_TASK_THRESHOLD_MS = 750;
const DEFAULT_PRODUCTION_SAMPLE_RATE = 0.01;
const SENSITIVE_CONTEXT_KEY =
  /(cursor|email|id|path|query|token|url|username)/i;

function readFiniteNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const SLOW_TASK_THRESHOLD_MS = Math.max(
  0,
  readFiniteNumber(
    process.env.KOCTEAU_PERF_SLOW_MS,
    DEFAULT_SLOW_TASK_THRESHOLD_MS,
  ),
);
const PERF_SAMPLE_RATE = Math.min(
  1,
  Math.max(
    0,
    readFiniteNumber(
      process.env.KOCTEAU_PERF_SAMPLE_RATE,
      process.env.NODE_ENV === "production"
        ? DEFAULT_PRODUCTION_SAMPLE_RATE
        : 0,
    ),
  ),
);
const PERF_ENABLED = process.env.KOCTEAU_PERF_LOGS !== "0";
const PERF_VERBOSE = process.env.KOCTEAU_PERF_VERBOSE === "1";

function roundDuration(durationMs: number) {
  return Number(durationMs.toFixed(1));
}

function sanitizeContext(context?: Record<string, unknown>) {
  if (!context) {
    return undefined;
  }

  const safeEntries = Object.entries(context).filter(
    ([key, value]) =>
      !SENSITIVE_CONTEXT_KEY.test(key) &&
      (typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string" ||
        value === null),
  );

  return safeEntries.length > 0 ? Object.fromEntries(safeEntries) : undefined;
}

function shouldLogCompletedTask(durationMs: number) {
  return (
    PERF_VERBOSE ||
    durationMs >= SLOW_TASK_THRESHOLD_MS ||
    Math.random() < PERF_SAMPLE_RATE
  );
}

function traceCorrelation(span: Sentry.Span) {
  if (!span.isRecording()) return {};
  const { traceId, spanId } = span.spanContext();
  return { trace_id: traceId, span_id: spanId };
}

export async function measureServerTask<T>(
  name: string,
  run: () => Promise<T>,
  context?: Record<string, unknown>,
) {
  return Sentry.startSpan(
    { name, op: "kocteau.server.task", onlyIfParent: true },
    async (span) => {
      if (!PERF_ENABLED) return run();
      const startedAt = performance.now();

      try {
        const result = await run();
        const durationMs = performance.now() - startedAt;
        if (shouldLogCompletedTask(durationMs)) {
          console.info({
            event:
              durationMs >= SLOW_TASK_THRESHOLD_MS
                ? "server_task_slow"
                : "server_task_sample",
            task: name,
            duration_ms: roundDuration(durationMs),
            ...traceCorrelation(span),
            context: sanitizeContext(context),
          });
        }
        return result;
      } catch (error) {
        console.error({
          event: "server_task_failed",
          task: name,
          duration_ms: roundDuration(performance.now() - startedAt),
          ...traceCorrelation(span),
          context: sanitizeContext(context),
          error:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : String(error),
        });
        throw error;
      }
    },
  );
}

function tracePublicRead(read: PublicReadObservation) {
  const endedAt = Date.now() / 1_000;
  const operation = /^(?:rpc:)?[a-z][a-z0-9_]{0,63}$/.test(read.operation)
    ? read.operation
    : "other";
  const span = Sentry.startInactiveSpan({
    name: `supabase.${operation}`,
    op: "kocteau.public_read",
    onlyIfParent: true,
    startTime: endedAt - read.totalMs / 1_000,
    attributes: {
      "kocteau.timing_kind": "http_round_trip",
      "kocteau.execution": "unknown",
      "kocteau.outcome": read.outcome,
      "kocteau.phase": read.phase,
      "kocteau.queue_ms": read.queueMs,
      "kocteau.headers_ms": read.headersMs,
      "kocteau.body_ms": read.bodyMs,
      "kocteau.total_ms": read.totalMs,
      ...(read.status === null
        ? {}
        : { "http.response.status_code": read.status }),
      ...(read.bytes === null ? {} : { "kocteau.bytes": read.bytes }),
    },
  });
  if (read.outcome !== "success" && read.outcome !== "cancelled") {
    // OpenTelemetry ERROR status; the pinned Next SDK does not export its named constant.
    span.setStatus({ code: 2, message: read.outcome });
  }
  span.end(endedAt);
}

let publicReadLogWindow = 0;
let publicReadLogCount = 0;
let suppressedPublicReadLogs = 0;

/** Bounded, sampled diagnostics with no query text, URLs, headers, or credentials. */
export function reportPublicRead(read: PublicReadObservation) {
  try {
    tracePublicRead(read);
  } catch {
    // Telemetry must not change a completed data read.
  }
  if (!PERF_ENABLED) return;
  const failed = read.outcome !== "success" && read.outcome !== "cancelled";
  if (!failed && !shouldLogCompletedTask(read.totalMs)) return;

  const now = Date.now();
  if (now - publicReadLogWindow >= 1_000) {
    publicReadLogWindow = now;
    publicReadLogCount = 0;
  }
  if (publicReadLogCount >= 10) {
    suppressedPublicReadLogs++;
    return;
  }
  publicReadLogCount++;
  const log = failed ? console.warn : console.info;
  log({
    event: "public_data_read",
    operation: read.operation,
    outcome: read.outcome,
    phase: read.phase,
    status: read.status,
    queue_ms: roundDuration(read.queueMs),
    headers_ms: roundDuration(read.headersMs),
    body_ms: roundDuration(read.bodyMs),
    total_ms: roundDuration(read.totalMs),
    bytes: read.bytes,
    suppressed: suppressedPublicReadLogs,
  });
  suppressedPublicReadLogs = 0;
}
