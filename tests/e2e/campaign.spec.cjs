const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const {setup,start,route}=require('./helpers.cjs');
test('source native complete campaign: all nine letters, all exits, persistent records and replay',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);const trace=[];
 for(let l=0;l<3;l++){
  if(l)await page.locator('#next').click();await expect(page.locator('#start')).toBeFocused();await start(page);
  trace.push(await route(page,l));await page.screenshot({path:`artifacts/evidence/source-level-${l+1}-results.png`});
  await expect(page.locator('#save-status')).toContainText('Saved on this device');
 }
 await page.locator('#replay').click();await expect(page.locator('#world')).toHaveAttribute('data-level-index','0');
 await page.reload();await expect(page.locator('#world')).toHaveAttribute('data-level-index','2');await expect(page.locator('#level-select option:disabled')).toHaveCount(0);
 expect(errors).toEqual([]);fs.writeFileSync('artifacts/evidence/source-witness.json',JSON.stringify(trace,null,2));
});
test('actual results show denied writes, session unlock still works',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Synthetic quota','QuotaExceededError');};});
 await setup(page);await start(page);await route(page,0);await expect(page.locator('#save-status')).toContainText('Not saved: storage write unavailable');await page.locator('#next').click();await expect(page.locator('#world')).toHaveAttribute('data-level-index','1');
});
for(const [width,height] of [[320,568],[390,844],[768,1024],[1366,768],[1440,900]])test(`layout and real screenshots ${width}x${height} DPR2`,async({page})=>{
 await page.setViewportSize({width,height});await setup(page);
 async function geometry(phase){
  const result=await page.evaluate(()=>{
   const c=document.querySelector('#world').getBoundingClientRect(),buttons=[...document.querySelectorAll('.touch button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};});
   return {overflow:document.documentElement.scrollWidth>innerWidth,canvas:{x:c.x,y:c.y,w:c.width,h:c.height,bottom:c.bottom},buttons,dpr:devicePixelRatio,fit:getComputedStyle(document.querySelector('canvas')).objectFit};
  });
  expect(result.overflow).toBe(false);expect(result.dpr).toBe(2);expect(result.fit).toBe('contain');expect(result.canvas.w).toBeGreaterThan(250);
  for(const b of result.buttons){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);expect(b.y).toBeGreaterThanOrEqual(result.canvas.bottom);expect(b.bottom).toBeLessThanOrEqual(height);}
  await page.screenshot({path:`artifacts/evidence/${width}x${height}-${phase}.png`});
 }
 await geometry('ready');await start(page);await geometry('playing');await page.keyboard.press('Escape');await geometry('paused');await page.locator('#resume').click();await page.clock.runFor(50);await route(page,0);await geometry('results');
});
test('one positive fixed-step rAF chain across repeated pause/restart; detached DOM output',async({page})=>{
 await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
 // Instrument AFTER clock installation, BEFORE app execution. Never changes simulation.
 await page.addInitScript(()=>{
  const request=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window),pending=new Set();
  window.__loopProbe={max:0,calls:0,pending:0};
  window.requestAnimationFrame=cb=>{let id=request(t=>{pending.delete(id);window.__loopProbe.pending=pending.size;window.__loopProbe.calls++;cb(t);});pending.add(id);window.__loopProbe.pending=pending.size;window.__loopProbe.max=Math.max(window.__loopProbe.max,pending.size);return id;};
  window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};
 });
 await page.goto('/');await start(page);
 for(let i=0;i<5;i++){await page.keyboard.press('Escape');await page.locator('#resume').click();await page.clock.runFor(40);await page.keyboard.press('r');await page.clock.runFor(40);}
 const before=await page.locator('#world').getAttribute('data-player-x');await page.locator('#world').evaluate(c=>{c.dataset.playerX='999999';c.dataset.phase='campaign-complete';});await page.clock.runFor(50);await expect(page.locator('#world')).toHaveAttribute('data-player-x',before);await expect(page.locator('#world')).toHaveAttribute('data-phase','playing');
 const probe=await page.evaluate(()=>window.__loopProbe);expect(probe.calls).toBeGreaterThan(20);expect(probe.max).toBe(1);expect(probe.pending).toBe(1);expect(+(await page.locator('#world').getAttribute('data-ticks'))).toBeGreaterThan(0);
});
test('axe DOM accessibility in ready, playing, paused and real results',async({page})=>{
 await setup(page);await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const reports=[];
 async function audit(phase){
  await page.clock.resume();const result=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  const now=await page.evaluate(()=>Date.now());await page.clock.pauseAt(now+2000);reports.push({phase,violations:result.violations});expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
 await audit('ready');await start(page);await audit('playing');await page.keyboard.press('Escape');await audit('paused');await page.locator('#restart').click();await page.clock.runFor(50);await route(page,0);await audit('results');
 fs.writeFileSync('artifacts/evidence/axe.json',JSON.stringify(reports,null,2));
});
