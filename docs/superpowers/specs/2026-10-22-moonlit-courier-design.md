# Moonlit Courier v1.0 — approved design

Approved by Abel on 2026-10-22: “ya gas”, replying to the complete three-level platformer, exact-Astra/TDD/independent-review and public GitHub Pages proposal. This written design records that approval; do not restart brainstorming or ask the same deployment permission again.

## Player experience
A short handcrafted 2D platform adventure, not an endless reskin of Neon Drift. A scarf-wearing night courier travels through warm-windowed rooftops, a clock tower and floating moon gardens. Three real traversable levels, each with three distinct letters, checkpoints and a mailbox exit. No enforced timer: the clock is optional personal-best motivation. For scope clarity, two letters per level are main-route deliveries and the third is a clearly labeled optional scenic-route letter for perfect completion; all nine are collectible and independently tested. UI must explicitly distinguish delivery requirement and bonus, never silently lock the player for missing an optional letter.

## Play rules and controls
- Run left/right: A/D or arrows. Jump: Space/W/ArrowUp. Horizontal air dash: Shift/X. Escape/P pauses/resumes. R restarts current level only while driving, not while editing settings. Native labeled touch controls for simultaneous movement+jump/dash.
- Ground jump has 100ms coyote tolerance and 120ms pre-landing input buffer; held jump is not repeated auto-jump. One horizontal air dash replenishes on safe landing; HUD visibly distinguishes ready/spent. Dash must not tunnel through solids/hazards. Predictable bounded jump physics, not frame-count timing.
- Gaps, solid platforms, a moving platform and visible wind obstacle/zone, introduced progressively. A fall/hazard causes fast automatic respawn at the last reached safe checkpoint; avoid spawn-in-hazard/death loops. Preserve letter collections within the current level across death. Reset only intended transient velocity, held inputs and dash state.
- The exit opens when two main-route letters are collected. The third scenic letter is optional and earns a perfect-delivery mark. Exit/level completion and record writes are idempotent. Next-level action after results; final third-level results show the complete night delivery and offer replay.
- Checkpoints change only after physically reaching them. Optional letters must be reachable without modifying simulation state. Every level has a deterministic recorded ordinary-input witness completing all three letters and exit.
- State graph: ready → playing ↔ paused → level-complete → next-level-ready, with final campaign-complete/replay. Respawn is an in-run recovery, not a soft lock. Blur/hidden/pagehide pauses and releases all inputs; never auto-resumes without consent.

## Visual and responsive direction
Midnight ink/blue-purple world, warm brass lanterns and cream typography; color is thematic scenery, not generic purple-card dashboard UI. Real rendered courier silhouette, animated scarf, outlined ledges, readable letter/envelope silhouettes, distinct checkpoint pennants and mailbox. Layered city, moon glow, rain/motes, clock face and garden flora visually differentiate the three levels. Smooth bounded camera follows the courier but respects world edges. Reduced-motion disables decorative shake/rain/trails/parallax, not the physics.
Arena and touch controls must remain usable together at320×568,390×844,768×1024,1366×768,1440×900 at DPR2. Preserve world aspect ratio, show floor/landing area, no HUD overlap or horizontal page overflow. Every action control is at least44CSS pixels. Legible pause/results overlays with native buttons/focus. DOM instructions/status mirror game progress; visual-reaction game is not claimed fully nonvisual accessible.

