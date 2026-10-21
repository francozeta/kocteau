import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchDeezerJson } from "../deezer/request.ts";
import { withSearchDeadline } from "./deadline.ts";

describe("catalog search budget", () => {
  it("keeps completed sources when a slow source exhausts the shared budget", async (t) => {
    t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), { once: true });
    }));
    const results = await withSearchDeadline((signal) => Promise.allSettled([
      Promise.resolve("available track"),
      fetchDeezerJson("https://api.deezer.com/search/album", {
        errorMessage: "Unavailable", revalidate: 60, retryDelays: [1, 1], signal,
      }),
    ]), { timeoutMs: 15 });
    assert.deepEqual(results[0], { status: "fulfilled", value: "available track" });
    assert.equal(results[1]?.status, "rejected");
    if (results[1]?.status === "rejected") assert.equal(results[1].reason.name, "TimeoutError");
  });

  it("does not let parallel slow searches amplify into retry storms", async (t) => {
    let active = 0;
    let calls = 0;
    t.mock.method(globalThis, "fetch", (_url: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      active++;
      calls++;
      init!.signal!.addEventListener("abort", () => {
        active--;
        reject(init!.signal!.reason);
      }, { once: true });
    }));
    const results = await Promise.allSettled(Array.from({ length: 16 }, () =>
      withSearchDeadline((signal) => fetchDeezerJson("https://api.deezer.com/search", {
        errorMessage: "Unavailable", revalidate: 60, retryDelays: [1, 1], signal,
      }), { timeoutMs: 20 }),
    ));
    assert.equal(calls, 16);
    assert.equal(active, 0);
    assert.equal(results.filter((result) => result.status === "rejected").length, 16);
  });

  it("cleans up its timer and parent listener after completion", async (t) => {
    const controller = new AbortController();
    const remove = t.mock.method(controller.signal, "removeEventListener");
    const signal = await withSearchDeadline(async (signal) => signal, {
      signal: controller.signal, timeoutMs: 10,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    controller.abort();
    assert.equal(signal.aborted, false);
    assert.equal(remove.mock.callCount(), 1);
  });

  it("does not start a cancelled search", async () => {
    const controller = new AbortController();
    controller.abort();
    let started = false;
    await assert.rejects(withSearchDeadline(async () => { started = true; }, {
      signal: controller.signal,
    }), { name: "AbortError" });
    assert.equal(started, false);
  });
});
