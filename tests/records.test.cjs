const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../records.js');
const memory=()=>{let value=null;return {getItem:()=>value,setItem:(k,v)=>{value=v;}};};
test('bounded versioned records reject corrupt, hostile, foreign and out-of-range values',()=>{
 assert.equal(R.load(memory()).status,'empty');
 for(const raw of ['{',JSON.stringify({version:9}),'{"__proto__":{"polluted":true}}','x'.repeat(20000),JSON.stringify({version:1,unlocked:99,levels:[]})]){
  const r=R.load({getItem:()=>raw});assert.equal(r.status,'invalid');assert.equal(r.data.unlocked,0);
 }
 assert.equal({}.polluted,undefined);
});
test('completion keeps best, bonus and unlock bounded; duplicate cannot increment',()=>{
 const storage=memory(),a=R.load(storage).data;
 const b=R.complete(a,0,{elapsed:12,collected:3});assert.equal(b.unlocked,1);assert.equal(b.levels[0].perfect,true);assert.equal(b.levels[0].best,12);
 assert.deepEqual(R.complete(b,0,{elapsed:12,collected:3}),b);
 const c=R.complete(b,0,{elapsed:20,collected:2});assert.equal(c.levels[0].best,12);assert.equal(c.levels[0].perfect,true);
 for(const n of [-1,3,NaN])assert.throws(()=>R.complete(c,n,{elapsed:12,collected:3}));
 assert.throws(()=>R.complete(c,1,{elapsed:Infinity,collected:2}));
});
test('read and write denial are separate truthful outcomes',()=>{
 const denied={getItem:()=>{throw new Error('denied read');},setItem:()=>{throw new Error('quota');}};
 assert.equal(R.load(denied).status,'read-denied');assert.equal(R.save(denied,R.empty()).ok,false);
 assert.equal(R.save(denied,R.empty()).status,'write-denied');
 const storage=memory();const data=R.complete(R.empty(),0,{elapsed:9,collected:2});assert.equal(R.save(storage,data).ok,true);assert.deepEqual(R.load(storage).data,data);
 let writes=0;assert.equal(R.save({setItem:()=>writes++},{malformed:true}).status,'invalid');assert.equal(writes,0);
 assert.equal(R.validate(Object.assign(Object.create({foreign:true}),R.empty())),null);
});
module.exports={memory};
