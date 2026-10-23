const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/e2e',timeout:180000,expect:{timeout:3000},workers:1,fullyParallel:false,
 reporter:[['list'],['json',{outputFile:'artifacts/evidence/playwright.json'}]],
 use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1366,height:768},deviceScaleFactor:2,
  launchOptions:{executablePath:'/root/.hermes/tools/chromium-1208/chrome-linux/chrome',args:['--no-sandbox']},
  screenshot:'only-on-failure',trace:'retain-on-failure'},
 webServer:{command:'node scripts/server.cjs',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:10000}
});