## Architecture / contracts
Zero runtime dependencies and no external runtime fonts/images/network. Plain JS/CSS/Canvas with original procedural art and optional synthesized WebAudio. Browser scripts also expose pure modules through CommonJS for Node tests; no runtime module loading/import requirement for file:// standalone.
- `levels.js`: `LEVELS` contains exactly3 complete handcrafted data definitions: id/name/world dimensions/spawn, solid platforms/moving-platform motions, hazards/wind/checkpoints, three `{id,x,y,optional}` letters, exit and deterministic native witness actions. Exactly two required and one optional per level.
- `engine.js`: exports `createGame(levelIndex=0, levelOverride=null)`, `stepGame(state,input,seconds=1/120)`, `snapshot(state)` and documented constants. Input keys `{left,right,jumpPressed,dashPressed}`; physics owns player AABB/velocity, collision, grounded/coyote/buffer/dash, collectibles, checkpoint/death/complete/elapsed state. One documented `state.player` shape `{x,y,vx,vy,w,h,grounded,facing,dashReady}`; snapshots deep detached. Pure functions do not access DOM, Canvas, Date, randomness, storage or WebAudio. Engine accepts synthetic level fixtures only in unit/oracle code; live app never exposes mutable state hooks or a teleport/complete API.
- `renderer.js`: receives detached snapshots plus time/preferences, renders the world/camera; no gameplay writes or collision inside paint.
- `records.js`: bounded versioned local save under a project-specific key, per-level unlock/required+bonus completion/best time; validate foreign/corrupt/out-of-range data and handle read/write denial separately. No timestamps treated as truth, no unbounded object merge/prototype pollution. Failed save is visible in the actual results, not a hidden welcome panel.
- `audio.js`: optional off-by-default WebAudio tones for jump/dash/letter/delivery; only after explicit user gesture; errors/unavailable API handled. Pause/blur/mute stops actual signal. Never autoplay or fetch remote music.
- `app.js`: native controls and key edge handling; fixed120Hz simulation accumulator based on rAF timestamp, boundedcatch-up and exactly one loop; pause resets timestamp and input. Settings preserve native keyboard default behavior for both keydown/keyup.
- Read-only DOM observability: canvas `#world` has detached current `data-player-x`, `data-player-y`, `data-grounded`, `data-level-index`, `data-phase`, `data-collected` updated from render state for geometry/native-input diagnostics. These attributes are output only and are never read back into simulation. No exposed engine instance or mutable window hook.
- Stable UI IDs: `#world`, `#start`, `#pause`, `#resume`, `#restart`, `#next`, `#replay`, `#letters`, `#bonus`, `#dash-status`, `#elapsed`, `#phase`, `#level-name`, `#deaths`, `#save-status`, `#sound`, `#sound-status`, `#reduced-motion`. Touch `button[data-input=left|right|jump|dash]`. Buttons may hide outside their appropriate phase; render/enable before focusing.

```text
native keyboard/pointer → app fixed-step controller → pure engine → detached snapshot
                                                        │                 ├→ Canvas renderer
                                                        │                 └→ DOM status + optional audio
                                                        └→ completed-level result → validated records
```

## Delivery, safety and evidence
- Target new public repository `aichrisz/moonlit-courier`, GitHub Pages project subpath `/moonlit-courier/`; user approval includes this publication. Do not publish untested local-only work or touch unrelated projects/providers/global model.
- Build copies an explicit runtime allowlist only to `dist/`; standalone `artifacts/Moonlit-Courier.html` embeds every local runtime file exactly once; source ZIP excludes node_modules/build/artifacts/git/private files. Refuse symlinks, dangling links and symlinked ancestors for all output helpers using synthetic fixtures, never host secrets.
- Dev-only pinned `@playwright/test=1.64.1`, `axe-core=4.14.0`, no runtime npm packages. Chromium executable `/root/.hermes/tools/chromium-1208/chrome-linux/chrome`; do not redownload browser unless unavailable.
- TDD vertical slices with actual RED→GREEN raw logs and meaningful failure reasons, no after-the-fact claim. Parent independent collision/ballistic/level reachability oracles and native-input tests; fresh read-only exact `gpt-6-astra` review bound to source fingerprint; independently rerun full check/build/export/unit/browser and online audit before ship.
- All nine letter locations and all three exits must be witnessed via ordinary input on source/build/offline; public smoke plus actual public native campaign completion after deploy. No mutable live-state hook and no test-by-teleport.
- Evidence distinguishes source tag, runtime Pages commit, publication-only docs commit; live bytes of every asset must match build and real public native controls must pass. Preserve history/tags, no force-push, no private files in Pages, rollback via new commit.
- Provide playable URL first, source URL, offline HTML and source ZIP, concise actual test counts and honest limits. Chromium emulation is not physical phone, Safari/Firefox, manual screen reader or human audio-perception certification.

## Non-goals
No online backend/accounts/analytics, multiplayer, combat/enemies/health system, inventory/crafting, procedural infinite world, metroidvania upgrades, copyrighted asset downloads, payments or external registrations. No claims about usability/performance not actually measured.
