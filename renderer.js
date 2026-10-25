(function (root) {
  'use strict';
  const palettes = {
    city: { sky: '#17273f', horizon: '#59617a', far: '#293c55', near: '#1a2d45', roof: '#273d53', trim: '#bc9b79', glow: '#f4c680' },
    clock: { sky: '#211d3a', horizon: '#675275', far: '#3d3555', near: '#2b2845', roof: '#39344e', trim: '#cda174', glow: '#ffd58c' },
    garden: { sky: '#112f3b', horizon: '#547878', far: '#234f57', near: '#183e49', roof: '#294e54', trim: '#97c5ad', glow: '#daf0b3' }
  };
  // Isolated presentation memory: no reference to the game, clock or DOM. The app
  // observes every accepted tick so short edges cannot disappear between paints.
  function createFeedback() {
    const capacity=64;
    let previous=null, particles=[], landing=0;
    function observe(s,reduced=false) {
      const q=s.player;
      if(!previous || previous.level!==s.levelIndex || s.ticks<previous.tick || s.elapsed<previous.time) {
        particles=[];landing=0;previous=null;
      }
      if(reduced){particles=[];landing=0;}
      if(previous && s.ticks!==previous.tick) {
        const dt=Math.max(0,s.elapsed-previous.time);
        particles=particles.map(p=>({...p,age:p.age+dt})).filter(p=>p.age<p.life);
        landing=Math.max(0,landing-dt);
        if(s.deaths!==previous.deaths){particles=[];landing=0;}
        const burst=(kind,x,y,count=8)=>{
          if(reduced)return;
          for(let i=0;i<count;i++){
            const angle=(i/count)*Math.PI*2;
            particles.push({kind,x,y,age:0,life:kind==='delivery'?1.1:.55,i,
              vx:Math.cos(angle)*(kind==='dash'?50:28),vy:Math.sin(angle)*26-15});
          }
          if(particles.length>capacity)particles.splice(0,particles.length-capacity);
        };
        for(const letter of s.level.letters)if(s.collected.includes(letter.id)&&!previous.collected.includes(letter.id))burst('pickup',letter.x,letter.y,10);
        if(previous.ready&&!q.dashReady)burst('dash',q.x+q.w/2,q.y+20);
        if(!previous.grounded&&q.grounded&&previous.vy>0&&s.deaths===previous.deaths){burst('landing',q.x+q.w/2,q.y+q.h,6);if(!reduced)landing=.16;}
        if(s.checkpointId&&s.checkpointId!==previous.checkpoint)burst('checkpoint',q.x+q.w/2,q.y,12);
        if(s.phase==='level-complete'&&previous.phase!==s.phase)burst('delivery',s.level.exit.x+22,s.level.exit.y+10,20);
      }
      previous={level:s.levelIndex,tick:s.ticks,time:s.elapsed,collected:[...s.collected],ready:q.dashReady,grounded:q.grounded,vy:q.vy,checkpoint:s.checkpointId,phase:s.phase,deaths:s.deaths};
    }
    return Object.freeze({capacity,observe,snapshot:()=>({particles:particles.map(p=>({...p})),landing})});
  }
  const backdrops = new Map();
  // MediaQueryList is live: the browser updates .matches on resize/orientation.
  // Keep one query rather than forcing style-query construction on every paint.
  const narrowViewport=typeof root.matchMedia==='function'?root.matchMedia('(max-width:600px)'):null;
  let stageBackdrop=null;
  function draw(canvas, s, seconds, reduced, feedback={particles:[],landing:0}) {
    const screen = canvas.getContext('2d');
    let c = screen;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    // Only the projection changes on a narrow device; world geometry stays frozen.
    const viewWidth = narrowViewport && narrowViewport.matches ? 720 : 960;
    if (canvas.width !== viewWidth*dpr || canvas.height !== 540*dpr) {
      canvas.width = viewWidth*dpr; canvas.height = 540*dpr;
    }
    c.setTransform(dpr,0,0,dpr,0,0);
    const p = palettes[s.level.theme] || palettes.city;
    const t = reduced ? 0 : seconds;
    const camera = Math.max(0, Math.min(s.level.width-viewWidth, s.player.x-viewWidth*330/960));
    const rect = (x,y,w,h,color) => { c.fillStyle=color; c.fillRect(x,y,w,h); };
    const line = (x,y,xx,yy,color,width=1) => { c.strokeStyle=color; c.lineWidth=width; c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke(); };
    const circle = (x,y,r,color) => {c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
    const text = (value,x,y,color=p.glow,size=12) => {c.fillStyle=color;c.font=`${size}px Georgia`;c.fillText(value,x,y);};
    const glow = (x,y,r,color) => {const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);};
    // Four independent, deterministic illustrations per theme, never camera-baked.
    // A finite theme key and fixed 2048x540 planes bound the cache at twelve canvases.
    const theme=Object.hasOwn(palettes,s.level.theme)?s.level.theme:'city';
    if (!backdrops.has(theme)) {
      const planes=[];
      for(let layer=0;layer<4;layer++){
        const plane=document.createElement('canvas');plane.width=2048;plane.height=540;
        planes.push(plane);c=plane.getContext('2d');
        if(layer===0){
          const sky=c.createLinearGradient(0,0,0,540);sky.addColorStop(0,p.sky);sky.addColorStop(.6,p.horizon);sky.addColorStop(1,'#a08b7b');c.fillStyle=sky;c.fillRect(0,0,2048,540);
          for(let i=0;i<110;i++){const x=(i*137+17)%2048,y=(i*53+23)%260;circle(x,y,i%7===0?1.3:.6,'#f4e1bd80');}
          const mx=650;glow(mx,104,135,'#f6dfa72b');circle(mx,104,42,'#f2e1b9');circle(mx-15,91,38,p.sky);
          // Long thin etched clouds, not moving light over collision edges.
          for(let i=0;i<12;i++){const x=(i*193)%2048,y=126+(i*37)%145;line(x,y,x+100+i%3*40,y,'#dfcbb21a',2);}
          continue;
        }
        const base=335+layer*53;
        for(let i=-1;i<24;i++){
          const x=i*97,w=68+(i*17+170)%26,h=65+(i*43+layer*23+430)%107,y=base-h;
          const color=layer===1?p.far:layer===2?p.near:'#142a3b';
          rect(x,y,w,h+80,color);
          c.fillStyle=color;c.beginPath();c.moveTo(x-5,y);c.lineTo(x+w*.52,y-22-(i%3)*10);c.lineTo(x+w+5,y);c.fill();
          line(x-4,y,x+w*.52,y-22-(i%3)*10,layer===1?'#a4a3a328':'#b99e7e40');
          rect(x+15,y-27,8,27,color);rect(x+12,y-28,14,3,'#a99b8430');
          if(layer>1)for(let wx=13;wx<w-10;wx+=21)for(let wy=20;wy<h;wy+=29){
            if((i+wx+wy)%5===0)continue;
            rect(x+wx-2,y+wy-2,10,16,'#101f31');rect(x+wx,y+wy,6,12,layer===2?'#d9b57a70':'#eec68d9a');
            line(x+wx+3,y+wy,x+wx+3,y+wy+12,color);line(x+wx-2,y+wy+14,x+wx+9,y+wy+14,'#aa97834a');
          }
          if(layer===3){for(let n=0;n<4;n++)line(x+n*18,y-6,x+n*18,y-17,'#a7a49b40');line(x,y-17,x+55,y-17,'#a7a49b40');}
        }
        if(layer===2&&theme==='city'){
          // A lit conservatory and hanging night-post lanterns give this street a home.
          const x=465;rect(x,258,180,167,'#2b3947');rect(x+8,265,164,154,'#bda47535');
          c.fillStyle='#253546';c.beginPath();c.moveTo(x-14,258);c.lineTo(x+90,192);c.lineTo(x+194,258);c.fill();
          for(let n=0;n<6;n++){line(x+12+n*30,260,x+90,195,'#b6a28170');rect(x+15+n*28,285,15,54,'#d9b77c65');}
          text('THE NIGHT POST',x+33,366,'#dbc49a',12);
          c.strokeStyle='#b9a78080';c.beginPath();c.moveTo(40,178);c.quadraticCurveTo(400,300,885,173);c.stroke();
          for(let n=0;n<9;n++){const lx=70+n*96,ly=190+Math.sin(n/8*Math.PI)*53;line(lx,ly-12,lx,ly,'#c0a279',1);glow(lx,ly+8,30,'#ffd79b24');rect(lx-5,ly,10,15,'#e1b67b');rect(lx-7,ly-2,14,3,'#314153');line(lx,ly,lx,ly+15,'#7d705c');}
        }
        if(layer===2&&theme==='clock'){
          const x=567;
          rect(x-77,128,154,335,'#332f45');rect(x-62,141,124,320,'#4e4254');
          for(let n=0;n<5;n++){rect(x-84,139+n*63,168,5,'#a28b723c');rect(x-51,269+n*37,17,25,'#e4b98258');rect(x+34,269+n*37,17,25,'#e4b98258');}
          c.fillStyle='#25293d';c.beginPath();c.moveTo(x-100,130);c.lineTo(x,28);c.lineTo(x+100,130);c.fill();
          for(let n=-2;n<=2;n++)line(x+n*30,125,x,30,'#a4927966');line(x,29,x,10,p.glow,2);circle(x,9,3,p.glow);
          glow(x,196,100,'#e8bc7e22');circle(x,196,66,'#1c283b');circle(x,196,62,'#be9d72');circle(x,196,56,'#eed4a0');circle(x,196,49,'#343446');
          for(let n=0;n<13;n++){const a=n*Math.PI*2/13;line(x+Math.sin(a)*42,196-Math.cos(a)*42,x+Math.sin(a)*47,196-Math.cos(a)*47,'#f2d6a5',2);}
          line(x,196,x-26,173,'#f7dca5',3);line(x,196,x+8,163,'#f7dca5',2);circle(x,196,4,p.glow);text('XIII',x-16,225,'#f9dfad',15);
          text('THE THIRTEENTH BELL',x-67,294,'#ceb48e',10);
          for(let n=0;n<3;n++){c.strokeStyle='#ba9b7050';c.lineWidth=2;c.beginPath();c.arc(x,196,76+n*8,Math.PI*.9,Math.PI*1.5);c.stroke();}
        }
        if(theme==='garden'&&layer<3){
          for(let n=0;n<7;n++){
            const x=110+n*280+(layer-1)*75,y=310+(n%3)*26-(layer===1?67:0),r=layer===1?65:87;
            c.fillStyle=layer===1?'#446965':'#294e52';c.beginPath();c.moveTo(x-r,y);c.bezierCurveTo(x-r/2,y+25,x+20,y+93,x+r,y);c.fill();
            c.fillStyle='#6d8b7790';c.beginPath();c.ellipse(x,y,r,13,0,0,Math.PI*2);c.fill();
            c.strokeStyle='#9cb59b80';c.lineWidth=5;c.beginPath();c.arc(x,y-6,r*.62,Math.PI,0);c.stroke();
            line(x-r*.62,y-6,x-r*.62,y+4,'#9cb59b80',6);line(x+r*.62,y-6,x+r*.62,y+4,'#9cb59b80',6);
            for(let k=0;k<7;k++){
              const bx=x-r+20+k*20,by=y-18-(k%3)*13;line(bx,y,bx,by-28,'#96b89b',1.5);
              for(let leaf=0;leaf<3;leaf++){c.fillStyle=leaf%2?'#b4c9a085':'#78a48c';c.beginPath();c.ellipse(bx+(leaf%2?6:-6),by-leaf*9,9,3,leaf%2?-.6:.6,0,Math.PI*2);c.fill();}
              circle(bx,by-30,3,'#e5dca7');
            }
            for(let k=0;k<4;k++){c.strokeStyle='#91ac8180';c.lineWidth=1;c.beginPath();c.moveTo(x-40+k*24,y+10);c.quadraticCurveTo(x-50+k*24,y+45,x-34+k*24,y+63);c.stroke();}
          }
        }
        // Fog belongs to its own plane and is behind the exact solid geometry.
        const fog=c.createLinearGradient(0,330,0,540);fog.addColorStop(0,'transparent');fog.addColorStop(.6,'#c5bba414');fog.addColorStop(1,'transparent');c.fillStyle=fog;c.fillRect(0,330,2048,210);
      }
      backdrops.set(theme,planes);
    }
    c=screen;
    const factors=[0,.09,.23,.41];
    // Blend all four independently translated planes at authored resolution first.
    // Only ONE smooth upscale reaches DPR2: four separate filtered upscales doubled
    // software-raster frame cost. One reusable viewport buffer adds at most 2 MiB,
    // unlike device-resolution caches which would quadruple the twelve-plane budget.
    if(!stageBackdrop)stageBackdrop=document.createElement('canvas');
    if(stageBackdrop.width!==viewWidth||stageBackdrop.height!==540){stageBackdrop.width=viewWidth;stageBackdrop.height=540;}
    const scenery=stageBackdrop.getContext('2d',{alpha:false});
    backdrops.get(theme).forEach((plane,i)=>scenery.drawImage(plane,reduced?0:-camera*factors[i],0));
    c.drawImage(stageBackdrop,0,0);
    // Foreground world coordinates: solid ledges are visually outlined collision geometry.
    c.save();c.translate(-camera,0);
    for(const b of s.platforms){
      const body=c.createLinearGradient(0,b.y,0,b.y+b.h);body.addColorStop(0,p.roof);body.addColorStop(1,'#122238');
      c.fillStyle=body;c.fillRect(b.x,b.y,b.w,b.h);rect(b.x,b.y,b.w,5,p.trim);rect(b.x,b.y+5,b.w,5,'#101d2f');
      for(let x=b.x+12;x<b.x+b.w-8;x+=32){line(x,b.y+13,x+18,b.y+13,'#77909d50');if(b.h>50){rect(x,b.y+31,12,23,'#e8ba7555');line(x+6,b.y+31,x+6,b.y+54,'#263b4b',2);line(x,b.y+42,x+12,b.y+42,'#263b4b',2);}}
      if(b.motion){line(b.x+8,b.y+12,b.x+b.w-8,b.y+12,p.glow,2);circle(b.x+15,b.y+17,4,'#9ac9d1');circle(b.x+b.w-15,b.y+17,4,'#9ac9d1');text('MOON LIFT',b.x+16,b.y+36,'#c4e5e3',9);}
      else if(b.h>50){
        // Ornament is BELOW the collision lip, never a false obstacle on the roof.
        for(let x=b.x+40;x<b.x+b.w-20;x+=145){
          line(x,b.y+14,x,b.y+68,'#bb9d7960',2);glow(x,b.y+40,28,'#edc18824');rect(x-4,b.y+34,8,14,'#ddba80');
          if(theme==='garden'){line(x+14,b.y+12,x+20,b.y+48,'#85b69d',2);for(let n=0;n<3;n++)circle(x+18+n%2*5,b.y+21+n*11,4,'#91b99c');}
        }
      }
    }
    // Brass lanterns, safe pennants, hazards and the visible wind ribbon.
    for(const cp of s.level.checkpoints){
      line(cp.x+8,cp.y+50,cp.x+8,cp.y-30,p.trim,3);
      c.fillStyle=s.checkpointId===cp.id?'#b8e7ba':'#d29775';c.beginPath();c.moveTo(cp.x+10,cp.y-28);c.lineTo(cp.x+43,cp.y-20+Math.sin(t*2)*3);c.lineTo(cp.x+10,cp.y-8);c.fill();
      circle(cp.x+8,cp.y-32,4,p.glow);text('SAFE POST',cp.x-12,cp.y-44,'#fff0d2',10);
    }
    for(const h of s.level.hazards){glow(h.x+h.w/2,h.y+4,28,'#f4a36530');for(let x=h.x;x<h.x+h.w;x+=8){c.fillStyle='#e69c80';c.beginPath();c.moveTo(x,h.y+h.h);c.lineTo(x+4,h.y);c.lineTo(x+8,h.y+h.h);c.fill();}text('HOT VENT',h.x-12,h.y-12,'#ffcba4',10);}
    for(const w of s.level.wind){rect(w.x,w.y,w.w,w.h,'#a5e7dc0d');text('HEADWIND ←',w.x+10,w.y-12,'#b9e5d8',12);for(let i=0;i<8;i++){const x=w.x+((i*31-t*42)%w.w+w.w)%w.w,y=w.y+30+i*22;line(x,y,x-28,y,'#a5dfcd80');line(x-28,y,x-21,y-4,'#a5dfcd80');}}
    for(const l of s.level.letters){
      if(s.collected.includes(l.id))continue;
      const y=l.y+(reduced?0:Math.sin(t*2.6+l.x)*3);
      glow(l.x,y,34,l.optional?'#b6e6ca50':'#ffca7650');
      c.save();c.translate(l.x,y);c.rotate(-.09);rect(-12,-8,24,16,l.optional?'#cae8d4':'#ffebbb');line(-12,-8,0,1,'#99704d');line(0,1,12,-8,'#99704d');line(-12,8,-3,0,'#bc9e78');line(12,8,3,0,'#bc9e78');circle(0,1,2,'#b96d66');c.restore();
      if(l.optional){text('SCENIC · OPTIONAL',l.x-54,l.y-35,'#d6f2df',11);text('✦',l.x-4,l.y-19,'#d6f2df',11);}
    }
    const ex=s.level.exit,open=s.level.letters.filter(l=>!l.optional).every(l=>s.collected.includes(l.id));
    glow(ex.x+22,ex.y+20,60,open?'#e6c07e40':'#98c4d018');rect(ex.x+18,ex.y+38,8,22,p.trim);
    c.fillStyle=open?'#c08a58':'#597583';c.beginPath();c.roundRect(ex.x,ex.y,44,44,[19,19,4,4]);c.fill();
    rect(ex.x+7,ex.y+16,30,5,'#14283b');rect(ex.x+12,ex.y+29,20,9,'#e6cd9d');text('POST',ex.x+13,ex.y+36,'#24374b',7);text(open?'DELIVER →':'2 LETTERS TO OPEN',ex.x-35,ex.y-17,'#ffe1aa',11);
    // Finite ink flecks / postmark rings. Drawing cannot create or age an effect.
    if(!reduced)for(const f of feedback.particles){
      const a=f.age/f.life,fx=f.x+f.vx*f.age,fy=f.y+f.vy*f.age;
      c.globalAlpha=(1-a)*.85;
      if(f.kind==='landing')line(fx-3,fy,fx+3,fy,'#d9c9a7',1.5);
      else if(f.kind==='dash')line(fx-10,fy,fx+2,fy,'#c6e6dc',2);
      else{c.save();c.translate(fx,fy);c.rotate(f.i+f.age);rect(-2,-2,4,4,f.kind==='checkpoint'?'#b9dbbf':p.glow);c.restore();}
      if(f.i===0&&f.kind!=='landing'&&f.kind!=='dash'){c.strokeStyle=p.glow;c.lineWidth=1.4;c.beginPath();c.arc(f.x,f.y,12+a*28,0,Math.PI*2);c.stroke();}
    }
    c.globalAlpha=1;
    // The boots terminate at the physical feet, not an enlarged decorative body.
    const q=s.player,x=q.x+q.w/2,feet=q.y+q.h;
    const walk=q.grounded&&Math.abs(q.vx)>1?Math.sin(t*18):0;
    const crouch=!reduced&&feedback.landing>0?3*(feedback.landing/.16):0;
    const rise=!q.grounded&&q.vy<0,fall=!q.grounded&&q.vy>=0;
    c.save();c.translate(x,feet);c.scale(q.facing,1);c.lineCap='round';
    if(!reduced&&s.dashTime>0){for(let i=3;i>0;i--){c.globalAlpha=.13;rect(-i*13-7,-30,14,25,'#b3e1df');}c.globalAlpha=1;}
    // Scarf is the only silhouette extension: clearly cloth, never collision mass.
    c.fillStyle='#cf7462';c.beginPath();c.moveTo(-5,-25+crouch);c.bezierCurveTo(-14,-27,-23,-21+Math.sin(t*9)*3,-31,-27+Math.sin(t*8)*3);c.lineTo(-24,-19);c.bezierCurveTo(-16,-19,-10,-20,-4,-21+crouch);c.fill();
    const backX=rise?-9:fall?-7:-5+walk*4,frontX=rise?7:fall?8:5-walk*4;
    const backY=rise?-9:fall?-4:-2,frontY=rise?-5:fall?-1:-2;
    line(-4,-13+crouch,backX,backY,'#102337',6);line(4,-13+crouch,frontX,frontY,'#102337',6);
    line(backX-1,backY,backX+4,backY,'#e4cba3',3);line(frontX-1,frontY,frontX+5,frontY,'#f3dcb5',3);
    c.fillStyle='#b2c8bd';c.strokeStyle='#102337';c.lineWidth=1.8;c.beginPath();c.moveTo(-7,-27+crouch);c.lineTo(7,-27+crouch);c.lineTo(9,-11+crouch);c.quadraticCurveTo(0,-7+crouch,-9,-11+crouch);c.closePath();c.fill();c.stroke();
    line(-6,-25+crouch,6,-13+crouch,'#b17c50',2.5);rect(4,-23+crouch,2,9,'#e8dfbd');
    line(6,-24+crouch,rise?10:fall?11:8+walk*2,rise?-30:fall?-18:-16+crouch,'#b2c8bd',4);circle(rise?10:fall?11:8+walk*2,rise?-30:fall?-18:-16+crouch,2,'#f4d5ab');
    circle(1,-31+crouch,6.8,'#f1cda3');rect(-7,-39+crouch,15,5,'#38566b');line(-8,-34+crouch,11,-34+crouch,'#e9c487',2);rect(6,-31+crouch,2,2,'#152638');
    rect(-7,-26+crouch,15,3,'#da8370');circle(0,-37+crouch,1.3,'#e8c989');
    c.fillStyle='#b98657';c.strokeStyle='#503f35';c.lineWidth=1;c.beginPath();c.roundRect(-12,-20+crouch,10,12,2);c.fill();c.stroke();line(-11,-17+crouch,-3,-17+crouch,'#efc88d',1.5);circle(-7,-15+crouch,1,'#f8e1a8');c.restore();c.restore();
    if(!reduced)for(let i=0;i<16;i++){const x=(i*71+t*(5+i%3))%viewWidth,y=(i*47+t*8)%540;circle(x,y,i%3===0?1:.5,'#ffe0aa50');}
    const vignette=c.createRadialGradient(viewWidth/2,260,180,viewWidth/2,260,viewWidth*.72);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#09142440');c.fillStyle=vignette;c.fillRect(0,0,viewWidth,540);
    text('NIGHT POST / '+s.level.name.toUpperCase(),23,29,'#e1dac2',10);
    text(s.level.subtitle,23,48,'#ddd1b6',12);
  }
  const api=Object.freeze({draw,createFeedback});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MCRenderer=api;
})(globalThis);
