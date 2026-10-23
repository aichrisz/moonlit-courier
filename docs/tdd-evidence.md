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

| Slice | Command | Observed RED | Observed GREEN |
|---|---|---|---|
|12 delivery API|`node --test tests/boundary.test.cjs`|public helper module absent|allowlisted build and inline standalone passed|
|13 delivery boundaries|`node --test tests/boundary.test.cjs`|symlink and unexpected-reference assertions failed|10 tests passed after preflight/refusal implementation|
|14 archive API|`node --test tests/archive.test.cjs`|Python packager absent|synthetic three-file committed archive verified|
|15 archive security|`node --test tests/archive.test.cjs`|five actual symlink-refusal assertions failed (exit status was incorrectly zero); expanded manifest/root/metadata cases also failed|10 tests passed after complete preflight; release gate stub removed|
|16 check|`node --test tests/check.test.cjs`|check API absent|2 checks passed, including syntax/private-path/network/test-skip refusal|

Post-GREEN readability refactor: `npm run test:unit` passed 47 tests (17-readability-green.txt), with mechanics/constants unchanged. The subsequent deterministic ZIP regression test is part of final verification.

Native build/offline/shortcut regression: `npm run test:browser -- --grep 'Escape and P|native nine-letter'` passed all 3 (18-delivery-green.txt). Both targets collected all nine letters and all exits. Offline was actually offline with only the main file request and computed root CSS checked. Existing Escape/P resume already passed with Resume focused, so no fake RED or unnecessary app patch was introduced.

Final gate status and exact evidence are maintained in docs/implementation-evidence.md. All artifacts remain local pending independent parent acceptance/review/release; no publication was performed.
