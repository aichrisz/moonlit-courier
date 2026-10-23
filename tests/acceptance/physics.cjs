/* Independent parent reference: analytic ballistics and rectangular contact faces.
 * No production collision/trajectory helper is used to calculate expectations. */
"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const ROOT = process.env.COURIER_ROOT || path.resolve(__dirname, "../..");
const { createGame, stepGame, snapshot, CONSTANTS: C } = require(
  ROOT + "/engine.js",
);
const fixture = (extra = {}) => ({
  id: "parent-fixture",
  name: "Parent synthetic geometry",
  width: 2000,
  height: 540,
  spawn: { x: 80, y: 400 },
  platforms: [{ x: 0, y: 440, w: 2000, h: 100 }],
  hazards: [],
  wind: [],
  checkpoints: [],
  letters: [],
  exit: { x: 1900, y: 380, w: 40, h: 60 },
  ...extra,
});
const near = (a, b, label) =>
  assert(Math.abs(a - b) < 1e-7, `${label}: ${a} != ${b}`);
const step = (g, input = {}, n = 1) => {
  for (let i = 0; i < n; i++)
    stepGame(
      g,
      i === 0 ? input : { left: !!input.left, right: !!input.right },
      C.STEP,
    );
  return g;
};
let ballisticComparisons = 0,
  floorComparisons = 0,
  wallComparisons = 0,
  ceilingComparisons = 0;
for (let seed = 0; seed < 24; seed++) {
  const g = step(
      createGame(0, fixture({ spawn: { x: 80 + seed * 13, y: 400 } })),
      {},
      4,
    ),
    initial = g.player.y;
  const trace = [2, 9, 17, 39, 55, 70];
  step(g, { jumpPressed: true });
  for (let n = 2; n <= 70; n++) {
    step(g);
    if (trace.includes(n)) {
      const t = n * C.STEP;
      // Independent continuous trajectory plus the analytic first-order integration
      // error bound. Physics may legitimately substep below the public120Hz tick.
      const expectedY = initial - C.JUMP * t + C.GRAVITY * t * t / 2;
      const errorBound = C.GRAVITY * C.STEP * t / 2 + 1e-7;
      assert(Math.abs(g.player.y - expectedY) <= errorBound,
        `ballistic position outside integration bound: ${g.player.y}, expected ${expectedY} ± ${errorBound}`);
      near(g.player.vy, -C.JUMP + C.GRAVITY * t, "jump velocity");
      ballisticComparisons++;
    }
  }
  const detached = snapshot(g),
    old = g.level.platforms[0].x;
  detached.level.platforms[0].x += 999;
  detached.collected.push("parent-only");
  assert.equal(g.level.platforms[0].x, old);
  assert(!g.collected.includes("parent-only"));
}
for (let k = 0; k < 80; k++) {
  const y = 320 + ((k * 37) % 160),
    g = createGame(
      0,
      fixture({
        spawn: { x: 60 + ((k * 79) % 800), y: 20 },
        platforms: [{ x: 0, y, w: 2000, h: 540 - y }],
      }),
    );
  for (let i = 0; i < 240; i++) {
    step(g);
    assert(g.player.y + g.player.h <= y + 1e-7, "cannot penetrate floor");
    if (g.player.grounded) {
      near(g.player.y, y - g.player.h, "floor top contact");
      floorComparisons++;
      break;
    }
  }
  assert(g.player.grounded, "must land on known unobstructed floor");
}
for (const direction of [-1, 1])
  for (let k = 0; k < 160; k++) {
    const spawn = { x: direction === 1 ? 100 : 900, y: 100 },
      gap = 0.2 + ((k * 43) % 135),
      width = 0.2 + ((k * 7) % 19),
      n = 2 + (k % 17);
    const clean = fixture({ spawn }),
      free = createGame(0, clean),
      w = free.player.w;
    const wall = {
      x: direction === 1 ? spawn.x + w + gap : spawn.x - gap - width,
      y: 0,
      w: width,
      h: 540,
    };
    const blocked = createGame(
      0,
      fixture({ spawn, platforms: [...clean.platforms, wall] }),
    );
    const input = {
      right: direction === 1,
      left: direction === -1,
      dashPressed: true,
    };
    step(free, input, n);
    step(blocked, input, n);
    const expected =
      direction === 1
        ? Math.min(free.player.x, wall.x - w)
        : Math.max(free.player.x, wall.x + wall.w);
    near(blocked.player.x, expected, "independent wall-face clamp");
    assert.equal(blocked.deaths, 0);
    wallComparisons++;
  }
for (let k = 0; k < 32; k++) {
  const bottom = 340 + k,
    ceiling = { x: 0, y: bottom - 7, w: 2000, h: 7 },
    g = step(
      createGame(
        0,
        fixture({ platforms: [{ x: 0, y: 440, w: 2000, h: 100 }, ceiling] }),
      ),
      {},
      4,
    );
  step(g, { jumpPressed: true });
  let touched = false;
  for (let n = 0; n < 75; n++) {
    step(g);
    assert(g.player.y >= bottom - 1e-7, "cannot penetrate ceiling");
    // A contact can occur inside a substep, followed by up to one public
    // tick of gravity before the observable snapshot. Bound that drift analytically.
    if (Math.abs(g.player.y - bottom) <= C.GRAVITY * C.STEP * C.STEP + 1e-7 && g.player.vy >= 0) {
      touched = true;
    }
  }
  assert(touched, "jump must reach the known ceiling");
  ceilingComparisons++;
}
const invalid = [0, -1, NaN, Infinity, 1];
for (const dt of invalid) {
  const g = createGame(0, fixture()),
    before = JSON.stringify(g);
  let thrown = false;
  try {
    stepGame(g, {}, dt);
  } catch (e) {
    assert(e instanceof RangeError);
    thrown = true;
  }
  assert(
    thrown || JSON.stringify(g) === before,
    "invalid time cannot corrupt/advance simulation",
  );
}
const report = {
  scope: "independent synthetic geometry and analytic movement",
  ballisticComparisons,
  floorComparisons,
  wallComparisons,
  ceilingComparisons,
  invalidTimeCases: invalid.length,
  detachedSnapshots: 24,
  constants: C,
};
fs.mkdirSync(path.join(ROOT, "artifacts/parent"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "artifacts/parent/physics.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report));
