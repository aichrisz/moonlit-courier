# Implementation verification evidence

Status: complete local implementation and verified delivery artifacts, pending independent parent acceptance/review/publication. No deployed release or independent ship verdict is claimed.

## Final full verification

`npm run verify` exited 0. It ran the real source check (80 manifest files, 25 JavaScript syntax checks, 8 runtime files), build, export, all unit/browser tests and online audit. Unit: **48 passed, 0 failed/skipped/todo**. Playwright: **16 passed, 0 unexpected/skipped/flaky**, in the full 9.0-minute run. Online `npm audit --audit-level=low`: **0 vulnerabilities**. This supersedes historical targeted reports.

Each source/build/offline native campaign collected nine unique letters and reached all three exits with zero deaths. Offline used `context.setOffline(true)` before file navigation; no adjacent or external request occurred, and computed `:root` background and canvas fit were asserted. Browser screenshot/geometry cases covered 320×568, 390×844, 768×1024, 1366×768 and 1440×900 at DPR2, in all four UI phases. Axe reported no tested WCAG-tag violations in ready/playing/paused/results.

`npm run package` exited 0 after source/manifest commit, verifying **80 committed files**, identical source/HEAD/ZIP bytes and a read-back integrity report. The package is regenerated after final documentation-only commits; `package.json` in artifacts/evidence and `final-report.json` bind the resulting ZIP to the actual final HEAD. Browser-tested runtime bytes remain unchanged by that documentation finalization. `git diff --check` passed. The owned localhost test-server port was verified closed. Parent-reserved files remain untracked and untouched.

## Executed targeted checks

- Archive security: `node --test tests/archive.test.cjs` produced genuine failures for source, source-ancestor, output, dangling and output-ancestor symlinks before refusal was implemented. Expanded manifest/metadata/root checks also ran RED. The subsequent run passed 10 tests. Raw logs: `docs/evidence/tdd/15-*`.
- `node --test tests/check.test.cjs`: initial missing-API RED, then both checks passed. Logs: `16-check-*`.
- After a formatting/readability-only engine/level refactor, `npm run test:unit` passed 47 tests. No mechanics or constants changed; `17-readability-green.txt` is the actual run. An additional deterministic archive regression test was added afterward and is included in the final gate.
- `npm run build && npm run export`: eight runtime files and the complete inline HTML generated.
- `npm run test:browser -- --grep 'Escape and P|native nine-letter'`: 3 passed. Both built HTTP and actual offline file:// campaigns collected all nine letters, crossed all three exits with zero returns, and matched exact source delivery bytes. The offline context was explicitly offline; its only request was the HTML document. Both Escape and P paused/resumed twice through native key events with Resume focused. This existing behavior passed without a production change; no invented regression RED is claimed.

## Evidence locations

- Full command log: `artifacts/evidence/verify.txt` (final gate).
- Playwright JSON: `artifacts/evidence/playwright.json` (latest full run after the gate).
- Source trace: `artifacts/evidence/source-witness.json`.
- Built and standalone traces/request lists/source hashes: `artifacts/evidence/build-witness.json`, `offline-witness.json`.
- Real screenshots: `artifacts/evidence/*-playing.png`, `*-results.png`, and five viewport ready/playing/paused/results captures.
- Axe: `artifacts/evidence/axe.json`.
- Package read-back integrity and HEAD: `artifacts/evidence/package.json` after committed-source packaging.

The earlier 11/13 browser run and its targeted two-test rerun are historical TDD/regression evidence, not the full final gate. No test result here is an independent parent acceptance verdict. No physical-device, Safari/Firefox, manual screen-reader or human audio-perception certification is claimed. No publication is performed by the worker.
