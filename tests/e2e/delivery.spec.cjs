const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {createHash} = require('node:crypto');
const {ROOT, RUNTIME, inlineHTML} = require('../../scripts/public.cjs');
const {setup, start, route} = require('./helpers.cjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

for (const target of ['build', 'offline']) {
 test(`${target}: native nine-letter three-exit campaign and exact source delivery bytes`, async ({page, context}) => {
  const errors = [], requests = [], trace = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  const data = new Map(RUNTIME.map(name => [name,fs.readFileSync(path.join(ROOT,name),'utf8')]));
  const sourceHashes = Object.fromEntries([...data].map(([name,text])=>[name,hash(text)]));
  let url = '/dist/';
  if (target === 'offline') {
   const file = path.join(ROOT,'artifacts/Moonlit-Courier.html');
   expect(fs.readFileSync(file,'utf8')).toBe(inlineHTML(data));
   url = pathToFileURL(file).href;
   await context.setOffline(true);
  } else {
   for (const name of RUNTIME) expect(hash(fs.readFileSync(path.join(ROOT,'dist',name)))).toBe(sourceHashes[name]);
  }
  await setup(page,url);
  await expect(page.locator('html')).toHaveCSS('background-color','rgb(12, 20, 35)');
  await expect(page.locator('#world')).toHaveCSS('object-fit','contain');
  if (target === 'offline') {
   await expect(page.locator('script[src]')).toHaveCount(0);
   await expect(page.locator('link[rel=stylesheet]')).toHaveCount(0);
   await expect(page.locator('style')).toHaveCount(1);
   await expect(page.locator('script')).toHaveCount(6);
  }
  for (let level=0;level<3;level++) {
   if(level) await page.locator('#next').click();
   await start(page);
   await page.screenshot({path:`artifacts/evidence/${target}-level-${level+1}-playing.png`});
   trace.push(await route(page,level));
   await page.screenshot({path:`artifacts/evidence/${target}-level-${level+1}-results.png`});
  }
  const letters=trace.flatMap(segments=>JSON.parse(segments.at(-1).collected));
  expect(new Set(letters).size).toBe(9);
  expect(errors).toEqual([]);
  if(target==='offline') expect(requests).toEqual([url]);
  else {
   expect(requests.every(request=>request.startsWith('http://127.0.0.1:4173/dist/'))).toBe(true);
   expect(requests).toHaveLength(8);
  }
  fs.writeFileSync(`artifacts/evidence/${target}-witness.json`,JSON.stringify({sourceHashes,requests,letters,trace},null,2));
 });
}
