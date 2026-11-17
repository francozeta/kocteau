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
import {
  assertHomeBuildIsolation,
  prepareHomeBuildFailure,
  verifyHomeRuntimeRecovery,
} from "./fixtures/home-build-recovery.mjs";

const reviewContent = (page) => page.locator(
  '[data-kocteau-route-page="' + new URL(page.url()).pathname + '"] section:has(> #review-structured-data):visible',
);

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
const browserName = process.env.JOURNEY_BROWSER || "webkit";
assert.ok(["webkit", "chromium"].includes(browserName));
const browserType = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
)[browserName];
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
prepareHomeBuildFailure(fixture);
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
    delay(480000, undefined, { ref: false }).then(() => {
      throw new Error("Isolated build deadline exceeded");
    }),
  ]);
  await writeFile(join(evidence, "build.log"), buildOutput);
  assert.equal(built[0], 0, buildOutput.slice(-5000));
  const prerender = JSON.parse(
    await readFile(join(webRoot, ".next/prerender-manifest.json"), "utf8"),
  );
  assertHomeBuildIsolation(fixture, prerender);
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
  results.push(...await verifyHomeRuntimeRecovery(fixture, appUrl));

  // Regression #242: a temporary public profile read failure must not be
  // cached as an absent account, and the same username must recover.
  // Use a valid public username: the original fixture-listener contains a
  // hyphen, which the public proxy deliberately rejects before data reads.
  const recoveryUsername = "fixturelistener";
  fixture.state.extraProfiles.push({ ...fixture.profile, username: recoveryUsername });
  fixture.state.fail = true;
  fixture.state.failTable = "profiles";
  fixture.state.headerDelayMs = 80;
  try {
    const unavailable = await fetch(appUrl + `/u/${recoveryUsername}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    const failedHtml = await unavailable.text();
    assert.notEqual(unavailable.status, 404,
      "A temporary profile Data API failure must not become a false 404");
    // RSC streaming can serialize an unrelated not-found phrase inside script
    // payloads. Inspect the server-rendered document, not transport scripts.
    const visibleFailedHtml = failedHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    assert.ok(visibleFailedHtml.includes("Profile temporarily unavailable"),
      "Transient profile errors should expose a recoverable visible state");
    results.push({ journey: "public-profile-origin-failure", status: unavailable.status, false404: false });
  } finally {
    fixture.state.fail = false;
    fixture.state.failTable = null;
    fixture.state.headerDelayMs = 80;
  }
  const profileRecovery = await fetch(appUrl + `/u/${recoveryUsername}`, {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(profileRecovery.status, 200,
    "The same public profile must load immediately after the origin recovers");
  assert.ok((await profileRecovery.text()).includes("Fixture listener"));
  const trulyMissing = await fetch(appUrl + "/u/missinglistener", {
    signal: AbortSignal.timeout(15000),
  });
  const missingHtml = await trulyMissing.text();
  // Streaming App Router pages can commit HTTP 200 before notFound() is
  // resolved. Verify the actual missing-page document, not only its status.
  const visibleMissingHtml = missingHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  assert.ok([200, 404].includes(trulyMissing.status),
    "A missing public profile must not become an origin error");
  assert.ok(!visibleMissingHtml.includes('id="profile-structured-data"'),
    "Missing profiles must not emit a profile's structured data");
  results.push({ journey: "public-profile-recovery", status: 200, missingStatus: trulyMissing.status });
  fixture.state.extraProfiles.length = 0;

  browser = await browserType.launch();
  // The streamed 200 response may contain only the shell in initial HTML.
  // Verify the actual hydrated not-found UI rather than requiring its copy
  // in the raw server response, which Next.js does not guarantee.
  const missingBrowserPage = await browser.newPage();
  try {
    await missingBrowserPage.goto(appUrl + "/u/missinglistener", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await missingBrowserPage.getByText("This page could not be found.", {
      exact: false,
    }).waitFor({ timeout: 10000 });
    assert.ok(
      !(await missingBrowserPage.locator("body").innerText()).includes("Fixture listener"),
      "Missing profiles must not render the fixture listener content",
    );
  } finally {
    await missingBrowserPage.close();
  }
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
    if (!mobile && !authenticated) {
      for (const [index, [root, source, label, oldPath]] of [
        ["tracks", fixture.entity, "fixture-track-fixture-artist", (id) => `/tracks/stale-title/${id}`],
        ["albums", fixture.album, "fixture-album-fixture-artist", (id) => `/albums/stale-title/${id}`],
        ["artists", fixture.artist, "fixture-artist", (id) => `/artists/stale-title/${id}`],
        ["reviews", fixture.reviews[0], "fixture-track-fixture-artist", (id) => `/reviews/${id}/stale-title`],
      ].entries()) {
        // Identity caches survive builds; migration probes must not reuse a
        // deliberately ambiguous or absent identity from an earlier fixture run.
        const target = root === "reviews" ? fixture.reviews
          : root === "artists" ? fixture.state.extraArtists : fixture.state.extraEntities;
        const row = createColdRow(source, target, 3000 + index);
        const canonical = `/${root}/${label}-${row.short_id}`;
        for (const id of [row.short_id, row.id, row.short_id.slice(0, 8)]) {
          const legacy = await context.request.get(appUrl + oldPath(id) + "?editReview=fixture&reviewsAfter=cursor", { maxRedirects: 0 });
          assert.equal(legacy.status(), 308, oldPath(id));
          const target = new URL(legacy.headers().location, appUrl);
          assert.equal(target.origin, new URL(appUrl).origin);
          assert.equal(target.pathname, canonical);
          assert.equal(target.searchParams.get("editReview"), "fixture");
          assert.equal(target.searchParams.get("reviewsAfter"), "cursor");
        }
        const stale = await context.request.get(appUrl + `/${root}/outdated-label-${row.short_id}`, { maxRedirects: 0 });
        if (stale.status() === 308) {
          assert.equal(new URL(stale.headers().location, appUrl).pathname, canonical);
        } else {
          assert.equal(stale.status(), 200);
          const html = await stale.text();
          assert.ok(html.includes("NEXT_REDIRECT;replace;" + canonical + ";308;"));
        }
        const current = await context.request.get(appUrl + canonical);
        assert.equal(current.status(), 200);
        const html = await current.text();
        assert.ok(html.includes(`rel="canonical" href="https://kocteau.com${canonical}"`),
          `Production metadata must retain the canonical host and current path: ${canonical}`);
        if (root === "reviews") {
          const documentHtml = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
          assert.ok(new RegExp(`<a\\b[^>]*href="/tracks/fixture-track-fixture-artist-${fixture.entity.short_id}"`).test(documentHtml),
            "Existing review card must link to canonical music in server HTML");
          assert.ok(/<a\b[^>]*href="\/u\/fixture-listener"/.test(documentHtml),
            "Existing review card must link to its public author in server HTML");
        }
        results.push({ journey: "canonical-url-migration", root, aliases: 3, redirect: 308, canonical });
      }
      const sitemap = await context.request.get(appUrl + "/sitemap.xml");
      assert.equal(sitemap.status(), 200);
      const xml = await sitemap.text();
      assert.ok(xml.includes(`/tracks/fixture-track-fixture-artist-${fixture.entity.short_id}`));
      assert.ok(!/\/(?:tracks|albums|artists)\/[^<]+\/[0-9a-f]{12}</.test(xml));
      assert.ok(!/<loc>[^<]*\/track<\/loc>/.test(xml), "Retired track index must not appear in sitemap");
      assert.ok(xml.includes("<loc>https://kocteau.com/</loc>"), "Sitemap must advertise the public root");
      assert.ok(!xml.includes("<loc>https://kocteau.com/home</loc>"), "The alias /home must not be a second sitemap entry");
      const retired = await context.request.get(appUrl + "/track", { maxRedirects: 0 });
      assert.equal(retired.status(), 308);
      assert.equal(new URL(retired.headers().location, appUrl).pathname, "/reviews");
      const llms = await context.request.get(appUrl + "/llms.txt");
      assert.equal(llms.status(), 200);
      const manifest = await llms.text();
      assert.ok(!manifest.includes("/track —"));
      assert.ok(manifest.includes("/tracks/{slug}-{id}"));
      results.push({ journey: "public-discovery-seo", retiredIndex: 308, target: "/reviews", existingServerLinks: true });
    }
    if (authenticated && mobile) {
      // An Auth 504 is not an anonymous session. The root must remain
      // private, recoverable and uncached, then load the real Feed again
      // without replacing or deleting the browser's session cookies.
      fixture.state.authFailure = true;
      try {
        const unavailable = await context.request.get(appUrl + "/", {
          maxRedirects: 0,
          timeout: 15000,
        });
        assert.equal(unavailable.status(), 503,
          "Temporary Auth outage must return 503, not marketing landing");
        assert.match(unavailable.headers()["cache-control"] ?? "", /no-store/);
        assert.match(unavailable.headers()["x-robots-tag"] ?? "", /noindex/);
        assert.equal(unavailable.headers().location, undefined);
        assert.equal(unavailable.headers()["set-cookie"], undefined,
          "Auth outage must not clear or overwrite existing browser cookies");
        const unavailableHtml = await unavailable.text();
        assert.ok(unavailableHtml.includes("Kocteau is temporarily unavailable"));
        assert.ok(!unavailableHtml.includes('data-kocteau-document-canvas="landing"'));
        results.push({ journey: "authenticated-auth-504", status: 503, mobile: true });
      } finally {
        fixture.state.authFailure = false;
      }
    }
    const rootResponse = await context.request.get(appUrl + "/", { maxRedirects: 0 });
    assert.equal(rootResponse.status(), 200, "The root must not redirect for either session state");
    const rootHtml = await rootResponse.text();
    if (authenticated) {
      assert.match(rootHtml, /<meta[^>]+name="robots"[^>]+content="noindex/);
      assert.ok(!rootHtml.includes('data-kocteau-document-canvas="landing"'),
        "Authenticated root must be the private Feed, not cached marketing HTML");
      assert.match(rootResponse.headers()["cache-control"] ?? "", /private|no-store/);
    } else {
      const canonical = rootHtml.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
      assert.ok(canonical, "Guest root must emit a canonical link");
      assert.equal(new URL(canonical).origin, "https://kocteau.com");
    assert.equal(new URL(canonical).pathname, "/");
      assert.ok(rootHtml.includes('data-kocteau-document-canvas="landing"'),
        "Anonymous root must render the existing public landing");
    }
    results.push({ journey: "root-audience-split", mobile, authenticated, status: 200 });
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
    if (authenticated) {
      // The initial route should not need a comment composer. Request it
      // only now, after measuring initial JS, and verify both responsive
      // overlays still work with synthetic authenticated data.
      const commentsTrigger = page.getByRole("button", { name: "Open comments" }).first();
      await commentsTrigger.click();
      const commentsOverlay = page
        .locator('[data-slot="drawer-content"], [data-slot="sheet-content"]')
        .first();
      await commentsOverlay.waitFor({ state: "visible", timeout: 20_000 });
      assert.ok(
        await commentsOverlay.getByText("Comments", { exact: true }).count(),
        "Lazy comments overlay must show the comment heading",
      );
      const afterOpen = await scriptSnapshot(page);
      assert.ok(
        afterOpen.count > listScripts.count,
        "Opening comments should load a deferred JavaScript chunk",
      );
      await page.keyboard.press("Escape");
      await commentsOverlay.waitFor({ state: "hidden" });
      results.push({
        mobile, authenticated, journey: "comments-overlay-lazy",
        scriptCountBefore: listScripts.count,
        scriptCountAfter: afterOpen.count,
        addedDecodedBytes: afterOpen.decodedBytes - listScripts.decodedBytes,
      });
    }
    const reviewPath = await reviewLink.getAttribute("href");
    started = performance.now();
    await reviewLink.click({ noWaitAfter: true });
    await page.waitForURL(
      (url) => url.pathname === new URL(reviewPath, appUrl).pathname,
      { waitUntil: "commit" },
    );
    await reviewContent(page)
      .waitFor({ state: "attached" });
    await reviewContent(page)
      .getByText(/Fixture review \d+/, { exact: true })
      .first()
      .waitFor();
    await page.waitForFunction(() => document.querySelectorAll("#review-structured-data").length === 1);
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
    await reviewContent(page)
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
        "/reviews/fixture-track-fixture-artist-" + bodyReview.short_id,
      { waitUntil: "domcontentloaded" },
    );
    await reviewContent(bodyPage)
      .waitFor({ state: "attached" });
    await bodyPage.waitForLoadState("networkidle");
    fixture.state.bodyDelayMs = 0;
    fixture.state.fail = true;
    fixture.state.failTable = "reviews";
    const failedReview = createColdRow(fixture.reviews[0], fixture.reviews, 2);
    const failurePath =
      "/reviews/fixture-track-fixture-artist-" + failedReview.short_id;
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
    await reviewContent(failurePage)
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
        path: "/tracks/fixture-track-fixture-artist-" + fixture.entity.short_id,
        title: fixture.entity.title,
        status: 403,
        delay: 0,
      },
      {
        kind: "artist",
        path: "/artists/fixture-artist-" + fixture.artist.short_id,
        title: fixture.artist.name,
        status: 503,
        delay: 3500,
      },
      {
        kind: "album",
        path: "/albums/fixture-album-fixture-artist-" + fixture.album.short_id,
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
        const unavailable = await context.request.get(appUrl + path, { maxRedirects: 0 });
        assert.equal(unavailable.status(), 503);
        assert.equal(unavailable.headers()["cache-control"], "no-store");
        assert.ok((await unavailable.text()).includes("Reload to retry"));
        fixture.state.fail = false;
        fixture.state.headerDelayMs = 80;
        const recovered = await context.request.get(appUrl + path, { maxRedirects: 0 });
        assert.equal(recovered.status(), 308);
        const uuidPage = await context.newPage();
        await uuidPage.goto(new URL(recovered.headers().location, appUrl).href, { waitUntil: "domcontentloaded" });
        if (probe.kind === "review")
          await reviewContent(uuidPage).waitFor({ state: "attached" });
        else
          await uuidPage.getByRole("heading", { name: probe.row.name || probe.row.title, exact: true }).first().waitFor();
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
      "/reviews/missing-ffffffffffff",
      "/tracks/missing-ffffffffffff",
      "/artists/missing-ffffffffffff",
      "/albums/missing-ffffffffffff",
      "/reviews/invalid-missing",
    ]) {
      const absentPage = await context.newPage();
      const absentResponse = await absentPage.goto(appUrl + path, {
        waitUntil: "domcontentloaded",
      });
      if (path.includes("/invalid-")) {
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
    const ambiguousRow = createColdRow(fixture.entity, fixture.state.extraEntities, 9000);
    const ambiguousResponse = await context.request.get(
      appUrl + "/tracks/ambiguous/" + ambiguousRow.short_id.slice(0, 8),
      { maxRedirects: 0 },
    );
    assert.equal(ambiguousResponse.status(), 404);
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
