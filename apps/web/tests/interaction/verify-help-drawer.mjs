import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(process.env.KOCTEAU_PLAYWRIGHT_MODULE || "playwright");
const origin = new URL(process.env.HELP_DRAWER_BASE_URL || "http://localhost:3000").origin;
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const output = process.env.HELP_DRAWER_REPORT_DIR || join(repositoryRoot, ".plan/local/drawer-audit/pilot");
const results = [];
await mkdir(output, { recursive: true });

async function settled(page) {
  await page.waitForFunction(() => {
    const popup = document.querySelector('[role="dialog"]');
    if (!popup || popup.hasAttribute("data-starting-style")) return false;
    return Math.abs(new DOMMatrix(getComputedStyle(popup).transform).m42) < 0.1;
  });
}

async function closed(page) {
  await page.getByRole("dialog", { includeHidden: true }).waitFor({ state: "detached" });
}

async function focusInside(page) {
  await page.waitForFunction(() => !!document.activeElement?.closest('[role="dialog"]'));
}

async function documentCanvas(page) {
  return page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
    theme: document.querySelector('meta[name="theme-color"]')?.content,
  }));
}

for (const [engine, browserType] of [["chromium", chromium], ["webkit", webkit]]) {
  const browser = await browserType.launch({
    headless: true,
    ...(engine === "chromium" && process.env.KOCTEAU_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.KOCTEAU_CHROMIUM_EXECUTABLE } : {}),
  });
  try {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
    await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const popup = page.getByRole("dialog", { name: "Help", exact: true });
    const trigger = page.getByRole("button", { name: "Open help menu", exact: true });
    await page.goto(origin + "/help/terms", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const canvas = await documentCanvas(page);
    assert.equal(canvas.theme, "#040404");

    await trigger.focus();
    await page.keyboard.press("Enter");
    await settled(page);
    await focusInside(page);
    assert.equal(await popup.getByRole("link").count(), 5);
    assert.equal(await popup.locator('a[aria-current="page"]').count(), 1);
    for (let index = 0; index < 11; index++) {
      await page.keyboard.press("Tab");
      await focusInside(page);
    }
    await page.keyboard.press("Escape");
    await closed(page);
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
    results.push({ engine, check: "keyboard, link semantics, focus trap and restore", status: "passed" });

    await trigger.tap();
    await settled(page);
    assert.deepEqual(await documentCanvas(page), canvas);
    await page.screenshot({ path: join(output, engine + "-open.png") });
    const geometry = await popup.boundingBox();
    assert.ok(Math.abs(geometry.width - 393) < 1);
    assert.ok(Math.abs(geometry.y + geometry.height - 852) < 1);
    const labels = await popup.evaluate(element => ["aria-labelledby", "aria-describedby"].map(attribute => document.getElementById(element.getAttribute(attribute))?.textContent));
    assert.deepEqual(labels, ["Help", "Kocteau notes and policies."]);
    if (process.env.HELP_DRAWER_AXE_PATH) {
      await page.addScriptTag({ path: process.env.HELP_DRAWER_AXE_PATH });
      const audit = await page.evaluate(() => window.axe.run({ include: [['[role="dialog"]']] }));
      results.push({ engine, check: "axe", violations: audit.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })) });
      assert.equal(audit.violations.filter(item => item.impact === "critical").length, 0);
    }
    await page.mouse.click(12, 120);
    await closed(page);
    results.push({ engine, check: "geometry, accessible name/description, outside dismissal", geometry, status: "passed" });

    for (let index = 0; index < 3; index++) {
      await trigger.click();
      await popup.waitFor();
      await page.waitForTimeout(80); // Deliberately interrupt the existing 500ms entrance.
      const before = await popup.boundingBox();
      await page.keyboard.press("Escape");
      const after = await popup.evaluate(element => new Promise(resolveFrame => requestAnimationFrame(() => resolveFrame(element.getBoundingClientRect().y))));
      assert.ok(after >= before.y - 30, "closing must not reset to an unrelated opening frame");
      await page.waitForTimeout(80); // Reopen before the exit can finish.
      const box = await trigger.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await settled(page);
      await page.keyboard.press("Escape");
      await closed(page);
    }
    results.push({ engine, check: "three interrupted open/close/reopen cycles", status: "passed" });

    await page.evaluate(() => scrollTo(0, 600));
    const previousScroll = await page.evaluate(() => scrollY);
    await trigger.tap();
    await settled(page);
    const lockedScroll = await page.evaluate(() => scrollY);
    await page.mouse.move(10, 120);
    if (engine === "webkit") {
      // Playwright does not support wheel input in mobile WebKit.
      await page.keyboard.press("PageDown");
    } else {
      await page.mouse.wheel(0, 300);
    }
    await page.waitForTimeout(60);
    assert.equal(await page.evaluate(() => scrollY), lockedScroll);
    const coverage = await page.locator('[data-slot="drawer-overlay"]').boundingBox();
    assert.ok(coverage.y <= 0 && coverage.y + coverage.height >= 852);
    await page.keyboard.press("Escape");
    await closed(page);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - previousScroll) < 2);
    assert.deepEqual(await documentCanvas(page), canvas);
    results.push({ engine, check: "scrolled-page backdrop coverage, scroll lock and restore", input: engine === "webkit" ? "PageDown" : "wheel", status: "passed" });

    await trigger.tap();
    await settled(page);
    const resting = await popup.boundingBox();
    const handle = await popup.locator('[data-slot="drawer-base-handle"]').boundingBox();
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 40, { steps: 8 });
    const dragged = await popup.boundingBox();
    assert.ok(dragged.y > resting.y + 15, "popup must follow the pointer");
    await page.mouse.move(x, y + 10, { steps: 8 });
    await page.waitForTimeout(250);
    await page.mouse.up();
    await settled(page);
    assert.ok(Math.abs((await popup.boundingBox()).y - resting.y) < 1);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 230, { steps: 12 });
    await page.mouse.up();
    await closed(page);
    results.push({ engine, check: "pointer drag tracks, cancels and dismisses", status: "passed" });

    if (engine === "chromium") {
      await trigger.tap();
      await settled(page);
      const touchHandle = await popup.locator('[data-slot="drawer-base-handle"]').boundingBox();
      const session = await context.newCDPSession(page);
      const point = { x: touchHandle.x + touchHandle.width / 2, y: touchHandle.y + touchHandle.height / 2 };
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      for (const delta of [10, 20, 35, 45]) {
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...point, y: point.y + delta }] });
        await page.waitForTimeout(20);
      }
      assert.ok((await popup.boundingBox()).y > resting.y + 15);
      await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
      await settled(page);
      await page.keyboard.press("Escape");
      await closed(page);
      await session.detach();
      results.push({ engine, check: "touch drag and touch cancellation", status: "passed" });
    }

    await page.setViewportSize({ width: 393, height: 430 });
    await trigger.tap();
    await settled(page);
    const overflow = await popup.evaluate(element => {
      const scrollArea = [...element.querySelectorAll("div")].find(candidate =>
        getComputedStyle(candidate).overflowY === "auto" && candidate.scrollHeight > candidate.clientHeight,
      );
      if (!scrollArea) return null;
      const bounds = scrollArea.getBoundingClientRect();
      return { maximum: scrollArea.scrollHeight - scrollArea.clientHeight, overflow: getComputedStyle(scrollArea).overflowY, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height * 0.8 };
    });
    assert.ok(overflow, "short viewports must provide a scrollable content region");
    assert.ok(overflow.maximum > 0);
    assert.equal(overflow.overflow, "auto");
    if (engine === "chromium") {
      const session = await context.newCDPSession(page);
      const resting = await popup.boundingBox();
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: overflow.x, y: overflow.y }] });
      for (const delta of [15, 30, 50, 70]) {
        await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: overflow.x, y: overflow.y - delta }] });
        await page.waitForTimeout(30);
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      assert.ok(await popup.evaluate(element => [...element.querySelectorAll("div")].some(candidate => candidate.scrollTop > 0)), "touch must scroll the content");
      assert.ok(Math.abs((await popup.boundingBox()).y - resting.y) < 1, "scrolling content must not drag the popup");
      await session.detach();
      results.push({ engine, check: "touch scrolling stays inside short-viewport content", status: "passed" });
    }
    await popup.evaluate(element => {
      for (const candidate of element.querySelectorAll("div")) {
        if (getComputedStyle(candidate).overflowY === "auto") candidate.scrollTop = candidate.scrollHeight;
      }
    });
    const last = await popup.getByRole("link").last().boundingBox();
    assert.ok(last.y >= 0 && last.y + last.height <= 430);
    await popup.getByRole("link").last().click();
    await page.waitForURL("**/help/changelog");
    await closed(page);
    results.push({ engine, check: "short viewport scroll and link navigation closes the drawer", status: "passed" });

    await page.setViewportSize({ width: 900, height: 1000 });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await settled(page);
    await focusInside(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await closed(page);
    assert.equal(await trigger.isVisible(), false);
    assert.equal(await page.evaluate(() => !!document.querySelector('[aria-modal="true"]')), false);
    await page.setViewportSize({ width: 393, height: 852 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await trigger.tap();
    await settled(page);
    assert.equal(await popup.evaluate(element => getComputedStyle(element).transitionDuration), "0s");
    await page.keyboard.press("Escape");
    await closed(page);
    results.push({ engine, check: "desktop breakpoint cleanup and reduced motion", status: "passed" });
    await context.close();
  } finally {
    await browser.close();
    await writeFile(join(output, "report.json"), JSON.stringify({ origin, results, physicalIOS: "not verified", voiceOver: "not verified" }, null, 2));
  }
}
console.log(JSON.stringify(results, null, 2));
