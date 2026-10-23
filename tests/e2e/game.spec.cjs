const {test,expect}=require('@playwright/test');
const {setup,start,pos}=require('./helpers.cjs');
test('native start, movement, jump, horizontal dash and pause',async({page})=>{
 await setup(page);await start(page);await expect(page.locator('#world')).toHaveAttribute('data-phase','playing');
 const a=await pos(page);await page.keyboard.down('ArrowRight');await page.clock.runFor(200);await page.keyboard.up('ArrowRight');expect((await pos(page)).x).toBeGreaterThan(a.x+30);
 await page.keyboard.down('Space');await page.clock.runFor(120);await page.keyboard.up('Space');expect((await pos(page)).y).toBeLessThan(a.y-25);
 await page.keyboard.press('x');await page.clock.runFor(50);await expect(page.locator('#dash-status')).toHaveText('Dash spent');
 await page.keyboard.press('Escape');await expect(page.locator('#world')).toHaveAttribute('data-phase','paused');const paused=await pos(page);await page.clock.runFor(300);expect(await pos(page)).toEqual(paused);
 await page.locator('#resume').click();await page.clock.runFor(50);await expect(page.locator('#world')).toHaveAttribute('data-phase','playing');
});
test('lifecycle pauses release held input and settings retain native Space',async({page})=>{
 await setup(page);await start(page);
 for(const event of ['blur','pagehide','visibilitychange']){
  await page.keyboard.down('ArrowRight');await page.clock.runFor(50);
  await page.evaluate(type=>{
   if(type==='visibilitychange')Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   (type==='visibilitychange'?document:window).dispatchEvent(new Event(type));
  },event);
  await expect(page.locator('#world')).toHaveAttribute('data-phase','paused');await page.keyboard.up('ArrowRight');
  if(event==='visibilitychange')await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}));
  await page.locator('#resume').click();await page.clock.runFor(50);const a=await pos(page);await page.clock.runFor(100);expect((await pos(page)).x).toBe(a.x);
 }
 await page.locator('#reduced-motion').focus();await page.keyboard.down('Space');await expect(page.locator('#reduced-motion')).not.toBeChecked();await page.keyboard.up('Space');await expect(page.locator('#reduced-motion')).toBeChecked();await expect(page.locator('body')).toHaveClass(/quiet/);
 const before=await pos(page);await page.keyboard.press('r');expect(await pos(page)).toEqual(before);
 await page.locator('#world').focus();await page.keyboard.press('Space');await page.clock.runFor(80);expect((await pos(page)).y).toBeLessThan(before.y);
 await page.keyboard.press('Escape');await expect(page.locator('#resume')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#world')).toHaveAttribute('data-phase','playing');
});
test('native multitouch movement plus jump, cancel and lost capture release',async({page})=>{
 await setup(page);await start(page);const a=await pos(page);
 const cdp=await page.context().newCDPSession(page);
 const center=async input=>{const r=await page.locator(`[data-input=${input}]`).boundingBox();return {x:r.x+r.width/2,y:r.y+r.height/2};};
 const right={...await center('right'),id:1},jump={...await center('jump'),id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right]});await page.clock.runFor(80);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,jump]});await page.clock.runFor(120);
 expect((await pos(page)).x).toBeGreaterThan(a.x+25);expect((await pos(page)).y).toBeLessThan(a.y-25);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await page.clock.runFor(30);const b=await pos(page);await page.clock.runFor(80);expect((await pos(page)).x).toBe(b.x);
 await page.locator('[data-input=right]').dispatchEvent('pointerdown',{pointerId:77,pointerType:'touch'});await page.clock.runFor(30);await page.locator('[data-input=right]').dispatchEvent('lostpointercapture',{pointerId:77,pointerType:'touch'});const c=await pos(page);await page.clock.runFor(50);expect((await pos(page)).x).toBe(c.x);
});
test('sound remains opt-in, native checkbox Space enables it and pause silences',async({page})=>{
 await setup(page);await start(page);await expect(page.locator('#sound-status')).toHaveText('Sound off');
 await page.locator('#sound').focus();await page.keyboard.down('Space');await expect(page.locator('#sound')).not.toBeChecked();await page.keyboard.up('Space');await expect(page.locator('#sound')).toBeChecked();await expect(page.locator('#sound-status')).toHaveText('Sound on');
 await page.locator('#world').focus();await page.keyboard.press('Space');await page.clock.runFor(80);await page.keyboard.press('Escape');await expect(page.locator('#sound-status')).toHaveText('Sound paused');
 await page.locator('#sound').uncheck();await expect(page.locator('#sound-status')).toHaveText('Sound off');
});
module.exports={setup,start,pos};
