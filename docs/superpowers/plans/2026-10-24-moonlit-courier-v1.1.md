# Moonlit Courier v1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Parent already selected one exact-Astra CLI implementer; do not spawn duplicate writers.

**Goal:** Deliver the approved five-part storybook visual polish without changing any simulation, level, audio or saved-progress behavior.

**Architecture:** The120Hz pure engine and records/audio boundaries are frozen. Presentation derives postal HUD and bounded feedback from detached snapshots; renderer uses responsive view projection, independently cached scenery and small transient effects, never feeds gameplay. Existing build/standalone/archive security boundaries remain intact.

**Tech Stack:** Vanilla JS, Canvas2D, HTML/CSS, Node test runner, pinned Playwright1.64.1/axe4.14.0; no runtime dependencies.

## Global Constraints
Read sibling approved design2026-10-24-moonlit-courier-v1.1-design.md. Exact frozen engine.js/levels.js/records.js/audio.js bytes; no mechanics/new levels/dependency/network scope. Only one writer. Main/v1.0 tags/gh-pages publication belong to parent. All tests must run; preserve genuine RED outputs under docs/evidence/tdd/v1.1 and GREEN counterpart. Generated PNGs/traces stay artifacts/, never source ZIP. Archive source manifest must exactly match committed tracked source; bump package+lock coherently to1.1.0. Preserve all original tests unless replacing a strictly visual outdated expectation with a demonstrably stronger behavior assertion and documenting why.

## Files and boundaries
- renderer.js: projection, original illustration, cache/trail bounds, character and visual feedback. Extract small presentation helper only when necessary; no broad architecture rewrite.
- styles.css/index.html: mail-house design tokens, responsive arena/control layout, semantic envelope slots/discrete dash status and overlay stamps.
- app.js: derived HUD/feedback only, no scheduler/input/storage mechanics changes.
- tests/presentation.test.cjs and tests/e2e/polish.spec.cjs: new feature contracts; existing engine/records/audio/build/archive suites remain.
- scripts/public.cjs/check.cjs/export.cjs/build.cjs/package.py: only explicit runtime additions if a helper split actually requires them; no weakened path/symlink/inline validation.
- README/CHANGELOG/docs/architecture.md/docs/v1.1-implementation-evidence.md/source-files.json: actual contract/recorded outcomes, not claimed publication.

### Task1: Responsive stage and immutable baseline
- [ ] Install pinned development packages `npm ci --ignore-scripts --no-audit`; run `npm run check && npm run test:unit` before changes. Parent already proved baseline48/48 and audit0; report real local results.
- [ ] Add browser RED: after native #start at1366×768, assert stage content ratio agrees with canvas.width/canvas.height and all four controls fit viewport. Actual example:
```js
const ratio = await page.locator('#world').evaluate(c => ({box:c.getBoundingClientRect().width/c.getBoundingClientRect().height, backing:c.width/c.height}));
expect(Math.abs(ratio.box-ratio.backing)).toBeLessThan(.02);
```
Require >0 geometry and original screenshot before edit; run targeted test with `npx playwright test tests/e2e/polish.spec.cjs --workers=1`, record genuine ratio failure (not missing imports/server errors).
- [ ] Implement same-aspect CSS stage and matching render viewport/camera, desktop960×540, mobile720×540. No nonuniform transform. Define explicit view width/height once for artwork/camera/tile clipping, keep original floor/hitbox coordinates.
- [ ] Cover all6 design dimensions and resized/oriented play; assert no overflow,44px buttons, simultaneously visible arena+controls after normal stage scrolling, then run unit/browser. Commit verified slice.

### Task2: Bounded presentation events and real feedback
- [ ] Before implementation add pure RED for a new feedback controller or renderer presentation factory. At minimum duplicate snapshot observation does not create a second pickup;960 repeated draws/ticks cannot leak unbounded items; reset/new level has no old effects; reduced state has no animated particles; input snapshot deep-equal before/after. Expected API can be named by implementer but must be documented and tested against the actual exported pure factory, not a production live-app hook.
```js
const before = structuredClone(snapshot);
feedback.observe(snapshot); feedback.observe(snapshot);
assert.deepEqual(snapshot, before);
assert(feedback.snapshot().particles.length <= feedback.capacity);
```
Observe expected RED first; record raw result.
- [ ] Implement fixed-capacity finite lifetime effects for true pickup/air dash/landing/checkpoint and delivery. Event source must be genuine simulation edge/snapshot difference, never guessed player X. Time ages only while gameplay time advances; clear on new route/restart/replay; static states remain correct with effects off.
- [ ] Strengthen native dash test: exact Dash spent and >10px real displacement after midair dash on desktop/touch, not merely a nonempty HUD. Run targeted and full unit test GREEN, commit.

