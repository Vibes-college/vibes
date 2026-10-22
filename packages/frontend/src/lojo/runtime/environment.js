/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// One active map workspace. All prototype DOM access and global listeners are
// scoped to its ShadowRoot; leaving the page releases every owned resource.
let current = null;
const scope = () => {
 if (!current || current.disposed) throw new Error('LOJO workspace is not mounted');
 return current;
};

function listen(target, type, handler, options) {
 const owner = scope();
 const wrapped = event => { if (!owner.paused && !owner.disposed) handler.call(target, event); };
 target.addEventListener(type, wrapped, options);
 if (target === owner.root) owner.portals.forEach(portal => portal.addEventListener(type, wrapped, options));
 owner.listeners.push({ target, type, handler, wrapped, options });
}

function unlisten(target, type, handler) {
 const owner = scope();
 owner.listeners = owner.listeners.filter(item => {
  if (item.target !== target || item.type !== type || item.handler !== handler) return true;
  target.removeEventListener(type, item.wrapped, item.options);
  if (target === owner.root) owner.portals.forEach(portal => portal.removeEventListener(type, item.wrapped, item.options));
  return false;
});
}

function query(owner, selector, all = false) {
 const roots = [owner.root, ...owner.portals];
 if (!all) {
  for (const root of roots) {
   if (root !== owner.root && root.matches?.(selector)) return root;
   const found = root.querySelector(selector); if (found) return found;
  }
  return null;
 }
 const result = [];
 for (const root of roots) {
  if (root !== owner.root && root.matches?.(selector)) result.push(root);
  result.push(...root.querySelectorAll(selector));
 }
 return [...new Set(result)];
}

