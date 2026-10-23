const test=require('node:test'),assert=require('node:assert/strict');
const {createAudio}=require('../audio.js');
test('off by default, opt-in signal, pause/mute stop nodes and master gain',async()=>{
 let made=0,stopped=0;const gains=[];
 class Context{
  constructor(){made++;this.currentTime=1;this.destination={};}
  createGain(){const gain={value:0,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){}};gains.push(gain);return {gain,connect(){},disconnect(){}};}
  createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){},stop(){stopped++;},disconnect(){}};}
  async resume(){} async suspend(){}
 }
 const messages=[],audio=createAudio({AudioContext:Context},m=>messages.push(m));
 audio.play('jump');assert.equal(made,0);await audio.enable(true);audio.setPlaying(true);audio.play('jump');assert.equal(made,1);assert.ok(gains[0].value>0);
 audio.setPlaying(false);assert.equal(gains[0].value,0);assert.ok(stopped>=1);assert.equal(messages.at(-1),'Sound paused');
 await audio.enable(false);assert.equal(gains[0].value,0);assert.equal(messages.at(-1),'Sound off');
});
test('unavailable or rejected audio remains a handled unavailable status',async()=>{
 for(const host of [{},{AudioContext:class{constructor(){throw Error('denied');}}}]){
  const messages=[],a=createAudio(host,m=>messages.push(m));await a.enable(true);a.play('letter');assert.equal(messages.at(-1),'Sound unavailable');
 }
});
