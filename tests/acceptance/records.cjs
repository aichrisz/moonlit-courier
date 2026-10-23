/* Parent adversarial persistent-record invariants. Pure adapter, actual storage outcomes. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const ROOT=process.env.COURIER_ROOT||path.resolve(__dirname,'../..');const R=require(ROOT+'/records.js');
const initial={version:1,unlocked:0,levels:Array.from({length:3},()=>({complete:false,perfect:false,best:null}))};
let cases=0;
const denied=R.load({getItem(){throw new Error('synthetic read denied');}});assert.deepEqual(denied.data,initial);assert.equal(denied.status,'read-denied');cases++;
let writes=0,last;
const store={getItem(){return last===undefined?null:last;},setItem(k,v){assert.equal(k,R.KEY);writes++;last=v;}};
assert.deepEqual(R.load(store).data,initial);cases++;
const corpus=['null','[]','true','"foreign"','{','{"__proto__":{"polluted":true}}','{"constructor":{"prototype":{"polluted":true}}}',JSON.stringify({...initial,version:2}),JSON.stringify({...initial,unlocked:-1}),JSON.stringify({...initial,unlocked:1.5}),JSON.stringify({...initial,unlocked:3}),JSON.stringify({...initial,levels:[]}),JSON.stringify({...initial,padding:'x'.repeat(5000)})];
for(const raw of corpus){last=raw;const out=R.load(store);assert.deepEqual(out.data,initial,'foreign/corrupt/hostile data must not unlock content');assert.equal(out.status,'invalid');assert.equal({}.polluted,undefined);cases++;}
let data=JSON.parse(JSON.stringify(initial));
for(let index=0;index<3;index++){
 data=R.complete(data,index,{elapsed:20+index,collected:2});
 assert.equal(data.unlocked,Math.min(2,index+1));assert.equal(data.levels[index].complete,true);assert.equal(data.levels[index].perfect,false);
 const first=JSON.parse(JSON.stringify(data));
 data=R.complete(data,index,{elapsed:20+index,collected:2});assert.deepEqual(data,first,'repeated same completion is idempotent');
 data=R.complete(data,index,{elapsed:18+index,collected:3});assert.equal(data.levels[index].best,18+index);assert.equal(data.levels[index].perfect,true);
 data=R.complete(data,index,{elapsed:30+index,collected:2});assert.equal(data.levels[index].best,18+index);assert.equal(data.levels[index].perfect,true,'worse replay cannot erase scenic stamp');
 assert(R.validate(data));cases+=4;
}
last=undefined;const outcome=R.save(store,data);assert.equal(outcome.ok,true);assert.equal(writes,1);assert.deepEqual(JSON.parse(last),data);assert.deepEqual(R.load(store).data,data);cases+=3;
const failed=R.save({setItem(){throw new Error('synthetic quota denial');}},data);assert.equal(failed.ok,false);cases++;
for(const n of [-1,0,Infinity,NaN,R.MAX_SECONDS+1]){
 assert.throws(()=>R.complete(data,0,{elapsed:n,collected:3}));cases++;
}
const report={method:'parent pure-storage adversarial corpus and independently expected progression/minimum-time invariants',cases,corruptInputs:corpus.length,readDenied:true,writeDenied:true,realSaveWrites:writes,final:data};
fs.mkdirSync(path.join(ROOT,'artifacts/parent'),{recursive:true});fs.writeFileSync(path.join(ROOT,'artifacts/parent/records.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