export const document = new Proxy({}, {
 get(_, key) {
  const owner = scope(), real = owner.root.ownerDocument;
  if (key === 'body') return owner.body;
  if (key === 'head') return owner.root;
  if (key === 'documentElement') return owner.root.host;
  if (key === 'activeElement') return owner.root.activeElement || [...owner.portals].find(portal => portal.contains(real.activeElement))?.ownerDocument.activeElement;
  if (key === 'title') return owner.title;
  if (key === 'querySelector' || key === 'querySelectorAll') return selector => query(owner, selector, key === 'querySelectorAll');
  if (key === 'getElementById') return id => owner.root.getElementById(id) || [...owner.portals].flatMap(portal => [portal, ...portal.querySelectorAll('[id]')]).find(element => element.id === id) || null;
  if (key === 'addEventListener') return (type, handler, options) => listen(owner.root, type, handler, options);
  if (key === 'removeEventListener') return (type, handler) => unlisten(owner.root, type, handler);
  const value = real[key]; return typeof value === 'function' ? value.bind(real) : value;
 },
 set(_, key, value) { if (key === 'title') { scope().title = value; return true; } return false; },
});
export const window = new Proxy({}, {
 get(_, key) {
  const owner = scope(), real = owner.root.ownerDocument.defaultView;
  if (key === 'document') return document;
  if (key === 'scrollY') return owner.body.scrollTop;
  if (key === 'scrollTo') return (...args) => owner.body.scrollTo(...args);
  if (key === 'innerWidth') return owner.root.host.clientWidth || real.innerWidth;
  if (key === 'innerHeight') return owner.root.host.clientHeight || real.innerHeight;
  if (key === 'addEventListener') return (type, handler, options) => listen(real, type, handler, options);
  if (key === 'removeEventListener') return (type, handler) => unlisten(real, type, handler);
  const value = real[key]; return typeof value === 'function' && !/^[A-Z]/.test(String(key)) ? value.bind(real) : value;
 },
});
export const location = new Proxy({}, {
 get(_, key) { const real = scope().root.ownerDocument.defaultView.location; const value = real[key]; return typeof value === 'function' ? value.bind(real) : value; },
 set(_, key, value) { if (key !== 'hash') throw new Error('Map runtime may only navigate within its route'); scope().root.ownerDocument.defaultView.location.hash = value; return true; },
});
export function setTimeout(callback, delay, ...args) {
 const owner = scope();
 const id = globalThis.setTimeout(() => { owner.timers.delete(id); if (!owner.disposed) callback(...args); }, delay);
 owner.timers.add(id); return id;
}
export function clearTimeout(id) { globalThis.clearTimeout(id); current?.timers.delete(id); }
export function setInterval(callback, delay, ...args) {
 const owner = scope();
 const id = globalThis.setInterval(() => { if (!owner.paused && !owner.disposed) callback(...args); }, delay);
 owner.intervals.add(id); return id;
}
export function clearInterval(id) { globalThis.clearInterval(id); current?.intervals.delete(id); }
export function requestAnimationFrame(callback) {
 const owner = scope();
 const id = globalThis.requestAnimationFrame(time => { owner.frames.delete(id); if (!owner.disposed) callback(time); });
 owner.frames.add(id); return id;
}
export function cancelAnimationFrame(id) { globalThis.cancelAnimationFrame(id); current?.frames.delete(id); }
export async function createEnvironment(root, signal, options = {}) {
 if (signal?.aborted) throw new Error('LOJO workspace mount cancelled');
 if (current && !current.disposed) throw new Error('A LOJO workspace is already active');
 const real = root.ownerDocument, body = real.createElement('div');
 body.className = 'lojo-body' + (options.nativeShell ? ' lojo-native' : '');
 body.innerHTML = '<div id="app"></div><div id="toast" role="status" aria-live="polite"></div><dialog id="dialog"></dialog>';
 root.replaceChildren(body);
 const owner = current = { root, body, title: '', paused: false, disposed: false, portals: new Set(), listeners: [], timers: new Set(), intervals: new Set(), frames: new Set() };
 const style = real.createElement('style');
 style.textContent = ':host{display:block;height:100%;min-height:0;isolation:isolate}.lojo-body{position:relative;contain:layout style;transform:translateZ(0);height:100%;overflow:auto;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.5}.lojo-body.is-map,.lojo-body.is-housing,.lojo-body.is-planner{overflow:hidden}dialog{color:var(--ink);background:var(--paper)}';
 root.append(style);
 let styleObserver;
 if (options.nativeShell && real.head) {
  const mirrored = new Map();
  const mirrorStyles = () => {
   const sources = [...real.head.querySelectorAll('link[rel="stylesheet"],style')].filter(node => node.tagName === 'STYLE' || node.href.startsWith(real.defaultView.location.origin + '/'));
   for (const [source, clone] of mirrored) if (!sources.includes(source)) { clone.remove(); mirrored.delete(source); }
   for (const source of sources) {
    if (mirrored.has(source)) continue;
    const clone = source.cloneNode(true); root.insertBefore(clone, body); mirrored.set(source, clone);
   }
  };
  mirrorStyles();
  styleObserver = new globalThis.MutationObserver(mirrorStyles);
  styleObserver.observe(real.head, { childList: true });
 }
 if (options.themeCss) {
  const theme = real.createElement('style'); theme.textContent = options.themeCss; root.append(theme);
 }
 const registerPortal = element => {
  if (owner.disposed || owner.portals.has(element)) return;
  owner.portals.add(element);
  owner.listeners.filter(item => item.target === root).forEach(({ type, wrapped, options: eventOptions }) => element.addEventListener(type, wrapped, eventOptions));
 };
 const unregisterPortal = element => {
  if (!owner.portals.delete(element)) return;
  owner.listeners.filter(item => item.target === root).forEach(({ type, wrapped, options: eventOptions }) => element.removeEventListener(type, wrapped, eventOptions));
 };
 let abortMount;
 const dispose = () => {
  if (owner.disposed) return;
  owner.disposed = true;
  styleObserver?.disconnect();
  signal?.removeEventListener('abort', abortMount);
  [...owner.portals].forEach(unregisterPortal);
  owner.listeners.forEach(({ target, type, wrapped, options }) => target.removeEventListener(type, wrapped, options));
  owner.timers.forEach(id => globalThis.clearTimeout(id)); owner.intervals.forEach(id => globalThis.clearInterval(id)); owner.frames.forEach(id => globalThis.cancelAnimationFrame(id));
  owner.listeners = []; owner.timers.clear(); owner.intervals.clear(); owner.frames.clear();
  root.replaceChildren(); if (current === owner) current = null;
 };
 const aborted = new Promise((resolve, reject) => {
  abortMount = () => { dispose(); reject(new Error('LOJO workspace mount cancelled')); };
  signal?.addEventListener('abort', abortMount, { once: true });
 });
 try {
  await Promise.race([aborted, Promise.all(['vendor/maplibre-gl.css', 'styles.css', 'discovery.css', 'map-polish.css', 'events.css'].map(file => new Promise((resolve, reject) => {
   const link = real.createElement('link'); link.rel = 'stylesheet'; link.href = '/lojo-assets/' + file;
   const timer = globalThis.setTimeout(() => reject(new Error('地图样式加载失败')), 15000); owner.timers.add(timer);
   link.onload = () => { globalThis.clearTimeout(timer); owner.timers.delete(timer); resolve(); };
   link.onerror = () => { globalThis.clearTimeout(timer); owner.timers.delete(timer); reject(new Error('地图样式加载失败')); };
   root.insertBefore(link, style);
  })))]);
 } catch (error) { dispose(); throw error; }
 signal?.removeEventListener('abort', abortMount);
 return { dispose, registerPortal, unregisterPortal, pause: () => { owner.paused = true; }, resume: () => { owner.paused = false; } };
}
