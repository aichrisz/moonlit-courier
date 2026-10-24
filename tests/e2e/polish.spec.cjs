const {test,expect}=require('@playwright/test');
const {setup,start,pos,route}=require('./helpers.cjs');
const fs=require('node:fs');
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