### Task3: Three illustrated worlds and courier
- [ ] Add real-canvas behavior RED for independently different scenery-plane translations at two camera positions, bounded cache sizes and stable rendering of a repeated immutable snapshot. A tiny injected drawing context can test transform relationships, but final visual acceptance requires actual browser PNGs. Do not assert helper source strings.
- [ ] Build separately cached sky/far/mid/near original art; actual different camera factors. Add theme-specific warm windows/lanterns/tower/garden, restrained fog and clear solid/hazard edges. Improve cap/scarf/satchel/boots/stride/rise/fall/landing poses anchored at physical feet.
- [ ] Ensure reduced preference eliminates optional motion but keeps stage/physics/readable statuses. Test same-snapshot no extra effects and bounded cache count after route cycling.
- [ ] Capture all3 actual scenes and mobile with legal/native campaign routes, compare before/after and review legibility. Keep CSS root background and text contrast compatible with existing accessibility contract. Run browser and units; commit.

### Task4: Postal HUD and stamped overlays
- [ ] Add RED asserting three semantic envelope slots with separate required/optional grouping and exact active state from genuine pickup; discrete dash readiness agrees with existing #dash-status; result stamp matches real perfect/ordinary outcomes and failed-save copy remains visible.
```js
expect(await page.locator('[data-letter-slot]').count()).toBe(3);
expect(await page.locator('#dash-status').innerText()).toBe('Dash spent');
```
Use existing native route fixture to actually collect/complete; fixture seeding of bounded local records allowed only for route selection, not fake current run completion. No mutable game hook/teleport.
- [ ] Implement compact type hierarchy, required envelopes/scenic seal, meter/text pair and warm mail-card start/pause/results. Keep all original native IDs and keyup/default checkbox/select behavior.
- [ ] Test pause/restart/blur/touch cancellation/reduced preference, axe scan with clock temporarily resumed, storage denial actual completion; full suite GREEN. Commit.

### Task5: Full local gate and reproducible handoff
- [ ] Update architecture with rendering/data-flow and frozen contracts; version package+lock1.1.0; changelog human impact; docs implementation outcomes contain commands/raw evidence/limits, no fictional pass/deployment claims. Update explicit sorted source manifest to every tracked intended source file (no artifacts/parent/scratch/private data).
- [ ] Run `npm run verify` from the isolated worktree; do not race another browser suite/server. Report exact counts/errors; preserve original failures if repair needed. Run all acceptance physics/fuzz/records/recovery and full source/dist/offline native campaigns+desktop/touch; parent may own final large acceptance rerun, but worker must not claim an unrun check.
- [ ] Commit only intended source/docs/tests; source status clean. Run `npm run package` AFTER commit (dirty archive intentionally refuses); verify all ZIP member bytes equal exact committed source and standalone real offline behavior. Do not commit generated output.
- [ ] Handoff: actual commit/status/version, changes, RED/GREEN evidence, exact commands/counts, screenshots/HTML/ZIP paths and limitations. Do not merge/push/tag/deploy or modify parent-owned tests/artifacts.

### Task6: Parent acceptance, fresh review and existing-site release
- [ ] Parent verifies exact worker model in state.db, frozen hash equality, diff ownership, no hidden skipped tests/network/dependencies. Independently rerun full verify and all native campaign/lifecycle/audio plus new responsive/effect resource checks. Inspect actual desktop/mobile/three-theme images; compose genuine before/after preview.
- [ ] Clean committed candidate → fingerprint of all tracked bytes/HEAD/status/index → fresh exact-Astra read-only review → verify actual model/provider and unchanged fingerprint; ship required. Fix-first means repair/retest/new review, never bypass.
- [ ] Parent fast-forward main, preserve v1.0.0, make immutablev1.1.0, source/tag push with readback; publish verified runtime allowlist in new gh-pages commit retaining d907f1d history; explicit source/HTTPS/latest built commit/8-or-actual-runtime exact public bodies.
- [ ] Run real PUBLIC full9-letter campaign, desktop/native touch and audio; update publication-only docs in separate commit without regenerating/retagging release ZIP. Read back exact remote target. Update vault/project/daily/index and run on-change private backup with exact remote note/author verification. Deliver playable URL, real preview, HTML and ZIP with honest limits.
