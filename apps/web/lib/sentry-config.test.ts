import assert from "node:assert/strict";
import { test } from "node:test";
import { getSentryOptions } from "./sentry-config";

test("production keeps the existing project and one-percent trace default", () => {
  const options = getSentryOptions({ production: true });
  assert.equal(options.enabled, true);
  assert.equal(options.tracesSampleRate, 0.01);
  assert.ok(options.dsn.startsWith("https://"));
  assert.equal(options.enableLogs, false);
  assert.equal(options.sendDefaultPii, false);
});

test("non-production remains disabled even when a trace rate is supplied", () => {
  const options = getSentryOptions({ production: false, sampleRate: "1" });
  assert.equal(options.enabled, false);
  assert.equal(options.tracesSampleRate, 0);
});

test("explicit zero disables trace sampling while keeping error collection configured", () => {
  const options = getSentryOptions({ production: true, sampleRate: "0" });
  assert.equal(options.enabled, true);
  assert.equal(options.tracesSampleRate, 0);
});

test("invalid rates fall back to one percent rather than enabling full sampling", () => {
  for (const sampleRate of ["", " ", "-1", "2", "NaN", "Infinity"]) {
    assert.equal(
      getSentryOptions({ production: true, sampleRate }).tracesSampleRate,
      0.01,
    );
  }
});

test("isolated verification can select its local collector and full sampling", () => {
  const options = getSentryOptions({
    production: true,
    dsn: "http://public@127.0.0.1:4319/1",
    sampleRate: "1",
  });
  assert.equal(options.dsn, "http://public@127.0.0.1:4319/1");
  assert.equal(options.tracesSampleRate, 1);
});

test("an explicitly empty DSN disables telemetry", () => {
  const options = getSentryOptions({ production: true, dsn: " " });
  assert.equal(options.enabled, false);
});
