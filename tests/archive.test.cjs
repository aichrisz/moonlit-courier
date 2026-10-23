const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync,execFileSync}=require('node:child_process');
const base=path.resolve(__dirname,'../artifacts/archive-fixtures'),script=path.resolve(__dirname,'../scripts/package.py');
function fixture(){fs.mkdirSync(base,{recursive:true});const root=fs.mkdtempSync(path.join(base,'case-'));fs.writeFileSync(path.join(root,'index.html'),'synthetic public source');fs.mkdirSync(path.join(root,'docs'));fs.writeFileSync(path.join(root,'docs/note.md'),'synthetic note');fs.writeFileSync(path.join(root,'source-files.json'),JSON.stringify(['docs/note.md','index.html','source-files.json']));execFileSync('git',['init','-q'],{cwd:root});execFileSync('git',['add','index.html','docs/note.md','source-files.json'],{cwd:root});execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture'],{cwd:root});return root;}
const pack=root=>spawnSync('python3',[script,'--root',root],{encoding:'utf8'});
test('source archive contains exactly manifest and committed bytes',()=>{const root=fixture();try{const result=pack(root);assert.equal(result.status,0,result.stderr);assert.ok(fs.statSync(path.join(root,'artifacts/Moonlit-Courier-source.zip')).size>0);assert.match(result.stdout,/3 committed files verified/);}finally{fs.rmSync(root,{recursive:true,force:true});}});
for(const kind of ['source','source-ancestor','output','dangling','ancestor'])test(`archive refuses ${kind} symlink without touching sentinel`,()=>{
 const root=fixture(),outside=fs.mkdtempSync(path.join(base,'outside-'));const sentinel=path.join(outside,'sentinel');fs.writeFileSync(sentinel,'synthetic public source');
 try{
  if(kind==='source'){fs.unlinkSync(path.join(root,'index.html'));fs.symlinkSync(sentinel,path.join(root,'index.html'));}
  else if(kind==='source-ancestor'){fs.renameSync(path.join(root,'docs'),path.join(outside,'docs'));fs.symlinkSync(path.join(outside,'docs'),path.join(root,'docs'));}
  else if(kind==='ancestor')fs.symlinkSync(outside,path.join(root,'artifacts'));
  else{fs.mkdirSync(path.join(root,'artifacts'));fs.symlinkSync(kind==='dangling'?path.join(outside,'missing'):sentinel,path.join(root,'artifacts/Moonlit-Courier-source.zip'));}
  const result=pack(root);assert.notEqual(result.status,0,'symlink must be refused');assert.match(result.stderr,/symlink/i);assert.equal(fs.readFileSync(sentinel,'utf8'),'synthetic public source');assert.equal(fs.existsSync(path.join(outside,'missing')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(outside,{recursive:true,force:true});}
});
test('archive refuses dirty source and manifest traversal',()=>{
 const root=fixture();try{fs.writeFileSync(path.join(root,'index.html'),'changed');let result=pack(root);assert.notEqual(result.status,0);assert.match(result.stderr,/Dirty source/);fs.writeFileSync(path.join(root,'source-files.json'),JSON.stringify(['../outside']));result=pack(root);assert.notEqual(result.status,0);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
module.exports={fixture,pack,base};
