# Moonlit Courier v1.1.0 publication — 2026-10-28

Supersedes the v1.0.0 record below; v1.0.0 remains an immutable, still-restorable tag.

- Live: https://aichrisz.github.io/moonlit-courier/
- Source: https://github.com/aichrisz/moonlit-courier
- Authorization: Abel approved the warm storybook polish ("boleh"), explicitly chose the performance repair over shipping as-is ("perbaiki"), and had previously authorised deployment of approved updates to the existing site.

## Immutable refs

- `v1.1.0` annotated tag → release commit `0108575bfbb3e3c44de557651f40cb26414abd7d` (115 tracked files).
- `v1.0.0` annotated tag `4db2b6f0…` → `de7e75fb88912b0cbca7ac4e5d66e72c92a7bf3c` — **untouched**; still the rollback target.
- `main` fast-forwarded `1fbc0c2` → `0108575`; push readback matched.
- gh-pages `005de8f5266c07d717a48b418c17fe157a84e75d`, parent `d907f1ddd71f718d05bc0bb0f2fdc5acd39eb5a1` (prior history preserved, no force-push). Only `app.js`, `index.html`, `renderer.js`, `styles.css` changed at runtime level.

## What changed in 1.1.0

Warm storybook-night polish on the same three hand-built levels, 9 letters, with unchanged physics/hitbox/levels/records/audio:

1. Responsive stage: the arena and all four touch controls now fit together, including narrow-short screens; the ≤600px 4:3 (720×540 render) and >600px 16:9 (960×540 render) projections stay exact.
2. Layered scenery: four independently translated parallax planes composited at CSS resolution into one reusable stage buffer, then a single smooth DPR2 blit.
3. Feedback: dash trail, pickup shimmer, checkpoint state, delivery animation — bounded, deduplicated, reduced-motion aware.
4. Courier articulation and postal HUD (envelope slots, dash charge, result card with route stamp).

## Verification (real, on the released commit)

- Parent independent acceptance on the release commit: physics, derived-routes, fuzz, records, recovery all pass; `source`, `dist` and `offline` campaigns each **9 letters / 3 exits / 0 errors**; audio variants pass.
- Full suite: **50 unit (50 pass, 0 fail) + 40 browser, 0 skipped, 0 flaky**; `npm audit` found 0 vulnerabilities. Source check: 115 files / 35 syntax checks / 8 runtime files.
- Frozen files byte-identical to the v1.0.0 baseline: `engine.js`, `levels.js`, `records.js`, `audio.js`.
- Final binding: manifest == `git ls-files` (115), all 8 dist files match source, standalone HTML 56,846 bytes, source ZIP 165,715 bytes with all 115 members verified against the committed tree, zero credential-pattern hits across all 159 history blobs.
- Performance fix, parent-measured: 9,550 ms → **4,926 ms** per 240 ticks against v1.0's 4,711 ms (+4.6%); real-clock fps 25.5 vs 26.5 desktop, 33.2 vs 26.7 at 390×844; per-frame `matchMedia` calls 125 → 0. The twelve cached parallax planes hash **identically (12/12 SHA256)** before vs after the repair, so no art was lost.
- Narrow-short fix, parent-measured: 568×320 needs 267.98 of 320 available px, 600×400 needs 348 of 400; all eight probed viewports pass, no horizontal overflow, 48px controls.
- Two fresh exact-`gpt-6-astra` read-only reviews (model/provider verified from the read-only session DB; HEAD and tracked bytes unchanged during each review):
  - Review 1 → **fix-first**, one blocker: narrow-short viewports could not fit arena + controls. Blocking, remedied in commit `0108575`.
  - Review 2 on `0108575` → **ship**, zero blockers; both residual items declared non-gating.
- Public verification on the live site: all 8 runtime bodies byte-match the release commit; served index differs from the v1.0.0 index; real public campaign **9 letters / 3 exits / 0 errors** at 1366×768 DPR2; public desktop and two-finger touch lifecycles both 132 ticks, 8 requests, 0 errors; public audio produced real waveform (peak RMS ≈ 0.028) and was silent when paused/muted, with `missing`/`rejected` API paths degrading to "Sound unavailable" while gameplay kept working.

## Honest limits

