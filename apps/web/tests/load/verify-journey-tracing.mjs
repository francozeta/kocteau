import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { startJourneyFixture } from "./fixtures/journey-tracing-upstreams.mjs";

const scriptSnapshot = (page) => page.evaluate(() => {
  const scripts = performance.getEntriesByType("resource")
    .filter((entry) => new URL(entry.name).pathname.endsWith(".js"));
  return {
    count: scripts.length,
    decodedBytes: scripts.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
    encodedBytes: scripts.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
  };
});
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
const coldProbeSeed = randomBytes(4).readUInt32BE(0);
const coldPrefix = (index) =>
  (0x50000000 + ((coldProbeSeed + index) & 0x0fffffff)).toString(16);
const preserved = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) =>
      /^(?:CI|PATH|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|NO_PROXY|SSL_CERT_FILE|SSL_CERT_DIR|NODE_EXTRA_CA_CERTS|PLAYWRIGHT_BROWSERS_PATH)$/.test(
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
  const { createServerClient } = require("@supabase/ssr");
  let sessionCookies = [];
  const fixtureAuth = createServerClient(
    "http://127.0.0.1:54321",
    "isolated-fixture-key",
    {
      cookies: {
        getAll: () => sessionCookies,
        setAll: (cookies) => {
          sessionCookies = cookies;
        },
      },
    },
  );
  const session = await fixtureAuth.auth.setSession({
    access_token: fixture.accessToken,
    refresh_token: "isolated-refresh-token",
  });
  assert.equal(session.error, null);
  for (const { mobile, authenticated } of [
    { mobile: true, authenticated: false },
    { mobile: false, authenticated: false },
    { mobile: true, authenticated: true },
    { mobile: false, authenticated: true },
  ]) {
    const syntheticRows = [];
    const createColdRow = (source, target, index) => {
      const prefix = coldPrefix(
        (authenticated ? 100 : 0) + (mobile ? 10 : 20) + index,
      );
      const row = {
        ...source,
        id: prefix + "-1234-4000-8000-000000000001",
        short_id: prefix + "1234",
      };
      target.push(row);
      syntheticRows.push({ target, row });
      return row;
    };
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
    if (authenticated) {
      await context.addCookies(
        sessionCookies.map(({ name, value }) => ({
          name,
          value,
          url: appUrl,
          sameSite: "Lax",
        })),
      );
    }
    const viewerReadsBefore = fixture.state.viewerReads;
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on("pageerror", (error) =>
      errors.push({ stage: "navigation", message: error.message }),
    );
    const captureRequest = (request) => {
      const headers = request.headers();
      if (headers["sentry-trace"]) {
        requests.push({
          traceId: headers["sentry-trace"].split("-")[0],
          prefetch:
            headers["next-router-prefetch"] === "1" ||
            headers.purpose === "prefetch",
          rsc: headers.rsc === "1",
        });
      }
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
      authenticated,
      journey: "reviews-direct",
      contentReadyMs: Math.round(performance.now() - started),
    };
    await settle(document);
    direct.settledMs = Math.round(performance.now() - started);
    results.push(direct);
    const listScripts = await scriptSnapshot(page);
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
      authenticated,
      journey: "review-link",
      contentReadyMs: Math.round(performance.now() - started),
    });
    await settle();
    const reviewScripts = await scriptSnapshot(page);
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
      authenticated,
      journey: "track-link",
      contentReadyMs: Math.round(performance.now() - started),
    });
    await settle();
    const trackScripts = await scriptSnapshot(page);
    results.push({ mobile, authenticated, journey: "reading-script-bytes",
      scripts: { list: listScripts, review: reviewScripts, track: trackScripts } });
    if (authenticated) {
      const edit = page.getByRole("button", { name: "Edit review", exact: true }).first();
      await edit.click();
      const title = page.locator("#review-title");
      await title.waitFor({ state: "visible" });
      const originalTitle = await title.inputValue();
      const ownReview = fixture.reviews.find((review) => review.title === originalTitle);
      assert.ok(ownReview, "Editor must receive the viewer's actual review");
      assert.equal(await page.locator("#review-body").inputValue(), ownReview.body);
      await title.fill("Unsaved local editor draft");
      assert.equal(await title.inputValue(), "Unsaved local editor draft");
      await page.keyboard.press("Escape");
      await title.waitFor({ state: "hidden" });
      await edit.click();
      await title.waitFor({ state: "visible" });
      assert.equal(await title.inputValue(), originalTitle);
      await page.keyboard.press("Escape");
      await title.waitFor({ state: "hidden" });
      results.push({ mobile, authenticated, journey: "editor-original-fields-reopen",
        resetToOriginal: true });
      const autoPage = await context.newPage();
      autoPage.on("pageerror", (error) => errors.push({ stage: "editor-auto-open", message: error.message }));
      await autoPage.goto(appUrl + trackPath + "?editReview=" + ownReview.id,
        { waitUntil: "domcontentloaded" });
      await autoPage.locator("#review-title").waitFor({ state: "visible" });
      assert.equal(await autoPage.locator("#review-title").inputValue(), originalTitle);
      await autoPage.keyboard.press("Escape");
      await autoPage.locator("#review-title").waitFor({ state: "hidden" });
      results.push({ mobile, authenticated, journey: "editor-query-auto-open",
        originalFields: true });
      await autoPage.close();
    }
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
    const bodyReview = createColdRow(fixture.reviews[0], fixture.reviews, 1);
    await bodyPage.goto(
      appUrl +
        "/reviews/" +
        bodyReview.short_id +
        "/fixture-track-fixture-artist",
      { waitUntil: "domcontentloaded" },
    );
    await bodyPage
      .locator("#review-structured-data")
      .waitFor({ state: "attached" });
    await bodyPage.waitForLoadState("networkidle");
    fixture.state.bodyDelayMs = 0;
    fixture.state.fail = true;
    fixture.state.failTable = "reviews";
    const failedReview = createColdRow(fixture.reviews[0], fixture.reviews, 2);
    const failurePath =
      "/reviews/" + failedReview.short_id + "/fixture-track-fixture-artist";
    const failurePage = await context.newPage();
    let failurePhase = "origin-failure";
    failurePage.on("pageerror", (error) =>
      errors.push({
        stage: failurePhase,
        message: error.message,
        expectedForcedFallback: error.message.startsWith(
          "Minified React error #419;",
        ),
      }),
    );
    const failure = await failurePage.goto(appUrl + failurePath, {
      waitUntil: "domcontentloaded",
    });
    await failurePage.waitForLoadState("networkidle");
    await failurePage
      .getByRole("heading", {
        name: "Reviews are temporarily unavailable",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await failurePage
        .getByText("This page could not be found.", { exact: true })
        .isVisible(),
      false,
    );
    assert.doesNotMatch(await failurePage.title(), /404|could not be found/i);
    await failurePage.waitForLoadState("networkidle");
    failurePhase = "recovery";
    fixture.state.fail = false;
    fixture.state.headerDelayMs = 80;
    await failurePage
      .getByRole("button", { name: "Retry reviews", exact: true })
      .press("Enter");
    await failurePage
      .locator("#review-structured-data")
      .waitFor({ state: "attached" });
    await failurePage
      .getByText(/Fixture review \d+/, { exact: true })
      .first()
      .waitFor();
    await failurePage.waitForLoadState("networkidle");
    results.push({
      mobile,
      authenticated,
      journey: "review-failure-retry",
      http: failure.status(),
      recovered: true,
    });
    for (const probe of [
      {
        kind: "track",
        path: "/tracks/fixture-track-fixture-artist/" + fixture.entity.short_id,
        title: fixture.entity.title,
        status: 403,
        delay: 0,
      },
      {
        kind: "artist",
        path: "/artists/fixture-artist/" + fixture.artist.short_id,
        title: fixture.artist.name,
        status: 503,
        delay: 3500,
      },
      {
        kind: "album",
        path: "/albums/fixture-album-fixture-artist/" + fixture.album.short_id,
        title: fixture.album.title,
        status: 503,
        delay: 0,
      },
    ]) {
      const source =
        probe.kind === "artist"
          ? fixture.artist
          : probe.kind === "album"
            ? fixture.album
            : fixture.entity;
      const target =
        probe.kind === "artist"
          ? fixture.state.extraArtists
          : fixture.state.extraEntities;
      const row = createColdRow(
        source,
        target,
        probe.kind === "track" ? 3 : probe.kind === "artist" ? 4 : 5,
      );
      probe.path = probe.path.replace(source.short_id, row.short_id);
      fixture.state.fail = true;
      fixture.state.failTable =
        probe.kind === "artist" ? "artists" : "entities";
      fixture.state.failureStatus = probe.status;
      fixture.state.headerDelayMs = probe.delay;
      const faultPage = await context.newPage();
      let probePhase = "origin-failure";
      faultPage.on("pageerror", (error) =>
        errors.push({
          stage: probePhase,
          message: error.message,
          expectedForcedFallback: error.message.startsWith(
            "Minified React error #419;",
          ),
        }),
      );
      const response = await faultPage.goto(appUrl + probe.path, {
        waitUntil: "domcontentloaded",
      });
      await faultPage
        .getByRole("heading", {
          name: "This page is temporarily unavailable",
          exact: true,
        })
        .waitFor();
      assert.equal(
        await faultPage
          .getByText("This page could not be found.", { exact: true })
          .isVisible(),
        false,
      );
      assert.doesNotMatch(await faultPage.title(), /404|could not be found/i);
      await faultPage.waitForLoadState("networkidle");
      probePhase = "recovery";
      fixture.state.fail = false;
      fixture.state.headerDelayMs = 80;
      await faultPage
        .getByRole("button", { name: "Retry", exact: true })
        .click();
      await faultPage
        .getByRole("heading", { name: probe.title, exact: true })
        .first()
        .waitFor();
      await faultPage.waitForLoadState("networkidle");
      results.push({
        mobile,
        authenticated,
        journey: probe.kind + "-failure-retry",
        fault: probe.delay ? "timeout" : probe.status,
        http: response.status(),
        recovered: true,
      });
      await faultPage.close();
    }
    if (mobile && !authenticated) {
      const uuidCases = [
        {
          kind: "review",
          row: { ...fixture.reviews[0], title: "Fixture review 90" },
          target: fixture.reviews,
        },
        {
          kind: "track",
          row: { ...fixture.entity },
          target: fixture.state.extraEntities,
        },
        {
          kind: "artist",
          row: { ...fixture.artist },
          target: fixture.state.extraArtists,
        },
        {
          kind: "album",
          row: { ...fixture.album },
          target: fixture.state.extraEntities,
        },
      ];
      for (const [index, probe] of uuidCases.entries()) {
        const prefix = coldPrefix(900 + index);
        probe.row.id = prefix + "-1234-4000-8000-000000000001";
        probe.row.short_id = prefix + "1234";
        probe.target.push(probe.row);
        const path =
          probe.kind === "review"
            ? "/reviews/" + probe.row.id + "/fixture-track-fixture-artist"
            : "/" +
              probe.kind +
              "s/" +
              (probe.kind === "artist"
                ? "fixture-artist"
                : probe.kind === "album"
                  ? "fixture-album-fixture-artist"
                  : "fixture-track-fixture-artist") +
              "/" +
              probe.row.id;
        fixture.state.fail = true;
        fixture.state.failTable =
          probe.kind === "review"
            ? "reviews"
            : probe.kind === "artist"
              ? "artists"
              : "entities";
        fixture.state.failureStatus = 503;
        fixture.state.headerDelayMs = 0;
        const uuidPage = await context.newPage();
        let uuidPhase = "origin-failure";
        uuidPage.on("pageerror", (error) =>
          errors.push({
            stage: uuidPhase,
            message: error.message,
            expectedForcedFallback: error.message.startsWith(
              "Minified React error #419;",
            ),
          }),
        );
        await uuidPage.goto(appUrl + path, { waitUntil: "domcontentloaded" });
        await uuidPage
          .getByRole("heading", {
            name:
              probe.kind === "review"
                ? "Reviews are temporarily unavailable"
                : "This page is temporarily unavailable",
            exact: true,
          })
          .waitFor();
        assert.equal(
          await uuidPage
            .getByText("This page could not be found.", { exact: true })
            .isVisible(),
          false,
        );
        await uuidPage.waitForLoadState("networkidle");
        uuidPhase = "recovery";
        fixture.state.fail = false;
        fixture.state.headerDelayMs = 80;
        await uuidPage
          .getByRole("button", {
            name: probe.kind === "review" ? "Retry reviews" : "Retry",
            exact: true,
          })
          .click();
        if (probe.kind === "review")
          await uuidPage
            .locator("#review-structured-data")
            .waitFor({ state: "attached" });
        else
          await uuidPage
            .getByRole("heading", {
              name: probe.row.name || probe.row.title,
              exact: true,
            })
            .first()
            .waitFor();
        await uuidPage.waitForLoadState("networkidle");
        results.push({
          mobile,
          authenticated,
          journey: probe.kind + "-uuid-failed-fill-retry",
          recovered: true,
        });
        await uuidPage.close();
        assert.equal(probe.target.pop(), probe.row);
      }
    }
    fixture.state.failureStatus = 503;
    for (const path of [
      "/reviews/ffffffffffff/missing",
      "/tracks/missing/ffffffffffff",
      "/artists/missing/ffffffffffff",
      "/albums/missing/ffffffffffff",
      "/reviews/invalid/missing",
    ]) {
      const absentPage = await context.newPage();
      const absentResponse = await absentPage.goto(appUrl + path, {
        waitUntil: "domcontentloaded",
      });
      if (path.includes("/invalid/")) {
        assert.equal(absentResponse.status(), 404);
      } else {
        await absentPage
          .getByText("This page could not be found.", { exact: true })
          .waitFor({ timeout: 5000 });
      }
      assert.equal(
        await absentPage.getByRole("button", { name: /^Retry/ }).count(),
        0,
      );
      await absentPage.close();
      results.push({ mobile, authenticated, journey: "genuine-missing", path });
    }
    fixture.state.identityMode = "ambiguous";
    const ambiguousPage = await context.newPage();
    await ambiguousPage.goto(
      appUrl + "/tracks/ambiguous/" + fixture.entity.short_id.slice(0, 8),
      { waitUntil: "domcontentloaded" },
    );
    await ambiguousPage
      .getByText("This page could not be found.", { exact: true })
      .waitFor();
    await ambiguousPage.close();
    fixture.state.identityMode = "normal";
    results.push({
      mobile,
      authenticated,
      journey: "ambiguous-legacy-prefix",
      missing: true,
    });
    await waitFor(
      () =>
        fixture.state.transactions.filter((t) => t.platform === "javascript")
          .length > browserEventsBefore,
      "Browser transaction did not reach isolated collector",
    );
    context.off("request", captureRequest);
    const failureErrors = errors.filter(
      (error) => error.expectedForcedFallback,
    );
    assert.deepEqual(
      errors.filter((error) => !error.expectedForcedFallback),
      [],
    );
    results.push({
      mobile,
      authenticated,
      journey: "trace-verification",
      failureRenderErrors: failureErrors,
    });
    assert.equal(
      (await context.cookies()).some((cookie) =>
        cookie.name.includes("auth-token"),
      ),
      authenticated,
    );
    assert.equal(fixture.state.viewerReads > viewerReadsBefore, authenticated);
    assert.equal(fixture.state.publicIdentityAuthViolations, 0);
    await context.close();
    for (const { target, row } of syntheticRows)
      target.splice(target.indexOf(row), 1);
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
      "Small deterministic fixture with simulated auth service; content visibility timings, not production P95/LCP, production authentication/RLS coverage or capacity. Background attribution remains unknown.",
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
  const pageStates = [];
  for (const context of browser?.contexts() ?? []) {
    for (const page of context.pages()) {
      try {
        pageStates.push({
          url: page.url(),
          title: await page.title(),
          text: (await page.locator("body").innerText({ timeout: 2000 })).slice(
            0,
            2000,
          ),
        });
      } catch {}
    }
  }
  await writeFile(
    join(evidence, "partial.json"),
    JSON.stringify(
      {
        results,
        pageStates,
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
