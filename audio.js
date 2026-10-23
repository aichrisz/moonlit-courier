(function(root,factory) {
  if(typeof module==='object' && module.exports) module.exports=factory();
  else root.MCAudio=factory();
})(globalThis,function() {
  'use strict';
  function createAudio(host,onStatus) {
    let context=null,master=null,enabled=false,playing=false,unavailable=false;
    const voices=new Set();
    function status(){onStatus(unavailable?'Sound unavailable':!enabled?'Sound off':playing?'Sound on':'Sound paused');}
    function silence(){
      if(master){master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(0,context.currentTime);}
      for(const voice of voices){try{voice.stop();voice.disconnect();}catch{/* A scheduled voice may already have ended. */}}
      voices.clear();
    }
    function failed(){unavailable=true;enabled=false;silence();status();}
    async function sync(){
      if(!enabled||!playing){silence();if(context)try{await context.suspend();}catch{failed();}}
      else if(context)try{
        master.gain.setValueAtTime(.12,context.currentTime);
        await context.resume();
        // A pause or mute can arrive while resume is pending.
        if(enabled&&playing)master.gain.setValueAtTime(.12,context.currentTime);
        else silence();
      }catch{failed();}
      status();
    }
    async function enable(value){
      enabled=!!value;
      if(enabled&&!context){
        try{
          const Constructor=host.AudioContext||host.webkitAudioContext;
          if(!Constructor)throw Error('unavailable');
          context=new Constructor();master=context.createGain();master.gain.value=0;master.connect(context.destination);
          unavailable=false;
        }catch{failed();return;}
      }
      if(!value)unavailable=false;
      await sync();
    }
    function setPlaying(value){playing=!!value;if(!playing)silence();status();void sync();}
    function play(event){
      if(!enabled||!playing||!context||unavailable)return;
      const pitch={jump:440,dash:220,letter:880,delivery:660,checkpoint:550}[event];if(!pitch)return;
      try{
        const now=context.currentTime,osc=context.createOscillator(),envelope=context.createGain();
        osc.type='sine';osc.frequency.setValueAtTime(pitch,now);envelope.gain.setValueAtTime(.65,now);envelope.gain.exponentialRampToValueAtTime(.001,now+.16);
        osc.connect(envelope);envelope.connect(master);voices.add(osc);
        osc.onended=()=>{voices.delete(osc);osc.disconnect();envelope.disconnect();};osc.start(now);osc.stop(now+.18);
      }catch{failed();}
    }
    status();return {enable,setPlaying,play};
  }
  return {createAudio};
});
