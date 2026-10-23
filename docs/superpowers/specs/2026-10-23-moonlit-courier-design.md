# Moonlit Courier v1.0 — approved design

Approved by Abel (“ya gas”), following the complete conversational proposal: three handcrafted platforming levels, run/jump/air dash, forgiving edge/buffer inputs, three letters per level including side routes, moving platforms/wind/hazards, checkpoints/fast respawn, optional timing, local progress, keyboard/touch, optional sound and reduced motion. HTML+source ZIP and a NEW public `aichrisz/moonlit-courier` repository/GitHub Pages were explicitly included and approved. No further scope/visibility authorization is needed for that exact target.

## Experience
- Atmospheric 2D side-view courier journey at night: sapphire/lavender sky, warm windows, moon, fog, readable rooftops, clock tower, suspended moon garden. A visible courier with satchel and animated scarf; parallax, dust/dash trail and delivery feedback kept decorative/bounded.
- Three genuinely distinct hand-authored routes: Rooftop Quarter, Clockwork Heights, Moon Garden. Each has exactly three uniquely identified letter pickups and a clearly lit destination mailbox. Side paths contain some letters; no linear auto-complete.
- Deliver all three letters at the mailbox before a level can complete. The mailbox explains missing letters instead of silently finishing. All three levels form a finite campaign with a final summary and replay.
- Timing is optional self-improvement, never a hard limit or failure countdown. No combat, procedural/endless mode, accounts, multiplayer, external assets, paid services or runtime third-party code.
- Short onboarding explains jump, air dash recharge on landing, letter/mailbox objective, checkpoint behavior and keyboard/touch controls. Difficulty comes from routes and movement rather than scarce lives.

## Movement / fairness
- Fixed-step deterministic simulation, world pixels, downward-positive Y. Collision rectangles align with visible solid faces, not glow/shadow.
- Left/right movement, one ground jump; coyote grace and jump buffering documented as exact constants in engine exports. Variable jump height is welcome only if verified and documented, not required to add scope.
- One directional horizontal air dash; recharge only when landed (or respawning). Holding jump/dash must not synthesize new button presses. Facing supplies dash direction if no horizontal input.
- Gravity, speed, dash duration, wind and all moving-platform motion use active simulation time, not wall time. Clamp invalid dt/inputs; bounded fixed-step accumulation after long frames.
- Correct swept/substepped movement: dash must not tunnel through a thin wall or platform, land through its underside, or miss hazards. Side/underside contacts and edge stepping are explicit test cases.
- Coyote and jump-buffer windows operate at documented boundaries and cannot enable repeated midair jump/dash exploits.
- Moving platforms carry a grounded player consistently. Wind zones are visibly marked, bounded and cannot create unavoidable instant deaths on safe checkpoint/spawn.
- Every required route/pickup/destination is actually reachable with legal actions. Prove complete routes through engine controls and real native browser inputs, not teleport/state hooks. Include moving-platform/wind traversal, not just metadata tests.

## Checkpoints / state
- At least one safe mid-level checkpoint per level, visibly activated. Falling or hazard contact respawns quickly at the latest safe spawn with dash restored, held inputs cleared and no permanent input lock. Avoid spawning inside a solid/hazard.
- Collected letters persist across death within the current attempt; level retry resets its attempt/letters/time consistently. Completed records survive reload; incomplete attempts need not persist.
- State phases: ready → playing ↔ paused → levelComplete → next level / campaignComplete. Explicit replay and level retry, no duplicate completion/save after repeated frames/buttons.
- Pause/blur/hidden/pagehide silence sound and clear held keys/pointers. Returning focus never resumes automatically. Start/resume/retry must enable controls before focusing a real play control; exactly one animation loop.
- Completion time counts active play only; standing still is allowed, pause cannot farm records and restarting does not add previous attempt time.

