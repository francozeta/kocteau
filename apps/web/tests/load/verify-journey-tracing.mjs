import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { startJourneyFixture } from "./fixtures/journey-tracing-upstreams.mjs";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRoot = resolve(webRoot, "../..");
const require = createRequire(join(webRoot, "package.json"));
const { webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
for (const name of [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
]) {
  if (
    await stat(join(webRoot, name)).then(
      () => true,
      () => false,
    )
  ) {
    throw new Error(
      "Use an isolated checkout without " +
        name +
        "; the verifier does not load application credentials",
    );
  }
}
const evidence = join(repositoryRoot, ".codex-private/journey-tracing");
await mkdir(evidence, { recursive: true });
const fixture = await startJourneyFixture();
const preserved = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      /^(?:PATH|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|NO_PROXY|SSL_CERT_FILE|SSL_CERT_DIR|NODE_EXTRA_CA_CERTS|PLAYWRIGHT_BROWSERS_PATH)$/.test(
        key,
      ) || key.startsWith("CODEX_"),
  ),
);
const env = {
  ...preserved,
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "isolated-fixture-key",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_SENTRY_DSN: fixture.dsn,
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "1",
  KOCTEAU_PERF_LOGS: "0",
  NODE_OPTIONS:
    "--import=" + join(webRoot, "tests/load/fixtures/isolate-upstreams.mjs"),
};
let build,
  app,
  browser,
  appUrl,
  output = "";
const results = [],
  requests = [];
const transactionTrace = (transaction) => transaction.contexts?.trace?.trace_id;
const manualReads = () =>
  fixture.state.transactions.flatMap((transaction) =>
    (transaction.spans ?? [])
      .filter((span) => span.op === "kocteau.public_read")
      .map((span) => ({ traceId: transactionTrace(transaction), ...span })),
  );
