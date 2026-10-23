# TDD execution evidence

The baseline 9a1c04c contained only approved design/plan documentation. No passing runtime baseline existed. All commands below were actually executed in the isolated v1 worktree. Raw output is in docs/evidence/tdd. Logs are observations, not an independent acceptance verdict.

| Slice | Command | Observed RED | Observed GREEN |
|---|---|---|---|
|01 movement|`node --test tests/engine.test.cjs`|engine.js missing (initial API test)|2 tests passed|
|02 grace|`node --test tests/physics.test.cjs`|coyote rise and landing buffer assertions failed|4 combined engine/physics tests passed|
|03 dash|`node --test tests/physics.test.cjs`|dashReady remained true|3 physics tests passed|
|04 world|`node --test tests/physics.test.cjs`|hazard death, moving passenger, checkpoint/collection assertions failed|8 combined tests passed|
|05 levels|`node --test tests/levels.test.cjs`|one level rather than three|20 combined tests passed, including 9 timing-margin witnesses|
|05 margin regression|`node --test tests/*.test.cjs`|clock-tower +1 frame witness hit vent before ascent|vent moved farther from the run-up; same assertions passed|
|06 records|`node --test tests/records.test.cjs`|records.js missing (new module API)|2 passed|
|07 denial|`node --test tests/records.test.cjs`|unhandled denied read|3 passed; read/write failure reported separately|
|08 native|`npm run test:browser`|clicking the real shell's Start left phase ready|native start/move/jump/dash/pause passed|
|09 lifecycle/touch|`npm run test:browser`|blur did not pause; native simultaneous touch did not move|3 native tests passed|
|10 audio|`node --test tests/audio.test.cjs`; `npm run test:browser -- --grep sound`|missing audio API; native Sound checkbox left status off|2 unit audio tests and 4 browser tests passed|
|11 campaign/layout|`npm run test:browser`|initial Start lacked focus; axe harness pause target was in the past|focus fixed, clock harness target moved safely ahead; source all-nine campaign and axe passed|

11 first-run also passed all five DPR2 layout cases in ready/playing/paused/results, storage-denied real results, loop instrumentation and native input cases. These are regression/acceptance tests added after the underlying features, not misrepresented as test-first feature implementation. Clock harness failures are retained separately and are not production RED evidence. Renderer background caching was a post-GREEN refactor; it preserves the foreground simulation and drawing-only contract.

Checkpoint: Tasks 1–3 committed; Task4 native source campaign, original renderer, touch/lifecycle/audio and layout implemented and exercised. Build/export/archive boundary helpers and their tests, final packaged/offline native campaign and handoff verification remain at this checkpoint. No publication was performed.
