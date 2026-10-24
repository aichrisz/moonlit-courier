(function (root) {
  'use strict';
  const palettes = {
    city: { sky: '#17273f', horizon: '#59617a', far: '#293c55', near: '#1a2d45', roof: '#273d53', trim: '#bc9b79', glow: '#f4c680' },
    clock: { sky: '#211d3a', horizon: '#675275', far: '#3d3555', near: '#2b2845', roof: '#39344e', trim: '#cda174', glow: '#ffd58c' },
    garden: { sky: '#112f3b', horizon: '#547878', far: '#234f57', near: '#183e49', roof: '#294e54', trim: '#97c5ad', glow: '#daf0b3' }
  };
  const backdrops = new Map();
  function draw(canvas, s, seconds, reduced) {
    const screen = canvas.getContext('2d');
    let c = screen;
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    // Only the projection changes on a narrow device; world geometry stays frozen.
    const viewWidth = root.matchMedia('(max-width:600px)').matches ? 720 : 960;
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
    // Cache the detailed distant architecture once per scene. Moving this painted
    // plane behind the foreground retains parallax without repainting every window.
    if (!backdrops.has(s.level.theme)) {
    const backdrop = document.createElement('canvas');backdrop.width=1600;backdrop.height=540;
    c=backdrop.getContext('2d');
    const sky=c.createLinearGradient(0,0,0,540);sky.addColorStop(0,p.sky);sky.addColorStop(1,p.horizon);c.fillStyle=sky;c.fillRect(0,0,1600,540);
    // Quiet, reproducible sky; decoration never touches simulation state.
    for(let i=0;i<74;i++){const x=(i*137+17)%960,y=(i*53+23)%285;circle(x,y,i%7===0?1.4:.7,`rgba(248,235,207,${.2+(i%5)/12})`);}
    const mx=755-(reduced?0:camera*.025);
    glow(mx,105,115,'#e8e5ca28');circle(mx,105,43,'#eee8ca');circle(mx-12,94,39,p.sky);circle(mx+19,125,4,'#d0d2bc40');
    // Three parallax layers of pitched roofs, chimneys and warm inhabited windows.
    for(let layer=0;layer<3;layer++){
      const factor=reduced?0:.1+layer*.13,base=370+layer*55;
      for(let i=-1;i<22;i++){
        const x=i*93-camera*factor, h=70+((i*47+layer*19+200)%115),w=62+(i*13+100)%28,y=base-h;
        rect(x,y,w,h,layer===0?p.far:p.near);
        c.fillStyle=layer===0?p.far:p.near;c.beginPath();c.moveTo(x-4,y);c.lineTo(x+w*.48,y-19-(i%3)*7);c.lineTo(x+w+4,y);c.fill();
        rect(x+12,y-22,8,25,layer===0?p.far:p.near);
        for(let wx=12;wx<w-8;wx+=18)for(let wy=16;wy<h-10;wy+=25){if((i+wx+wy+layer)%4!==0){rect(x+wx,y+wy,5,9,layer===2?'#efc27c70':'#e2ba7550');line(x+wx+2.5,y+wy,x+wx+2.5,y+wy+9,p.near);}}
      }
    }
    if(s.level.theme==='clock'){
      const x=570-(reduced?0:camera*.18);
      rect(x-75,125,150,350,'#29273f');rect(x-65,143,130,285,'#38334f');
      for(let i=0;i<5;i++){rect(x-80,168+i*56,160,4,'#95806c');rect(x-53,220+i*45,12,24,'#f4c68045');rect(x+42,220+i*45,12,24,'#f4c68045');}
      c.fillStyle='#22233b';c.beginPath();c.moveTo(x-95,128);c.lineTo(x,25);c.lineTo(x+95,128);c.fill();line(x,25,x,6,p.glow,2);
      glow(x,178,75,'#ffcf7920');circle(x,178,52,'#bd9b70');circle(x,178,46,'#172839');circle(x,178,41,'#d9bb83');circle(x,178,38,'#283146');
      for(let i=0;i<12;i++){const a=i*Math.PI/6;line(x+Math.sin(a)*32,178-Math.cos(a)*32,x+Math.sin(a)*37,178-Math.cos(a)*37,'#fbe6b6',2);}
      line(x,178,x-21,161,'#fbe6b6',3);line(x,178,x+5,148,'#fbe6b6',2);circle(x,178,4,p.glow);
      text('XIII',x-12,201,'#fbe6b6',11);
    }
    if(s.level.theme==='garden'){
      for(let i=0;i<6;i++){
        const x=i*200+40-(reduced?0:camera*.13),y=220+(i%3)*45;
        c.fillStyle='#365b60';c.beginPath();c.ellipse(x,y,65,12,0,0,Math.PI*2);c.fill();
        c.beginPath();c.moveTo(x-65,y);c.lineTo(x+22,y+55);c.lineTo(x+65,y);c.fill();
        for(let j=0;j<5;j++){line(x+j*15-35,y,x+j*12-35,y-40-j*4,'#7aab91',2);circle(x+j*12-35,y-40-j*4,5,'#dae6ae');}
        c.strokeStyle='#82a6a480';c.lineWidth=3;c.beginPath();c.arc(x,y-10,37,Math.PI,0);c.stroke();
      }
    }
    backdrops.set(s.level.theme,backdrop);
    }
    c=screen;
    c.drawImage(backdrops.get(s.level.theme),-(reduced?0:camera*.12),0);
    // Foreground world coordinates: solid ledges are visually outlined collision geometry.
    c.save();c.translate(-camera,0);
    for(const b of s.platforms){
      const body=c.createLinearGradient(0,b.y,0,b.y+b.h);body.addColorStop(0,p.roof);body.addColorStop(1,'#122238');
      c.fillStyle=body;c.fillRect(b.x,b.y,b.w,b.h);rect(b.x,b.y,b.w,5,p.trim);rect(b.x,b.y+5,b.w,5,'#101d2f');
      for(let x=b.x+12;x<b.x+b.w-8;x+=32){line(x,b.y+13,x+18,b.y+13,'#77909d50');if(b.h>50){rect(x,b.y+31,12,23,'#e8ba7555');line(x+6,b.y+31,x+6,b.y+54,'#263b4b',2);line(x,b.y+42,x+12,b.y+42,'#263b4b',2);}}
      if(b.motion){line(b.x+8,b.y+12,b.x+b.w-8,b.y+12,p.glow,2);circle(b.x+15,b.y+17,4,'#9ac9d1');circle(b.x+b.w-15,b.y+17,4,'#9ac9d1');text('MOON LIFT',b.x+16,b.y+36,'#c4e5e3',9);}
      else if(b.h>50){
        for(let x=b.x+55;x<b.x+b.w-30;x+=150){rect(x,b.y-26,21,26,'#314354');rect(x-4,b.y-28,29,6,p.trim);line(x+6,b.y-22,x+6,b.y-5,'#67798a');}
        if(s.level.theme==='garden')for(let x=b.x+17;x<b.x+b.w-10;x+=39){line(x,b.y,x-3,b.y-17,'#85b69d',2);circle(x-3,b.y-18,4,'#cadc9f');line(x,b.y-7,x+7,b.y-13,'#85b69d',2);}
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
    // Courier: cap, face, satchel, articulated boots and a wind-drawn red scarf.
    const q=s.player,x=q.x+q.w/2,y=q.y,walk=q.grounded&&Math.abs(q.vx)>1?Math.sin(t*18):0;
    c.save();c.translate(x,y+20);c.scale(q.facing,1);
    if(!reduced&&s.dashTime>0){for(let i=3;i>0;i--){c.globalAlpha=.12;rect(-i*12-9,-8,18,27,'#b3e1df');}c.globalAlpha=1;}
    c.fillStyle='#d7796f';c.beginPath();c.moveTo(-5,-5);c.bezierCurveTo(-18,-7,-26,Math.sin(t*9)*6,-39,-8+Math.sin(t*8)*4);c.lineTo(-29,3);c.bezierCurveTo(-20,5,-13,0,-4,1);c.fill();
    line(-4,10,-7+walk*4,18,'#112237',7);line(5,10,7-walk*4,18,'#112237',7);line(-7+walk*4,18,-1+walk*4,18,'#d4bb95',4);line(7-walk*4,18,12-walk*4,18,'#d4bb95',4);
    c.fillStyle='#7295a4';c.beginPath();c.moveTo(-8,-8);c.lineTo(8,-8);c.lineTo(12,11);c.lineTo(-10,11);c.fill();line(-6,-5,8,9,'#f1ce8e',3);
    circle(1,-13,8,'#eed1aa');rect(-8,-22,18,6,'#466b82');rect(-10,-17,24,3,'#a9c1b8');rect(6,-14,2,2,'#172639');rect(-8,-7,17,4,'#dc8677');
    c.fillStyle='#b6855e';c.beginPath();c.roundRect(-14,1,12,13,3);c.fill();line(-13,5,-3,5,'#e2be88',2);circle(-8,7,1,'#f4d9a0');c.restore();c.restore();
    if(!reduced)for(let i=0;i<22;i++){const x=(i*71+t*(5+i%3))%960,y=(i*47+t*8)%540;circle(x,y,i%3===0?1.2:.6,'#ffe0aa65');}
    const vignette=c.createRadialGradient(480,260,160,480,260,600);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'#09142465');c.fillStyle=vignette;c.fillRect(0,0,960,540);
    text('NIGHT POST / '+s.level.name.toUpperCase(),23,29,'#e1dac2',10);
  }
  root.MCRenderer=Object.freeze({draw});
})(globalThis);
