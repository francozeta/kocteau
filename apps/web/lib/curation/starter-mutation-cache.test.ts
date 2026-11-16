import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";

const invalidations: unknown[][] = [];
let allowed = true;
let rpcError: { code: string; message: string } | null = null;
const stubs = {
  cache: {
    revalidateTag: (...args: unknown[]) => { invalidations.push(["tag", ...args]); },
    revalidatePath: (...args: unknown[]) => { invalidations.push(["path", ...args]); },
  },
  access: {
    requireStarterCurator: async () => allowed
      ? { ok: true, supabase: { rpc: async () => ({ data: { id: "fixture" }, error: rpcError }) } }
      : { ok: false, response: new Response(null, { status: 403 }) },
  },
};
const stubKey = Symbol.for("kocteau.starter-mutation-cache.test");
let routes: typeof import("../../app/api/starter/tracks/route");

before(async () => {
  Object.defineProperty(globalThis, stubKey, { value: stubs, configurable: true });
  const modules = new Map([["next/cache", "cache"], ["@/lib/curation/access", "access"]]);
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const name = modules.get(specifier);
      return name ? { url: "starter-mutation:" + name, shortCircuit: true } : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("starter-mutation:")) return nextLoad(url, context);
      return {
        format: "commonjs",
        source: 'module.exports = globalThis[Symbol.for("kocteau.starter-mutation-cache.test")][' + JSON.stringify(url.slice("starter-mutation:".length)) + "];",
        shortCircuit: true,
      };
    },
  });
  try {
    routes = await import("../../app/api/starter/tracks/route");
  } finally {
    hooks.deregister();
  }
});
after(() => { Reflect.deleteProperty(globalThis, stubKey); });
beforeEach(() => { invalidations.length = 0; allowed = true; rpcError = null; });

const payload = { provider: "deezer", provider_id: "42", type: "track", title: "Fixture track", tag_ids: [] };
const archived = { id: "11111111-1111-4111-8111-111111111111" };
function request(body: unknown) {
  return new Request("https://kocteau.test/api/starter/tracks", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("saving and archiving expire shared picks and refresh both home surfaces", async () => {
  for (const [method, body] of [[routes.POST, payload], [routes.DELETE, archived]] as const) {
    invalidations.length = 0;
    assert.equal((await method(request(body))).status, 200);
    assert.deepEqual(invalidations, [
      ["tag", "starter-tracks", { expire: 0 }],
      ["path", "/home"], ["path", "/"], ["path", "/studio/starter"],
    ]);
  }
});

test("rejected and failed mutations do not invalidate a valid shared catalog", async () => {
  allowed = false;
  assert.equal((await routes.POST(request(payload))).status, 403);
  allowed = true;
  assert.equal((await routes.POST(request({}))).status, 400);
  rpcError = { code: "XX000", message: "Fixture origin unavailable" };
  assert.equal((await routes.POST(request(payload))).status, 500);
  assert.equal((await routes.DELETE(request(archived))).status, 500);
  assert.deepEqual(invalidations, []);
});
