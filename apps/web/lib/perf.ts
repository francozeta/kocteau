import "server-only";

const DEFAULT_SLOW_TASK_THRESHOLD_MS = 750;
const DEFAULT_PRODUCTION_SAMPLE_RATE = 0.01;
const SENSITIVE_CONTEXT_KEY = /(cursor|email|id|path|query|token|url|username)/i;

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
      process.env.NODE_ENV === "production" ? DEFAULT_PRODUCTION_SAMPLE_RATE : 0,
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

export async function measureServerTask<T>(
  name: string,
  run: () => Promise<T>,
  context?: Record<string, unknown>,
) {
  if (!PERF_ENABLED) {
    return run();
  }

  const startedAt = performance.now();

  try {
    const result = await run();
    const durationMs = performance.now() - startedAt;

    if (shouldLogCompletedTask(durationMs)) {
      console.info({
        event: durationMs >= SLOW_TASK_THRESHOLD_MS ? "server_task_slow" : "server_task_sample",
        task: name,
        duration_ms: roundDuration(durationMs),
        context: sanitizeContext(context),
      });
    }

    return result;
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    console.error({
      event: "server_task_failed",
      task: name,
      duration_ms: roundDuration(durationMs),
      context: sanitizeContext(context),
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : String(error),
    });
    throw error;
  }
}
