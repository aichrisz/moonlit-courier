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
module.exports={fixture,run};
