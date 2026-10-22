const test = require('node:test');
const assert = require('node:assert/strict');
const {createGame, stepGame, snapshot} = require('../engine.js');
const run=(g,n,input={})=>{for(let i=0;i<n;i++)stepGame(g,input);return g;};
test('jump leaves spawn and lands safely; snapshots detached',()=>{
 const g=run(createGame(),4); const y=g.player.y;
 stepGame(g,{jumpPressed:true}); run(g,12); assert.ok(g.player.y<y);
 run(g,160); assert.equal(g.player.y,y); assert.equal(g.player.grounded,true);
 const copy=snapshot(g); copy.player.x=-999; assert.notEqual(g.player.x,-999);
});
test('fixed input simulation deterministic and invalid time rejected',()=>{
 const a=run(createGame(),50,{right:true}), b=run(createGame(),50,{right:true});
 assert.deepEqual(snapshot(a),snapshot(b));
 for(const dt of [NaN,Infinity,-1,0,1])assert.throws(()=>stepGame(a,{},dt),RangeError);
});
module.exports={run};
