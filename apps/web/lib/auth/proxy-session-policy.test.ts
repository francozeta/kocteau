import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applySessionRefreshHeaders,
  classifySessionClaims,
  copySessionCacheHeaders,
} from "./proxy-session-policy";

test("verified claims keep the private route; missing claims are anonymous", () => {
  assert.equal(classifySessionClaims(true, null), "authenticated");
  assert.equal(classifySessionClaims(false, null), "anonymous");
});

test("Auth 503, 504, 429 and network failures are NOT anonymous sessions", () => {
  for (const error of [
    { status: 503 }, { status: 504 }, { status: 429 },
    { name: "AuthRetryableFetchError", status: 0 },
    new TypeError("fetch failed"),
    { code: "unexpected_failure" },
  ]) assert.equal(classifySessionClaims(false, error), "unavailable");
  assert.equal(classifySessionClaims(false, { status: 401 }), "anonymous");
  assert.equal(classifySessionClaims(false, { status: 403 }), "anonymous");
});

test("session refresh cookies must mark the response private and preserve expiry headers", () => {
  const headers = new Headers();
  applySessionRefreshHeaders(headers, {
    "Cache-Control": "public, s-maxage=3600",
    Expires: "Thu, 01 Jan 1970 00:00:00 GMT",
    Pragma: "no-cache",
  });
  assert.equal(headers.get("cache-control"), "private, no-store");
  assert.ok(headers.get("expires"));
  assert.equal(headers.get("pragma"), "no-cache");
  const rewritten = new Headers();
  copySessionCacheHeaders(headers, rewritten);
  assert.equal(rewritten.get("cache-control"), "private, no-store");
  assert.equal(rewritten.get("pragma"), "no-cache");
  assert.ok(rewritten.get("expires"));
});

test("refresh without cache headers is still private", () => {
  const headers = new Headers();
  applySessionRefreshHeaders(headers, undefined);
  assert.equal(headers.get("cache-control"), "private, no-store");
});
