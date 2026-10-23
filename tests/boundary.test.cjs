const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {build,exportHTML,RUNTIME}=require('../scripts/public.cjs');
const base=path.resolve(__dirname,'../artifacts/boundary-fixtures');
function fixture(){fs.mkdirSync(base,{recursive:true});const root=fs.mkdtempSync(path.join(base,'case-'));for(const name of RUNTIME)fs.copyFileSync(path.resolve(__dirname,'..',name),path.join(root,name));return root;}
test('allowlist build and exactly-once inline standalone include actual runtime',()=>{
 const root=fixture();try{build(root);exportHTML(root);assert.deepEqual(fs.readdirSync(path.join(root,'dist')).sort(),[...RUNTIME].sort());
 const html=fs.readFileSync(path.join(root,'artifacts/Moonlit-Courier.html'),'utf8');assert.equal((html.match(/<style>/g)||[]).length,1);assert.equal((html.match(/<script>/g)||[]).length,6);assert.ok(html.includes(fs.readFileSync(path.join(root,'styles.css'),'utf8')));assert.ok(!html.includes('src="app.js"'));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
for(const operation of [build,exportHTML])for(const kind of ['source','output','dangling','ancestor'])test(`${operation.name} refuses ${kind} symlink without touching sentinel`,()=>{
 const root=fixture(),outside=fs.mkdtempSync(path.join(base,'outside-')),sentinel=path.join(outside,'sentinel');fs.writeFileSync(sentinel,'SYNTHETIC SAFE');
 try{
  let target;
  if(kind==='source'){target=path.join(root,'app.js');fs.unlinkSync(target);fs.symlinkSync(sentinel,target);}
  else if(kind==='ancestor'){target=path.join(root,operation===build?'dist':'artifacts');fs.symlinkSync(outside,target);}
  else {target=path.join(root,operation===build?'dist/app.js':'artifacts/Moonlit-Courier.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.symlinkSync(kind==='dangling'?path.join(outside,'missing'):sentinel,target);}
  assert.throws(()=>operation(root),/symlink/i);assert.equal(fs.readFileSync(sentinel,'utf8'),'SYNTHETIC SAFE');assert.equal(fs.existsSync(path.join(outside,'missing')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true});}
});
test('export refuses duplicate/missing/foreign script and stylesheet references; build rejects stray files',()=>{
 for(const mutation of [h=>h.replace('</body>','<script src="app.js"></script></body>'),h=>h.replace('<script src="engine.js"></script>',''),h=>h.replace('src="app.js"','src="other.js"'),h=>h.replace('href="styles.css"','href="other.css"')]){
  const root=fixture();try{const f=path.join(root,'index.html');fs.writeFileSync(f,mutation(fs.readFileSync(f,'utf8')));assert.throws(()=>exportHTML(root),/references/i);}finally{fs.rmSync(root,{recursive:true,force:true});}
 }
 const root=fixture();try{fs.mkdirSync(path.join(root,'dist'));fs.writeFileSync(path.join(root,'dist/private.txt'),'synthetic');assert.throws(()=>build(root),/unexpected/i);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
module.exports={fixture};
