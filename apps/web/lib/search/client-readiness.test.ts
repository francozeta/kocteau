import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";
import { test } from "node:test";
import { QueryClient, QueryObserver, onlineManager } from "@tanstack/react-query";
import { kocteauTrackSearchQueryOptions } from "../../queries/tracks.ts";
import { FetchJsonError, fetchJson } from "../../queries/http.ts";
import { readSearchReadiness, searchPhasesToRefetch } from "./client-readiness.ts";

const result = {
  provider: "deezer", provider_id: "951796", type: "track",
  title: "Sea, Swallow Me", artist_name: "Cocteau Twins",
  cover_url: null, deezer_url: null, source: "local",
};

function headers(status: "fresh" | "stale" | "degraded") {
  return {
    "X-Kocteau-Search-Status": status,
    "X-Kocteau-Search-Local": status,
    "X-Kocteau-Search-Links": "skipped",
    "X-Kocteau-Search-Provider": "skipped",
  };
}

test("search preserves a degraded 200 and retries only on explicit recovery", async (t) => {
  const client = new QueryClient();
  client.mount();
  t.after(() => { client.unmount(); client.clear(); onlineManager.setOnline(true); });
  const options = kocteauTrackSearchQueryOptions("cocteau", "track", "local");
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json([result], { headers: headers(calls === 1 ? "degraded" : "fresh") });
  });

  const partial = await client.fetchQuery(options);
  assert.equal(partial.readiness.status, "degraded");
  assert.equal(partial.readiness.links, "skipped");
  assert.equal(partial.results[0]?.provider_id, result.provider_id);

  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  await wait(20);
  assert.equal(observer.getCurrentResult().isStale, true);
  assert.equal(calls, 1, "remount must not restart the failed phase");
  unsubscribe();
  const resubscribe = observer.subscribe(() => {});
  await wait(20);
  assert.equal(calls, 1);
  assert.equal(observer.getCurrentResult().data?.results.length, 1);
  onlineManager.setOnline(false);
  onlineManager.setOnline(true);
  await wait(20);
  assert.equal(calls, 1, "reconnecting must not restart the degraded phase");

  const recovered = await observer.refetch();
  assert.equal(calls, 2);
  assert.equal(recovered.data?.readiness.status, "fresh");
  assert.equal(recovered.data?.results[0]?.provider_id, result.provider_id);
  assert.equal(recovered.isStale, false);
  resubscribe();
});

test("stale readiness remains distinct from fresh without discarding results", async (t) => {
  const client = new QueryClient();
  t.after(() => client.clear());
  t.mock.method(globalThis, "fetch", async () => Response.json([result], { headers: headers("stale") }));
  const options = kocteauTrackSearchQueryOptions("cocteau", "all", "local");
  const data = await client.fetchQuery(options);
  assert.equal(data.readiness.status, "stale");
  assert.equal(data.results.length, 1);
  const observer = new QueryObserver(client, options);
  assert.equal(observer.getCurrentResult().isStale, true);
  assert.equal(options.retry, false);
  assert.equal(options.refetchOnWindowFocus, false);
});

test("explicit recovery does not reissue a healthy phase", () => {
  const fresh = readSearchReadiness(new Headers(headers("fresh")));
  const degraded = readSearchReadiness(new Headers(headers("degraded")));
  assert.deepEqual(searchPhasesToRefetch([
    { isError: false, readiness: fresh }, { isError: false, readiness: degraded },
  ]), [false, true]);
  assert.deepEqual(searchPhasesToRefetch([
    { isError: true }, { isError: false, readiness: fresh },
  ]), [true, false]);
  assert.deepEqual(searchPhasesToRefetch([
    { isError: false, readiness: fresh }, { isError: false, readiness: fresh },
  ]), [true, true]);
});

test("missing or invalid readiness is unknown rather than fabricated fresh", () => {
  assert.equal(readSearchReadiness(new Headers()).status, "unknown");
  assert.equal(readSearchReadiness(new Headers({ "X-Kocteau-Search-Status": "skipped" })).status, "unknown");
  assert.equal(readSearchReadiness(new Headers({ "X-Kocteau-Search-Local": "invalid" })).local, "unknown");
});

test("HTTP failures retain their status and do not retry automatically", async (t) => {
  const client = new QueryClient();
  t.after(() => client.clear());
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ error: "Try again" }, { status: 502, headers: headers("degraded") });
  });
  await assert.rejects(client.fetchQuery(kocteauTrackSearchQueryOptions("failure", "all", "remote")),
    (error) => error instanceof FetchJsonError && error.status === 502 && error.message === "Try again");
  const observer = new QueryObserver(client, kocteauTrackSearchQueryOptions("failure", "all", "remote"));
  const unsubscribe = observer.subscribe(() => {});
  await wait(20);
  assert.equal(calls, 1);
  unsubscribe();
});

test("cancelling Query still aborts the response body request", async (t) => {
  const client = new QueryClient();
  t.after(() => client.clear());
  let receivedSignal: AbortSignal | null | undefined;
  const options = kocteauTrackSearchQueryOptions("cancel", "track", "remote");
  t.mock.method(globalThis, "fetch", (_input: RequestInfo | URL, init?: RequestInit) => {
    receivedSignal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      receivedSignal?.addEventListener("abort", () => reject(receivedSignal?.reason), { once: true });
    });
  });
  const pending = client.fetchQuery(options);
  void pending.catch(() => {});
  await client.cancelQueries({ queryKey: options.queryKey });
  assert.equal(receivedSignal?.aborted, true);
  await assert.rejects(pending);
});

test("existing fetchJson callers still receive only their payload", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json([result]));
  assert.deepEqual(await fetchJson("/fixture"), [result]);
});
