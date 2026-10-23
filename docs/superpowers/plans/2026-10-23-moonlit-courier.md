# Moonlit Courier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved three-level handcrafted courier platformer, offline artifacts and verified public GitHub Pages gameplay.

**Architecture:** Pure deterministic fixed-step simulation consumes level geometry and boolean actions, exposes detached snapshots to an independent Canvas renderer. App owns native DOM input/lifecycle and bounded audio/storage adapters; delivery scripts share one explicit runtime allowlist and guarded output boundary.

**Tech Stack:** Plain HTML/CSS/JavaScript UMD/classic modules, Node built-in tests, pinned Playwright1.64.1/axe-core4.14.0, native Canvas/Web Audio, Python stdlib ZIP.

## Global Constraints
- Execute approved `docs/superpowers/specs/2026-10-23-moonlit-courier-design.md`; no feature expansion, no runtime third-party assets.
- One exact `gpt-6-astra` implementation writer, isolated `feat/moonlit-courier` worktree. Parent owns independent acceptance and publication; worker never publishes, changes other projects, global models/providers, credentials or services.
- Every slice: write test → run and record expected genuine RED → implement minimum → run GREEN → refactor with GREEN → explicit owned-file commit. Empty-module contract skeleton allowed to reach an assertion RED, not merely import/syntax error.
- Use complete real implementations and legal-input complete routes, no fake data, teleport/browser mutable hooks, removed tests, skip/flaky masking or caller-supplied arbitrary state in live UI.
- Worker may read previous projects ONLY for established delivery/test infrastructure patterns; do not import game code. Pin dev deps exactly; Chromium executable fixed in design.

## File map / interfaces
- `levels.js`: frozen `LEVELS` with3 entries; geometric metadata/IDs and themes. `engine.js`: `createRun(levelIndex=0)`, `step(run,{left,right,jump,dash},dtSeconds)`, deeply detached `snapshot(run)`, exported exact constants. Document state in README.
- `renderer.js`: snapshot-to-Canvas drawing only. `records.js`: injectable load/save progress validation. `audio.js`: lazy opt-in bounded synth with mute/fallback.
- `app.js`, `index.html`, `styles.css`: native interface and lifecycle, scene/HUD/settings/delivery panels. No debug global live-state mutation API.
- `scripts/{public,check,server,build,export}.cjs`, `scripts/package.py`, `playwright.config.cjs`, package/lock, `.gitignore`.
- `tests/{engine,records,delivery}.test.cjs`, `tests/e2e/*.spec.cjs`, route/action fixtures and manual scripts if useful. `docs/tdd-evidence.md`, `docs/implementation-evidence.md`, README/CHANGELOG.

## Task1: Deterministic movement, collision, authored route contract
**Files:** `levels.js`, `engine.js`, `tests/engine.test.cjs`; minimal `package.json` for built-in unit runner.
**Produces:** documented state/snapshot contract; level definitions usable without DOM; `createRun`, `step`, `snapshot` available via require and browser globals.
- [ ] Write behavior assertions using actual exported functions, beginning with deterministic start and landing:
```js
const test=require('node:test');const assert=require('node:assert/strict');
const engine=require('../engine.js');
test('same actions reproduce the same run',()=>{
 const a=engine.createRun(0),b=engine.createRun(0);
 for(let n=0;n<240;n++){
  const input={right:true,jump:n===40,dash:n===55};
  engine.step(a,input,1/120);engine.step(b,input,1/120);
 }
 assert.deepEqual(engine.snapshot(a),engine.snapshot(b));
});
```
 Add independent explicit expected-boundary tests for coyote/buffer/dash held-edge, dash recharge, landing vs underside/wall, high-speed thin walls/hazards, platform carry/wind and bounded bad dt. Read constants in test inputs but calculate expected geometry independently, not by calling the production collision helper as oracle.
- [ ] `node --test tests/engine.test.cjs > artifacts/tdd/task1-red.log 2>&1`; inspect real assertion RED due to missing mechanics; preserve evidence. Add assertions before each new sub-feature.
- [ ] Implement pure fixed-step mechanics, safe contact resolution, carry/wind and edge-trigger inputs; freeze levels, detach snapshots. No renderer code in engine.
- [ ] `node --test tests/engine.test.cjs > artifacts/tdd/task1-green.log 2>&1`; require all pass.
- [ ] Prove all three level routes using only boolean actions, including each letter, moving platform and wind passage; store deterministic action schedules useful to browser tests. Never satisfy reachability by overwriting player state. Commit `feat: implement tested courier movement and authored routes`.

## Task2: Checkpoints, delivery campaign and honest persistent records
**Files:** `engine.js`, `levels.js`, `records.js`, `tests/engine.test.cjs`, `tests/records.test.cjs`.
**Consumes:** Task1 run/action/geometry contract. **Produces:** explicit phase/objective/completion/checkpoint fields and storage adapter.
- [ ] Write failing tests before state/storage implementation: missing letters prevent finish; all three unique letters complete only once; death retains letters/restores dash at safe checkpoint; held actions clear; retry resets attempt; next-level/campaign completion; paused time excluded; malformed/oversized/corrupt prototype values/read denial/write denial handled independently.
```js
// Example shape; finalize exported storage names before committing its tests.
const memory={getItem(){throw new Error('denied')},setItem(){throw new Error('quota')}};
// Adapter's documented load returns bounded default progress and a warning;
// adapter save returns a failure outcome rather than claiming persistence.
```
- [ ] Record `node --test tests/engine.test.cjs tests/records.test.cjs` RED in `artifacts/tdd/task2-red.log`, inspect it, implement then record GREEN at matching path.
- [ ] Keep time/unlock/save-once decisions in domain/storage adapters, not spread through UI. Test very large and nonfinite data. Commit `feat: add checkpoint delivery progression and guarded records`.

