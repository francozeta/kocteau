import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const { webkit } = require(
  process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright",
);
const base = "http://127.0.0.1:3000";
const fixture = JSON.parse(
  readFileSync(
    resolve(
      import.meta.dirname,
      "../../../../.codex-private/feed/fixture.json",
    ),
    "utf8",
  ),
);
const browser = await webkit.launch();
const results = [];
try {
  for (const mobile of [true, false]) {
    for (const [user, account] of fixture.accounts.entries()) {
      const context = await browser.newContext({
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1280, height: 900 },
        isMobile: mobile,
        hasTouch: mobile,
        reducedMotion: "reduce",
      });
      await context.addCookies(
        account.cookie.split("; ").map((pair) => {
          const separator = pair.indexOf("=");
          return {
            name: pair.slice(0, separator),
            value: pair.slice(separator + 1),
            url: base,
          };
        }),
      );
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        return url.hostname === "127.0.0.1" || url.protocol === "about:"
          ? route.continue()
          : route.fulfill({ status: 204 });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base + "/feed", {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      const cards = page.locator(".kocteau-review-card-list-item");
      await cards.first().waitFor();
      const firstCount = await cards.count();
      assert.equal(firstCount, 8);
      assert.equal(
        await page
          .getByRole("button", { name: "Unlike this review", exact: true })
          .count(),
        user === 0 ? 1 : 0,
      );
      assert.equal(
        await page
          .getByRole("button", {
            name: "Remove from saved reviews",
            exact: true,
          })
          .count(),
        user === 0 ? 1 : 0,
      );

      if (mobile && user === 1) {
        const card = cards.first();
        for (const [path, before, after] of [
          ["like", "Like this review", "Unlike this review"],
          ["bookmark", "Save this review", "Remove from saved reviews"],
        ]) {
          const matches = (response) =>
            new URL(response.url()).pathname.endsWith("/" + path) &&
            response.request().method() === "POST";
          let response = page.waitForResponse(matches);
          await card.getByRole("button", { name: before, exact: true }).click();
          assert.equal((await response).status(), 200);
          await card
            .getByRole("button", { name: after, exact: true })
            .waitFor();
          response = page.waitForResponse(matches);
          await card.getByRole("button", { name: after, exact: true }).click();
          assert.equal((await response).status(), 200);
          await card
            .getByRole("button", { name: before, exact: true })
            .waitFor();
        }
      }

      await cards.last().scrollIntoViewIfNeeded();
      await page.waitForFunction(
        (count) =>
          document.querySelectorAll(".kocteau-review-card-list-item").length >
          count,
        firstCount,
      );
      const paginatedCount = await cards.count();
      assert.ok(paginatedCount > firstCount);
      await page.getByRole("link", { name: "Following", exact: true }).click();
      await page
        .getByText("No following reviews yet", { exact: true })
        .waitFor();
      await page.getByRole("link", { name: "Trending", exact: true }).click();
      await cards.first().waitFor();
      await page.getByRole("link", { name: "For You", exact: true }).click();
      await cards.first().waitFor();
      assert.ok((await cards.count()) >= firstCount);
      assert.deepEqual(errors, []);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      results.push({
        mobile,
        user,
        initialReviews: firstCount,
        paginatedReviews: paginatedCount,
        pageErrors: errors.length,
        viewNavigation: true,
        mutationRoundTrip: mobile && user === 1,
      });
      await context.close();
    }
  }
  console.log(
    JSON.stringify({ engine: "WebKit", localSessions: true, results }, null, 2),
  );
} finally {
  await browser.close();
}
