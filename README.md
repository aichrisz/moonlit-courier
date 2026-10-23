# Moonlit Courier 1.0

A small, handcrafted night-post adventure: cross warm-windowed rooftops, pass the clock tower, and carry the last letters through moon gardens. Original Canvas scenery and courier art; no runtime packages, remote assets, accounts or analytics.

**v1.0.0 is LIVE:** https://aichrisz.github.io/moonlit-courier/ · [source](https://github.com/aichrisz/moonlit-courier). Immutable game/tag `de7e75f`; Pages `d907f1d`. Parent48 unit/16 browser and audit0, source/build/offline complete native campaigns, fresh exact-Astra ship review,8 exact live asset matches and actual public nine-letter/three-exit campaign passed. Publication provenance/limits: `docs/deployment.md`; reproducible independent protocol: `docs/verification.md`. The91-file source ZIP remains exact `v1.0.0`, not later publication-only documentation.

## Play

Open `index.html` directly, or use the self-contained `artifacts/Moonlit-Courier.html` after `npm run export`. The standalone contains its CSS and all six scripts; it needs neither adjacent files nor a server. Storage availability on `file://` is browser-dependent and failures are shown honestly.

For local HTTP development, `node scripts/server.cjs` serves only runtime files at http://127.0.0.1:4173/ (and the build at `/dist/`). It binds localhost only, shuts down after ten minutes, and supports Ctrl+C. No install is needed to play.

- Move: A/D or left/right arrows.
- Jump: Space, W or up arrow. Hold does not auto-jump.
- Horizontal air dash: Shift or X; one charge, restored on landing.
- Pause/resume: Escape or P. R restarts the current route while driving.
- Touch: hold an arrow and press Jump/Dash simultaneously. Cancelling a touch releases it.
- Settings keep native keyboard behavior; leave their focus for gameplay shortcuts. Sound starts off and requires opt-in. Pause/blur/mute silences it. Less decoration preserves physics while removing decorative motion/parallax/trails.

Each of the three neighbourhoods has two required post letters and one clearly labeled optional scenic letter. Two letters open its mailbox; the third earns a perfect stamp. Pennants are safe checkpoints. Falling or touching a hot vent returns you to the last reached pennant and keeps your letters. There is no enforced timer, combat or lives limit. Results lead to the next route; the final screen offers replay. The unlocked route selector and best times survive reload when local storage works.

## Development and delivery

Tested toolchain: Node 26.7.0, npm 11.19.0, Python standard library. Dev-only pins are `@playwright/test` 1.64.1 and `axe-core` 4.14.0. Install with `npm install --ignore-scripts`. Tests reuse the existing Chromium executable configured in `playwright.config.cjs`; there is no browser download step.

- `npm run check`: manifest/path, source syntax, exact dependency pins, runtime-network and reference checks.
- `npm run build`: eight allowlisted files to `dist/`; rejects unexpected entries and symlinks.
- `npm run export`: one self-contained `artifacts/Moonlit-Courier.html`.
- `npm run test:unit`: pure simulation, records, audio adapters and synthetic delivery-boundary tests.
- `npm run test:browser`: native-input campaign, controls, lifecycle, accessibility and responsive checks. Build/export first.
- `npm test`: unit and browser tests.
- `npm run verify`: check → build → export → unit → browser → online npm audit. Network is needed for the audit, not gameplay.
- `npm run package`: deterministic source ZIP and integrity report, only from an exact committed source manifest. Commit all intended source and `source-files.json` first; dirty/missing/unexpected source is refused.

Outputs are under `artifacts/` and `dist/`, not committed. ZIP entries exactly match `source-files.json` and committed bytes; portable parent-owned `tests/acceptance` checks are included, while temporary/untracked scratch, dependencies, Git metadata, artifacts and private files are excluded. The package helper refuses symlinks, including dangling links and ancestors. The helpers assume a single local writer, not an adversarial concurrent filesystem.

`docs/verification.md` documents the independent parent protocol and reproducible `tests/acceptance` commands. Their geometry-derived native routes are separate from the implementation witnesses below. Actual release verdict/model/fingerprints and final publication provenance are separate attestations, not assertions manufactured in the source code.

## Evidence and limits

`tests/routes.cjs` exports three schedules as `[{frames,input}]`: one frame is 1/120 second, movement is held through a segment, and jump/dash are rising edges on its first frame. The same routes are driven by the pure engine and native browser keys, never teleportation or a live-state hook. Browser telemetry is output-only.

Screenshots, full Playwright JSON, source/build/offline witness traces, axe report, command logs and packaging hashes are in `artifacts/evidence/`. These are implementer evidence, not an independent acceptance verdict.

The visual-reaction game is not claimed fully nonvisual accessible. Tests cover Chromium emulation at five viewport sizes and DPR2, not physical phones, Safari/Firefox, manual screen-reader use or human audio perception. Records support run times up to 24 hours. User preferences are session-local; delivery records stay on this device, not in a cloud account.