const waitFor = async (test, label, timeout = 10000) => {
  const deadline = Date.now() + timeout;
  while (!test()) {
    if (Date.now() > deadline) throw new Error(label);
    await delay(100);
  }
};
const stop = async (child) => {
  if (!child) return;
  if (child.exitCode === null && child.signalCode === null) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {}
    await Promise.race([
      once(child, "exit"),
      delay(5000, undefined, { ref: false }),
    ]);
    if (child.exitCode === null)
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
  }
  child.stdout?.destroy();
  child.stderr?.destroy();
};
try {
  const collectorUrl = new URL(fixture.dsn);
  collectorUrl.username = "";
  collectorUrl.password = "";
  collectorUrl.pathname = "/api/1/envelope/";
  const malformed = await fetch(collectorUrl, {
    method: "POST",
    headers: { "Content-Encoding": "gzip" },
    body: "not-a-gzip-envelope",
  });
  assert.equal(
    malformed.status,
    400,
    "Malformed telemetry must not crash the collector",
  );
  console.log(
    JSON.stringify({
      event: "build",
      scope: "loopback Data API and local telemetry collector only",
    }),
  );
  build = spawn("pnpm", ["--filter", "web", "build"], {
    cwd: repositoryRoot,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let buildOutput = "";
  for (const stream of [build.stdout, build.stderr])
    stream.on("data", (chunk) => {
      buildOutput = (buildOutput + chunk).slice(-50000);
    });
  const built = await Promise.race([
    once(build, "exit"),
    delay(240000, undefined, { ref: false }).then(() => {
      throw new Error("Isolated build deadline exceeded");
    }),
  ]);
  await writeFile(join(evidence, "build.log"), buildOutput);
  assert.equal(built[0], 0, buildOutput.slice(-5000));
  const prerender = JSON.parse(
    await readFile(join(webRoot, ".next/prerender-manifest.json"), "utf8"),
  );
  assert.equal(
    prerender.routes["/"]?.initialRevalidateSeconds,
    300,
    "Public homepage ISR must remain 300 seconds",
  );
  const buildOriginReads = fixture.state.reads;
  fixture.state.reads = 0;
  fixture.state.transactions.length = 0;
  app = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
    ],
    { cwd: webRoot, env, detached: true, stdio: ["ignore", "pipe", "pipe"] },
  );
  for (const stream of [app.stdout, app.stderr])
    stream.on("data", (chunk) => {
      output = (output + chunk).slice(-50000);
    });
  await waitFor(
    () => {
      if (app.exitCode !== null || app.signalCode !== null)
        throw new Error(output);
      appUrl ??= stripVTControlCharacters(output).match(
        /- Local:\s+(http:\/\/127\.0\.0\.1:\d+)/,
      )?.[1];
      return Boolean(appUrl && output.includes("Ready"));
    },
    "Next startup timed out",
    45000,
  );
  browser = await webkit.launch();
  for (const mobile of [true, false]) {
    const browserEventsBefore = fixture.state.transactions.filter(
      (t) => t.platform === "javascript",
    ).length;
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
      reducedMotion: "reduce",
    });
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return url.hostname === "127.0.0.1" || url.protocol === "about:"
        ? route.continue()
        : route.fulfill({ status: 204 });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on("pageerror", (error) =>
      errors.push({ stage: "navigation", message: error.message }),
    );
    const pendingRequests = [];
    const requestErrors = [];
    const captureRequest = (request) => {
      pendingRequests.push(
        request
          .allHeaders()
          .then((headers) => {
            if (headers["sentry-trace"])
              requests.push({
                traceId: headers["sentry-trace"].split("-")[0],
                prefetch:
                  headers["next-router-prefetch"] === "1" ||
                  headers.purpose === "prefetch",
                rsc: headers.rsc === "1",
              });
          })
          .catch((error) => requestErrors.push(String(error))),
      );
    };
    context.on("request", captureRequest);
    const settle = async (response) => {
      if (response) await response.finished();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    };
    let started = performance.now();
    const document = await page.goto(appUrl + "/reviews", {
      waitUntil: "commit",
      timeout: 45000,
    });
    const reviewLink = page.locator('a[href^="/reviews/"]').first();
    await reviewLink.waitFor();
    const direct = {
      mobile,
      journey: "reviews-direct",
      contentReadyMs: Math.round(performance.now() - started),
    };
    await settle(document);
    direct.settledMs = Math.round(performance.now() - started);
    results.push(direct);
    const reviewPath = await reviewLink.getAttribute("href");
    started = performance.now();
    await reviewLink.click({ noWaitAfter: true });
    await page.waitForURL(
      (url) => url.pathname === new URL(reviewPath, appUrl).pathname,
      { waitUntil: "commit" },
    );
    await page
      .locator("#review-structured-data")
      .waitFor({ state: "attached" });
    await page
      .getByText(/Fixture review \d+/, { exact: true })
      .first()
      .waitFor();
    results.push({
      mobile,
      journey: "review-link",
      contentReadyMs: Math.round(performance.now() - started),
    });
    await settle();
    const trackLink = page.locator('a[href^="/tracks/"]').first();
    await trackLink.waitFor();
    const trackPath = await trackLink.getAttribute("href");
    started = performance.now();
    await trackLink.click({ noWaitAfter: true });
    await page.waitForURL(
      (url) => url.pathname === new URL(trackPath, appUrl).pathname,
      { waitUntil: "commit" },
    );
    await page.locator("#track-structured-data").waitFor({ state: "attached" });
    await page
      .getByRole("heading", { name: fixture.entity.title, exact: true })
      .waitFor();
    results.push({
      mobile,
      journey: "track-link",
      contentReadyMs: Math.round(performance.now() - started),
    });
    await settle();
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page
      .locator("#review-structured-data")
      .waitFor({ state: "attached" });
    await settle();
    // Fresh documents keep forced origin probes separate from normal Link/back navigation.
    fixture.state.headerDelayMs = 0;
    fixture.state.bodyDelayMs = 120;
    const bodyPage = await context.newPage();
    bodyPage.on("pageerror", (error) =>
      errors.push({ stage: "body-probe", message: error.message }),
    );
    await bodyPage.goto(appUrl + reviewPath, { waitUntil: "domcontentloaded" });
    await bodyPage
      .locator("#review-structured-data")
      .waitFor({ state: "attached" });
    await bodyPage.waitForLoadState("networkidle");
    fixture.state.bodyDelayMs = 0;
    fixture.state.fail = true;
    const failurePath =
      "/reviews/" +
      fixture.reviews.at(-1).short_id +
      "/fixture-track-fixture-artist";
    const failurePage = await context.newPage();
    failurePage.on("pageerror", (error) =>
      errors.push({ stage: "origin-failure", message: error.message }),
    );
    const failure = await failurePage.goto(appUrl + failurePath, {
      waitUntil: "domcontentloaded",
    });
    await failurePage.waitForLoadState("networkidle");
    const missing = await failurePage
      .getByText("This page could not be found.", { exact: true })
      .count();
    results.push({
      mobile,
      journey: "origin-failure-observation",
      http: failure.status(),
      missingPage: Boolean(missing),
      openIssue: "#260",
    });
    fixture.state.fail = false;
    fixture.state.headerDelayMs = 80;
    const recoveryPage = await context.newPage();
    recoveryPage.on("pageerror", (error) =>
      errors.push({ stage: "recovery", message: error.message }),
    );
    await recoveryPage.goto(appUrl + failurePath, {
      waitUntil: "domcontentloaded",
    });
    await recoveryPage
      .locator("#review-structured-data")
      .waitFor({ state: "attached" });
    await recoveryPage
      .getByText(/Fixture review \d+/, { exact: true })
      .first()
      .waitFor();
    await recoveryPage.waitForLoadState("networkidle");
    await waitFor(
      () =>
        fixture.state.transactions.filter((t) => t.platform === "javascript")
          .length > browserEventsBefore,
      "Browser transaction did not reach isolated collector",
    );
    context.off("request", captureRequest);
    await Promise.all(pendingRequests);
    assert.deepEqual(requestErrors, []);
    const failureErrors = errors.filter(
      (error) => error.stage === "origin-failure",
    );
    assert.deepEqual(
      errors.filter((error) => error.stage !== "origin-failure"),
      [],
    );
    results.push({
      mobile,
      journey: "trace-verification",
      failureRenderErrors: failureErrors,
    });
    assert.equal(
      (await context.cookies()).some((cookie) =>
        cookie.name.includes("auth-token"),
      ),
      false,
    );
    await context.close();
  }
  await waitFor(
    () =>
      manualReads().some((s) => s.data?.["kocteau.outcome"] === "http_error"),
    "Missing failed public-read span",
  );
  const reads = manualReads();
  assert.ok(reads.some((s) => s.data?.["kocteau.headers_ms"] >= 60));
  assert.ok(reads.some((s) => s.data?.["kocteau.body_ms"] >= 90));
  const browserTraces = new Set(
    fixture.state.transactions
      .filter((t) => t.platform === "javascript")
      .map(transactionTrace),
  );
  const propagated = new Set(requests.map((request) => request.traceId));
  const correlated = new Set(
    reads
      .map((read) => read.traceId)
      .filter((id) => browserTraces.has(id) || propagated.has(id)),
  );
  assert.ok(correlated.size > 0, "No browser-to-server trace correlation");
  for (const read of reads) {
    assert.equal(read.data?.["kocteau.timing_kind"], "http_round_trip");
    assert.equal(read.data?.["kocteau.execution"], "unknown");
    assert.doesNotMatch(
      JSON.stringify(read.data),
      /https?:\/\/|127\.0\.0\.1|isolated-fixture-key|private-canary|Synthetic listening note/i,
      "Manual read-span data must omit URLs, credentials, query canaries and review text",
    );
  }
  const report = {
    at: new Date().toISOString(),
    environment: "isolated local production build",
    engine: "WebKit",
    productionPercentiles: null,
    limits:
      "Small deterministic guest fixture; content visibility timings, not production P95/LCP, authenticated coverage or capacity. Background attribution remains unknown.",
    homepageIsrSeconds: 300,
    results,
    buildOriginReads,
    runtimeOriginReads: fixture.state.reads,
    transactions: fixture.state.transactions.length,
    publicReadSpans: reads.length,
    correlatedTraceCount: correlated.size,
    propagatedRequests: requests.length,
    failureSpans: reads.filter((s) => s.data?.["kocteau.outcome"] !== "success")
      .length,
    headerWaitObserved: reads.some((s) => s.data?.["kocteau.headers_ms"] >= 60),
    bodyWaitObserved: reads.some((s) => s.data?.["kocteau.body_ms"] >= 90),
  };
  await writeFile(
    join(evidence, "report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ event: "verified", ...report }));
} catch (error) {
  console.error(error);
  console.error(output.slice(-5000));
  await writeFile(
    join(evidence, "partial.json"),
    JSON.stringify(
      {
        results,
        envelopeTypes: fixture.state.envelopeTypes,
        transactions: fixture.state.transactions.length,
        publicReadSpans: manualReads().length,
        error: String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await writeFile(join(evidence, "server.log"), output);
  await browser?.close();
  await stop(build);
  await stop(app);
  await fixture.close();
}
