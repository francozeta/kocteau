import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { isDiscoveryLabAvailable } from "./lab-access";

test("only Vercel previews or explicitly opted-in local development expose the lab", () => {
  for (const nodeEnv of ["production", "development", "test", undefined]) {
    for (const localOptIn of [false, true]) {
      assert.equal(isDiscoveryLabAvailable({ vercelEnv: "preview", nodeEnv, localOptIn }), true);
      assert.equal(isDiscoveryLabAvailable({ vercelEnv: "production", nodeEnv, localOptIn }), false);
      assert.equal(isDiscoveryLabAvailable({ vercelEnv: "development", nodeEnv, localOptIn }), false);
      assert.equal(isDiscoveryLabAvailable({ vercelEnv: undefined, nodeEnv, localOptIn }), nodeEnv === "development" && localOptIn);
    }
  }
});

const calls: string[] = [];
let signedIn = true;
let curator = true;
const stubs = {
  navigation: {
    notFound: () => { throw new Error("not-found"); },
    redirect: (location: string) => { throw new Error(`redirect:${location}`); },
  },
  auth: { getCurrentUser: async () => { calls.push("auth"); return signedIn ? { id: "test-curator" } : null; } },
  curator: { getStarterCuratorAccess: async () => { calls.push("curator"); return curator; } },
  shell: { default: () => null },
  client: { default: () => null },
};
const modules = new Map([
  ["next/navigation", "navigation"],
  ["@/lib/auth/server", "auth"],
  ["@/lib/queries/curation", "curator"],
  ["@/components/shell/app-shell", "shell"],
  ["@/components/studio/discovery-ranking-lab", "client"],
]);
const originalEnv = process.env.VERCEL_ENV;
const stubKey = Symbol.for("kocteau.discovery-lab-access.test");
let route: typeof import("../../app/studio/discovery-lab/page");

before(async () => {
  Object.defineProperty(globalThis, stubKey, { value: stubs, configurable: true });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const name = modules.get(specifier);
      return name ? { url: `lab-access-test:${name}`, shortCircuit: true } : nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (!url.startsWith("lab-access-test:")) return nextLoad(url, context);
      return {
        format: "commonjs",
        source: `module.exports = globalThis[Symbol.for("kocteau.discovery-lab-access.test")][${JSON.stringify(url.slice("lab-access-test:".length))}];`,
        shortCircuit: true,
      };
    },
  });
  try {
    route = await import("../../app/studio/discovery-lab/page");
  } finally {
    hooks.deregister();
  }
});
after(() => {
  if (originalEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalEnv;
  Reflect.deleteProperty(globalThis, stubKey);
});
beforeEach(() => {
  calls.length = 0;
  signedIn = true;
  curator = true;
});
const invoke = () => route.default({ searchParams: Promise.resolve({ local: "1" }) });

test("the real page denies production before reading auth or rendering its Studio shell", async () => {
  process.env.VERCEL_ENV = "production";
  await assert.rejects(invoke(), /not-found/);
  assert.deepEqual(calls, []);
  assert.equal(route.dynamic, "force-dynamic");
  assert.deepEqual(route.metadata.robots, { index: false, follow: true });
});

test("preview requires both a signed-in user and the existing curator role", async () => {
  process.env.VERCEL_ENV = "preview";
  signedIn = false;
  await assert.rejects(invoke(), /redirect:\/login/);
  assert.deepEqual(calls, ["auth"]);
  signedIn = true;
  curator = false;
  await assert.rejects(invoke(), /not-found/);
  assert.deepEqual(calls, ["auth", "auth", "curator"]);
  curator = true;
  const element = await invoke();
  assert.equal(element.props.variant, "studio");
});