## Interfaces / architecture
- Plain static HTML/CSS/classic-script modules that concatenate safely into one offline HTML; CommonJS export support for pure modules and Node tests. No bundler/runtime framework required.
- `levels.js`: immutable level geometry, pickup IDs, checkpoints, wind/platform motion and visual themes; three entries exposed as `LEVELS`.
- `engine.js`: `createRun(levelIndex=0)`, `step(run,input,dtSeconds)`, `snapshot(run)` and exported exact physics constants. `step` may mutate only its supplied run; no DOM, randomness, clock, storage or audio. `snapshot` is deeply detached.
- Input shape: `{left,right,jump,dash}` booleans, edge transitions owned by engine/run so keyboard and touch behave identically. Document all run/snapshot fields needed for tests/renderer.
- `renderer.js`: draws snapshots with projection/camera and immutable level geometry; detached from simulation, clamps device pixel ratio and decorative particles. Reduced motion removes decorative camera/trail effects but not gameplay movement.
- `records.js`: validates versioned bounded progress and finite nonnegative per-level best times; injectable storage for tests. Guard getItem/setItem failures independently; corrupt records cannot unlock beyond three levels or inject HTML.
- `audio.js`: lazy gesture-triggered synthesized sound, default OFF, no microphone/network. Bounded voices/context, immediate mute on paused/hidden/results; guard missing/rejected AudioContext without breaking play. Visible label reflects actual requested/available mode honestly.
- `app.js`: DOM/lifecycle/input/one rAF/storage/audio wiring; no test-only mutable live state hooks. Prefer no global app hook; pure engine exports are enough for domain tests.
- HUD includes DOM text for phase/current level, collected letter count, dash ready/recharging, checkpoint feedback, active time, and route progress. Canvas has an accessible description; controls/objectives remain text-readable. Visual reaction is still required and is not nonvisual-equivalence certification.

## UI / touch / access
- Responsive arena and native controls simultaneously usable at320×568,390×844,768×1024,1366×768 and1440×900; no horizontal overflow or overlapping action buttons. Maintain world aspect ratio/readability; at least44px touch targets.
- Keyboard: arrows/A,D move; Space/W/up jump; Shift/X dash; Escape pause. Native settings/select controls retain their Space keydown AND keyup behavior; held driving keys are still released safely.
- Pointer capture and multiple held pointers support move+jump/dash concurrently. pointerup/cancel/lost capture/blur/hidden release the correct action. Prevent scroll only on actual gameplay input/surface, never globally on unrelated controls.
- Native Start, Pause/Resume, Retry, Next Level, Campaign Replay, accessible sound and reduced-motion options. Restore focus visibly; meaningful results/save messages in the currently visible panel. No remote fonts/images/icons/audio.

## Delivery/security
- Runtime allowlist explicit in `scripts/public.cjs`; `npm run build` copies only those files to dist. Export embeds every runtime stylesheet/script exactly once and fails on missing/duplicate assets. The resulting `artifacts/Moonlit-Courier.html` runs alone at file:// while offline with no neighboring/external asset requests.
- ZIP contains committed source/docs/tests/lockfile only, no .git/worktrees/node_modules/dist/host briefs/env/evidence caches/secrets. Archive must match exact release source bytes.
- Build/export/package refuse symlink or dangling-link traversal in ANY output ancestor. Test with synthetic sentinels/fixtures, not host secrets. Reject malformed URL paths in any local dev server; bind only loopback.
- Dev-only pinned known-working `@playwright/test`1.64.1 and `axe-core`4.14.0; use existing ARM64 Chromium executable `/root/.hermes/tools/chromium-1208/chrome-linux/chrome`. Audit dependency advisories before publication.
- First public push scans tracked paths AND all reachable history blobs for prohibited files and credential patterns. Publish runtime-only `gh-pages`, explicit Pages source/HTTPS, preserve release provenance; no force-push or config/provider/service changes.

## Acceptance / proof
- Raw TDD RED before implementation and GREEN after, separate engine/storage/delivery/UI slices; preserve actual logs and assertion failures, not fabricated summaries.
- Unit tests: deterministic stepping; edge/buffer boundaries; dash recharge/held press; walls/undersides/high-speed hazards; moving platform carry; checkpoint/respawn/letters; incomplete mailbox/completion/unlock/save-once; bad dt; immutable snapshots/levels; storage malformed/read/write denial; output boundary guards.
- Browser: native full campaign completion, touch movement/jump/dash, keyboard/settings focus, pause/blur/hidden/replay/save, corrupt/denied storage, reduced motion, noJS guidance, all-phase axe/layout with clock resumed for axe. No skip/flaky or weakened assertions to ship.
- Parent independent geometry/resource/timing oracles and native-input source/dist/offline routes; inspect actual screenshots at desktop/mobile. Fresh exact-Astra read-only review bound to fingerprints; fix-first means no release until corrected and rereviewed.
- Final publish: exact source/tag/remote refs; latest Pages built at exact deployment commit; every public runtime body matches tested build; actual public native desktop/touch route. Report live URL first, source second, actual counts and limitations. Never claim physical devices/Safari/Firefox/human audio testing without execution.

## Sources checked
- MDN 2D collision detection: https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
- MDN Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- MDN Web Audio best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
