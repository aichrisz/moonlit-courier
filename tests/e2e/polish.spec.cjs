const {test,expect}=require('@playwright/test');
const {setup,start,pos,route}=require('./helpers.cjs');
const fs=require('node:fs');
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
  for(let n=0;n<96;n++)MCRenderer.draw(canvas,MCEngine.snapshot(MCEngine.createGame(n%3)),0,false);
  return {a,b,quiet,stable,immutable:before===JSON.stringify(s),images:images.size};
 });
 expect(r.a).toHaveLength(4);expect(new Set(r.a.map(p=>p.image)).size).toBe(4);
 expect(r.a.map(p=>p.image)).toEqual(r.b.map(p=>p.image));
 const shifts=r.b.map((p,i)=>p.x-r.a[i].x);expect(shifts[0]).toBe(0);expect(new Set(shifts).size).toBe(4);
 expect(shifts.slice(1).every(x=>x<0)).toBe(true);expect(r.quiet.every(p=>p.x===0)).toBe(true);
 expect(r.images).toBe(12);expect(r.a.every(p=>p.w<=2048&&p.h===540)).toBe(true);expect(r.stable).toBe(true);expect(r.immutable).toBe(true);
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
