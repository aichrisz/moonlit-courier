/* Parent-owned acceptance: only native input and detached DOM output. No game-state hooks. */
"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const ROOT = process.env.COURIER_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(ROOT + "/node_modules/@playwright/test");
const mode = process.argv[2] || "source",
  touch = process.env.COURIER_TOUCH === "1";
const url =
  process.env.COURIER_URL ||
  require("node:url").pathToFileURL(
    path.join(
      ROOT,
      mode === "offline"
        ? "artifacts/Moonlit-Courier.html"
        : mode === "dist"
          ? "dist/index.html"
          : "index.html",
    ),
  ).href;
const OUT = path.join(
  ROOT,
  "artifacts/parent",
  mode + (touch ? "-touch" : "-desktop"),
);
fs.mkdirSync(OUT, { recursive: true });
const keyboard = {
  left: "ArrowLeft",
  right: "ArrowRight",
  jumpPressed: "Space",
  dashPressed: "Shift",
};
async function observation(page) {
  return page.locator("#world").evaluate((el) => ({ ...el.dataset }));
}
async function geometry(page) {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    boxes: [
      "#world",
      "[data-input=left]",
      "[data-input=right]",
      "[data-input=jump]",
      "[data-input=dash]",
    ].map((sel) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return {
        sel,
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        right: r.right,
        bottom: r.bottom,
      };
    }),
  }));
  assert.equal(result.overflow, false);
  for (const b of result.boxes)
    assert(
      b.x >= -1 &&
        b.y >= -1 &&
        b.right <= result.width + 1 &&
        b.bottom <= result.height + 1 &&
        b.w > 0 &&
        b.h > 0,
      JSON.stringify(b),
    );
  return result;
}
async function audit(page) {
  await page.evaluate(() => {
    const pending = new Set(),
      a = { ticks: 0, max: 0 };
    window.__parentLoop = a;
    const request = requestAnimationFrame.bind(window),
      cancel = cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => {
      let id;
      id = request((t) => {
        pending.delete(id);
        a.ticks++;
        cb(t);
      });
      pending.add(id);
      a.max = Math.max(a.max, pending.size);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      return cancel(id);
    };
  });
}
async function advance(page, ms) {
  await page.clock.runFor(ms);
}
async function click(page, id) {
  assert(await page.locator(id).isVisible(), id + " visible");
  assert(await page.locator(id).isEnabled(), id + " enabled");
  await page.locator(id).click();
}
async function main() {
  const browser = await chromium.launch({
    executablePath: "/root/.hermes/tools/chromium-1208/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      viewport: touch
        ? { width: 390, height: 844 }
        : { width: 1366, height: 768 },
      deviceScaleFactor: 2,
      hasTouch: touch,
      isMobile: touch,
    });
    if (mode === "offline") await context.setOffline(true);
    const page = await context.newPage(),
      errors = [],
      requests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (r) => errors.push("request failed " + r.url()));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push("HTTP " + r.status() + " " + r.url());
    });
    page.on("request", (r) => requests.push(r.url()));
    await page.clock.install({ time: new Date("2026-10-22T00:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-22T00:00:00.050Z"));
    await page.goto(url);
    await audit(page);
    // The theme paints :root; body intentionally contributes a transparent gradient.
    assert.equal(
      await page.locator("html").evaluate(el=>getComputedStyle(el).backgroundColor),
      'rgb(12, 20, 35)',
      "actual source/export theme CSS must load",
    );
    assert.equal(await page.locator("#sound").isChecked(), false);
    await click(page, "#start");
    await advance(page, 64);
    await page.locator("#world").focus();
    await page.locator("#world").scrollIntoViewIfNeeded();
    const layout = await geometry(page);
    const start = await observation(page);
    assert.equal(start.phase, "playing");
    const touchSession = touch ? await context.newCDPSession(page) : null;
    const point = async (name, id) => {
      const box = await page.locator(`[data-input=${name}]`).boundingBox();
      assert(box && box.width >= 44 && box.height >= 44, 'usable native touch target');
      return {x: box.x + box.width/2, y: box.y + box.height/2, id};
    };
    const touches = async (points) => touchSession.send('Input.dispatchTouchEvent', {
      type: points.length ? 'touchStart' : 'touchEnd', touchPoints: points
    });
    if(touch) await touches([await point('right',1)]);
    else await page.keyboard.down("ArrowRight");
    await advance(page, 200);
    if(touch) await touches([]); else await page.keyboard.up("ArrowRight");
    const moved = await observation(page);
    assert(
      Number(moved.playerX) > Number(start.playerX),
      "actual right input must move courier",
    );
    // Real two-finger movement+jump in touch emulation, not merely a narrow viewport.
    if(touch) await touches([await point('right',1),await point('jump',2)]);
    else await page.keyboard.down("Space");
    await advance(page, 100);
    if(touch) await touches([]); else await page.keyboard.up("Space");
    const jumped = await observation(page);
    assert(
      Number(jumped.playerY) < Number(moved.playerY),
      "actual jump must rise above floor",
    );
    if(touch) {
      assert(Number(jumped.playerX)>Number(moved.playerX),'two-finger movement+jump coexist');
      await touches([await point('dash',1)]);
    } else await page.keyboard.down("Shift");
    await advance(page, 80);
    if(touch) await touches([]); else await page.keyboard.up("Shift");
    const dash = await page.locator("#dash-status").textContent();
    assert(dash && dash.trim().length > 0);
    await page.keyboard.press("Escape");
    await advance(page, 32);
    assert.equal((await observation(page)).phase, "paused");
    const before = await observation(page),
      time = await page.locator("#elapsed").textContent();
    await advance(page, 1000);
    assert.equal(await page.locator("#elapsed").textContent(), time);
    assert.equal((await observation(page)).playerX, before.playerX);
    await page.screenshot({ path: path.join(OUT, "paused.png") });
    await click(page, "#resume");
    await advance(page, 32);
    assert.equal((await observation(page)).phase, "playing");
    await page.keyboard.down("ArrowRight");
    await advance(page, 64);
    await page.evaluate(() => dispatchEvent(new Event("blur")));
    await page.keyboard.up("ArrowRight");
    await advance(page, 32);
    assert.equal((await observation(page)).phase, "paused");
    await click(page, "#resume");
    await advance(page, 200);
    const stopped = await observation(page);
    await advance(page, 300);
    assert(
      Math.abs(
        Number((await observation(page)).playerX) - Number(stopped.playerX),
      ) < 15,
      "blur releases held movement",
    );
    await page.locator("#world").focus();
    await page.keyboard.press("r");
    await advance(page, 32);
    const restart = await observation(page);
    assert(
      Number(restart.playerX) <= Number(start.playerX) + 5,
      "restart restores level spawn",
    );
    await page.screenshot({ path: path.join(OUT, "running.png") });
    const loop = await page.evaluate(() => window.__parentLoop);
    assert(loop.ticks > 0 && loop.max <= 1, JSON.stringify(loop));
    if (mode === "offline")
      assert(
        requests.every((x) => x === url || x.startsWith("data:")),
        "standalone cannot load adjacent assets",
      );
    else if (process.env.COURIER_URL)
      assert(
        requests.every((x) => x.startsWith(process.env.COURIER_URL)),
        "public assets stay under project prefix",
      );
    assert.deepEqual(errors, []);
    const report = {
      mode,
      touch,
      target: url,
      layout,
      start,
      moved,
      jumped,
      dash,
      loop,
      requests,
      errors,
    };
    fs.writeFileSync(
      path.join(OUT, "report.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify({ mode, touch, loop, requests: requests.length, errors }),
    );
  } finally {
    await browser.close();
  }
}
module.exports = {
  ROOT,
  keyboard,
  observation,
  geometry,
  advance,
  click,
  audit,
};
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
