import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyAuthClaims } from "./claims-policy";

test("verified subject authorizes; absent subject is a guest", () => {
  assert.equal(classifyAuthClaims("viewer-id", null), "authenticated");
  assert.equal(classifyAuthClaims(null, null), "anonymous");
});

test("known invalid session becomes anonymous", () => {
  assert.equal(
    classifyAuthClaims(null, { name: "AuthSessionMissingError" }),
    "anonymous",
  );
  assert.equal(
    classifyAuthClaims(null, { code: "refresh_token_not_found", status: 400 }),
    "anonymous",
  );
  assert.equal(
    classifyAuthClaims(null, { code: "invalid_jwt", status: 401 }),
    "anonymous",
  );
});

test("gateway/auth outages and unexpected errors are never logouts", () => {
  for (const error of [
    { name: "AuthRetryableFetchError", status: 0 },
    { status: 503, code: "service_unavailable" },
    { status: 504 },
    { status: 429 },
    { message: "socket error" },
    { status: 503, code: "invalid_grant" },
  ]) {
    assert.equal(classifyAuthClaims(null, error), "unavailable");
  }
});
