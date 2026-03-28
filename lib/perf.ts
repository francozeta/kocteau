import "server-only";

const SLOW_QUERY_THRESHOLD_MS = Number(process.env.KOCTEAU_PERF_SLOW_MS ?? 300);
const PERF_ENABLED =
  process.env.KOCTEAU_PERF_LOGS === "1" || process.env.NODE_ENV !== "production";
const PERF_VERBOSE = process.env.KOCTEAU_PERF_VERBOSE === "1";

function formatDuration(durationMs: number) {
  return `${durationMs.toFixed(1)}ms`;
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

    if (PERF_VERBOSE || durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      console.info(`[perf] ${name} completed in ${formatDuration(durationMs)}`, context ?? {});
    }

    return result;
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    console.error(`[perf] ${name} failed after ${formatDuration(durationMs)}`, {
      ...(context ?? {}),
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
