import assert from "node:assert/strict";
import test from "node:test";
import { DeezerRequestError, getDeezerAlbum, getDeezerTrack } from "../deezer";

test("the worker sees Deezer transport failures while page lookups keep their fallback", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 403 }));
  t.mock.method(console, "warn", () => {});
  await assert.rejects(getDeezerTrack("123", { throwOnError: true }), DeezerRequestError);
  assert.equal(await getDeezerTrack("123"), null);
});

test("provider error payloads cannot be mistaken for successful catalog lookups", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: { message: "unavailable" } }));
  await assert.rejects(getDeezerAlbum("123", { throwOnError: true }), DeezerRequestError);
  assert.equal(await getDeezerAlbum("123"), null);
});

test("a missing resource is distinct from a failed request", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }));
  assert.equal(await getDeezerTrack("123", { throwOnError: true }), null);
});

test("malformed source identities and responses fail strict collection", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ title: "No identity" }));
  await assert.rejects(getDeezerTrack("123", { throwOnError: true }), DeezerRequestError);
  await assert.rejects(getDeezerAlbum("123", { throwOnError: true }), DeezerRequestError);
  await assert.rejects(getDeezerTrack("invalid", { throwOnError: true }), DeezerRequestError);
});
