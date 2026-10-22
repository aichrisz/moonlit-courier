const test=require('node:test'),assert=require('node:assert/strict');
const {LEVELS}=require('../levels.js');
const {createGame,stepGame}=require('../engine.js');
const {routes,drive}=require('./routes.cjs');
for(let l=0;l<3;l++)for(const margin of [-1,0,1])test(`ordinary witness level ${l+1}, timing margin ${margin}`,()=>{
 const g=drive({stepGame},createGame(l),routes[l],margin);assert.equal(g.phase,'level-complete');assert.equal(g.collected.length,3);assert.equal(g.deaths,0);
});
test('every checkpoint is safe for idle respawn and long mixed input stays finite',()=>{
 for(let l=0;l<3;l++){
  for(const c of LEVELS[l].checkpoints){const g=createGame(l,{...LEVELS[l],spawn:c.spawn});for(let i=0;i<240;i++)stepGame(g,{});assert.equal(g.deaths,0);assert.equal(g.player.grounded,true);}
  const g=createGame(l);for(let i=0;i<12000;i++)stepGame(g,{right:i%400<250,left:i%400>=250,jumpPressed:i%97===0,dashPressed:i%173===0});
  for(const k of ['x','y','vx','vy'])assert.ok(Number.isFinite(g.player[k]));assert.ok(g.player.x>=0&&g.player.x<=g.level.width-g.player.w);
 }
});
test('three distinct authored worlds with 2 required + 1 scenic each',()=>{
 assert.equal(LEVELS.length,3);const ids=new Set();for(const l of LEVELS){assert.equal(l.letters.length,3);assert.equal(l.letters.filter(x=>!x.optional).length,2);for(const x of l.letters)ids.add(x.id);assert.ok(l.checkpoints.length>=2);assert.ok(l.platforms.length>=5);}
 assert.equal(ids.size,9);assert.ok(LEVELS.some(l=>l.platforms.some(p=>p.motion)));assert.ok(LEVELS.some(l=>l.wind.length));
});
test('required delivery is not locked by absent scenic letter',()=>{
 const level={...LEVELS[0],width:600,spawn:{x:30,y:400},platforms:[{x:0,y:440,w:600,h:100}],checkpoints:[],hazards:[],wind:[],letters:[{id:'a',x:100,y:410,optional:false},{id:'b',x:170,y:410,optional:false},{id:'c',x:150,y:100,optional:true}],exit:{x:240,y:380,w:40,h:60}};
 const g=createGame(0,level);for(let i=0;i<150;i++)stepGame(g,{right:true});assert.equal(g.phase,'level-complete');assert.equal(g.collected.length,2);
 level.letters[1].y=100;const h=createGame(0,level);for(let i=0;i<150;i++)stepGame(h,{right:true});assert.equal(h.phase,'playing');
});