- Timing figures come from headless software-rasterised Chromium on this host. They are relative comparisons, not a claim about GPU-accelerated or physical-device frame rates.
- Touch and layout checks use Chromium emulation, not physical phones, and not Safari/Firefox.
- The 64 MiB budget assertion bounds Canvas backing stores only, not total browser/GPU/compositor memory.
- Audio evidence is waveform-level, not human listening certification.

## Recovery

Restore the previous release by pointing `main` back at v1.0.0's commit and publishing that runtime in a NEW gh-pages commit. Never force-push and never move a tag. Rollback target: `de7e75f`.

---

# Moonlit Courier publication — 2026-10-23 (historical, v1.0.0)

- Live: https://aichrisz.github.io/moonlit-courier/
- Source: https://github.com/aichrisz/moonlit-courier
- Authorization: Abel approved the three-level game, exact-Astra/TDD/review and NEW public repository/Pages with "ya gas"; later explicitly requested continuation. No new permission prompt or unrelated provider/config change.
- Immutable `v1.0.0` game source: `de7e75fb88912b0cbca7ac4e5d66e72c92a7bf3c`. Source ZIP91 exact committed files;43,678-byte self-contained HTML, six embedded scripts. Later publication documentation is a separate main commit, never a retag/replacement of this source artifact.
- Pages `gh-pages`: `d907f1ddd71f718d05bc0bb0f2fdc5acd39eb5a1`. Runtime-only eight files plus `.nojekyll`; exact latest built commit, explicit project root source, HTTPS, all8 public bodies match source/build hashes. No tests/ZIP/docs/credentials published to Pages.

## Real verification

- Implementation and independent parent full runs:48 unit and16 browser, zero fail/cancelled/skips/flaky, online audit0. Source/build/offline all-nine-letter/three-exit campaigns and six desktop/touch-emulated lifecycle variants passed. Resumed check/build/export/unit/package/online audit passed again on identical source.
- Independent reference:144 ballistic comparisons,80 floor contacts,320 wall faces,32 ceiling contacts, invalid-time/deep-copy checks;321,888 deterministic mixed-input states;36 hostile-storage/progression cases;20 checkpoint/thin-hazard/carrier/wind/optional-exit cases. No expected collision/trajectory calculated by a production helper.
- Actual native WebAudio waveform on jump/re-enable, silent pause/mute/blur output, missing/rejected API with functioning gameplay. Cached gain and suspended context waveform are recorded separately; no human listening certification.
- Fresh exact-Astra review session `20261023_191825_69881d`: **ship**, no blockers. Actual model/provider verified from read-only session DB; all91 tracked bytes and HEAD/status/index/diff unchanged. Source fingerprint `19f4da1e87839a9511d304d01530e6834b96ace0e07c66bacd375e6c27cab474`.
- Nonblocking reviewer note: original native smoke only required nonempty dash HUD. Public smoke strengthens it to exact **Dash spent** plus actual >10px forward displacement, on both native desktop and two-finger touch emulation. This exposed no runtime defect; release source/tag were not modified.
- Public full campaign: actual9 pickups/all3 exits, zero deaths, persistent perfect marks, one write/completion and intact replay; one animation loop and no app/HTTP/request errors or outside-prefix requests. Public desktop+touch lifecycle and actual audio/fallback tests passed too.
- Source/history scan:91 tracked paths,108 blobs,14 commits at prepublication checkpoint, zero prohibited-path/credential-pattern hits. Archive reads every member against its immutable committed release source.

## Provenance / recovery

Machine-readable full hashes, review findings/attestation, public native reports, campaign and audio: `docs/evidence/publication-verification.json`. Reproduction protocol: `verification.md`; deep architecture: `architecture.md`; TDD RED/GREEN logs are preserved, not invented after implementation.

Pages auto-enabled between GET404 and POST, returning409. Recovery read back exact source/HTTPS/refs, waited for the already-pushed commit and compared live files; it did not recreate the repository or force/repeat a push. This is the first public deployment: no prior public rollback was tested. Future recovery restores this known-good eight-file runtime in a new commit and revalidates, never force-push or moving tags.

Chromium emulation is not physical phones, Safari/Firefox, manual screen-reader or human audio-perception acceptance. Optional time records do not enforce a deadline; local storage behavior/failure remains browser-dependent and visibly truthful.
