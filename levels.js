(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MCLevels=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const roof=(x,w,y=440,h=100)=>({x,y,w,h});
const flag=(id,x)=>({id,x,y:390,w:34,h:50,spawn:{x,y:400}});
const letters=(prefix,scenicX,scenicY,mainX)=>[{id:prefix+'-home',x:280,y:410,optional:false},{id:prefix+'-wish',x:scenicX,y:scenicY,optional:true},{id:prefix+'-dawn',x:mainX,y:410,optional:false}];
const LEVELS=[
 {id:'rooftops',name:'Lantern Rooftops',subtitle:'A warm light in every window',theme:'city',width:2160,height:540,spawn:{x:80,y:400},
 platforms:[roof(0,460),roof(560,520),roof(1250,480),roof(1880,280),roof(790,160,350,22),{...roof(1110,110,440,20),motion:{axis:'x',amplitude:26,period:4}}],
 hazards:[],wind:[],checkpoints:[flag('roof-east',620),flag('roof-last',1540)],letters:letters('roof',860,320,1480),exit:{x:2050,y:380,w:44,h:60}},
 {id:'clocktower',name:'The Thirteenth Bell',subtitle:'Between the gears, the city dreams',theme:'clock',width:2260,height:540,spawn:{x:80,y:400},
 platforms:[roof(0,490),roof(600,510),roof(1300,480),roof(1920,340),roof(800,170,350,24),{...roof(1150,110,430,22),motion:{axis:'y',amplitude:32,period:3}}],
 hazards:[{x:1660,y:422,w:32,h:18}],wind:[],checkpoints:[flag('bell-east',650),flag('bell-last',1540)],letters:letters('bell',875,320,1480),exit:{x:2150,y:380,w:44,h:60}},
 {id:'gardens',name:'Moonwake Gardens',subtitle:'Carry a little dawn home',theme:'garden',width:2300,height:540,spawn:{x:80,y:400},
 platforms:[roof(0,470),roof(590,540),roof(1320,490),roof(1940,360),roof(810,175,350,26),{...roof(1180,105,435,22),motion:{axis:'x',amplitude:36,period:4.5}}],
 hazards:[],wind:[{x:1330,y:220,w:160,h:220,force:-55}],checkpoints:[flag('garden-east',640),flag('garden-last',1550)],letters:letters('garden',885,320,1530),exit:{x:2180,y:380,w:44,h:60}}
];
// Deep frozen definitions: callers receive detached copies through createGame.
function freeze(v){Object.freeze(v);for(const x of Object.values(v))if(x&&typeof x==='object'&&!Object.isFrozen(x))freeze(x);return v;}
return {LEVELS:freeze(LEVELS)};
});
