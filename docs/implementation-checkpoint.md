# Implementation checkpoint — interrupted execution, NOT release-ready

The execution runtime exhausted its bounded time budget during Task5. This is an honest partial handoff, not completion of all six tasks and not parent acceptance. Do not publish this checkpoint.

## Retained work

- f43d90c: initial movement/coyote/buffer, genuine RED/GREEN.
- ce74e2a: dash, collision, checkpoints, three worlds and ordinary-input route witnesses.
- f4714d0: validated records and separately handled denied reads/writes. `npm run test:unit` at that checkpoint: 23 passed, zero failed/skipped.
- 62be846: original illustrated Canvas city/tower/gardens/courier, native keyboard and simultaneous touch, lifecycle input release, preferences and opt-in audio, result/save UI and source campaign tests.
- Task5 build/export helpers now preflight allowlisted sources/destinations, refuse existing/dangling/intermediate symlinks, reject unexpected dist entries and duplicate/missing script/style references. Initial API and subsequent meaningful boundary RED/GREEN logs are retained.

## Actual browser execution

`npm run test:browser` in 11-campaign-layout-first.txt: 13 tests ran, 11 passed, 2 failed. Failures were missing initial Start focus and an axe clock harness pause target in the past. All five viewport/DPR2 layout tests passed in ready/playing/paused/results; denied-save real result, rAF single-chain instrumentation and native controls also passed.

After fixing initial focus and the clock harness, `npm run test:browser -- --grep 'source native|axe DOM'` passed both selected tests (11-campaign-layout-green.txt). This exercised all nine letters and all three exits on SOURCE via native keyboard, persistence/replay and four-phase axe. This was a targeted rerun, NOT a final full-suite pass. Earlier audio run passed 2 unit tests and 4 browser tests.

Real screenshots, JSON browser report, source witness telemetry and axe output are under artifacts/evidence. The JSON report describes the latest targeted run, not an invented full-suite total.

`npm run build`: 8 allowlisted runtime files created in dist.
`npm run export`: artifacts/Moonlit-Courier.html created, 40314 bytes at this checkpoint. Actual file:// gameplay and built campaign have NOT yet been exercised.

## Immediate continuation

1. Archive happy-path TDD was actually run: 14-archive-api-red.txt (missing Python script), then 14-archive-api-green.txt (fixture's three committed files exactly archived/read back). New archive security tests were then written in tests/archive.test.cjs, but have NOT been run. They are expected to expose unsafe symlink following in the incomplete Python helper. Run that meaningful RED before implementing refusal. Only use the synthetic fixtures. A deliberate CLI release gate now prevents packaging the project/nonfixture roots until this work is completed. The gate itself has not had a test rerun.
2. Finish archive source/output/ancestor/dangling symlink checks, manifest validation, root/traversal containment, exact committed-byte verification and final archive hashes. Add source-files.json (not created yet) covering exactly owned committed source. Do not include parent-reserved files, artifacts, node_modules or private files.
3. Add scripts/check.cjs (not created yet). Finish README, CHANGELOG and docs/architecture.md, including constants, exact pure API, witness semantics and honest limits. Refactor compressed pure implementation after GREEN as requested.
4. LEVELS currently does not embed witness actions; reusable schedules exist in tests/routes.cjs. Reconcile that remaining normative data requirement without introducing a browser state hook.
5. Exercise complete native campaign on built and actual offline HTML, offline computed CSS and no runtime network. Extend browser security/error/audio denial coverage as appropriate. Preserve all assertions.
6. Run full npm run verify (check/build/export/unit/browser/online audit), then package after committing the exact source manifest. No final verify/audit/package has run. npm install's earlier audit was clean but is NOT the required final online audit.
7. Finish diff/check, explicit owned-path staging, clean owned worktree and exact hashes/report. Parent-reserved tests may remain untracked and must not be edited, staged or deleted.

## Limits / safety

No push, merge, tag, publication, credential action or host/global configuration change was performed. Playwright-managed localhost servers have a bounded shutdown timer and runner teardown. Physical phones, Safari/Firefox, screen-reader and human audio perception have not been certified. Implementer evidence is not independent parent acceptance.

All source keeps createGame/stepGame/snapshot; no createRun/step replacement, teleport or mutable live-instance hook. DOM datasets are output-only. Optional scenic letters do not gate delivery; source native witness collected all of them anyway.
