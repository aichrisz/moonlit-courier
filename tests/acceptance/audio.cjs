/* Parent actual WebAudio waveform/lifecycle evidence, no mocked playback method.
 * A zero-volume analyser side branch measures the native master's waveform. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=process.env.COURIER_ROOT||path.resolve(__dirname,'../..');const {chromium}=require(ROOT+'/node_modules/@playwright/test');
const target=process.env.COURIER_URL||require('node:url').pathToFileURL(path.join(ROOT,'index.html')).href;
async function main(){
 const browser=await chromium.launch({executablePath:'/root/.hermes/tools/chromium-1208/chrome-linux/chrome',args:['--no-sandbox']});
 try{
  const reports=[];
  for(const variant of ['actual','missing','rejected']){
   const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push('failed '+r.url()));
   await page.addInitScript(({variant})=>{
    const Base=window.AudioContext;window.__parentAudio=[];
    if(variant==='missing'){
     Object.defineProperty(window,'AudioContext',{value:undefined,configurable:true});Object.defineProperty(window,'webkitAudioContext',{value:undefined,configurable:true});return;
    }
    class ObservedAudio extends Base{
     constructor(...args){
      super(...args);const original=this.createGain.bind(this);let first=true;
      this.createGain=(...values)=>{
       const gain=original(...values);
       if(first){
        first=false;const analyser=this.createAnalyser(),zero=original();analyser.fftSize=2048;zero.gain.value=0;
        gain.connect(analyser);analyser.connect(zero);zero.connect(this.destination);
        window.__parentAudio.push({context:this,gain,analyser});
       }
       return gain;
      };
     }
     resume(){if(variant==='rejected')return Promise.reject(new Error('synthetic resume denial'));return super.resume();}
    }
    window.AudioContext=ObservedAudio;
   },{variant});
   await page.goto(target);assert.equal(await page.locator('#sound').isChecked(),false);
   assert.equal(await page.evaluate(()=>window.__parentAudio.length),0,'no AudioContext before explicit opt-in');
   await page.locator('#sound').check();await page.locator('#start').click();
   const sample=()=>page.evaluate(()=>window.__parentAudio.map(({context,gain,analyser})=>{
    const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);
    let sum=0;for(const value of values)sum+=value*value;const rawRms=Math.sqrt(sum/values.length);
    return {state:context.state,gain:gain.gain.value,rawRms,outputRms:context.state==='running'?rawRms:0};
   }));
   const result={variant,target};
   if(variant==='actual'){
    await page.waitForFunction(()=>document.querySelector('#sound-status').textContent==='Sound on');
    await page.locator('#world').focus();await page.keyboard.press('Space');
    let peak=0;for(let i=0;i<8;i++){await page.waitForTimeout(20);for(const row of await sample())peak=Math.max(peak,row.outputRms);}
    assert(peak>0.00001,'native jump tone must produce a real measured waveform');result.activePeakRms=peak;
    await page.locator('#pause').click();await page.waitForTimeout(80);result.paused=await sample();
    console.log('PARENT_PAUSED_SAMPLE',JSON.stringify(result.paused));
    assert(result.paused.every(x=>x.outputRms===0&&(x.state==='suspended'||x.gain===0)));assert.equal(await page.locator('#sound-status').textContent(),'Sound paused');
    await page.locator('#resume').click();await page.locator('#sound').uncheck();await page.waitForTimeout(80);result.muted=await sample();
    assert(result.muted.every(x=>x.outputRms===0&&(x.state==='suspended'||x.gain===0)));assert.equal(await page.locator('#sound-status').textContent(),'Sound off');
    await page.locator('#sound').check();await page.locator('#world').focus();
    await page.waitForFunction(()=>document.querySelector('#world').dataset.grounded==='true');
    await page.keyboard.press('Space');let resumedPeak=0;
    for(let i=0;i<8;i++){await page.waitForTimeout(20);for(const row of await sample())resumedPeak=Math.max(resumedPeak,row.outputRms);}
    assert(resumedPeak>0.00001);result.reenabledPeakRms=resumedPeak;
    await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.waitForTimeout(80);result.blurred=await sample();
    assert(result.blurred.every(x=>x.outputRms===0&&(x.state==='suspended'||x.gain===0)));
   }else{
    await page.waitForFunction(()=>document.querySelector('#sound-status').textContent==='Sound unavailable');
    await page.locator('#world').focus();const x=await page.locator('#world').getAttribute('data-player-x');
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(160);await page.keyboard.up('ArrowRight');
    assert(Number(await page.locator('#world').getAttribute('data-player-x'))>Number(x),'unsupported sound cannot break actual gameplay');
    result.soundStatus=await page.locator('#sound-status').textContent();result.samples=await sample();
   }
   assert.deepEqual(errors,[]);result.errors=errors;reports.push(result);await context.close();
  }
  fs.mkdirSync(path.join(ROOT,'artifacts/parent'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'artifacts/parent/audio.json'),JSON.stringify({method:'actual native AudioContext analyser side branch; suspended context output is zero by WebAudio semantics, raw held buffer RMS retained separately',reports},null,2));
  console.log(JSON.stringify(reports));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
