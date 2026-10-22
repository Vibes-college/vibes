/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global innerWidth:readonly, innerHeight:readonly, performance:readonly, matchMedia:readonly */
import { document, setTimeout, clearTimeout, requestAnimationFrame, cancelAnimationFrame } from './environment.js';
import { icon } from './icons.js';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// One bounded animation frame loop: pointer input changes the target; the card
// eases toward it and stops rendering as soon as it comes to rest.
export function bindCardTilt(element, { maxX = 16, maxY = 22, input = element } = {}) {
 let raf = 0, x = 0, y = 0, tx = 0, ty = 0, lx = 50, ly = 50, tlx = 50, tly = 50, down = null, moved = false;
 const frame = () => {
  x += (tx - x) * .16; y += (ty - y) * .16; lx += (tlx - lx) * .19; ly += (tly - ly) * .19;
  element.style.setProperty('--rx', x.toFixed(2) + 'deg'); element.style.setProperty('--ry', y.toFixed(2) + 'deg');
  element.style.setProperty('--light-x', lx.toFixed(2) + '%'); element.style.setProperty('--light-y', ly.toFixed(2) + '%');
  element.style.setProperty('--foil-x', (25 + lx * .55).toFixed(2) + '%'); element.style.setProperty('--foil-y', (25 + ly * .55).toFixed(2) + '%');
  if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(tlx - lx) + Math.abs(tly - ly) > .08)raf = requestAnimationFrame(frame); else raf = 0;
 };
 const start = () => {if (!raf && !reduced())raf = requestAnimationFrame(frame);};
 const move = e => {
  if (e.pointerType === 'touch' && !down) return;
  const r = input.getBoundingClientRect(), px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
  tx = (.5 - py) * maxX * 2; ty = (px - .5) * maxY * 2; tlx = px * 100; tly = py * 100;
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7)moved = true;
  element.classList.add('is-handling'); start();
 };
 const leave = () => {tx = ty = 0; tlx = tly = 50; element.classList.remove('is-handling'); start();};
 const press = e => {down = { x: e.clientX, y: e.clientY }; moved = false; if (e.pointerType === 'touch')input.setPointerCapture(e.pointerId); move(e);};
 const release = () => {down = null; leave();};
 const blockDragClick = e => {if (moved) {e.preventDefault(); e.stopImmediatePropagation(); moved = false;}};
 input.addEventListener('pointerdown', press); input.addEventListener('pointermove', move);
 input.addEventListener('pointerleave', leave); input.addEventListener('pointerup', release); input.addEventListener('pointercancel', release);
 input.addEventListener('click', blockDragClick, true);
 return () => {cancelAnimationFrame(raf); input.removeEventListener('pointerdown', press); input.removeEventListener('pointermove', move); input.removeEventListener('pointerleave', leave); input.removeEventListener('pointerup', release); input.removeEventListener('pointercancel', release); input.removeEventListener('click', blockDragClick, true);};
}

