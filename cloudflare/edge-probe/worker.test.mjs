import assert from "node:assert/strict";
import test from "node:test";
import worker from "./worker.mjs";

test("health returns infrastructure-only response", async () => {
  const response = await worker.fetch(new Request("https://example.workers.dev/health"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    status: "ok",
    purpose: "cloudflare-infrastructure-only",
    appDeployed: false,
    supabaseConnected: false,
    loginEnabled: false,
  });
});

test("no Kocteau routes are served by the infrastructure probe", async () => {
  for (const path of ["/", "/login", "/search", "/albums/example", "/api/reviews", "/robots.txt"]) {
    const response = await worker.fetch(new Request("https://example.workers.dev" + path));
    assert.equal(response.status, 404, path);
  }
  assert.equal(
    (await worker.fetch(new Request("https://example.workers.dev/health", { method: "POST" }))).status,
    404,
  );
});
