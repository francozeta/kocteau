import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";

type Row = {
  id: string; username: string; avatar_url: null; display_name: string;
  bio: null; spotify_url: null; apple_music_url: null; deezer_url: null;
  onboarded: boolean; taste_onboarded?: boolean;
};
const profile: Row = {
  id: "viewer-fixture", username: "listener", avatar_url: null,
  display_name: "Fixture listener", bio: null, spotify_url: null,
  apple_music_url: null, deezer_url: null, onboarded: true, taste_onboarded: true,
};
const responses: Array<{ data: Row | null; error: {code: string; message: string} | null }> = [];
const calls: Array<{ selection: string; signal: AbortSignal | null }> = [];
const postgrest = {
  select(selection: string) {
    const call = { selection, signal: null as AbortSignal | null };
    calls.push(call);
    return {
      eq() {
        return {
          abortSignal(signal: AbortSignal) {
            call.signal = signal;
            return { maybeSingle: async () => responses.shift() ?? { data: null, error: null } };
          },
        };
      },
    };
  },
};
const fakeSupabase = {
  auth: { getClaims: async () => ({ data: { claims: { sub: profile.id } }, error: null }) },
  from: (table: string) => {
    assert.equal(table, "profiles");
    return postgrest;
  },
};
const stubKey = Symbol.for("kocteau.viewer-context.test");
const stubs = {
  empty: {},
  react: { cache: (fn: unknown) => fn },
  headers: { cookies: async () => ({ getAll: () => [{name: "sb-fixture"}] }) },
  server: { supabaseServer: async () => fakeSupabase },
};
const modules = new Map([
  ["server-only", "empty"],
  ["react", "react"],
  ["next/headers", "headers"],
  ["@/lib/supabase/server", "server"],
]);
let auth: typeof import("./server");

before(async () => {
  Object.defineProperty(globalThis, stubKey, { value: stubs, configurable: true });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const name = modules.get(specifier);
      return name
        ? { url: "viewer-test:" + name, shortCircuit: true }
        : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("viewer-test:")) return nextLoad(url, context);
      const name = url.slice("viewer-test:".length);
      return {
        format: "commonjs",
        source: 'module.exports = globalThis[Symbol.for("kocteau.viewer-context.test")][' + JSON.stringify(name) + "];",
        shortCircuit: true,
      };
    },
  });
  try {
    auth = await import("./server");
  } finally {
    hooks.deregister();
  }
});
after(() => Reflect.deleteProperty(globalThis, stubKey));
beforeEach(() => { calls.length = 0; responses.length = 0; });

test("transient 503 never doubles private viewer reads", async () => {
  responses.push({ data: null, error: {code:"503", message:"Data API unavailable"} });
  assert.equal(await auth.getCurrentViewerProfile(), null);
  assert.equal(calls.length, 1);
  assert.ok(calls[0]?.signal, "profile read must have an abort signal");
});

test("legacy taste column can use one fallback within the same deadline", async () => {
  responses.push(
    { data: null, error: {code:"42703", message:'column "taste_onboarded" does not exist'} },
    { data: { ...profile, taste_onboarded: undefined }, error: null },
  );
  const state = await auth.getCurrentOnboardingState();
  assert.deepEqual(state, {profileOnboarded:true, tasteOnboarded:true});
  assert.equal(calls.length, 2);
  assert.equal(calls[0]?.signal, calls[1]?.signal);
  assert.ok(!calls[1]?.selection.includes("taste_onboarded"));
});

test("confirmed absence is still an absent profile without fallback", async () => {
  responses.push({ data: null, error: null });
  assert.equal(await auth.getCurrentViewerProfile(), null);
  assert.equal(calls.length, 1);
});
