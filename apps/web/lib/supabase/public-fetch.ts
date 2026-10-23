export type PublicReadObservation = {
  operation: string;
  outcome: "success" | "http_error" | "timeout" | "cancelled" | "queue_full" | "network_error";
  phase: "queue" | "headers" | "body" | "complete";
  status: number | null;
  queueMs: number;
  headersMs: number;
  bodyMs: number;
  totalMs: number;
  bytes: number | null;
};

type PublicReadOptions = {
  timeoutMs?: number;
  concurrency?: number;
  maxPending?: number;
  onRead?: (observation: PublicReadObservation) => void;
};

function readOperation(input: RequestInfo | URL) {
  try {
    const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
    const match = /^\/rest\/v1\/(rpc\/)?([a-z][a-z0-9_]{0,63})$/.exec(path);
    return match ? (match[1] ? "rpc:" : "") + match[2] : "other";
  } catch {
    return "other";
  }
}

export function createPublicReadFetch({
  timeoutMs = 3_000,
  concurrency = 8,
  maxPending = 32,
  onRead,
}: PublicReadOptions = {}): typeof fetch {
  let active = 0;
  type Waiter = { start: () => void; cancel: () => void };
  const pending = new Set<Waiter>();

  function acquire(signal: AbortSignal): Promise<() => void> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const waiter: Waiter = {
        start() {
          pending.delete(waiter);
          signal.removeEventListener("abort", waiter.cancel);
          active++;
          let released = false;
          resolve(() => {
            if (released) return;
            released = true;
            active--;
            pending.values().next().value?.start();
          });
        },
        cancel() {
          pending.delete(waiter);
          reject(signal.reason);
        },
      };
      if (active < concurrency) waiter.start();
      else if (pending.size >= maxPending) {
        reject(new DOMException("Public data read queue is full", "QuotaExceededError"));
      } else {
        pending.add(waiter);
        signal.addEventListener("abort", waiter.cancel, { once: true });
      }
    });
  }

  return async (input, init) => {
    const startedAt = performance.now();
    let admittedAt: number | undefined;
    let headersAt: number | undefined;
    let phase: PublicReadObservation["phase"] = "queue";
    let outcome: PublicReadObservation["outcome"] = "network_error";
    let status: number | null = null;
    let bytes: number | null = null;
    const controller = new AbortController();
    const signals = [controller.signal];
    if (input instanceof Request) signals.push(input.signal);
    if (init?.signal) signals.push(init.signal);
    const signal = AbortSignal.any(signals);
    const timer = setTimeout(() => controller.abort(
      new DOMException("Public data read deadline exceeded", "TimeoutError"),
    ), timeoutMs);
    let release: (() => void) | undefined;
    try {
      release = await acquire(signal);
      admittedAt = performance.now();
      phase = "headers";
      signal.throwIfAborted();
      const response = await fetch(input, { ...init, signal });
      headersAt = performance.now();
      status = response.status;
      phase = "body";
      // Hold the slot and deadline through body consumption, not just headers.
      const body = await response.arrayBuffer();
      bytes = body.byteLength;
      signal.throwIfAborted();
      const result = new Response(body.byteLength ? body : null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      phase = "complete";
      outcome = response.ok ? "success" : "http_error";
      return result;
    } catch (error) {
      outcome = signal.aborted
        ? signal.reason?.name === "TimeoutError" ? "timeout" : "cancelled"
        : error instanceof DOMException && error.name === "QuotaExceededError"
          ? "queue_full" : "network_error";
      throw error;
    } finally {
      const completedAt = performance.now();
      clearTimeout(timer);
      release?.();
      if (onRead) {
        try {
          onRead({
            operation: readOperation(input), outcome, phase, status, bytes,
            queueMs: (admittedAt ?? completedAt) - startedAt,
            headersMs: admittedAt === undefined ? 0 : (headersAt ?? completedAt) - admittedAt,
            bodyMs: headersAt === undefined ? 0 : completedAt - headersAt,
            totalMs: completedAt - startedAt,
          });
        } catch {
          // Telemetry must not change the result or retain a transport slot.
        }
      }
    }
  };
}
