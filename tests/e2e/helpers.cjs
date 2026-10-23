const {expect}=require('@playwright/test');
const {routes}=require('../routes.cjs');
async function setup(page,url='/'){
 await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});
 await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));await page.goto(url);
}
async function start(page){await page.locator('#start').click();await page.clock.runFor(50);}
const pos=async page=>page.locator('#world').evaluate(c=>({x:+c.dataset.playerX,y:+c.dataset.playerY,phase:c.dataset.phase}));
async function route(page,index){
 const held=new Set();let exact=0,rounded=0;const trace=[];
 for(const action of routes[index]){
  const wanted=new Set();if(action.input.left)wanted.add('ArrowLeft');if(action.input.right)wanted.add('ArrowRight');if(action.input.jumpPressed)wanted.add('Space');if(action.input.dashPressed)wanted.add('x');
  for(const key of held)if(!wanted.has(key)){await page.keyboard.up(key);held.delete(key);}
  for(const key of wanted)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
  exact+=action.frames*1000/120;const end=Math.round(exact);await page.clock.runFor(end-rounded);rounded=end;
  trace.push(await page.locator('#world').evaluate(c=>({...c.dataset})));
 }
 for(const key of held)await page.keyboard.up(key);
 expect(trace.at(-1).phase,JSON.stringify(trace,null,2)).toBe(index===2?'campaign-complete':'level-complete');
 expect(JSON.parse(trace.at(-1).collected)).toHaveLength(3);
 await expect(page.locator('#deaths')).toHaveText('Returns 0');
 return trace;
}
module.exports={setup,start,pos,route};
