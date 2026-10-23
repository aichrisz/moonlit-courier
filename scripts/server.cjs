'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['index.html','styles.css','levels.js','engine.js','records.js','renderer.js','audio.js','app.js'];
const allowed=new Set(files.flatMap(f=>['/'+f,'/dist/'+f]));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(name==='/')name='/index.html';if(name==='/dist/')name='/dist/index.html';
 if(!allowed.has(name)){res.writeHead(404).end('Not found');return;}
 const file=path.join(root,name);
 try{
  let part=root;for(const segment of name.split('/').filter(Boolean)){part=path.join(part,segment);if(fs.lstatSync(part).isSymbolicLink())throw Error('link');}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store'});res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end('Not found');}
});
server.listen(4173,'127.0.0.1');
const close=()=>server.close(()=>process.exit(0));
process.on('SIGTERM',close);process.on('SIGINT',close);
// Local testing only: even an abandoned runner cannot leave a persistent service.
setTimeout(close,10*60*1000).unref();
