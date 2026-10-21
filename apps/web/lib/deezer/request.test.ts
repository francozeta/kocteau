import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DeezerRequestError, fetchDeezerJson } from "./request.ts";

const options = { errorMessage: "Provider unavailable", revalidate: 60 };

function pendingFetch(signal: AbortSignal, onAbort = () => {}) {
  return new Promise<Response>((_resolve, reject) => {
    signal.addEventListener("abort", () => {
      onAbort();
      reject(signal.reason);
    }, { once: true });
  });
}

describe("Deezer request lifecycle", () => {
  it("preserves JSON results and fetch cache policy", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async (_url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal((init as RequestInit & { next: { revalidate: number } }).next.revalidate, 60);
      return Response.json({ data: [{ id: 1 }] });
    });
    assert.deepEqual(await fetchDeezerJson("https://api.deezer.com/search", options), { data: [{ id: 1 }] });
    assert.equal(fetch.mock.callCount(), 1);
  });

  it("retries temporary failures within the configured attempt count", async (t) => {
    let attempts = 0;
    t.mock.method(globalThis, "fetch", async () =>
      ++attempts < 3 ? new Response(null, { status: 503 }) : Response.json({ ok: true }),
    );
    assert.deepEqual(await fetchDeezerJson("https://api.deezer.com/search", {
      ...options, retryDelays: [1, 1],
    }), { ok: true });
    assert.equal(attempts, 3);
  });

  it("does not retry a permanent HTTP failure", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }));
    await assert.rejects(fetchDeezerJson("https://api.deezer.com/search", {
      ...options, retryDelays: [1, 1],
    }), (error: unknown) => error instanceof DeezerRequestError && error.status === 404);
    assert.equal(fetch.mock.callCount(), 1);
  });

  it("does not start an already cancelled request", async (t) => {
    const controller = new AbortController();
    const reason = new DOMException("Search replaced", "AbortError");
    controller.abort(reason);
    const fetch = t.mock.method(globalThis, "fetch", async () => Response.json({}));
    await assert.rejects(fetchDeezerJson("https://api.deezer.com/search", {
      ...options, signal: controller.signal,
    }), (error: unknown) => error === reason);
    assert.equal(fetch.mock.callCount(), 0);
  });

  it("cancels an in-flight request without retrying", async (t) => {
    const controller = new AbortController();
    let aborted = false;
    const fetch = t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, init?: RequestInit) =>
      pendingFetch(init!.signal!, () => { aborted = true; }),
    );
    const promise = fetchDeezerJson("https://api.deezer.com/search", {
      ...options, signal: controller.signal, retryDelays: [1, 1],
    });
    controller.abort();
    await assert.rejects(promise, { name: "AbortError" });
    assert.equal(aborted, true);
    assert.equal(fetch.mock.callCount(), 1);
  });

  it("cancels during backoff without launching another attempt", async (t) => {
    const controller = new AbortController();
    const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 429 }));
    const promise = fetchDeezerJson("https://api.deezer.com/search", {
      ...options, signal: controller.signal, retryDelays: [1_000, 1_000],
    });
    const timer = setTimeout(() => controller.abort(), 10);
    try {
      await assert.rejects(promise, { name: "AbortError" });
      assert.equal(fetch.mock.callCount(), 1);
    } finally {
      clearTimeout(timer);
    }
  });

  it("enforces the per-attempt timeout and preserves the failure cause", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, init?: RequestInit) => pendingFetch(init!.signal!));
    await assert.rejects(fetchDeezerJson("https://api.deezer.com/search", {
      ...options, timeoutMs: 10,
    }), (error: unknown) =>
      error instanceof DeezerRequestError &&
      error.cause instanceof DOMException &&
      error.cause.name === "TimeoutError",
    );
    assert.equal(fetch.mock.callCount(), 1);
  });

  it("releases the parent abort listener after a successful request", async (t) => {
    const controller = new AbortController();
    const remove = t.mock.method(controller.signal, "removeEventListener");
    t.mock.method(globalThis, "fetch", async () => Response.json({ ok: true }));
    await fetchDeezerJson("https://api.deezer.com/search", { ...options, signal: controller.signal });
    assert.equal(remove.mock.callCount(), 1);
  });
});
