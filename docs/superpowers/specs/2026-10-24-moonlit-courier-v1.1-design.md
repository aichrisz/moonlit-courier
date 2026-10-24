# Moonlit Courier v1.1 — Moonlit storybook polish

Date: 2026-10-24. Approval: Abel replied **boleh** to the full five-part polish proposal, explicitly including exact Astra implementation, independent review and deployment to the existing public URL. This document makes that approved proposal testable; it adds no levels, mechanics, service, payment or account scope.

## Visual target
Retain the warm editorial night-post identity, navy/cream/brass/mint palette and handcrafted Canvas artwork. Make the game feel like a finished illustrated adventure rather than a prototype. Do NOT reskin as neon/cyberpunk or add generic card grids. Desktop screenshot reference is the current published game; before/after images must be actual captured game frames, not generated concept art represented as implementation.

## Geometry and responsive arena
- Remove INTERNAL letterboxing: stage content and Canvas drawing viewport have the same aspect ratio, without nonuniform stretch/cropping gameplay.
- Desktop world viewport960×540. Compact route header/HUD and center the largest16:9 stage that permits actual arena and all four44px controls in a1366×768 viewport after normal stage scrolling.
- Mobile <=600px may use a render-only720×540 (4:3) view to increase projected player/letter size. This changes only how much world is seen: camera clamps to level.width - viewportWidth and follows at the same relative anchor330/960. Physics coordinates, collision boxes, authored geometry and input timing remain identical. CSS and renderer must agree on the breakpoint/aspect, including resize/orientation. On narrow short screens fit stage+controls, not a fixed huge blank panel.
- Check320×740,390×844,768×1024,1366×768 and1440×900, plus mobile landscape844×390. No horizontal document overflow, nonzero undistorted Canvas, no hidden/clipped buttons. Preferences and important overlay content remain accessible by normal scrolling where necessary.

## Illustrated scenes
- Cache sky and at least three distinct building/scenery layers separately, then actually translate them by different bounded camera factors. Do not bake all layers into one image and call its single offset independent parallax.
- City: layered inhabited roofs, lantern pools, chimneys/railings and light fog. Clock: prominent original XIII dial/tower and distinctive rooftops. Garden: moonlit foliage/arches and floating-garden shapes. Preserve unmistakable playable ledges and clear hazardous surfaces; soft effects never conceal them.
- Courier gains a stronger contrasting silhouette, cap/face/satchel detail, readable boots/stride, ascending/falling poses and scarf/coat secondary motion. Body aligns with original physical feet and hitbox; no dishonest enlargement of colliding body. Prefer better projection/readability, not fake larger collision regions.

## Feedback, accessibility and motion
- Bounded render-only feedback for pickup, dash, landing, reached checkpoint and completed delivery. Observe real snapshots/events exactly once; drawing the same tick repeatedly cannot duplicate effects. Finite capped pools/trails, no per-event intervals or additional rAF loops; reset on restart/new route/replay and avoid stale events across pause.
- Reduced-motion preference and Less decoration remove nonessential particles/trails/scarf/parallax and animated stamp effects while retaining static status, hazard visibility and unchanged simulation. Never use flashes, mandatory screen shake or color alone to convey readiness.
- Postal HUD: two required envelope slots + one separate optional scenic slot, text equivalents preserved; clear discrete ready/spent dash meter (landing restores, NO invented timed refill), optional time and returns lower prominence. Preserve existing visible status IDs/text semantics for accessibility/testing, including #dash-status ready/spent.
- Welcome/pause/results share a refined mail-card treatment; result stamps distinguish delivered/perfect and remain truthful when storage save fails. Native keyboard focus, checkbox/select behavior, simultaneous touch/cancellation and44px targets remain correct. Audio remains opt-in and unchanged.

## Frozen contracts
`engine.js`, `levels.js`, `records.js`, `audio.js` must be BYTE-IDENTICAL to main1fbc0c2. No dependency additions/upgrades, runtime remote assets/network/analytics or mutable live game hooks. `app.js` may change ONLY presentation derivation/markup synchronization and bounded visual feedback notification; keep120Hz stepping, input lifecycle, save-once and storage key/version untouched. New code has clear inline WHY comments and deep architecture/flow documentation. Prefer existing eight runtime files; split renderer helpers only if needed for clarity and update the explicit pipeline/script-order/standalone boundary tests honestly.

## Tests and release acceptance
- Real RED before each substantive behavior change, preserve raw output; assertions test runtime behavior rather than source-regex shape. Do not loosen old mechanics, storage or security assertions to hide regressions. Correct a strictly visual obsolete assertion only with documented replacement proving the stronger intended behavior.
- New browser coverage for actual arena/canvas geometry, mobile scaling, envelope/dash state, result stamps, reduced preference, finite effect count/reset and responsive resize. New pure tests for any feedback helpers, immutable input snapshots, bounded capacity and no duplicate event processing. Keep old unit/browser/acceptance suites.
- Parent independently checks frozen bytes, full source/build/offline campaigns (all9 letters/all3 exits), desktop/touch lifecycle including spent dash plus displacement, long render stability/bounds and native audio. Actual screenshots all3 scenes and desktop/mobile before/after; final visual review by parent.
- No time-to-frame requirement inferred from a fake Playwright clock. Record real representative frame cost if measured; optimization must not sacrifice legibility/correctness.
- Final candidate committed and clean; manifest exactly tracked source; ZIP members equal committed source bytes; standalone genuinely offline and CSS+all scripts embedded. History/path/credential-pattern scan emits counts/paths, never secrets.
- Fresh fingerprint-bound exactgpt-6-astra read-only review, actual model verified, ship verdict and unchanged candidate. Parent—not implementation worker—merges, immutablev1.1.0 tag, pushes and deploys only runtime allowlist on existing gh-pages with retained history, then verifies exact remote refs/latest built commit/HTTPS/public bytes and real public gameplay/touch.
- Preserve v1.0.0/de7e75f and old known-good Pagesd907f1d as rollback anchors. Report v1.1 source/tag, deployment and later docs commits distinctly. Deliver live URL, offline HTML, source ZIP, real preview and honest emulation limits; reconcile vault+backup.
