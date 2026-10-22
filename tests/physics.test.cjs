const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,stepGame,snapshot}=require('../engine.js');
const fixture=(extra={})=>({id:'fixture',name:'Fixture',width:1200,height:540,spawn:{x:80,y:400},platforms:[{x:0,y:440,w:1200,h:100}],hazards:[],wind:[],checkpoints:[],letters:[],exit:{x:1100,y:380,w:40,h:60},...extra});
const run=(g,n,input={})=>{for(let i=0;i<n;i++)stepGame(g,input);return g;};
test('100ms coyote jump after walking off edge',()=>{
 const g=run(createGame(0,fixture({platforms:[{x:0,y:440,w:140,h:100}]})),4);
 run(g,32,{right:true}); assert.equal(g.player.grounded,false); stepGame(g,{jumpPressed:true});assert.ok(g.player.vy<0,'coyote jump must rise');
});
test('120ms buffered jump is consumed on landing, not held autojump',()=>{
 const g=run(createGame(0,fixture()),4);stepGame(g,{jumpPressed:true});
 while(!(g.player.vy>0&&g.player.y+g.player.h>405))stepGame(g,{});
 stepGame(g,{jumpPressed:true});let jumped=false;
 for(let i=0;i<20;i++){stepGame(g,{});if(g.player.vy<0)jumped=true;}
 assert.ok(jumped,'buffer must survive until landing');run(g,150);assert.equal(g.player.grounded,true);
});
test('single horizontal air dash suspends gravity and refills only on landing',()=>{
 const g=run(createGame(0,fixture()),4);stepGame(g,{jumpPressed:true});run(g,12);
 const y=g.player.y;stepGame(g,{right:true,dashPressed:true});
 assert.equal(g.player.dashReady,false);assert.equal(g.player.vy,0);assert.equal(g.player.y,y);
 stepGame(g,{left:true,dashPressed:true});assert.equal(g.player.dashReady,false);assert.ok(g.player.vx>0,'dash direction locked');
 run(g,150);assert.equal(g.player.grounded,true);assert.equal(g.player.dashReady,true);
});
test('thin hazards and walls cannot be tunneled at maximum accepted dt',()=>{
 const wall={x:200,y:0,w:1,h:440};const g=run(createGame(0,fixture({platforms:[{x:0,y:440,w:1200,h:100},wall]})),4);
 stepGame(g,{jumpPressed:true});run(g,12);for(let i=0;i<10;i++)stepGame(g,{right:true,dashPressed:i===0},1/30);
 assert.ok(g.player.x+g.player.w<=200);
 const h=run(createGame(0,fixture({hazards:[{x:200,y:0,w:1,h:440}]})),4);stepGame(h,{jumpPressed:true});run(h,12);
 for(let i=0;i<10;i++)stepGame(h,{right:true,dashPressed:i===0},1/30);
 assert.equal(h.deaths,1,'crossed hazard must respawn exactly once');assert.ok(h.player.x<200);
});
test('moving platform carries grounded passenger and underside stops ascent',()=>{
 const g=run(createGame(0,fixture({platforms:[{x:0,y:440,w:240,h:20,motion:{axis:'x',amplitude:60,period:4}}]})),4);
 const x=g.player.x;run(g,60);assert.ok(g.player.x>x+20,'passenger must travel with lift');assert.equal(g.player.grounded,true);
 const h=run(createGame(0,fixture({platforms:[{x:0,y:440,w:1200,h:100},{x:50,y:330,w:100,h:10}]})),4);
 stepGame(h,{jumpPressed:true});run(h,25);assert.ok(h.player.y>=340);assert.ok(h.player.vy>=0);
});
test('physical checkpoint and letters survive death; exit completion idempotent',()=>{
 const g=run(createGame(0,fixture({checkpoints:[{id:'safe',x:180,y:400,w:30,h:40,spawn:{x:180,y:400}}],letters:[{id:'a',x:140,y:410,optional:false},{id:'b',x:220,y:410,optional:false},{id:'c',x:160,y:410,optional:true}],hazards:[{x:300,y:410,w:20,h:30}],exit:{x:250,y:380,w:30,h:60}})),4);
 run(g,76,{right:true});assert.equal(g.checkpointId,'safe');assert.deepEqual(g.collected.sort(),['a','b','c']);assert.equal(g.phase,'level-complete');
 const finished=snapshot(g);run(g,200,{right:true});assert.deepEqual(snapshot(g),finished);
 const h=run(createGame(0,fixture({checkpoints:[{id:'safe',x:180,y:400,w:30,h:40,spawn:{x:180,y:400}}],letters:[{id:'a',x:140,y:410,optional:false}],hazards:[{x:300,y:410,w:20,h:30}]})),4);
 while(h.deaths===0&&h.ticks<300)stepGame(h,{right:true});assert.equal(h.deaths,1);assert.equal(h.player.x,180);assert.equal(h.player.vx,0);assert.equal(h.player.vy,0);assert.equal(h.player.dashReady,true);assert.deepEqual(h.collected,['a']);run(h,120);assert.equal(h.deaths,1);
});
module.exports={fixture,run};
