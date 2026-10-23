'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const SCRIPTS = Object.freeze(['levels.js', 'engine.js', 'records.js', 'renderer.js', 'audio.js', 'app.js']);
const RUNTIME = Object.freeze(['index.html', 'styles.css', ...SCRIPTS]);

function safePath(root, relative = '') {
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).some(p => p === '..')) {
    throw Error('Path traversal refused');
  }
  const target = path.resolve(root, relative);
  const parsed = path.parse(target);
  let cursor = parsed.root;
  // lstat (not exists/stat) also rejects dangling and intermediate symlinks.
  for (const part of target.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    try { if (fs.lstatSync(cursor).isSymbolicLink()) throw Error('Symlink refused: ' + cursor); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}
function sources(root) {
  safePath(root);
  return new Map(RUNTIME.map(name => {
    const file = safePath(root, name);
    if (!fs.lstatSync(file).isFile()) throw Error('Expected regular source: ' + name);
    return [name, fs.readFileSync(file, 'utf8')];
  }));
}
function build(root = ROOT) {
  const data = sources(root);
  const directory = safePath(root, 'dist');
  if (fs.existsSync(directory)) {
    for (const name of fs.readdirSync(directory)) {
      const file = safePath(root, 'dist/' + name);
      if (!RUNTIME.includes(name) || !fs.lstatSync(file).isFile()) throw Error('Unexpected dist entry: ' + name);
    }
  }
  // Preflight every destination before making any write.
  for (const name of RUNTIME) safePath(root, 'dist/' + name);
  fs.mkdirSync(directory, {recursive:true});
  for (const [name, bytes] of data) fs.writeFileSync(safePath(root, 'dist/' + name), bytes);
  return RUNTIME.length;
}
function inlineHTML(data) {
  let html = data.get('index.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m => m[0]);
  const expected = SCRIPTS.map(name => `<script src="${name}"></script>`);
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)].map(m => m[0]);
  if (JSON.stringify(scripts) !== JSON.stringify(expected) ||
      JSON.stringify(styles) !== JSON.stringify(['<link rel="stylesheet" href="styles.css">'])) {
    throw Error('Unexpected, duplicate or missing runtime references');
  }
  for (const name of SCRIPTS) {
    if (/<\/script/i.test(data.get(name))) throw Error('Unsafe script closing sequence');
    html = html.replace(`<script src="${name}"></script>`, () => '<script>\n' + data.get(name) + '\n</script>');
  }
  if (/<\/style/i.test(data.get('styles.css'))) throw Error('Unsafe style closing sequence');
  html = html.replace(styles[0], () => '<style>\n' + data.get('styles.css') + '\n</style>');
  return html;
}
function exportHTML(root = ROOT) {
  const html = inlineHTML(sources(root));
  const output = safePath(root, 'artifacts/Moonlit-Courier.html');
  fs.mkdirSync(safePath(root, 'artifacts'), {recursive:true});
  fs.writeFileSync(output, html);
  return Buffer.byteLength(html);
}
module.exports = {ROOT, RUNTIME, SCRIPTS, safePath, build, inlineHTML, exportHTML};
