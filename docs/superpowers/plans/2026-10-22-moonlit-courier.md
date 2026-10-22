# Moonlit Courier v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. One exact-Astra implementer owns the worktree; parent separately owns acceptance and publication.

**Goal:** Ship the approved three-level moonlit courier platformer as a verified playable web game plus offline HTML/source ZIP and GitHub Pages.

**Architecture:** Pure data-driven platform simulation separated from Canvas presentation, native input/lifecycle, optional WebAudio and bounded local saves. A fixed120Hz browser controller passes edge-triggered input to the pure engine and renders detached snapshots; read-only DOM telemetry supports real-input tests without exposing live simulation state.

**Tech Stack:** Plain JavaScript/CommonJS-compatible browser globals, CSS/Canvas/WebAudio, Node built-in tests; dev-only @playwright/test1.64.1 and axe-core4.14.0. Explicit-allowlist build/export; Python stdlib ZIP if simplest.

## Global Constraints
- Approved spec: `docs/superpowers/specs/2026-10-22-moonlit-courier-design.md`; interfaces, IDs, field names and exactly3 levels/3 letters each are normative.
- Exactly `gpt-6-astra`/openai-codex; no silent model fallback. One writer under `/root/projects/moonlit-courier/.worktrees/v1` on `feat/moonlit-courier-v1`.
- User already approved the full proposed scope, public new repo and Pages: “ya gas”. No repeated permission request; no worker remote push/deployment. Parent alone releases after gates.
- Zero runtime dependencies or external assets; dev versions pinned above. New-project baseline is documentation-only, not a claim of passing nonexistent tests.
- Preserve source/test history, test-first vertical slices. Capture actual targeted RED/GREEN output at each slice in `docs/evidence/tdd/`, and commands/reasons in `docs/tdd-evidence.md`. Assertions are not weakened to make screenshots pass.
- Parent-reserved paths: `tests/parent/`, `docs/parent-acceptance.md`, `artifacts/parent/`. Worker must not touch them, globals, credentials, other projects, skills, cron, vault, provider config, external repo or deployed assets.
- Shared commands supplied by worker: `npm run check`, `npm run build`, `npm run export`, `npm run test:unit`, `npm run test:browser`, `npm test`, `npm run verify`, `npm run package`.

## File responsibilities
`levels.js` content data; `engine.js` pure physics/progression; `records.js` validation/persistence; `renderer.js` drawing/camera; `audio.js` guarded audio lifecycle; `app.js` input/state machine/clock/DOM; `index.html` semantic shell; `styles.css` responsive tokens. `scripts/{check,server,public,build,export}.cjs` and `scripts/package.py` are bounded delivery helpers. `tests/*.test.cjs`, `tests/e2e/*.spec.cjs`, `tests/routes.cjs` are runnable verification. `docs/architecture.md`, `docs/tdd-evidence.md`, README, CHANGELOG explain actual behavior, contracts and limits.

### Task1: real grounded movement / jump slice
**Create:** package.json+lock, playwright.config.cjs, levels.js, engine.js, tests/engine.test.cjs.
**Consumes:** spec's input/player contracts. **Produces:** LEVELS, createGame, stepGame, snapshot with deterministic grounded movement and deep-detached observations.
- [ ] Write the first missing-API test, run and save real RED before creating runtime modules. Example test intent:
```js
const assert=require('node:assert/strict');
const test=require('node:test');
const {createGame,stepGame,snapshot}=require('../engine.js');
test('jump leaves the spawn floor and returns to a safe landing',()=>{
 const g=createGame(0); for(let n=0;n<4;n++)stepGame(g,{},1/120);
 const start=snapshot(g).player.y;stepGame(g,{jumpPressed:true},1/120);
 for(let n=0;n<12;n++)stepGame(g,{},1/120);
 assert(snapshot(g).player.y<start);
});
```
- [ ] Implement bounded state, floor collision and fixed-step horizontal/jump behavior only; run targeted GREEN, then add separately failing grounded landing/coyote/buffer tests before those behaviors. Define actual physics constants and units in architecture docs.
- [ ] Add real deep snapshot/determinism/invalid-time tests, run GREEN and commit this independently testable slice. A missing-file initial RED is legitimate; later feature REDs must fail meaningful behavior assertions.

### Task2: dash / hazards / three real levels / progression
**Modify:** engine.js, levels.js, tests/engine.test.cjs. **Create:** tests/levels.test.cjs, tests/routes.cjs.
**Consumes:** Task1 pure API. **Produces:** exact3 complete levels, one-air-dash/no-tunnel collision, moving-platform riding, visible wind zones, safe checkpoints/respawn, required+optional letters and idempotent complete.
- [ ] Add/run one failing test for spent dash, implement minimal one-air-dash with safe refill on landing; then separately test solid/hazard tunneling at dash speed, side/underside/corner contact and moving-platform support.
- [ ] Add/run failing checkpoint and collectible tests, then implement. Use a complete synthetic level with a floor, a reachable letter/checkpoint and a hazard beyond it; ordinary stepGame inputs must reach each contact. Assert restored checkpoint, reset velocity/dash, one death increment, retained unique letter IDs and idempotent exit completion. No live-app teleport. A complete early dash invariant example is:
```js
test('a second aerial dash does not restore spent charge',()=>{
 const g=createGame(0);
 for(let n=0;n<4;n++)stepGame(g,{},1/120);
 stepGame(g,{jumpPressed:true},1/120);
 for(let n=0;n<12;n++)stepGame(g,{},1/120);
 stepGame(g,{right:true,dashPressed:true},1/120);
 assert.equal(snapshot(g).player.dashReady,false);
 stepGame(g,{left:true,dashPressed:true},1/120);
 assert.equal(snapshot(g).player.dashReady,false);
});
```
- [ ] Build three distinct handcrafted traversable worlds. Add deterministic action witnesses `[{frames,input}]` in tests/routes.cjs for all3 letters+exit in all3 levels; assert all9 unique IDs and all3 completions using pure API. Test that skipping an optional letter permits required delivery, and missing a required letter does not.
- [ ] Assert reachability at timing margins, safe respawn from every checkpoint, bounds and no NaN over long mixed actions. Commit GREEN.

