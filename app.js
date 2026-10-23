(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const {createGame, stepGame, snapshot, CONSTANTS} = MCEngine;
  const storage = {getItem: key => localStorage.getItem(key), setItem: (key,value) => localStorage.setItem(key,value)};
  const loaded = MCRecords.load(storage);
  let records = loaded.data;
  let game = createGame(records.unlocked);
  let phase = 'ready', last = null, accumulator = 0;
  let keys = new Set(), edges = {jumpPressed:false,dashPressed:false};
  const canvas = $('world');
  const audio = MCAudio.createAudio(globalThis,message=>{$('sound-status').textContent=message;});
  $('sound').addEventListener('change',()=>{void audio.enable($('sound').checked);});
  const moves = {ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyW:'jump',ArrowUp:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyX:'dash'};
  $('save-status').textContent = ({loaded:'Previous deliveries loaded on this device.',invalid:'Unreadable save ignored. Your next delivery can create a new record.', 'read-denied':'Storage read unavailable. You can still play this night.'})[loaded.status] || 'Progress stays on this device when storage is available.';

  const pointers = new Map();
  function release() {
    keys.clear(); edges = {jumpPressed:false,dashPressed:false};
    const held = [...pointers]; pointers.clear();
    for(const [id,button] of held) {
      button.classList.remove('pressed');
      try { if(button.hasPointerCapture(id)) button.releasePointerCapture(id); } catch { /* Already cancelled. */ }
    }
  }
  function transition(next) {
    phase = next; last = null; accumulator = 0; release();
    audio.setPlaying(phase==='playing');
    update();
    const focus = {playing:'world',paused:'resume',ready:'start','level-complete':'next','campaign-complete':'replay'}[phase];
    if (focus) $(focus).focus({preventScroll:true});
  }
  function newLevel(index) {
    game = createGame(index); transition('ready');
  }
  function update() {
    const s = snapshot(game), p = s.player;
    // Output-only telemetry. Nothing in the controller reads these attributes back.
    Object.assign(canvas.dataset, {playerX:String(p.x),playerY:String(p.y),grounded:String(p.grounded),levelIndex:String(s.levelIndex),phase,collected:JSON.stringify(s.collected),ticks:String(s.ticks)});
    $('level-name').textContent = s.level.name;
    $('route-number').textContent = `ROUTE 0${s.levelIndex+1} / 03`;
    const main = s.level.letters.filter(l=>!l.optional && s.collected.includes(l.id)).length;
    const bonus = s.level.letters.filter(l=>l.optional && s.collected.includes(l.id)).length;
    $('letters').textContent = `Post ${main} / 2 required`;
    $('bonus').textContent = `Scenic ${bonus} / 1 optional`;
    $('dash-status').textContent = p.dashReady ? 'Dash ready' : 'Dash spent';
    $('elapsed').textContent = s.elapsed.toFixed(1)+'s';
    $('deaths').textContent = 'Returns '+s.deaths;
    const results = phase==='level-complete'||phase==='campaign-complete';
    $('panel').hidden = phase==='playing';
    for (const [id,show] of Object.entries({start:phase==='ready',resume:phase==='paused',restart:phase==='paused',next:phase==='level-complete',replay:phase==='campaign-complete',pause:phase==='playing',selection:phase==='ready'})) $(id).hidden=!show;
    if(phase==='ready') {
      $('panel-title').textContent = s.levelIndex===0 ? 'Some wishes travel by moonlight.' : s.level.name;
      $('panel-description').textContent = 'Two letters open the mailbox. Take the scenic route for a third, perfect-delivery letter.';
    } else if(phase==='paused') {
      $('panel-title').textContent='The city can wait.';
      $('panel-description').textContent='Your route is paused. Resume when you are ready, or restart this neighbourhood.';
    } else if(results) {
      $('panel-title').textContent=phase==='campaign-complete'?'The night is delivered.':'A light left on for you.';
      $('panel-description').textContent=`${bonus?'Perfect delivery · all three letters.':'Delivery complete · scenic letter not collected.'} ${s.elapsed.toFixed(1)}s · ${s.deaths} returns. ${phase==='campaign-complete'?'All three neighbourhoods reached. Thank you, courier.':'The next neighbourhood is waiting.'}`;
    }
    $('panel-kicker').textContent=results?'SIGNED, SEALED, DELIVERED':phase==='paused'?'TAKE A BREATH':'A SMALL ADVENTURE AFTER DARK';
    $('phase').textContent=phase==='playing'?(main===2?'Mailbox open → Scenic letter is optional.':'Find two post letters. Pennants are safe checkpoints.'):phase==='paused'?'Paused · controls released.':results?'Delivery complete · '+(bonus?'perfect scenic stamp earned.':'optional scenic stamp not earned.'):'Ready · choose an unlocked neighbourhood.';
    const select=$('level-select');
    for(let i=0;i<3;i++){
      select.options[i].disabled=i>records.unlocked;
      select.options[i].textContent=`0${i+1} · ${MCLevels.LEVELS[i].name}${i>records.unlocked?' — locked':''}`;
    }
    select.value=String(s.levelIndex);
    const record=records.levels[s.levelIndex];
    $('record-summary').textContent=record.complete?`Best ${record.best.toFixed(1)}s · ${record.perfect?'perfect stamp':'delivered'}`:'No delivery record yet.';
    MCRenderer.draw(canvas,s,s.elapsed,$('reduced-motion').checked);
  }
  function completed() {
    try {
      records=MCRecords.complete(records,game.levelIndex,{elapsed:game.elapsed,collected:game.collected.length});
      const saved=MCRecords.save(storage,records);
      $('save-status').textContent=saved.ok?'Saved on this device. Your best time and scenic stamp are safe.':'Not saved: storage write unavailable. Progress remains for this session only.';
    } catch {
      $('save-status').textContent='Not saved: this run is outside the supported record bounds. Your delivery still counts for this session.';
    }
    transition(game.levelIndex===2?'campaign-complete':'level-complete');
  }
  $('start').addEventListener('click',()=>transition('playing'));
  $('pause').addEventListener('click',()=>transition('paused'));
  $('resume').addEventListener('click',()=>transition('playing'));
  $('restart').addEventListener('click',()=>{game=createGame(game.levelIndex);transition('playing');});
  $('next').addEventListener('click',()=>newLevel(game.levelIndex+1));
  $('replay').addEventListener('click',()=>newLevel(0));
  $('level-select').addEventListener('change',e=>{const n=Number(e.target.value);if(n<=records.unlocked)newLevel(n);});
  function editing(target) {return target instanceof Element && !!target.closest('input,select,textarea,button,a,[contenteditable=true]');}
  window.addEventListener('keydown',e=>{
    if(editing(e.target) && !(e.target instanceof HTMLButtonElement && ['Escape','KeyP'].includes(e.code)))return;
    if(['Escape','KeyP'].includes(e.code)){
      e.preventDefault();if(!e.repeat&&(phase==='playing'||phase==='paused'))transition(phase==='playing'?'paused':'playing');return;
    }
    if(phase!=='playing')return;
    if(e.code==='KeyR'){e.preventDefault();if(!e.repeat){game=createGame(game.levelIndex);transition('playing');}return;}
    const action=moves[e.code];if(!action)return;e.preventDefault();
    if(!keys.has(e.code)&&!e.repeat){if(action==='jump')edges.jumpPressed=true;if(action==='dash')edges.dashPressed=true;}
    keys.add(e.code);
  });
  window.addEventListener('keyup',e=>{
    keys.delete(e.code);if(editing(e.target))return;
    if(moves[e.code]&&phase==='playing')e.preventDefault();
  });
  // Independent pointer identities let movement, jump and dash coexist on real touchscreens.
  for(const button of document.querySelectorAll('[data-input]')) {
    button.addEventListener('pointerdown',e=>{
      if(phase!=='playing')return;
      e.preventDefault();canvas.focus({preventScroll:true});
      pointers.set(e.pointerId,button);button.classList.add('pressed');
      try { button.setPointerCapture(e.pointerId); } catch { /* Synthetic cancellation tests may have no active pointer. */ }
      if(button.dataset.input==='jump')edges.jumpPressed=true;
      if(button.dataset.input==='dash')edges.dashPressed=true;
    });
    const lift=e=>{pointers.delete(e.pointerId);if(![...pointers.values()].includes(button))button.classList.remove('pressed');};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,lift);
  }
  const leave=()=>{release();if(phase==='playing')transition('paused');};
  window.addEventListener('blur',leave);
  window.addEventListener('pagehide',leave);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});
  $('reduced-motion').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function decoration(){document.body.classList.toggle('quiet',$('reduced-motion').checked);update();}
  $('reduced-motion').addEventListener('change',decoration);decoration();
  function frame(now) {
    if(last===null)last=now;
    const delta=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
    if(phase==='playing'){
      accumulator+=delta;
      while(accumulator+1e-9>=CONSTANTS.STEP && phase==='playing'){
        const held=[...[...keys].map(k=>moves[k]), ...[...pointers.values()].map(b=>b.dataset.input)];
        stepGame(game,{left:held.includes('left'),right:held.includes('right'),...edges},CONSTANTS.STEP);
        edges={jumpPressed:false,dashPressed:false};accumulator-=CONSTANTS.STEP;
        for(const event of game.events)audio.play(event);
        if(game.events.includes('respawn'))release();
        if(game.phase==='level-complete')completed();
      }
    }
    update();
    requestAnimationFrame(frame); // The only scheduling site; transitions never start another chain.
  }
  update();$('start').focus({preventScroll:true});requestAnimationFrame(frame);
})();
