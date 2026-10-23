/* Parent-owned sustained mixed-input invariants on the real shipped level data. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=process.env.COURIER_ROOT||path.resolve(__dirname,'../..');
const {LEVELS}=require(ROOT+'/levels.js');const {createGame,stepGame,CONSTANTS:C}=require(ROOT+'/engine.js');
assert.equal(LEVELS.length,3);const names=new Set(LEVELS.map(l=>l.name));assert.equal(names.size,3);
let stateCount=0,deaths=0,completions=0;
for(let levelIndex=0;levelIndex<LEVELS.length;levelIndex++){
 const l=LEVELS[levelIndex];assert.equal(l.letters.length,3);assert.equal(new Set(l.letters.map(x=>x.id)).size,3);assert.equal(l.letters.filter(x=>!x.optional).length,2);assert.equal(l.letters.filter(x=>x.optional).length,1);
 for(let seed=1;seed<=32;seed++){
  const g=createGame(levelIndex);let random=seed*7919+levelIndex*1301,lastDeaths=0,lastTime=0;
  const rng=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return (random>>>0)/4294967296;};
  for(let n=0;n<3600;n++){
   const r=rng(),input={left:r<.20,right:r>=.20&&r<.84,jumpPressed:rng()<.065,dashPressed:rng()<.03};stepGame(g,input,C.STEP);const p=g.player;stateCount++;
   for(const key of ['x','y','vx','vy','w','h'])assert(Number.isFinite(p[key]),`${l.id}/${seed}/${n}: ${key}`);
   assert(p.x>=-1e-7&&p.x+p.w<=l.width+1e-7,'horizontal world bounds');assert(p.y<l.height+500,'fall cannot persist indefinitely below world');
   assert.equal(typeof p.dashReady,'boolean');assert.equal(typeof p.grounded,'boolean');assert(g.elapsed>=lastTime,'deaths cannot reset timing to improve records');lastTime=g.elapsed;
   assert(g.deaths>=lastDeaths&&g.deaths<=lastDeaths+1,'death recovery is idempotent per simulation tick');lastDeaths=g.deaths;
   assert(g.collected.length<=3&&new Set(g.collected).size===g.collected.length,'letters bounded and unique');assert(g.collected.every(id=>l.letters.some(x=>x.id===id)),'no phantom letters');
   if(g.phase==='level-complete'){assert(l.letters.filter(x=>!x.optional).every(x=>g.collected.includes(x.id)),'exit cannot complete without required letters');const before=JSON.stringify(g);stepGame(g,{right:true,jumpPressed:true,dashPressed:true},C.STEP);assert.equal(JSON.stringify(g),before,'completed state frozen/idempotent');completions++;break;}
  }
  deaths+=g.deaths;
 }
}
const report={levels:LEVELS.map(x=>x.id),seedsPerLevel:32,maxTicksPerSeed:3600,stateCount,deaths,completions};fs.mkdirSync(path.join(ROOT,'artifacts/parent'),{recursive:true});fs.writeFileSync(path.join(ROOT,'artifacts/parent/fuzz.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
