/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 地图拖动 / 缩放：鼠标拖、滚轮缩放、双指捏合、松手惯性、双击放大；点击和拖动区分开。
   usage: const pz = PanZoom(svgEl, worldGroupEl, {w, h, min, max, inset, onChange, onInteract}) */
export function PanZoom(svg, world, o) {
  const v = {k: 1, x: 0, y: 0}, pts = new Map();
  let drag = null, moved = 0, pinch = null, fling = 0, vel = {x: 0, y: 0, t: 0}, lastTap = null, anim = 0;
  const clampK = k => Math.min(o.max || 2.2, Math.max(o.min || 0.12, k));
  const apply = () => { world.setAttribute('transform', `translate(${v.x.toFixed(1)} ${v.y.toFixed(1)}) scale(${v.k.toFixed(4)})`); o.onChange && o.onChange(v); };
  const rect = () => svg.getBoundingClientRect();
  const stop = () => { cancelAnimationFrame(fling); cancelAnimationFrame(anim); fling = anim = 0; };
  function zoomAt(mx, my, k2) { k2 = clampK(k2); v.x = mx - (mx - v.x) * (k2 / v.k); v.y = my - (my - v.y) * (k2 / v.k); v.k = k2; apply(); }
  function zoomAnim(mx, my, k2, D = 260) { stop(); const k0 = v.k, t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3); zoomAt(mx, my, k0 + (k2 - k0) * e); if (p < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step); }
  // visible area = svg minus floating panels (o.inset() → {l, t, r, b})
  const vis = () => { const r = rect(), i = o.inset ? o.inset() : {l:0, t:0, r:0, b:0}; return {x:i.l, y:i.t, w:r.width - i.l - i.r, h:r.height - i.t - i.b}; };
  function fit(pad = 0.94, box) { stop(); const a = vis(), b = box || {x:0, y:0, w:o.w, h:o.h};
    v.k = clampK(Math.min(a.w / b.w, a.h / b.h) * pad); v.x = a.x + (a.w - b.w * v.k) / 2 - b.x * v.k; v.y = a.y + (a.h - b.h * v.k) / 2 - b.y * v.k; apply(); }
  function fitK(pad, box) { const a = vis(); return clampK(Math.min(a.w / box.w, a.h / box.h) * pad); }
  function focus(cx, cy, k, animate = true) {
    const a = vis(), k2 = clampK(k || v.k), tx = a.x + a.w / 2 - cx * k2, ty = a.y + a.h / 2 - cy * k2;
    if (!animate) { v.k = k2; v.x = tx; v.y = ty; return apply(); }
    stop(); const s0 = {...v}, t0 = performance.now(), D = 520;
    const step = t => { const p = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - p, 3);
      v.k = s0.k + (k2 - s0.k) * e; v.x = s0.x + (tx - s0.x) * e; v.y = s0.y + (ty - s0.y) * e; apply(); if (p < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  const center = () => { const a = vis(); return {x:(a.x + a.w / 2 - v.x) / v.k, y:(a.y + a.h / 2 - v.y) / v.k, k:v.k}; };

  svg.addEventListener('wheel', e => { e.preventDefault(); stop(); o.onInteract && o.onInteract(); const r = rect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, v.k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016))); }, {passive: false});
  svg.addEventListener('pointerdown', e => { stop(); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { drag = {x: e.clientX, y: e.clientY, vx: v.x, vy: v.y}; moved = 0; vel = {x: 0, y: 0, t: performance.now(), px: e.clientX, py: e.clientY}; }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: v.k}; drag = null; o.onInteract && o.onInteract(); } });
  svg.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], r = rect(); moved = 99;
      zoomAt((a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top, pinch.k * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d); return; }
    if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved = Math.max(moved, Math.hypot(dx, dy));
      if (moved > 4) { if (!svg.hasPointerCapture(e.pointerId)) { svg.setPointerCapture(e.pointerId); o.onInteract && o.onInteract(); }
        v.x = drag.vx + dx; v.y = drag.vy + dy; apply(); svg.classList.add('panning');
        const t = performance.now(), dt = Math.max(1, t - vel.t); vel = {x: .8 * (e.clientX - vel.px) / dt + .2 * vel.x, y: .8 * (e.clientY - vel.py) / dt + .2 * vel.y, t, px: e.clientX, py: e.clientY}; } } });
  const up = e => { const wasDrag = drag && moved > 4; pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (!pts.size) {
      drag = null; setTimeout(() => svg.classList.remove('panning'), 0);
      // inertia after a flick
      if (wasDrag && performance.now() - vel.t < 80 && Math.hypot(vel.x, vel.y) > .25) { let vx = vel.x * 16, vy = vel.y * 16;
        const step = () => { v.x += vx; v.y += vy; vx *= .92; vy *= .92; apply(); if (Math.hypot(vx, vy) > .4) fling = requestAnimationFrame(step); };
        fling = requestAnimationFrame(step); }
      // double tap / double click zooms in
      if (moved <= 4 && e.type === 'pointerup') { const now = performance.now(), r = rect();
        if (lastTap && now - lastTap.t < 300 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) { zoomAnim(e.clientX - r.left, e.clientY - r.top, v.k * 1.7); lastTap = null; }
        else lastTap = {t: now, x: e.clientX, y: e.clientY}; }
    } };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  // swallow the click that ends a drag
  svg.addEventListener('click', e => { if (moved > 4) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
  return {v, fit, fitK, focus, center, vis, stop, zoomBy: f => { const a = vis(); zoomAnim(a.x + a.w / 2, a.y + a.h / 2, v.k * f); }, apply};
}
