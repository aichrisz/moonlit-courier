# Architecture and contracts

## Boundaries

Native keyboard/pointer events enter the private controller in `app.js`. It advances the pure engine on a fixed 1/120-second accumulator, then sends a detached snapshot to `renderer.js` and mirrors progress into DOM text. `records.js` and `audio.js` receive explicit platform adapters. There is no exported live game instance, teleport, forced-completion API, dynamic evaluator or network runtime loader.

The CommonJS/browser wrappers expose `MCLevels`, `MCEngine`, `MCRecords`, `MCAudio` and `MCRenderer` module APIs in a browser. These are modules, not the controller's mutable state. Node simulation uses only `levels.js` and `engine.js`: no DOM, Date, random values, storage or audio. Runtime scripts are ordered once in `index.html` and embedded once by the standalone exporter.

## Level data and pure engine

`levels.js` exports deep-frozen `LEVELS`, exactly three definitions. Each includes `id`, `name`, `subtitle`, `theme`, `width`, `height`, `spawn`, `platforms`, `hazards`, `wind`, `checkpoints`, `letters` and `exit`. Positions/sizes use world pixels, positive y downward. Solids/hazards/exits use `{x,y,w,h}`; a platform may add `motion:{axis,amplitude,period}`. Motions are sinusoidal relative to their authored base position; period is seconds. Wind adds `force` to horizontal speed when overlapping the zone. Each checkpoint has an id, contact bounds and a stationary safe spawn. Letters use center coordinates `{id,x,y,optional}`, with 24×20 pickup bounds. Exactly two are required and one scenic. Witness schedules belong in tests, not production data.

`engine.js` exports:

- `createGame(levelIndex=0, levelOverride=null)`: validates index 0–2 and deep-copies the authored definition or a complete synthetic test fixture. Overrides must provide the same finite, bounded data shape; arbitrary hostile fixture values are not a supported game-content format.
- `stepGame(state,input,seconds=1/120)`: mutates/returns that pure state. Input is `{left,right,jumpPressed,dashPressed}`; the last two are edge events, not held keys. Invalid/nonfinite durations or durations outside `(0,1/30]` throw RangeError. Completed states are inert.
- `snapshot(state)`: deep detached JSON-compatible observation, including nested level/platform/letter state.
- `CONSTANTS`: frozen public values below.

Player fields are exactly `{x,y,vx,vy,w,h,grounded,facing,dashReady}`. Spawn body is 24×40; `facing` is ±1. State additionally contains `levelIndex`, copied `level`, `elapsed`, `ticks`, pure `phase` (`playing` or `level-complete`), unique `collected` ids, checkpoint spawn/id, `deaths`, coyote/buffer/dash timers, dash direction, per-call `events`, and current moving `platforms`. `ticks` counts accepted playing calls, while elapsed advances by simulated substeps (a terminal contact may stop a call early).

| Constant | Value | Units / role |
|---|---:|---|
| STEP | 1/120 | seconds per app simulation tick |
| RUN | 240 | pixels/second |
| GRAVITY | 1500 | pixels/second² |
| JUMP | 540 | upward speed magnitude |
| MAX_FALL | 780 | pixels/second |
| COYOTE | 0.1 | seconds after leaving support |
| BUFFER | 0.12 | seconds retained jump edge |
| DASH_SPEED | 660 | horizontal pixels/second |
| DASH_TIME | 0.16 | seconds; direction locks at activation |
| MAX_TRAVEL | 2 | authored-speed microstep displacement bound |

Each accepted call is subdivided using the maximum authored dash/fall speed. Collision resolves horizontal and vertical axes separately, with hazard/letter/checkpoint/exit contacts between axes. This prevents thin obstacles being skipped at supported speeds. Moving support is identified against its previous top surface before carrying a grounded passenger. Only downward solid contact restores the dash charge. Dash freezes vertical speed and cannot be recharged in air. Checkpoints require physical grounded overlap. Death returns immediately, resets movement timers/velocities and restores dash; it retains letters, elapsed time and checkpoint. The emitted `respawn` event tells the controller to release held controls. Exit completion also returns immediately and never increments/writes a result again.

## Browser controller and observability

