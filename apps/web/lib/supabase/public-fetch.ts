type PublicReadOptions = {
  timeoutMs?: number;
  concurrency?: number;
  maxPending?: number;
};

export function createPublicReadFetch({
  timeoutMs = 3_000,
  concurrency = 8,
  maxPending = 32,
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
      signal.throwIfAborted();
      const response = await fetch(input, { ...init, signal });
      // Hold the slot and deadline through body consumption, not just headers.
      const body = await response.arrayBuffer();
      signal.throwIfAborted();
      return new Response(body.byteLength ? body : null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } finally {
      clearTimeout(timer);
      release?.();
    }
  };
}
