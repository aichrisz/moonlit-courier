'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {ROOT, RUNTIME, SCRIPTS, safePath, inlineHTML} = require('./public.cjs');

function check(root = ROOT) {
  const names = JSON.parse(fs.readFileSync(safePath(root, 'source-files.json'), 'utf8'));
  if (!Array.isArray(names) || !names.length || names.length > 1000 ||
      new Set(names).size !== names.length || !names.includes('source-files.json')) {
    throw Error('Invalid explicit source manifest');
  }
  const data = new Map();
  let syntax = 0;
  for (const name of names) {
    if (typeof name !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(name) ||
        name.split('/').some(p => !p || ['.', '..', '.git', '.worktrees', 'node_modules', 'dist', 'artifacts', 'parent', 'private', '__pycache__', '.hermes'].includes(p) || p.startsWith('.env')) ||
        name === 'docs/parent-acceptance.md' || /\.(pem|key|db|sqlite|zip)$/.test(name)) {
      throw Error('Forbidden manifest path: ' + name);
    }
    const file = safePath(root, name);
    if (!fs.lstatSync(file).isFile()) throw Error('Expected regular source: ' + name);
    const text = fs.readFileSync(file, 'utf8');
    data.set(name, text);
    if (/\.(js|cjs)$/.test(name)) {
      const result = spawnSync(process.execPath, ['--check', file], {encoding:'utf8'});
      if (result.status !== 0) throw Error('Syntax error in ' + name + '\n' + result.stderr);
      syntax++;
    }
    if (name.startsWith('tests/') && /^\s*(?:test|it|describe)\.(?:skip|fixme|only)\s*\(/m.test(text)) {
      throw Error('Skipped/focused tests refused: ' + name);
    }
  }
  for (const name of RUNTIME) if (!data.has(name)) throw Error('Missing runtime: ' + name);
  const pkg = JSON.parse(data.get('package.json'));
  if (Object.keys(pkg.dependencies || {}).length ||
      JSON.stringify(pkg.devDependencies) !== JSON.stringify({'@playwright/test':'1.64.1','axe-core':'4.14.0'})) {
    throw Error('Expected exact dev-only dependency pins');
  }
  for (const name of SCRIPTS) {
    if (/\beval\s*\(|\bnew\s+Function\b|\bfetch\s*\(|\bXMLHttpRequest\b|https?:\/\//.test(data.get(name))) {
      throw Error('Runtime dynamic code/network refused: ' + name);
    }
  }
  if (/@import|url\s*\(/i.test(data.get('styles.css'))) throw Error('External CSS resources refused');
  // Also validates the exact script order and the single local stylesheet reference.
  inlineHTML(data);
  if (names.includes('scripts/package.py')) {
    const result = spawnSync('python3', [safePath(root,'scripts/package.py'), '--help'], {encoding:'utf8'});
    if (result.status !== 0) throw Error('Python syntax/CLI check failed: ' + result.stderr);
  }
  return {files:names.length, syntax, runtime:RUNTIME.length};
}
if (require.main === module) console.log('Source check passed: ' + JSON.stringify(check()));
module.exports = {check};
