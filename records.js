(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MCRecords = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'moonlit-courier.v1';
  const MAX_SECONDS = 86400;
  const empty = () => ({
    version: 1, unlocked: 0,
    levels: Array.from({ length: 3 }, () => ({ complete: false, perfect: false, best: null }))
  });
  const plain = o => o && typeof o === 'object' && !Array.isArray(o) &&
    Object.getPrototypeOf(o) === Object.prototype;
  const exact = (o, keys) => plain(o) && Object.keys(o).length === keys.length &&
    keys.every(k => Object.hasOwn(o, k));

  function validate(o) {
    if (!exact(o, ['version', 'unlocked', 'levels']) || o.version !== 1 ||
        !Number.isInteger(o.unlocked) || o.unlocked < 0 || o.unlocked > 2 ||
        !Array.isArray(o.levels) || o.levels.length !== 3) return null;
    for (const l of o.levels) {
      if (!exact(l, ['complete', 'perfect', 'best']) || typeof l.complete !== 'boolean' ||
          typeof l.perfect !== 'boolean' || (l.perfect && !l.complete) ||
          (l.complete ? !(Number.isFinite(l.best) && l.best > 0 && l.best <= MAX_SECONDS)
            : l.best !== null)) return null;
    }
    if ((o.unlocked > 0 && !o.levels[0].complete) ||
        (o.unlocked > 1 && !o.levels[1].complete)) return null;
    return JSON.parse(JSON.stringify(o));
  }

  function load(storage) {
    let raw;
    // Access to storage itself may be denied (including a file:// origin).
    try { raw = storage.getItem(KEY); }
    catch { return { data: empty(), status: 'read-denied' }; }
    if (raw === null) return { data: empty(), status: 'empty' };
    let data = null;
    try {
      if (typeof raw === 'string' && raw.length <= 4096) data = validate(JSON.parse(raw));
    } catch { /* Corrupt content is distinct from a platform read denial. */ }
    return { data: data || empty(), status: data ? 'loaded' : 'invalid' };
  }

  function save(storage, data) {
    const clean = validate(data);
    if (!clean) return { ok: false, status: 'invalid' };
    try {
      storage.setItem(KEY, JSON.stringify(clean));
      return { ok: true, status: 'saved' };
    } catch { return { ok: false, status: 'write-denied' }; }
  }

  function complete(data, index, result) {
    const out = validate(data);
    if (!out || !Number.isInteger(index) || index < 0 || index > 2 ||
        !Number.isFinite(result.elapsed) || result.elapsed <= 0 ||
        result.elapsed > MAX_SECONDS || ![2, 3].includes(result.collected)) {
      throw new RangeError('invalid completion');
    }
    const previous = out.levels[index];
    out.levels[index] = {
      complete: true, perfect: previous.perfect || result.collected === 3,
      best: previous.best === null ? result.elapsed : Math.min(previous.best, result.elapsed)
    };
    out.unlocked = Math.max(out.unlocked, Math.min(2, index + 1));
    return out;
  }
  return { KEY, MAX_SECONDS, empty, validate, load, save, complete };
});