The app has one rAF chain, never started by phase transitions. Delta catch-up is clamped to 100ms; transitions reset timestamp/accumulator and all held keys/pointers. Large stalls deliberately do not fast-forward the courier through seconds of unseen obstacles. Render receives snapshots only; camera is bounded to the world and 960×540 view. The Canvas backing store supports DPR up to 2, while CSS object-fit preserves the image aspect with letterboxing where needed.

Browser phases are `ready → playing ↔ paused → level-complete → ready`, then `campaign-complete → ready` on replay. Results focus Next/Replay only after showing the button; pause focuses Resume. Escape/P work while that native button owns focus. Form controls retain native keydown and keyup defaults, including checkbox Space. Touch pointers are tracked separately, so direction/jump/dash can coexist; pointer-up/cancel/lost capture releases only the relevant pointer. Blur, hidden document and pagehide pause/release, never auto-resume.

Canvas `#world` mirrors `data-player-x`, `data-player-y`, `data-grounded`, `data-level-index`, `data-phase`, `data-collected` (JSON id array) and extra `data-ticks`. They are output only. Changing them cannot change gameplay. Required HUD/action/settings IDs are the approved spec IDs; additional selection IDs are `level-select`, `record-summary` and `selection`.

## Records and audio

`records.js`: `KEY='moonlit-courier.v1'`, `MAX_SECONDS=86400`, `empty()`, `validate(data)`, `load(storage)`, `save(storage,data)`, `complete(data,index,result)`. Data is `{version:1,unlocked:0..2,levels:[{complete,perfect,best},…]}`. Exactly three records, own exact keys, plain objects and bounded positive best times are required. Reads accept at most 4096 characters. `load` reports `empty`, `loaded`, `invalid` or `read-denied`; `save` returns `{ok,status}` with `saved`, `invalid` or `write-denied`. `complete` is used for legitimately unlocked routes with `{elapsed,collected:2|3}`; it preserves a better best/perfect stamp without counters that could double-increment. Invalid results throw. Write denial keeps session progress and displays “Not saved” in actual results. Corrupt data is ignored; no foreign merge or timestamp trust. Runs over the record-time bound remain playable but are not saved.

`audio.js` exposes `createAudio(host,onStatus)`, returning `enable(boolean)`, `setPlaying(boolean)`, `play(event)`. No AudioContext exists before opt-in. Tones are local sine oscillators with short envelopes. Pause/mute zeros the master signal, stops active voices and suspends the context; missing/rejected audio is reported as unavailable. Async resume rechecks flags so a pending resume cannot restore gain after a pause. Delivery results also suspend sound. Reduced decoration affects art, not collision or movement. Preferences are not saved.

## Delivery and verification

`public.cjs` defines the exact eight runtime files. Build/export preflight source and output ancestors with lstat; links, including dangling ones, are refused. Build refuses stray dist entries rather than recursively deleting them. Export validates exact script order and single stylesheet reference, then uses literal replacement callbacks to embed each source once. No runtime module imports/CORS dependency are introduced.

`source-files.json` explicitly enumerates committed source including itself. The Python packager checks lexical paths, every ancestor, bounded regular files, exact HEAD tree/index/manifest agreement and source bytes versus HEAD. It writes a deterministic relative-path ZIP with fixed entry metadata, reads every entry back, and writes verified per-source/ZIP SHA256 plus HEAD to `artifacts/evidence/package.json`. Outputs never include parent-owned untracked files. Tools are single-writer local delivery helpers, not a defense against hostile concurrent filesystem mutation.

`tests/routes.cjs` exports `{routes,drive}`. Each of three routes is `[{frames,input}]`; one frame is 1/120s, movement is held, jump/dash are first-frame edges. `drive` feeds only public engine inputs. Browser helpers mirror keys with cumulative millisecond rounding and Playwright clock windows; no simulation state injection. Pure witnesses also test ±1-frame jump-segment margins. Browser clock installation precedes rAF instrumentation. Axe temporarily uses a running clock to avoid frozen timer deadlocks.

The verification script runs check/build/export/unit/browser and online audit. Browser JSON and screenshots describe real Chromium runs; emulated viewports/touch are not physical-device or full nonvisual-accessibility certification. Independent parent acceptance/review/deployment remain outside worker scope.
