const test=require('node:test');
const assert=require('node:assert/strict');
const renderer=require('../renderer.js');
const {createGame,stepGame,snapshot}=require('../engine.js');
const {routes}=require('./routes.cjs');
test('feedback observes real simulation edges once, stays bounded and never mutates snapshots',()=>{
 assert.equal(typeof renderer.createFeedback,'function');
 const f=renderer.createFeedback(),g=createGame(),kinds=new Set();f.observe(snapshot(g));
 for(const action of routes[0])for(let n=0;n<action.frames;n++){
  stepGame(g,{...action.input,jumpPressed:n===0&&action.input.jumpPressed,dashPressed:n===0&&action.input.dashPressed});
  const s=snapshot(g),before=structuredClone(s);f.observe(s);const first=f.snapshot();
  for(const p of first.particles)kinds.add(p.kind);
  f.observe(s);assert.deepEqual(f.snapshot(),first);assert.deepEqual(s,before);assert.ok(first.particles.length<=f.capacity);
 }
 assert.deepEqual([...kinds].sort(),['checkpoint','dash','delivery','landing','pickup']);
 const before=f.snapshot();for(let n=0;n<960;n++)f.observe(snapshot(g));assert.deepEqual(f.snapshot(),before);
 f.observe(snapshot(createGame()));assert.equal(f.snapshot().particles.length,0);
});
test('feedback ages only with simulation time, clears for reduced motion and route/restart, expires',()=>{
 assert.equal(typeof renderer.createFeedback,'function');
 const f=renderer.createFeedback(),g=createGame();f.observe(snapshot(g));
 for(let n=0;n<5;n++){stepGame(g,{});f.observe(snapshot(g));}
 stepGame(g,{jumpPressed:true});f.observe(snapshot(g));stepGame(g,{dashPressed:true});f.observe(snapshot(g));
 assert.ok(f.snapshot().particles.some(p=>p.kind==='dash'));const first=f.snapshot();
 for(let n=0;n<960;n++)f.observe(snapshot(g));assert.deepEqual(f.snapshot(),first);
 for(let n=0;n<960;n++){stepGame(g,{});f.observe(snapshot(g));assert.ok(f.snapshot().particles.length<=f.capacity);}
 assert.equal(f.snapshot().particles.length,0);
 f.observe(snapshot(createGame(1)));assert.equal(f.snapshot().particles.length,0);
 const quiet=renderer.createFeedback();const q=createGame();quiet.observe(snapshot(q),true);
 for(const action of routes[0])for(let n=0;n<action.frames;n++){
  stepGame(q,{...action.input,jumpPressed:n===0&&action.input.jumpPressed,dashPressed:n===0&&action.input.dashPressed});quiet.observe(snapshot(q),true);
  assert.equal(quiet.snapshot().particles.length,0);
 }
});
