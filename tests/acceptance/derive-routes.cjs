/* Parent route derivation from level geometry + actual pure public input.
 * Does not import or trust the implementer's route witnesses or expected states.
 * Derived actions are later replayed via real browser keyboard/pointer input. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const ROOT=process.env.COURIER_ROOT||path.resolve(__dirname,'../..');
const {LEVELS}=require(ROOT+'/levels.js');
const {createGame,stepGame,CONSTANTS:C}=require(ROOT+'/engine.js');
assert.equal(LEVELS.length,3);
const routes=[],summaries=[];
for(let index=0;index<LEVELS.length;index++) {
  const level=LEVELS[index],game=createGame(index),actions=[];
  let ticks=0;
  function frame(input={}) {
    assert(ticks++<8000,'parent controller bounded');
    const normalized={left:!!input.left,right:!!input.right,jumpPressed:!!input.jumpPressed,dashPressed:!!input.dashPressed};
    const key=JSON.stringify(normalized),previous=actions[actions.length-1];
    if(previous&&previous.key===key)previous.frames++;
    else actions.push({frames:1,input:normalized,key});
    stepGame(game,normalized,C.STEP);
    assert.equal(game.deaths,0,`${level.id}: route must not rely on death/teleport`);
  }
  function walkTo(x) {
    let n=0;
    while(game.player.x<x&&game.phase==='playing') {assert(n++<2000,'walk bounded');frame({right:true});}
  }
  function land() {
    let n=0;
    while(!game.player.grounded&&game.phase==='playing') {assert(n++<300,'landing bounded');frame();}
  }
  function leap({dash=false,target=null}={}) {
    assert(game.player.grounded,'start each planned jump grounded');
    frame({right:true,jumpPressed:true});
    if(dash) {
      for(let i=1;i<30;i++)frame({right:true});
      frame({right:true,dashPressed:true});
    }
    let n=0;
    while(game.phase==='playing'&&(!game.player.grounded||(target!==null&&game.player.x<target))) {
      assert(n++<500,'leap bounded');
      frame({right:target===null||game.player.x<target});
    }
  }
  for(let i=0;i<4;i++)frame();
  const floorY=level.spawn.y+game.player.h;
  const roofs=level.platforms.filter(p=>!p.motion&&p.y===floorY).sort((a,b)=>a.x-b.x);
  assert.equal(roofs.length,4,'handcrafted main route has four roofs');
  walkTo(roofs[0].x+roofs[0].w-60);leap();
  const optional=level.letters.find(l=>l.optional);
  const perch=level.platforms.find(p=>!p.motion&&p.y<floorY&&optional.x>=p.x&&optional.x<=p.x+p.w);
  assert(perch,'scenic letter has a real reachable perch');
  walkTo(perch.x-100);leap({target:optional.x});
  assert(game.collected.includes(optional.id),'parent-derived scenic branch must collect bonus');
  walkTo(roofs[1].x+roofs[1].w-60);land();leap({dash:true});
  const hazards=level.hazards.filter(h=>h.x>game.player.x&&h.x<roofs[2].x+roofs[2].w).sort((a,b)=>a.x-b.x);
  for(const hazard of hazards) {
    walkTo(hazard.x-90);land();leap({target:hazard.x+hazard.w+30});land();
  }
  walkTo(roofs[2].x+roofs[2].w-60);land();leap({dash:true});
  walkTo(level.exit.x+level.exit.w);
  assert.equal(game.phase,'level-complete');
  assert.equal(game.collected.length,3);
  assert.deepEqual([...game.collected].sort(),level.letters.map(x=>x.id).sort());
  const compact=actions.map(({frames,input})=>({frames,input}));
  routes.push(compact);
  summaries.push({index,id:level.id,ticks,seconds:game.elapsed,letters:[...game.collected],deaths:game.deaths,segments:compact.length,phase:game.phase});
}
const output={method:'independently derived geometry-driven route, no worker witnesses',step:C.STEP,routes,summaries};
fs.mkdirSync(path.join(ROOT,'artifacts/parent'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'artifacts/parent/derived-routes.json'),JSON.stringify(output,null,2));
console.log(JSON.stringify(summaries));
