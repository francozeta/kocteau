import assert from "node:assert/strict";
import { test } from "node:test";
import { accountTransitionPath } from "./account-navigation";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

test("identity changes retain the destination while sign-out returns to login", () => {
  const context = { serverAccountId: "a", browserAccountId: "b", currentPath: "/search?q=one#focus", storage: memoryStorage() };
  assert.equal(accountTransitionPath({ ...context, event: "SIGNED_IN" }), context.currentPath);
  assert.equal(accountTransitionPath({ ...context, browserAccountId: null, event: "SIGNED_OUT" }), "/login");
  assert.equal(accountTransitionPath({ ...context, browserAccountId: "a", event: "TOKEN_REFRESHED" }), null);
});

test("a persistent initial mismatch leaves private rendering after one reconciliation", () => {
  const context = { serverAccountId: null, browserAccountId: "a", currentPath: "/search", storage: memoryStorage(), event: "INITIAL_SESSION" };
  assert.equal(accountTransitionPath(context), "/search");
  assert.equal(accountTransitionPath(context), "/home");
  assert.equal(accountTransitionPath({ ...context, serverAccountId: "a" }), null);
  assert.equal(accountTransitionPath(context), "/search");
});

test("initial reconciliation remains bounded when browser storage is unavailable", () => {
  const context = { serverAccountId: "a", browserAccountId: "b", currentPath: "/reviews/one", event: "INITIAL_SESSION" };
  assert.equal(accountTransitionPath({ ...context, storage: null }), "/home");
  const denied = () => { throw new Error("Storage denied"); };
  assert.equal(accountTransitionPath({ ...context, storage: { getItem: denied, setItem: denied, removeItem: denied } }), "/home");
});
