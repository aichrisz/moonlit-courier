(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./levels.js'));else root.MCEngine=factory(root.MCLevels);})(typeof globalThis!=='undefined'?globalThis:this,function(levels){
'use strict';
const {LEVELS}=levels;
const CONSTANTS=Object.freeze({STEP:1/120,RUN:240,GRAVITY:1500,JUMP:540,MAX_FALL:780,COYOTE:0.1,BUFFER:0.12,DASH_SPEED:660,DASH_TIME:0.16,MAX_TRAVEL:2});
const copy=v=>JSON.parse(JSON.stringify(v));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function platformAt(b,t){const p={...b};if(b.motion)p[b.motion.axis]+=Math.sin(t*2*Math.PI/b.motion.period)*b.motion.amplitude;return p;}
function createGame(levelIndex=0,levelOverride=null){
 if(!Number.isInteger(levelIndex)||levelIndex<0||levelIndex>=LEVELS.length)throw new RangeError('level index');
 const level=copy(levelOverride||LEVELS[levelIndex]);
 return {levelIndex,level,player:{...level.spawn,vx:0,vy:0,w:24,h:40,grounded:false,facing:1,dashReady:true},elapsed:0,ticks:0,phase:'playing',collected:[],checkpoint:copy(level.spawn),checkpointId:null,deaths:0,coyote:0,buffer:0,dashTime:0,dashDirection:1,events:[],platforms:level.platforms.map(b=>platformAt(b,0))};
}
function respawn(s){
 Object.assign(s.player,s.checkpoint,{vx:0,vy:0,grounded:false,dashReady:true});
 s.deaths++;s.coyote=0;s.buffer=0;s.dashTime=0;s.events.push('respawn');
}
function contacts(s){
 const p=s.player;
 if(p.y>s.level.height+100||s.level.hazards.some(h=>overlaps(p,h))){respawn(s);return false;}
 for(const c of s.level.checkpoints)if(overlaps(p,c)&&p.grounded&&s.checkpointId!==c.id){s.checkpoint=copy(c.spawn);s.checkpointId=c.id;s.events.push('checkpoint');}
 for(const l of s.level.letters)if(!s.collected.includes(l.id)&&overlaps(p,{x:l.x-12,y:l.y-10,w:24,h:20})){s.collected.push(l.id);s.events.push('letter');}
 if(s.level.letters.filter(l=>!l.optional).every(l=>s.collected.includes(l.id))&&overlaps(p,s.level.exit)){s.phase='level-complete';s.events.push('delivery');return false;}
 return true;
}
function stepGame(s,input={},seconds=CONSTANTS.STEP){
 if(!Number.isFinite(seconds)||seconds<=0||seconds>1/30)throw new RangeError('seconds must be finite in (0,1/30]');
 if(s.phase!=='playing')return s;
 s.events=[];s.ticks++;const p=s.player;
 const direction=(input.right?1:0)-(input.left?1:0);
 s.coyote=p.grounded?CONSTANTS.COYOTE:Math.max(0,s.coyote-seconds);
 s.buffer=input.jumpPressed?CONSTANTS.BUFFER:Math.max(0,s.buffer-seconds);
 if(direction&&s.dashTime<=0)p.facing=direction;
 if(s.buffer>0&&s.coyote>0){p.vy=-CONSTANTS.JUMP;p.grounded=false;s.coyote=0;s.buffer=0;s.events.push('jump');}
 if(input.dashPressed&&!p.grounded&&p.dashReady){p.dashReady=false;s.dashTime=CONSTANTS.DASH_TIME;s.dashDirection=p.facing;s.events.push('dash');}
 // Spatial substeps resolve thin solids/hazards even for the maximum accepted dt.
 const count=Math.ceil(seconds*Math.max(CONSTANTS.MAX_FALL,CONSTANTS.DASH_SPEED)/CONSTANTS.MAX_TRAVEL),dt=seconds/count;
 for(let k=0;k<count;k++){
  const previous=s.platforms;s.elapsed+=dt;s.platforms=s.level.platforms.map(b=>platformAt(b,s.elapsed));
  if(p.grounded){const support=previous.findIndex(b=>Math.abs(p.y+p.h-b.y)<0.01&&p.x+p.w>b.x&&p.x<b.x+b.w);if(support>=0){p.x+=s.platforms[support].x-previous[support].x;p.y+=s.platforms[support].y-previous[support].y;}}
  if(s.dashTime>0){p.vx=s.dashDirection*CONSTANTS.DASH_SPEED;p.vy=0;s.dashTime=Math.max(0,s.dashTime-dt);}
  else {p.vx=direction*CONSTANTS.RUN;p.vy=Math.min(CONSTANTS.MAX_FALL,p.vy+CONSTANTS.GRAVITY*dt);for(const w of s.level.wind)if(overlaps(p,w))p.vx+=w.force;}
  p.x+=p.vx*dt;
  for(const b of s.platforms)if(overlaps(p,b)){p.x=p.vx>0?b.x-p.w:b.x+b.w;p.vx=0;s.dashTime=0;}
  p.x=Math.max(0,Math.min(s.level.width-p.w,p.x));
  if(!contacts(s))return s;
  p.y+=p.vy*dt;p.grounded=false;
  for(const b of s.platforms)if(overlaps(p,b)){if(p.vy>=0){p.y=b.y-p.h;p.grounded=true;p.dashReady=true;s.dashTime=0;}else p.y=b.y+b.h;p.vy=0;}
  if(!contacts(s))return s;
 }
 return s;
}
function snapshot(state){return copy(state);}
return {createGame,stepGame,snapshot,CONSTANTS};
});
