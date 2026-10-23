(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./levels.js'));
  else root.MCEngine = factory(root.MCLevels);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (levels) {
  'use strict';
  const {LEVELS} = levels;
  // World pixels and seconds. The browser calls at STEP; fixtures may use up to 1/30s.
  const CONSTANTS = Object.freeze({
    STEP: 1/120, RUN: 240, GRAVITY: 1500, JUMP: 540, MAX_FALL: 780,
    COYOTE: 0.1, BUFFER: 0.12, DASH_SPEED: 660, DASH_TIME: 0.16, MAX_TRAVEL: 2
  });
  const copy = value => JSON.parse(JSON.stringify(value));
  const overlaps = (a, b) => a.x < b.x+b.w && a.x+a.w > b.x &&
    a.y < b.y+b.h && a.y+a.h > b.y;

  function platformAt(base, time) {
    const platform = {...base};
    if (base.motion) {
      platform[base.motion.axis] += Math.sin(time*2*Math.PI/base.motion.period)*base.motion.amplitude;
    }
    return platform;
  }

  function createGame(levelIndex = 0, levelOverride = null) {
    if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= LEVELS.length) {
      throw new RangeError('level index');
    }
    const level = copy(levelOverride || LEVELS[levelIndex]);
    return {
      levelIndex, level,
      player: {
        ...level.spawn, vx: 0, vy: 0, w: 24, h: 40,
        grounded: false, facing: 1, dashReady: true
      },
      elapsed: 0, ticks: 0, phase: 'playing', collected: [],
      checkpoint: copy(level.spawn), checkpointId: null, deaths: 0,
      coyote: 0, buffer: 0, dashTime: 0, dashDirection: 1, events: [],
      platforms: level.platforms.map(base => platformAt(base, 0))
    };
  }

  function respawn(state) {
    // Death preserves unique letters, elapsed time and reached checkpoint. Only the
    // movement transient is reset; the app consumes this event to release held input.
    Object.assign(state.player, state.checkpoint, {
      vx: 0, vy: 0, grounded: false, dashReady: true
    });
    state.deaths++;
    state.coyote = 0;
    state.buffer = 0;
    state.dashTime = 0;
    state.events.push('respawn');
  }

  function contacts(state) {
    const player = state.player;
    if (player.y > state.level.height+100 || state.level.hazards.some(h => overlaps(player, h))) {
      respawn(state);
      return false;
    }
    for (const checkpoint of state.level.checkpoints) {
      if (overlaps(player, checkpoint) && player.grounded && state.checkpointId !== checkpoint.id) {
        state.checkpoint = copy(checkpoint.spawn);
        state.checkpointId = checkpoint.id;
        state.events.push('checkpoint');
      }
    }
    for (const letter of state.level.letters) {
      const bounds = {x: letter.x-12, y: letter.y-10, w: 24, h: 20};
      if (!state.collected.includes(letter.id) && overlaps(player, bounds)) {
        state.collected.push(letter.id);
        state.events.push('letter');
      }
    }
    const required = state.level.letters.filter(letter => !letter.optional);
    if (required.every(letter => state.collected.includes(letter.id)) && overlaps(player, state.level.exit)) {
      state.phase = 'level-complete';
      state.events.push('delivery');
      return false;
    }
    return true;
  }

  function stepGame(state, input = {}, seconds = CONSTANTS.STEP) {
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 1/30) {
      throw new RangeError('seconds must be finite in (0,1/30]');
    }
    // Completed states are inert: no repeated deliveries, clock updates or events.
    if (state.phase !== 'playing') return state;
    state.events = [];
    state.ticks++;
    const player = state.player;
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    state.coyote = player.grounded ? CONSTANTS.COYOTE : Math.max(0, state.coyote-seconds);
    state.buffer = input.jumpPressed ? CONSTANTS.BUFFER : Math.max(0, state.buffer-seconds);
    if (direction && state.dashTime <= 0) player.facing = direction;
    if (state.buffer > 0 && state.coyote > 0) {
      player.vy = -CONSTANTS.JUMP;
      player.grounded = false;
      state.coyote = 0;
      state.buffer = 0;
      state.events.push('jump');
    }
    if (input.dashPressed && !player.grounded && player.dashReady) {
      player.dashReady = false;
      state.dashTime = CONSTANTS.DASH_TIME;
      state.dashDirection = player.facing;
      state.events.push('dash');
    }

    // At authored speeds each microstep travels <=2px. Test both axes and contacts
    // separately, so a thin hazard/ledge cannot be skipped even with a 1/30s call.
    const count = Math.ceil(seconds*Math.max(CONSTANTS.MAX_FALL, CONSTANTS.DASH_SPEED)/CONSTANTS.MAX_TRAVEL);
    const dt = seconds/count;
    for (let index = 0; index < count; index++) {
      const previous = state.platforms;
      state.elapsed += dt;
      state.platforms = state.level.platforms.map(base => platformAt(base, state.elapsed));
      // Carry only an actual grounded passenger, using the previous top surface.
      if (player.grounded) {
        const support = previous.findIndex(base =>
          Math.abs(player.y+player.h-base.y) < 0.01 &&
          player.x+player.w > base.x && player.x < base.x+base.w);
        if (support >= 0) {
          player.x += state.platforms[support].x-previous[support].x;
          player.y += state.platforms[support].y-previous[support].y;
        }
      }
      if (state.dashTime > 0) {
        player.vx = state.dashDirection*CONSTANTS.DASH_SPEED;
        player.vy = 0;
        state.dashTime = Math.max(0, state.dashTime-dt);
      } else {
        player.vx = direction*CONSTANTS.RUN;
        player.vy = Math.min(CONSTANTS.MAX_FALL, player.vy+CONSTANTS.GRAVITY*dt);
        for (const wind of state.level.wind) {
          if (overlaps(player, wind)) player.vx += wind.force;
        }
      }
      player.x += player.vx*dt;
      for (const base of state.platforms) {
        if (overlaps(player, base)) {
          player.x = player.vx > 0 ? base.x-player.w : base.x+base.w;
          player.vx = 0;
          state.dashTime = 0;
        }
      }
      player.x = Math.max(0, Math.min(state.level.width-player.w, player.x));
      // Return immediately after death/completion: one event per contact, not per microstep.
      if (!contacts(state)) return state;
      player.y += player.vy*dt;
      player.grounded = false;
      for (const base of state.platforms) {
        if (overlaps(player, base)) {
          if (player.vy >= 0) {
            player.y = base.y-player.h;
            player.grounded = true;
            player.dashReady = true;
            state.dashTime = 0;
          } else {
            player.y = base.y+base.h;
          }
          player.vy = 0;
        }
      }
      if (!contacts(state)) return state;
    }
    return state;
  }

  function snapshot(state) { return copy(state); }
  return {createGame, stepGame, snapshot, CONSTANTS};
});
