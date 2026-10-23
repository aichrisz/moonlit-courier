# Independent acceptance protocol and release provenance

This document describes the parent's independent checks. It is not a fabricated
review verdict or a substitute for the actual raw results. Release is permitted
only when `artifacts/parent/final-gate.json` and the fresh review attestation pass.
The later publication record distinguishes immutable game source/tag, Pages
runtime commit and publication-only documentation. See `deployment.md` after
publication; the immutable prepublication source need not claim its own future
public URL or self-referential commit hash.

## Architecture under test

```text
native keyboard / simultaneous touch
                |
          private app controller (fixed 120Hz, one animation loop)
                |
       pure deterministic engine <---- immutable authored levels
                |
        detached snapshot ------> Canvas + DOM status
                |
    completion once --------> validated local record / actual save outcome
                |
       optional guarded synthesized audio (no runtime requests)
```

`docs/architecture.md` specifies constants, state shapes, collision/substep,
checkpoint, input, storage, audio and output-path contracts in detail. The UI
is a visual-reaction game: DOM checks do not certify nonvisual gameplay.

## Parent-owned portable checks

The original implementation writer never edited/staged `tests/parent`.
After that writer and its independent run stopped, parent-owned test source was
organized as **`tests/acceptance`** for reproducibility in the source archive.
This is an ownership/organization change, not a relaxation of the archive's
private/parent-temporary-path or symlink guards. Runtime data still contains no
witness schedules, mutable engine instance or completion/teleport hook.

Run from repository root after `npm ci --ignore-scripts`, build and export:

```sh
npm run verify
node tests/acceptance/physics.cjs
node tests/acceptance/derive-routes.cjs
node tests/acceptance/fuzz.cjs
node tests/acceptance/records.cjs
node tests/acceptance/recovery.cjs
node tests/acceptance/campaign.cjs source
node tests/acceptance/campaign.cjs dist
node tests/acceptance/campaign.cjs offline
node tests/acceptance/native.cjs source
COURIER_TOUCH=1 node tests/acceptance/native.cjs source
node tests/acceptance/native.cjs dist
COURIER_TOUCH=1 node tests/acceptance/native.cjs dist
node tests/acceptance/native.cjs offline
COURIER_TOUCH=1 node tests/acceptance/native.cjs offline
node tests/acceptance/audio.cjs
```

The repository's pinned Playwright/axe dev tools and configured Chromium path
are prerequisites, not runtime dependencies. Adjust the explicit Chromium path
when reproducing on another machine. Archive uses Python3 standard library.

- **Physics:** independent analytic ballistics/error bounds and rectangular
  floor/wall/ceiling faces, both directions/thin solids, invalid time and deep
  detached snapshots. Expected contact geometry never calls production helpers.
- **Routes:** derive legal action schedules from authored world geometry, not
  implementer `tests/routes.cjs`. Replay those actions through ordinary browser
  keys on source/build/offline. Require all nine actual pickups, all three exits,
  zero deaths, real persistent perfect marks, one write/completion and preserved
  replay records. Offline context must have only its embedded HTML request.
- **Fuzz:** bounded deterministic mixed inputs across every level; finite
  positions/resources/time, safe recovery, unique pickups and inert completion.
- **Records:** independent malformed/hostile/oversized corpus, separate read/write
  denial, exact progression, minimum best-time/perfect preservation and idempotence.
- **Recovery/obstacles:** real grounded checkpoint contact, retained letters,
  stable idle respawn, subpixel hazard dash at four accepted dt values in both
  directions, analytic horizontal/vertical moving support, analytic wind travel,
  and required-only completion without the optional scenic letter.
- **Native lifecycle:** real desktop keys and two-finger Chromium touch events,
  move/jump/dash, pause freeze/resume, blur release, restart, geometry and single
  positive animation-chain instrumentation across source/build/offline.
- **Actual audio:** native AudioContext analyser waveform after opt-in; measurable
  jump/re-enabled tone; pause/mute/blur graph silence and handled missing/rejected
  API with real movement still functioning. Retain raw buffer RMS, native context
  state and cached gain separately; a suspended graph can retain a stale gain
  value without audible output. No human listening claim.

## Evidence binding and safety

Parent raw logs, JSON reports and actual screenshots live under ignored
`artifacts/parent/`. Independent runs snapshot and recheck all eight runtime
hashes. The parent full suite snapshots every behavior-bearing tracked JS/CJS/
Python file and dependency metadata; documentation finalization may overlap
without modifying those tested bytes. Final clean-candidate binding rechecks
that full tested-file set, runtime hashes, final manifest and fresh unit suite.
This avoids treating an older selected browser report as a full run or repeating
a lengthy unchanged campaign merely because a documentation commit was added.

Fresh exact `gpt-6-astra` review uses a separate session and a bounded read-only
brief. Parent independently checks actual model/session and all tracked bytes,
HEAD, status, staged and unstaged fingerprints before accepting `ship` with no
blockers. This is behaviorally verified read-only, not a claim of OS sandboxing.

Before publication, parent scans tracked/history paths and credential patterns;
verifies explicit eight-file runtime allowlist, source/build identity and every
standalone embedding; and reads every ZIP member against the exact committed
release tree. Package must reject dirty/missing/extra source, manifest traversal,
private/generated paths, symlinks including dangling/ancestor links and unsafe
outputs using synthetic fixture sentinels, never actual host secrets.

Public release must then read back exact source/tag/Pages refs, built commit,
HTTPS/source branch and every live runtime body. Public native full campaign
and desktop/touch lifecycle checks run at `/moonlit-courier/`, with no app/HTTP/
request errors or unintended third-party requests. First-ever publication has
no older public version to claim as a tested rollback anchor; recovery is a new
commit restoring this known-good runtime, never force-push or retagging.

## Limits

Chromium viewport/touch emulation is not physical-device, Safari/Firefox,
manual screen-reader or human auditory certification. Optional time records
are motivation, not an enforced deadline. Local storage/file-origin behavior
is browser-dependent and failures must remain visibly truthful. No paid
services, backend, accounts, telemetry or external runtime assets are added.