// Pointer pairs are recognized directly so mobile dragging cannot synthesize a
// flip. A cancelled gesture, long press, or movement clears the tap sequence.
export function bindDoubleTap(element, onDoubleTap) {
 let press = null, lastTap = null;
 const reset = () => {press = null; lastTap = null;};
 const down = e => {if (!e.isPrimary || e.button > 0) {reset(); return;}press = { id: e.pointerId, x: e.clientX, y: e.clientY, time: performance.now(), dragged: false };};
 const move = e => {if (press && e.pointerId === press.id && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) {press.dragged = true; lastTap = null;}};
 const up = e => {if (!press || e.pointerId !== press.id) return; const p = press; press = null; const now = performance.now(); if (p.dragged || now - p.time > 350) {lastTap = null; return;} if (lastTap && now - lastTap.time <= 340 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {lastTap = null; e.preventDefault(); onDoubleTap();} else lastTap = { time: now, x: e.clientX, y: e.clientY };};
 element.addEventListener('pointerdown', down); element.addEventListener('pointermove', move); element.addEventListener('pointerup', up); element.addEventListener('pointercancel', reset);
 return () => {element.removeEventListener('pointerdown', down); element.removeEventListener('pointermove', move); element.removeEventListener('pointerup', up); element.removeEventListener('pointercancel', reset);};
}

export class Discovery {
 constructor({ onDiscover, onNavigate, onClose }) {
  this.onDiscover = onDiscover; this.onNavigate = onNavigate; this.onClose = onClose;
  this.dialog = document.createElement('dialog'); this.dialog.className = 'discovery-overlay'; this.dialog.setAttribute('aria-label', '街坊相遇卡');
  document.body.append(this.dialog);
  this.dialog.addEventListener('cancel', e => {e.preventDefault(); this.close();});
  this.dialog.addEventListener('click', e => {
   const action = e.target.closest('[data-discovery]')?.dataset.discovery;
   if (action === 'close') this.close();
   else if (action === 'story') {const id = this.animal.id; this.close(); this.onNavigate('animal/' + id);} else if (action === 'capture') {const id = this.animal.id; this.close(); this.onNavigate('capture/' + id);} else if (e.target === this.dialog) this.close();
  });
 }
 open(animal, { origin, known = false } = {}) {
  if (this.dialog.open) this.close(true);
  this.animal = animal; this.known = known; this.flipped = false; this.busy = false; this.ready = false; this.previous = document.activeElement;
  this.dialog.innerHTML = `<button data-discovery="close" class="discovery-close" aria-label="收起卡片，回到地图">${icon('x')}</button>
   <div class="discovery-stage"><div class="discovery-aura"></div><div class="discovery-motes" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
    <div class="discovery-flight"><div class="discovery-tilt"><button class="discovery-card" aria-label="双击翻到宠物介绍；键盘按回车翻面" disabled>
     <span class="discovery-turn">
      <span class="discovery-face discovery-front ${animal.color}"><span class="foil-border"></span><img class="dc-subject" src="${animal.sticker || animal.photo}" alt="宠物" draggable="false"><span class="card-grain"></span><span class="card-foil"></span><span class="card-glare"></span><span class="opening-sheen"></span></span>
      <span class="discovery-face discovery-back ${animal.color}" aria-hidden="true"><span class="foil-border"></span>
       <span class="dc-identity"><img src="${animal.photo}" alt="" draggable="false"><strong>${animal.name}</strong></span>
       <span class="dc-traits">${animal.traits.map(t => `<span>${t}</span>`).join('')}</span>
       <span class="dc-mood">${animal.mood}</span><span class="dc-story">${animal.story}</span>
       <span class="card-grain"></span><span class="card-foil"></span><span class="card-glare"></span>
      </span>
     </span></button></div></div>
   </div>
   <div class="discovery-footer"><div class="discovery-next" hidden><button data-discovery="story">查看档案 ${icon('arrow-up-right')}</button><button data-discovery="capture" aria-label="记录这位邻居的相遇">${icon('camera')}</button></div></div>`;
  this.dialog.classList.remove('is-closing', 'is-ready', 'is-flipped');
  this.dialog.style.setProperty('--origin-x', ((origin ? origin.left + origin.width / 2 : innerWidth / 2) - innerWidth / 2) + 'px');
  this.dialog.style.setProperty('--origin-y', ((origin ? origin.top + origin.height / 2 : innerHeight * .6) - innerHeight / 2) + 'px');
  this.dialog.showModal(); document.body.classList.add('discovering');
  this.dialog.querySelector('.discovery-close').focus({ preventScroll: true });
  const surface = this.dialog.querySelector('.discovery-tilt'), input = this.dialog.querySelector('.discovery-flight');
  this.unbind = bindCardTilt(surface, { input }); this.unbindTap = bindDoubleTap(input, () => this.flip());
  this.dialog.querySelector('.discovery-card').addEventListener('keydown', e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); if (!e.repeat) this.flip();}});
  this.readyTimer = setTimeout(() => {
   this.ready = true; this.dialog.classList.add('is-ready'); this.dialog.querySelector('.discovery-card').disabled = false;
  }, reduced() ? 0 : 1050);
 }
 flip() {
  if (!this.ready || this.busy) return;
  this.flipped = !this.flipped; this.busy = true;
  this.dialog.classList.toggle('is-flipped', this.flipped);
  const front = this.dialog.querySelector('.discovery-front'), back = this.dialog.querySelector('.discovery-back');
  front.setAttribute('aria-hidden', String(this.flipped)); back.setAttribute('aria-hidden', String(!this.flipped));
  this.dialog.querySelector('.discovery-card').setAttribute('aria-label', this.flipped ? '双击翻回宠物正面；键盘按回车翻面' : '双击翻到宠物介绍；键盘按回车翻面');
  this.dialog.querySelector('.discovery-next').hidden = true;
  this.flipTimer = setTimeout(() => {
   this.busy = false;
   if (this.flipped) {
    const saved = this.onDiscover(this.animal.id);
    this.known = saved !== false;
    this.dialog.querySelector('.discovery-next').hidden = false;
   }
  }, reduced() ? 0 : 760);
 }
 close(immediate = false) {
  if (!this.dialog.open) return;
  clearTimeout(this.closeTimer); clearTimeout(this.readyTimer); clearTimeout(this.flipTimer); this.unbind?.(); this.unbindTap?.();
  const finish = () => {this.dialog.close(); this.dialog.innerHTML = ''; document.body.classList.remove('discovering'); this.onClose?.(); if (this.previous?.isConnected) this.previous.focus({ preventScroll: true });};
  if (immediate || reduced())finish(); else {this.dialog.classList.add('is-closing'); clearTimeout(this.closeTimer); this.closeTimer = setTimeout(finish, 220);}
 }
}
