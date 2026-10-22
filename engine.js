(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./levels.js'));else root.MCEngine=factory(root.MCLevels);})(typeof globalThis!=='undefined'?globalThis:this,function(levels){
'use strict';
const {LEVELS}=levels;
const CONSTANTS=Object.freeze({STEP:1/120,RUN:240,GRAVITY:1500,JUMP:540,MAX_FALL:780,COYOTE:0.1,BUFFER:0.12,DASH_SPEED:660,DASH_TIME:0.16});
const copy=v=>JSON.parse(JSON.stringify(v));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function createGame(levelIndex=0,levelOverride=null){
 if(!Number.isInteger(levelIndex)||levelIndex<0||levelIndex>=LEVELS.length)throw new RangeError('level index');
 const level=copy(levelOverride||LEVELS[levelIndex]);
 return {levelIndex,level,player:{...level.spawn,vx:0,vy:0,w:24,h:40,grounded:false,facing:1,dashReady:true},elapsed:0,ticks:0,phase:'playing',collected:[],checkpoint:copy(level.spawn),checkpointId:null,deaths:0,coyote:0,buffer:0,dashTime:0,events:[],platforms:copy(level.platforms)};
}
function stepGame(s,input={},seconds=CONSTANTS.STEP){
 if(!Number.isFinite(seconds)||seconds<=0||seconds>1/30)throw new RangeError('seconds must be finite in (0,1/30]');
 if(s.phase!=='playing')return s;
 const p=s.player;s.events=[];s.elapsed+=seconds;s.ticks++;
 p.vx=((input.right?1:0)-(input.left?1:0))*CONSTANTS.RUN;if(p.vx)p.facing=Math.sign(p.vx);
 s.coyote=p.grounded?CONSTANTS.COYOTE:Math.max(0,s.coyote-seconds);
 s.buffer=input.jumpPressed?CONSTANTS.BUFFER:Math.max(0,s.buffer-seconds);
 if(s.buffer>0&&s.coyote>0){p.vy=-CONSTANTS.JUMP;p.grounded=false;s.coyote=0;s.buffer=0;s.events.push('jump');}
 p.vy=Math.min(CONSTANTS.MAX_FALL,p.vy+CONSTANTS.GRAVITY*seconds);
 p.x+=p.vx*seconds;
 for(const b of s.platforms)if(overlaps(p,b)){p.x=p.vx>0?b.x-p.w:b.x+b.w;p.vx=0;}
 p.x=Math.max(0,Math.min(s.level.width-p.w,p.x));
 p.y+=p.vy*seconds;p.grounded=false;
 for(const b of s.platforms)if(overlaps(p,b)){if(p.vy>=0){p.y=b.y-p.h;p.grounded=true;}else p.y=b.y+b.h;p.vy=0;}
 return s;
}
function snapshot(state){return copy(state);}
return {createGame,stepGame,snapshot,CONSTANTS};
});
