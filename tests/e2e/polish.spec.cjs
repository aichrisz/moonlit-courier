const {test,expect}=require('@playwright/test');
const {setup,start,pos,route}=require('./helpers.cjs');
const fs=require('node:fs');
async function delivery(page,scenic=true){
 const actions=require('../routes.cjs').routes[0];let exact=0,rounded=0;const held=new Set();
 for(let n=0;n<actions.length;n++){
  const a=actions[n],wanted=new Set();if(a.input.right)wanted.add('ArrowRight');if(a.input.left)wanted.add('ArrowLeft');
  if(a.input.jumpPressed&&(scenic||n!==4))wanted.add('Space');if(a.input.dashPressed)wanted.add('x');
  for(const k of held)if(!wanted.has(k)){await page.keyboard.up(k);held.delete(k);}
  for(const k of wanted)if(!held.has(k)){await page.keyboard.down(k);held.add(k);}
  exact+=a.frames*1000/120;const end=Math.round(exact);await page.clock.runFor(end-rounded);rounded=end;
 }
 for(const k of held)await page.keyboard.up(k);
 await expect(page.locator('#world')).toHaveAttribute('data-phase','level-complete');
}
test('semantic envelopes mirror genuine pickups and discrete dash charge',async({page})=>{
 await setup(page);await start(page);await expect(page.locator('[data-letter-slot]')).toHaveCount(3);
 await expect(page.getByRole('group',{name:'Required post letters'}).locator('[data-letter-slot]')).toHaveCount(2);
 await expect(page.getByRole('group',{name:'Optional scenic letter'}).locator('[data-letter-slot]')).toHaveCount(1);
 await expect(page.locator('[data-letter-slot][data-collected=true]')).toHaveCount(0);
 await page.keyboard.down('ArrowRight');await page.clock.runFor(800);await page.keyboard.up('ArrowRight');
 await expect(page.locator('#letters')).toHaveText('Post 1 / 2 required');await expect(page.locator('[data-letter-slot][data-collected=true]')).toHaveCount(1);
 await page.keyboard.press('Space');await page.clock.runFor(100);await page.keyboard.press('x');await page.clock.runFor(50);
 await expect(page.locator('#dash-status')).toHaveText('Dash spent');await expect(page.locator('#dash-meter')).toHaveAttribute('aria-valuenow','0');
 await page.clock.runFor(900);await expect(page.locator('#dash-status')).toHaveText('Dash ready');await expect(page.locator('#dash-meter')).toHaveAttribute('aria-valuenow','1');
});
for(const scenic of [true,false])test(`truthful ${scenic?'perfect':'ordinary'} postmark despite failed save`,async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Denied','QuotaExceededError');};});
 await setup(page);await start(page);await delivery(page,scenic);
 await expect(page.locator('#delivery-stamp')).toHaveText(scenic?'PERFECT DELIVERY':'DELIVERED');
 expect(JSON.parse(await page.locator('#world').getAttribute('data-collected'))).toHaveLength(scenic?3:2);
 await expect(page.locator('#save-status')).toBeVisible();await expect(page.locator('#save-status')).toContainText('Not saved');
 await page.screenshot({path:`artifacts/v11/result-${scenic?'perfect':'ordinary'}.png`});
});
for(const [width,height] of [[320,740],[844,390]])test(`mail-card content reachable at ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await setup(page);
 for(const id of ['start','level-select','save-status']){
  await page.locator('#'+id).scrollIntoViewIfNeeded();const r=await page.locator('#'+id).boundingBox();expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.height).toBeGreaterThan(0);
 }
 await start(page);await page.keyboard.press('Escape');await expect(page.locator('#resume')).toBeFocused();await page.locator('#restart').click();await page.clock.runFor(50);await delivery(page);
 await page.locator('#save-status').scrollIntoViewIfNeeded();await expect(page.locator('#save-status')).toBeVisible();
 await page.screenshot({path:`artifacts/v11/overlay-${width}x${height}.png`});
});
test('real Canvas uses four independent cached planes, stable pixels and bounded route cycling',async({page})=>{
 await setup(page);
 const r=await page.evaluate(()=>{
  // This canvas and pure fixture are isolated from the private live controller.
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),images=new Set();let calls=[];
  const native=ctx.drawImage.bind(ctx);ctx.drawImage=(image,...args)=>{images.add(image);calls.push({image:[...images].indexOf(image),x:args[0],w:image.width,h:image.height});native(image,...args);};
  const g=MCEngine.createGame(),s=MCEngine.snapshot(g),before=JSON.stringify(s);
  MCRenderer.draw(canvas,s,0,false);const a=calls;calls=[];
  const moved=structuredClone(s);moved.player.x=930;MCRenderer.draw(canvas,moved,0,false);const b=calls;calls=[];
  const pixels=canvas.toDataURL();MCRenderer.draw(canvas,moved,0,false);const stable=pixels===canvas.toDataURL();calls=[];
  MCRenderer.draw(canvas,moved,0,true);const quiet=calls;calls=[];
  const still=canvas.toDataURL();MCRenderer.draw(canvas,moved,20,true);const quietStable=still===canvas.toDataURL();calls=[];
  for(let n=0;n<96;n++)MCRenderer.draw(canvas,MCEngine.snapshot(MCEngine.createGame(n%3)),0,false);
  return {a,b,quiet,stable,quietStable,immutable:before===JSON.stringify(s),images:images.size};
 });
 expect(r.a).toHaveLength(4);expect(new Set(r.a.map(p=>p.image)).size).toBe(4);
 expect(r.a.map(p=>p.image)).toEqual(r.b.map(p=>p.image));
 const shifts=r.b.map((p,i)=>p.x-r.a[i].x);expect(shifts[0]).toBe(0);expect(new Set(shifts).size).toBe(4);
 expect(shifts.slice(1).every(x=>x<0)).toBe(true);expect(r.quiet.every(p=>p.x===0)).toBe(true);
 expect(r.images).toBe(12);expect(r.a.every(p=>p.w<=2048&&p.h===540)).toBe(true);expect(r.stable).toBe(true);expect(r.immutable).toBe(true);
 expect(r.quietStable).toBe(true);
 fs.writeFileSync('artifacts/v11/plane-probe.json',JSON.stringify(r,null,2));
});
for(const width of [1366,390])test(`native illustrated three-theme campaign ${width}`,async({page})=>{
 await page.setViewportSize({width,height:width===390?844:768});await setup(page);
 for(let level=0;level<3;level++){
  if(level)await page.locator('#next').click();await start(page);
  await page.screenshot({path:`artifacts/v11/${process.env.POLISH_CAPTURE||'after'}-scene-${level}-${width}.png`});
  await route(page,level);
 }
});
for(const mode of ['keyboard','touch'])test(`real ${mode} air dash spends readiness and displaces courier`,async({page})=>{
 await setup(page);await start(page);let cdp;
 if(mode==='keyboard'){await page.keyboard.press('Space');await page.clock.runFor(100);}
 else{
  cdp=await page.context().newCDPSession(page);const r=await page.locator('[data-input=jump]').boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await page.clock.runFor(100);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await expect(page.locator('#world')).toHaveAttribute('data-grounded','false');const before=await pos(page);
 if(mode==='keyboard')await page.keyboard.press('x');
 else{const r=await page.locator('[data-input=dash]').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:2}]});}
 await page.clock.runFor(50);await expect(page.locator('#dash-status')).toHaveText('Dash spent');expect((await pos(page)).x-before.x).toBeGreaterThan(10);
 if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
});
const sizes=[[1366,768],[320,740],[390,844],[768,1024],[1440,900],[844,390]];
for(const [width,height] of sizes)test(`same-aspect arena and reachable controls ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await setup(page);await start(page);
 await page.locator('.stage').evaluate(e=>e.scrollIntoView({block:'start'}));
 const g=await page.evaluate(()=>{
  const c=document.querySelector('#world'),r=c.getBoundingClientRect();
  return {box:r.width/r.height,backing:c.width/c.height,w:r.width,h:r.height,top:r.top,overflow:document.documentElement.scrollWidth>innerWidth,
   buttons:[...document.querySelectorAll('.touch button')].map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height,top:r.top,bottom:r.bottom};})};
 });
 const phase=process.env.POLISH_CAPTURE||'after';
 await page.screenshot({path:`artifacts/v11/${phase}-${width}x${height}.png`});
 expect(g.w).toBeGreaterThan(0);expect(g.h).toBeGreaterThan(0);expect(Math.abs(g.box-g.backing),JSON.stringify(g)).toBeLessThan(.02);
 expect(g.backing).toBeCloseTo(width<=600?720/540:960/540,2);expect(g.overflow).toBe(false);expect(g.top).toBeGreaterThanOrEqual(0);
 for(const b of g.buttons){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);expect(b.top).toBeGreaterThanOrEqual(g.top+g.h);expect(b.bottom).toBeLessThanOrEqual(height);}
});
test('orientation changes projection without restarting or stretching',async({page})=>{
 await setup(page);await start(page);const before=await pos(page);
 for(const [width,height] of [[390,844],[844,390],[1366,768]]){
  await page.setViewportSize({width,height});await page.clock.runFor(32);
  const r=await page.locator('#world').evaluate(c=>({box:c.clientWidth/c.clientHeight,back:c.width/c.height}));
  expect(Math.abs(r.box-r.back)).toBeLessThan(.02);expect(r.back).toBeCloseTo(width<=600?4/3:16/9,2);expect((await pos(page)).x).toBe(before.x);
 }
});
