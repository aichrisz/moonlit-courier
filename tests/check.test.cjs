const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {check} = require('../scripts/check.cjs');
const base = path.resolve(__dirname, '../artifacts/check-fixtures');
function fixture() {
 fs.mkdirSync(base,{recursive:true});
 const root=fs.mkdtempSync(path.join(base,'case-'));
 const names=['source-files.json','package.json','index.html','styles.css','levels.js','engine.js','records.js','renderer.js','audio.js','app.js'];
 for(const name of names)if(name!=='source-files.json')fs.copyFileSync(path.resolve(__dirname,'..',name),path.join(root,name));
 fs.writeFileSync(path.join(root,'source-files.json'),JSON.stringify(names));
 return root;
}
test('check validates explicit source, pinned dev-only dependencies and syntax',()=>{
 const root=fixture();try { assert.equal(check(root).runtime,8); } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('check refuses broken JS, private paths, skips and runtime network code',()=>{
 for(const [name,value] of [['app.js','function {'],['app.js','fetch("https://example.invalid")'],['tests/example.test.cjs','test.skip("hidden",()=>{});']]){
  const root=fixture();try {
   if(name.startsWith('tests/')) {fs.mkdirSync(path.join(root,'tests'));const list=JSON.parse(fs.readFileSync(path.join(root,'source-files.json')));list.push(name);fs.writeFileSync(path.join(root,'source-files.json'),JSON.stringify(list));}
   fs.writeFileSync(path.join(root,name),value);assert.throws(()=>check(root));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
 const root=fixture();try{fs.writeFileSync(path.join(root,'source-files.json'),JSON.stringify(['../private']));assert.throws(()=>check(root));}finally{fs.rmSync(root,{recursive:true,force:true});}
});