## Task3: Playable atmospheric responsive interface and audio
**Files:** `index.html`, `styles.css`, `app.js`, `renderer.js`, `audio.js`, `playwright.config.cjs`, `tests/e2e/*.spec.cjs`, package/lock.
**Consumes:** detached snapshot, frozen level theme and progress adapters. **Produces:** native-input playable three-level campaign at source URL; no mutable test app hooks.
- [ ] Pin dev dependencies exactly; `npm install --ignore-scripts` then use existing Chromium, no browser download needed. Configure loopback-only dev server and Playwright reports under ignored artifacts.
- [ ] Write native interaction tests BEFORE UI: ready→start, visible controls and focus, jump/dash/letter feedback, pause/blur/hidden, next/retry/end, real full campaign routes, simultaneous touch actions, pointer cancel/lost capture, native settings Space keydown+keyup, storage error visible in results and reload, sound opt-in/fallback, responsive phases/axe/noJS.
- [ ] Run focused browser tests to observed RED; source404 is not enough, obtain a missing UI/behavior assertion failure. Preserve `artifacts/tdd/task3-red.log`.
- [ ] Implement drawing from geometry rather than cosmetic mismatched hitboxes. Atmosphere: distinct three environments, courier/satchel/scarf silhouette, moon/warm windows, legible moving ledges/wind, checkpoint flags/mailboxes; no generic card dashboard. Add bounded decoration and honest sound/motion toggles.
- [ ] Wire exactly one rAF loop, capped accumulator, clear held inputs and silence on lifecycle transitions, native buttons/focus/input scopes. Capture pointer IDs per action and preserve settings native defaults on both key paths.
- [ ] Run GREEN focused tests then full `npm test`, saving actual reports/screenshots at desktop and mobile, with all-phase axe scans using a running clock. Annotate Chromium/emulated touch only. Commit `feat: build responsive moonlit delivery adventure`.

## Task4: Secure reproducible standalone/build/archive and complete gate
**Files:** `scripts/{public,check,server,build,export}.cjs`, `scripts/package.py`, `tests/delivery.test.cjs`, package scripts, README/CHANGELOG/evidence.
**Consumes:** complete source allowlist. **Produces:** dist, `artifacts/Moonlit-Courier.html`, `artifacts/Moonlit-Courier-source.zip`, complete evidence; no publication by worker.
- [ ] Write failing boundary/export assertions first: missing assets/duplicate scripts/refusal at linked and dangling-linked output ancestors for build/export/package using synthetic outside sentinels. No real secret fixture paths. Confirm RED `node --test tests/delivery.test.cjs`.
- [ ] Implement explicit-allowlist copying and exact-once embedding; guard every output ancestor, archive committed source only with reproducible relative paths. Dev server must reject decoded traversal and bind127.0.0.1.
- [ ] Scripts: `npm run check`, `npm run build`, `npm run export`, `npm run test:unit`, `npm run test:browser`, `npm test`, `npm run package`, `npm run verify` (check/build/export/unit/browser/manual where applicable/audit). Offline exported file must load alone with context offline and no neighboring/external requests, representative computed CSS correct and native objective/pause route works.
- [ ] Run full gate, online `npm audit --fetch-retries=0 --fetch-timeout=15000`, record exact commands/outcomes/counts and limitations in docs. Preserve selected real RED/GREEN raw logs in `docs/evidence/`, avoiding host secrets/unrelated logs.
- [ ] README explains architecture/controls/time/checkpoint/letter/dash/storage/errors/offline startup and true current local status; no publication claims. CHANGELOG v1.0.0. Commit only owned source/tests/docs/config. Ensure clean worktree and final package matches that commit. Report final HEAD, evidence paths, known limits and an actionable parent verification command. Do not tag/merge/push/create repo/deploy.

## Parent-only Task5: Independent acceptance, fresh exact review and publication
- [ ] Independently verify actual model via read-only session store, inspect source/diff/tests and raw TDD outputs. Run full gate personally.
- [ ] Independent collision/geometry/timing/respawn/input invariants plus complete legal routes for all letters/levels and Native source/dist/offline keyboard/touch paths. Inspect screenshots. Compare exact source/build/offline runtime embedding and ZIP bytes with final source; security scan paths and reachable history.
- [ ] Fresh exact-Astra read-only review in a new session, bound to runtime/diff/HEAD/index/status fingerprints. Require ship; fix-first → actual regression RED/fix/GREEN and rereview.
- [ ] Explicit approved new target `aichrisz/moonlit-courier`: create public repo only after clean preflight, push exact main and immutable v1.0.0, read back refs; publish only runtime+.nojekyll to gh-pages, explicit Pages source+HTTPS and exact latest build.
- [ ] Fetch/compare every public runtime response; real native desktop/touch critical routes on actual project URL. Save provenance/rollback, update and remotely verify source docs/homepage. Preserve tagged release vs later docs commits.
- [ ] Reconcile vault project/daily/index/log and on-change backup with exact remote note bytes/author verification. Deliver live URL first, source next, offline HTML/ZIP and concise real acceptance/limitations.

## Self-review
All approved features map to tasks1–4, independent release gates to5. No live mutation hooks, procedural scope, external runtime assets or extra services. Spec is the written form of the design Abel already approved, not a new approval loop. One implementation writer and a separate read-only reviewer prevent concurrent edits. Parent must not turn planned checks into claimed execution.