### Task3: durable progress and truthful failures
**Create:** records.js, tests/records.test.cjs.
**Produces:** documented records API and strict versioned project-specific saves; clean storage adapter dependency for tests; actual outcome returned on write.
- [ ] Test-first empty/corrupt/version mismatch/out-of-range/hostile JSON; reject inherited/prototype keys and oversized input, bound level indices, unlocks and elapsed/best-time values.
- [ ] Test-first reads denied and writes denied independently; no double-run increments on repeated completion; replay cannot erase a better record. Synthetic denied storage is an explicit platform fixture, not fake success.
- [ ] Implement minimal normalization/read/write/complete functions, run all unit tests and commit.

### Task4: polished native game / renderer / sound / lifecycle
**Create:** index.html, styles.css, renderer.js, audio.js, app.js, scripts/server.cjs, tests/e2e/game.spec.cjs.
**Consumes:** pure API and records module. **Produces:** real playable responsive world and native UI with exact spec IDs/read-only canvas datasets.
- [ ] Write/run failing browser start→move→jump→dash→pause test against the native shell before adding each missing behavior. Use a working bounded localhost static server rooted in this worktree; never bind public or serve parent paths.
- [ ] Implement renderer original vector world/courier/scarf, three distinct scenes and bounded camera. App owns one timestamp-driven accumulator with bounded catch-up; edge inputs consumed once per simulated action, no autojump, no stuck held input across phase changes. No mutable window game API.
- [ ] Introduce tests first for native touch simultaneous holds/lost capture/pointercancel, blur/visibility/pagehide pause, pause→resume/restart/next/replay focus, and native sound/reduced-motion Space keyboard ownership.
- [ ] Implement actual off-by-default WebAudio opt-in with safe unavailable/rejected paths; pause/blur/mute signal silence. Add actual user-facing results save outcome and per-level progress selection/unlocks (no reset without explicit user action).
- [ ] Test geometry at all five spec viewports in ready/playing/paused/results, axe for DOM rules, stable Canvas aspect; actual snapshots and physical device/human-listening limits documented. Commit GREEN.

### Task5: bounded build / standalone / ZIP
**Create:** scripts/public.cjs, scripts/{check,build,export}.cjs, scripts/package.py, tests/boundary.test.cjs.
**Produces:** dist runtime allowlist, artifacts/Moonlit-Courier.html, artifacts/Moonlit-Courier-source.zip; no runtime loader/import/CORS requirement on file://.
- [ ] Write/run RED synthetic boundary tests for existing, dangling and intermediate symlinks across build/export/archive. Use independent fixture root and outside sentinel; assert outside unchanged. No host secret reads.
- [ ] Implement explicit allowlist copy and exactly-once inline CSS/scripts export; reject unexpected/missing/duplicate script refs instead of silently exporting partial/unformatted HTML. ZIP uses only intended source files and no traversal/outside-symlink content.
- [ ] Assert standalone has no external local/font/image runtime refs; real offline browser computed style and input path, not only text substitution. Build/standalone contents match exact source hashes and archive files match intended source. Commit GREEN.

### Task6: final actual campaign and handoff
**Modify:** tests/e2e/game.spec.cjs, package scripts, README.md, CHANGELOG.md, docs/architecture.md, docs/tdd-evidence.md.
- [ ] Implement/rerun ordinary keyboard/pointer all-three-level witnesses on source, build and offline HTML; parent will independently derive/check witnesses and public campaign. Read-only DOM observations are allowed; injecting engine state/teleport/completion is forbidden.
- [ ] `npm run verify` must run syntax/check, build/export, all unit/browser tests and online npm audit. Save machine-readable Playwright stats and actual screenshots at artifacts/evidence. Never invent expected counts, silently skip/fixme tests, or label tests unrun as passed.
- [ ] `npm run package`; inspect archive source file list and hashes. Explain real architecture, controls, letter rules, constants and limits. Raw RED/GREEN logs are short and preserve assertions, not giant tool transcripts.
- [ ] Self-review git diff/check, commit worktree clean. Do NOT merge/push/tag/deploy or touch parent paths. Report exact commit, commands/counts, artifacts, route witness schema, known issues and anything not actually tested. Parent follows with independent acceptance, fresh exact-Astra review and approved release.

## Parent acceptance / publication (not worker-owned)
- Independently inspect physics and write direct ballistic/AABB/anti-tunnel/resource/respawn oracles and native input campaign; derive at least one route without trusting worker expected values. Exercise source/build/standalone with no app/network errors and actual offline style.
- Online audit, secret/path/history scan, check full source ZIP, collect exact runner counts, inspect actual game screenshots; fresh read-only exact-Astra ship verdict fingerprint-bound to runtime.
- Tag immutable source v1.0.0, fast-forward main, create authorized public repo once, push/read exact source/tag, runtime-only gh-pages, explicit Pages source/HTTPS. Bounded wait for exact deployment built; compare every public runtime response to build and run actual public native campaign plus touch smoke.
- Documentation-only publication follow-up must not alter reviewed runtime; distinguish source/tag/Pages/docs commits. Update project/daily/index/log, on-change vault backup plus exact remote-byte and author verification. Final live URL + source + downloadable HTML/ZIP, concise verified counts and residual limits.
