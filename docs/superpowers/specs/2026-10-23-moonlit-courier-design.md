# Moonlit Courier — recovery note (2026-10-23)

This note is NOT a second game specification. The canonical approved design is `2026-10-22-moonlit-courier-design.md`, whose implementation already exists in `.worktrees/v1`, branch `feat/moonlit-courier-v1`, checkpoint `ce74e2a` with uncommitted records TDD work.

Discovery corrected an incomplete initial filename search: existing Moonlit Courier source was inside a hidden worktree. Do not launch a duplicate writer or replace that implementation. Main already had baseline `9a1c04c`; the later documentation-only `f5d68de` did not create the game.

Use the original exact interfaces `createGame`, `stepGame`, detached `snapshot`, with `jumpPressed`/`dashPressed`. Each level has two required deliveries and one clearly labeled optional scenic/perfect letter. All three letters and each exit must still be demonstrated through ordinary inputs in all three levels. The previous recovery draft incorrectly restated all letters as mandatory and proposed renamed APIs; those restatements are withdrawn, not a user-approved scope change.

The original exact-Astra session `20261022_210746_25e148` stopped on HTTP429, not a completed implementation. No writer remains active. An exact `gpt-6-astra` availability probe returned ASTRA_READY in session `20261023_062432_d81859`, verified via read-only session store. Resume the existing worktree/session rather than restart or change model. Parent-reserved `tests/parent/` must remain untouched by the implementer.

Public repository/GitHub Pages `aichrisz/moonlit-courier` remains approved by Abel's “ya gas” to the complete original proposal, but does not yet exist. Do not claim deployment until actual source/Pages/live-native verification.
