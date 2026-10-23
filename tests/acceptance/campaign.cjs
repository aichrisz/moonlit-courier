/* Independent geometry-derived legal route replayed through actual browser keys.
 * Only public DOM observations are read. No app-state writes or completion hooks. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {ROOT,observation,geometry,click,audit}=require('./native.cjs');
const {chromium}=require(ROOT+'/node_modules/@playwright/test');
const {LEVELS}=require(ROOT+'/levels.js');
const mode=process.argv[2]||'source';
const target=process.env.COURIER_URL||require('node:url').pathToFileURL(path.join(ROOT,mode==='offline'?'artifacts/Moonlit-Courier.html':mode==='dist'?'dist/index.html':'index.html')).href;
const routeData=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/parent/derived-routes.json'),'utf8'));
assert.equal(routeData.routes.length,LEVELS.length);
const OUT=path.join(ROOT,'artifacts/parent',mode+'-campaign');fs.mkdirSync(OUT,{recursive:true});
// This is the real native input mapping from the approved design, not an engine call.
const keys={left:'ArrowLeft',right:'ArrowRight',jumpPressed:'Space',dashPressed:'Shift'};
function collectedCount(raw){
 if(/^\d+$/.test(raw||''))return Number(raw);
 try{const a=JSON.parse(raw);if(Array.isArray(a))return a.length;}catch{}
 return (raw||'').split(',').filter(Boolean).length;
}
async function main(){
 const browser=await chromium.launch({executablePath:'/root/.hermes/tools/chromium-1208/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:2});
  if(mode==='offline')await context.setOffline(true);
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push('failed '+r.url()));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});page.on('request',r=>requests.push(r.url()));
  await page.clock.install({time:new Date('2026-10-23T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-10-23T00:00:00.050Z'));
  await page.addInitScript(()=>{
   window.__parentSaves=[];const write=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){if(key==='moonlit-courier.v1')window.__parentSaves.push(value);return write.call(this,key,value);};
  });
  await page.goto(target);await audit(page);
  const reports=[];
  for(let index=0;index<LEVELS.length;index++){
   if(index===0||await page.locator('#start').isVisible())await click(page,'#start');
   await page.clock.runFor(32);await page.locator('#world').focus();await page.locator('#world').scrollIntoViewIfNeeded();
   assert.equal((await observation(page)).phase,'playing');
   assert.equal(Number((await observation(page)).levelIndex),index);
   const layout=await geometry(page),held={left:false,right:false};
   const writesBefore=await page.evaluate(()=>window.__parentSaves.length);
   const actions=routeData.routes[index];
   for(let n=0;n<actions.length;n++){
    const {frames,input}=actions[n];assert(Number.isInteger(frames)&&frames>0);
    for(const action of ['left','right']){
     if(held[action]&&!input[action])await page.keyboard.up(keys[action]);
     if(!held[action]&&input[action])await page.keyboard.down(keys[action]);
     held[action]=!!input[action];
    }
    const edges=['jumpPressed','dashPressed'].filter(k=>input[k]);
    for(const edge of edges)await page.keyboard.down(keys[edge]);
    const milliseconds=frames*routeData.step*1000;
    if(edges.length){
     const edgeWindow=Math.min(milliseconds,routeData.step*1000);
     await page.clock.runFor(edgeWindow);
     for(const edge of edges)await page.keyboard.up(keys[edge]);
     if(milliseconds>edgeWindow)await page.clock.runFor(milliseconds-edgeWindow);
    }else await page.clock.runFor(milliseconds);
    const seen=await observation(page);
    assert.equal(Number(await page.locator('#deaths').textContent().then(t=>(t.match(/\d+/)||['0'])[0])),0,'route must not rely on respawn');
    assert(Number(seen.playerX)>=0,'observed position remains finite/in-bounds');
    if(n===Math.floor(actions.length/2))await page.screenshot({path:path.join(OUT,'level-'+index+'-scenic.png')});
   }
   for(const k of ['left','right'])if(held[k])await page.keyboard.up(keys[k]);
   await page.clock.runFor(32);
   const end=await observation(page);
   assert(['level-complete','campaign-complete'].includes(end.phase),'full route reaches real mailbox, not a fabricated results screen: '+JSON.stringify(end));
   assert.equal(collectedCount(end.collected),LEVELS[index].letters.length,'all authored letter IDs must have actual native pickup witnesses');
   const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('moonlit-courier.v1')));
   assert.equal(stored.levels[index].complete,true);assert.equal(stored.levels[index].perfect,true);
   assert(Number.isFinite(stored.levels[index].best)&&stored.levels[index].best>0);
   assert.equal(await page.evaluate(()=>window.__parentSaves.length)-writesBefore,1,'one persistence write per actual completion');
   await page.clock.runFor(128);
   assert.equal(await page.evaluate(()=>window.__parentSaves.length)-writesBefore,1,'results frames cannot write duplicate completions');
   const record={index,id:LEVELS[index].id,letters:collectedCount(end.collected),phase:end.phase,observation:end,layout,stored,save:await page.locator('#save-status').textContent()};
   reports.push(record);await page.screenshot({path:path.join(OUT,'level-'+index+'-complete.png')});
   if(index<LEVELS.length-1){await click(page,'#next');await page.clock.runFor(32);}
  }
  assert.equal(reports.reduce((n,r)=>n+r.letters,0),LEVELS.reduce((n,l)=>n+l.letters.length,0));
  const saved=await page.evaluate(()=>localStorage.getItem('moonlit-courier.v1'));
  await click(page,'#replay');await page.clock.runFor(32);
  assert.equal(await page.evaluate(()=>localStorage.getItem('moonlit-courier.v1')),saved,'campaign replay preserves earned progress/records');
  const loop=await page.evaluate(()=>window.__parentLoop);assert(loop.ticks>0&&loop.max<=1,JSON.stringify(loop));
  if(mode==='offline')assert(requests.every(u=>u===target||u.startsWith('data:')),'standalone has no adjacent/external assets');
  else if(process.env.COURIER_URL)assert(requests.every(u=>u.startsWith(process.env.COURIER_URL)),'public requests remain under project prefix');
  assert.deepEqual(errors,[]);
  const result={mode,target,method:routeData.method,levels:reports,totalLetters:reports.reduce((n,r)=>n+r.letters,0),loop,requests,errors};
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({mode,totalLetters:result.totalLetters,levels:reports.map(r=>({index:r.index,letters:r.letters,phase:r.phase})),loop,errors}));
 }finally{await browser.close();}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
