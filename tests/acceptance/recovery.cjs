/* Parent-owned recovery/obstacle oracle. Expected carrier/wind geometry is analytic;
 * input actions are legal edges, never a write to a running app or game instance. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=process.env.COURIER_ROOT||path.resolve(__dirname,'../..');
const {createGame,stepGame}=require(ROOT+'/engine.js');
const fixture=(extra={})=>({id:'parent-recovery',name:'Synthetic parent route',width:1000,height:540,spawn:{x:20,y:400},platforms:[{x:0,y:440,w:1000,h:100}],hazards:[],wind:[],checkpoints:[],letters:[],exit:{x:950,y:380,w:44,h:60},...extra});
const tick=(g,input={},n=1,dt=1/120)=>{for(let i=0;i<n;i++)stepGame(g,i?{left:!!input.left,right:!!input.right}:input,dt);return g;};
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let checkpointCases=0,thinHazardCases=0,carrierCases=0,windCases=0,optionalExitCases=0;
{
 const g=createGame(0,fixture({hazards:[{x:320,y:0,w:1,h:540}],checkpoints:[{id:'safe',x:190,y:390,w:40,h:50,spawn:{x:200,y:400}}],letters:[{id:'home',x:80,y:410,optional:false},{id:'dawn',x:280,y:410,optional:false},{id:'scenic',x:170,y:160,optional:true}]}));
 for(let i=0;i<400&&!g.deaths;i++)tick(g,{right:true});
 assert.equal(g.deaths,1);assert.equal(g.checkpointId,'safe');near(g.player.x,200);near(g.player.y,400);
 assert.deepEqual(g.collected,['home','dawn']);assert.equal(g.player.dashReady,true);assert.equal(g.player.vx,0);assert.equal(g.player.vy,0);
 tick(g,{},360);assert.equal(g.deaths,1,'safe checkpoint cannot immediately death-loop');assert.deepEqual(g.collected,['home','dawn']);checkpointCases++;
}
for(const dt of [1/240,1/120,1/60,1/30])for(const direction of [-1,1]){
 const g=createGame(0,fixture({spawn:{x:direction>0?330:450,y:400},hazards:[{x:400,y:0,w:0.1,h:540}]}));
 tick(g,{},4,dt);tick(g,{left:direction<0,right:direction>0,jumpPressed:true},1,dt);
 tick(g,{left:direction<0,right:direction>0,dashPressed:true},1,dt);
 for(let i=0;i<240&&!g.deaths;i++)tick(g,{left:direction<0,right:direction>0},1,dt);
 assert.equal(g.deaths,1,'air dash cannot cross a subpixel-wide full-height hazard');
 near(g.player.x,g.level.spawn.x);tick(g,{},80,dt);assert.equal(g.deaths,1);thinHazardCases++;
}
for(const axis of ['x','y']){
 const amplitude=axis==='x'?30:24,period=3;
 const g=createGame(0,fixture({spawn:{x:200,y:400},platforms:[{x:80,y:440,w:300,h:20,motion:{axis,amplitude,period}}]}));
 tick(g,{},120);assert(g.player.grounded);const start=g.player.x,t0=g.elapsed;
 tick(g,{},30);assert(g.player.grounded);
 if(axis==='x')near(g.player.x,start+amplitude*(Math.sin(g.elapsed*2*Math.PI/period)-Math.sin(t0*2*Math.PI/period)));
 else near(g.player.y,440+amplitude*Math.sin(g.elapsed*2*Math.PI/period)-40);
 carrierCases++;
}
for(const dt of [1/240,1/120,1/60,1/30])for(const direction of [-1,1]){
 const force=-55,g=createGame(0,fixture({spawn:{x:400,y:400},wind:[{x:0,y:0,w:1000,h:540,force}]}));tick(g,{},4,dt);const x=g.player.x;
 tick(g,{left:direction<0,right:direction>0},20,dt);near(g.player.x,x+(direction*240+force)*20*dt);windCases++;
}
{
 const g=createGame(0,fixture({letters:[{id:'required-a',x:100,y:410,optional:false},{id:'required-b',x:300,y:410,optional:false},{id:'optional',x:200,y:100,optional:true}],exit:{x:450,y:380,w:44,h:60}}));
 for(let i=0;i<400&&g.phase==='playing';i++)tick(g,{right:true});
 assert.equal(g.phase,'level-complete');assert.deepEqual(g.collected,['required-a','required-b']);
 const complete=JSON.stringify(g);tick(g,{right:true,jumpPressed:true,dashPressed:true},200);assert.equal(JSON.stringify(g),complete,'post-completion simulation cannot duplicate progress');optionalExitCases++;
}
const report={method:'parent analytic carrier/wind expectations plus legal-input hazard/recovery/optional-exit synthetic fixtures',checkpointCases,thinHazardCases,carrierCases,windCases,optionalExitCases};
fs.mkdirSync(path.join(ROOT,'artifacts/parent'),{recursive:true});fs.writeFileSync(path.join(ROOT,'artifacts/parent/recovery.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
