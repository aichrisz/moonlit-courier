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
// Visibility alone does not prove scrollable content escapes ancestor clipping.
async function visibleIntersection(page,id){
 await page.locator('#'+id).scrollIntoViewIfNeeded();
 // Center through native scrolling rather than leave a fractional-pixel edge at
 // the viewport boundary; the full-intersection assertions remain exact.
 await page.locator('#'+id).evaluate(e=>e.scrollIntoView({block:'center',inline:'nearest'}));
 const r=await page.locator('#'+id).evaluate(e=>{
  const r=e.getBoundingClientRect(),panel=document.querySelector('#panel'),p=panel.getBoundingClientRect(),s=document.querySelector('.stage').getBoundingClientRect();
  const left=Math.max(0,s.left,p.left+panel.clientLeft),top=Math.max(0,s.top,p.top+panel.clientTop);
  const right=Math.min(innerWidth,s.right,p.left+panel.clientLeft+panel.clientWidth),bottom=Math.min(innerHeight,s.bottom,p.top+panel.clientTop+panel.clientHeight);
  return {w:r.width,h:r.height,visibleW:Math.max(0,Math.min(r.right,right)-Math.max(r.left,left)),visibleH:Math.max(0,Math.min(r.bottom,bottom)-Math.max(r.top,top))};
 });
 expect(r.visibleW,id).toBeGreaterThan(0);expect(r.visibleH,id).toBeGreaterThan(0);
 expect(r.visibleW,id).toBeCloseTo(r.w,3);expect(r.visibleH,id).toBeCloseTo(r.h,3);
}
for(const [width,height] of [[320,740],[844,390],[568,320],[600,400],[601,400]])test(`mail-card content reachable at ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await setup(page);
 for(const id of ['start','level-select','save-status']){
  await page.locator('#'+id).scrollIntoViewIfNeeded();const r=await page.locator('#'+id).boundingBox();expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.height).toBeGreaterThan(0);
  await visibleIntersection(page,id);
 }
 await start(page);await page.keyboard.press('Escape');await expect(page.locator('#resume')).toBeFocused();
 for(const id of ['resume','restart'])await visibleIntersection(page,id);
 await page.locator('#restart').click();await page.clock.runFor(50);await delivery(page);
 await page.locator('#save-status').scrollIntoViewIfNeeded();await expect(page.locator('#save-status')).toBeVisible();
 for(const id of ['delivery-stamp','next','save-status'])await visibleIntersection(page,id);
 await page.screenshot({path:`artifacts/v11/overlay-${width}x${height}.png`});
});
test('real Canvas preserves four parallax planes through one bounded smooth target blit',async({page})=>{
 await page.addInitScript(()=>{
  const native=document.createElement;const created=[];
  document.createElement=function(...args){const e=native.apply(this,args);if(e instanceof HTMLCanvasElement)created.push(e);return e;};
  window.__canvasAllocationAudit={created,restore:()=>{document.createElement=native;}};
 });
 await setup(page);
 const r=await page.evaluate(()=>{
  // Observe actual Canvas resources and blits, not renderer helpers or live state.
  const canvas=document.createElement('canvas'),images=new Set(),frames=[];let calls=[];
  const proto=CanvasRenderingContext2D.prototype,native=proto.drawImage;
  proto.drawImage=function(image,...args){
   images.add(image);const x=args.length===8?args[4]:args[0];
   calls.push({image:[...images].indexOf(image),target:this.canvas===canvas,x,w:image.width,h:image.height,smoothing:this.imageSmoothingEnabled});
   return native.call(this,image,...args);
  };
  const paint=(s,t=0,reduced=false)=>{calls=[];MCRenderer.draw(canvas,s,t,reduced);frames.push(calls);return calls;};
  try{
   const s=MCEngine.snapshot(MCEngine.createGame()),before=JSON.stringify(s);
   const a=paint(s);const moved=structuredClone(s);moved.player.x=930;const b=paint(moved);
   const pixels=canvas.toDataURL();paint(moved);const stable=pixels===canvas.toDataURL();
   const quiet=paint(moved,0,true),still=canvas.toDataURL();paint(moved,20,true);const quietStable=still===canvas.toDataURL();
   for(let n=0;n<96;n++)paint(MCEngine.snapshot(MCEngine.createGame(n%3)));
   const resources=window.__canvasAllocationAudit.created.filter(c=>c!==canvas).map(c=>({w:c.width,h:c.height,bytes:c.width*c.height*4}));
   const world=document.querySelector('#world');
   return {a,b,quiet,stable,quietStable,immutable:before===JSON.stringify(s),
    planes:[...images].filter(c=>c.width===2048&&c.height===540).length,
    targetBlits:frames.map(f=>f.filter(c=>c.target).length),smooth:frames.every(f=>f.every(c=>c.smoothing)),
    resources,cacheBytes:resources.reduce((sum,c)=>sum+c.bytes,0),outputBytes:world.width*world.height*4};
  }finally{proto.drawImage=native;window.__canvasAllocationAudit.restore();}
 });
 const planes=frame=>frame.filter(p=>p.w===2048&&p.h===540);
 const a=planes(r.a),b=planes(r.b),quiet=planes(r.quiet);
 expect(a).toHaveLength(4);expect(new Set(a.map(p=>p.image)).size).toBe(4);expect(a.map(p=>p.image)).toEqual(b.map(p=>p.image));
 const shifts=b.map((p,i)=>p.x-a[i].x);expect(shifts).toEqual([0,-600*.09,-600*.23,-600*.41]);
 expect(quiet).toHaveLength(4);expect(quiet.every(p=>p.x===0)).toBe(true);expect(r.planes).toBe(12);
 expect(r.targetBlits.every(n=>n===1),JSON.stringify(r.targetBlits)).toBe(true);expect(r.smooth).toBe(true);
 // 64 MiB RGBA backing budget includes every renderer-created canvas AND the DPR2 output.
 // The isolated test target is excluded: production owns only #world.
 expect(r.cacheBytes+r.outputBytes).toBeLessThan(64*1024*1024);expect(r.resources).toHaveLength(13);
 expect(r.stable).toBe(true);expect(r.immutable).toBe(true);expect(r.quietStable).toBe(true);
 fs.writeFileSync('artifacts/v11/plane-probe.json',JSON.stringify(r,null,2));
});
test('narrow projection query is cached across paints and native orientation changes',async({page})=>{
 await page.addInitScript(()=>{const native=window.matchMedia.bind(window);window.__narrowQueries=0;window.matchMedia=q=>{if(q==='(max-width:600px)')window.__narrowQueries++;return native(q);};});
 await setup(page);await start(page);await page.clock.runFor(1000);
 for(const width of [390,844,1366]){await page.setViewportSize({width,height:768});await page.clock.runFor(32);expect(await page.locator('#world').evaluate(c=>c.width/c.height)).toBeCloseTo(width<=600?4/3:16/9,2);}
 expect(await page.evaluate(()=>window.__narrowQueries)).toBe(1);
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
const sizes=[[1366,768],[320,740],[390,844],[768,1024],[1440,900],[844,390],[568,320],[600,400],[601,400]];
for(const [width,height] of sizes)test(`same-aspect arena and reachable controls ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await setup(page);await start(page);
 await page.locator('.stage').evaluate(e=>e.scrollIntoView({block:'start'}));
 const g=await page.evaluate(()=>{
  const c=document.querySelector('#world'),r=c.getBoundingClientRect(),stage=document.querySelector('.stage').getBoundingClientRect();
  return {box:r.width/r.height,backing:c.width/c.height,backingWidth:c.width,backingHeight:c.height,dpr:devicePixelRatio,w:r.width,h:r.height,top:r.top,left:r.left,right:r.right,bottom:r.bottom,
   stage:{left:stage.left,right:stage.right,top:stage.top,bottom:stage.bottom,w:stage.width,h:stage.height},overflow:document.documentElement.scrollWidth>innerWidth,
   buttons:[...document.querySelectorAll('.touch button')].map(b=>{const r=b.getBoundingClientRect();
    const points=[[r.left+5,r.top+5],[r.right-5,r.top+5],[r.left+5,r.bottom-5],[r.right-5,r.bottom-5],[(r.left+r.right)/2,(r.top+r.bottom)/2]];
    return {w:r.width,h:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,unobscured:points.every(([x,y])=>b.contains(document.elementFromPoint(x,y)))};
   })};
 });
 const phase=process.env.POLISH_CAPTURE||'after';
 await page.screenshot({path:`artifacts/v11/${phase}-${width}x${height}.png`});
 fs.writeFileSync(`artifacts/v11/${phase}-geometry-${width}x${height}.json`,JSON.stringify(g,null,2));
 expect(g.w).toBeGreaterThan(0);expect(g.h).toBeGreaterThan(0);expect(Math.abs(g.box-g.backing),JSON.stringify(g)).toBeLessThan(.02);
 expect(g.backing).toBeCloseTo(width<=600?720/540:960/540,2);expect(g.overflow).toBe(false);expect(g.top).toBeGreaterThanOrEqual(0);
 expect(g.dpr).toBe(2);expect([g.backingWidth,g.backingHeight]).toEqual(width<=600?[1440,1080]:[1920,1080]);
 expect(g.stage.top).toBeGreaterThanOrEqual(0);expect(g.stage.bottom).toBeLessThanOrEqual(height);expect(g.stage.left).toBeGreaterThanOrEqual(0);expect(g.stage.right).toBeLessThanOrEqual(width);
 expect(g.left).toBe(g.stage.left);expect(g.right).toBe(g.stage.right);expect(g.top).toBe(g.stage.top);expect(g.bottom).toBe(g.stage.bottom);
 expect(g.buttons).toHaveLength(4);
 for(const b of g.buttons){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);expect(b.top).toBeGreaterThanOrEqual(g.top+g.h);expect(b.bottom).toBeLessThanOrEqual(height);
  expect(b.left).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width);expect(b.unobscured).toBe(true);
 }
});
test('orientation changes projection without restarting or stretching',async({page})=>{
 await setup(page);await start(page);const before=await pos(page);
 for(const [width,height] of [[390,844],[844,390],[1366,768],[568,320],[600,400],[601,400],[600,400]]){
  await page.setViewportSize({width,height});await page.clock.runFor(32);
  const r=await page.locator('#world').evaluate(c=>({box:c.clientWidth/c.clientHeight,back:c.width/c.height,dimensions:[c.width,c.height]}));
  expect(Math.abs(r.box-r.back)).toBeLessThan(.02);expect(r.back).toBeCloseTo(width<=600?4/3:16/9,2);expect((await pos(page)).x).toBe(before.x);
  expect(r.dimensions).toEqual(width<=600?[1440,1080]:[1920,1080]);
 }
});
