import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DeezerRequestError, getDeezerAlbum, getDeezerArtistTopTracks } from "./deezer.ts";
import { withSearchDeadline } from "./search/deadline.ts";

const artist = { id: "399", fan_count: 100 };

describe("optional Deezer resources", () => {
  it("propagates cancellation through the default artist-track fallback", async (t) => {
    const controller = new AbortController();
    const warn = t.mock.method(console, "warn", () => {});
    const fetch = t.mock.method(globalThis, "fetch",
      (_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), { once: true });
      }),
    );
    const pending = getDeezerArtistTopTracks(artist, 6, { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(fetch.mock.callCount(), 1);
    assert.equal(warn.mock.callCount(), 0);
  });

  it("retains the artist-enrichment retry when failures are surfaced", async (t) => {
    let attempts = 0;
    t.mock.method(globalThis, "fetch", async () =>
      ++attempts === 1
        ? new Response(null, { status: 503 })
        : Response.json({ data: [{ id: 123, title: "Recovered track" }] }),
    );
    const results = await getDeezerArtistTopTracks(artist, 6, { throwOnError: true });
    assert.equal(attempts, 2);
    assert.equal(results[0]?.title, "Recovered track");
    assert.equal(results[0]?.artist_id, "399");
  });

  it("surfaces exhausted artist-enrichment failures after the retained retry", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
    await assert.rejects(getDeezerArtistTopTracks(artist, 6, { throwOnError: true }),
      (error: unknown) => error instanceof DeezerRequestError && error.status === 503);
    assert.equal(fetch.mock.callCount(), 2);
  });

  it("stops enrichment backoff when the shared search budget expires", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
    await assert.rejects(withSearchDeadline(
      (signal) => getDeezerArtistTopTracks(artist, 6, { signal, throwOnError: true }),
      { timeoutMs: 15 },
    ), { name: "TimeoutError" });
    assert.equal(fetch.mock.callCount(), 1);
  });

  it("preserves the existing strict album policy outside catalog search", async (t) => {
    const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
    await assert.rejects(getDeezerAlbum("123", { throwOnError: true }),
      (error: unknown) => error instanceof DeezerRequestError && error.status === 503);
    assert.equal(fetch.mock.callCount(), 1);
  });

  it("preserves graceful fallback for non-cancelled optional album failures", async (t) => {
    const warn = t.mock.method(console, "warn", () => {});
    const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
    assert.equal(await getDeezerAlbum("123"), null);
    assert.equal(fetch.mock.callCount(), 2);
    assert.equal(warn.mock.callCount(), 1);
  });
});
