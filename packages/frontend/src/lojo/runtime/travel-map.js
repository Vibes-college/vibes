/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global innerWidth:readonly, matchMedia:readonly, maplibregl:readonly */
import { document, requestAnimationFrame } from './environment.js';
import { tripMarker } from './travel-ui.js';
import { escapeHTML as e } from './model.js';
export class TravelMap {
 constructor(owner) {
  this.owner = owner; this.map = owner.map; this.fitKey = ''; this.cards = []; this.stops = [];
  this.lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.lines.classList.add('trip-marker-lines'); this.lines.setAttribute('aria-hidden', 'true'); owner.container.append(this.lines);
  this.map.on('move', () => this.layout()); this.map.on('resize', () => this.layout());
 }
 clear() {this.cards = []; this.stops = []; this.lines.innerHTML = ''; if (!this.map.getStyle()) return; for (const id of ['trip-path', 'trip-path-halo']) if (this.map.getLayer(id)) this.map.removeLayer(id); if (this.map.getSource('trip-path')) this.map.removeSource('trip-path'); this.fitKey = '';}
 render() {
  const { owner, map } = this; owner.markers.forEach(m => m.remove()); owner.markers = []; this.cards = []; this.stops = []; this.lines.innerHTML = ''; if (!owner.loaded) return;
  const view = owner.travelView || {}, route = view.route; if (route) {this.drawRoute(route, view); return;}
  const oldKey = this.fitKey; this.clear(); const groups = []; for (const r of owner.items) {const group = groups.find(g => g[0].city === r.city); if (group)group.push(r); else groups.push([r]);}
  for (const group of groups.sort((a, b) => a[0].coord[0] - b[0].coord[0])) {
   const r = group[0], el = document.createElement('button'); el.className = 'trip-marker' + (group.length > 1 ? ' trip-marker-stack' : ''); el.innerHTML = tripMarker(group); el.dataset.tripIds = group.map(x => x.id).join(','); el.setAttribute('aria-label', group.length > 1 ? r.city + '的 ' + group.length + ' 条路线' : r.name);
   el.onclick = () => group.length > 1 ? owner.onGroup?.(group.map(x => x.id), 'travel') : owner.onSelect?.(r.id, 'travel'); const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(r.coord).addTo(map); owner.markers.push(marker); this.cards.push({ marker, el, coord: r.coord });
  }
  this.fitKey = 'overview:' + owner.items.map(x => x.id).join(','); if (this.fitKey !== oldKey)requestAnimationFrame(() => this.fit()); this.layout();
 }
 layout() {
  if (this.owner.layer !== 'travel') return; if (this.stops.length) {this.layoutStops(); return;} if (!this.cards.length) return;
  const mobile = innerWidth <= 760, width = this.owner.container.clientWidth, height = this.owner.container.clientHeight, placed = [], lines = [];
  for (const { marker, el, coord } of this.cards) {
   const p = this.map.project(coord), w = el.offsetWidth, h = el.offsetHeight;
   if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {el.style.visibility = 'hidden'; continue;}el.style.visibility = '';
   const minX = w / 2 + 14, maxX = width - w / 2 - 14, minY = (mobile ? 118 : 150) + h / 2, maxY = height - (mobile ? 105 : 110) - h / 2;
   let best = null;
   for (const dy of [-h / 2 - 12, 0, -h - 24, h / 2 + 24, h + 24, -2 * h, 2 * h]) for (const dx of [0, -w - 15, w + 15, -w / 2 - 8, w / 2 + 8]) {
    const x = Math.max(minX, Math.min(maxX, p.x + dx)), y = Math.max(minY, Math.min(Math.max(minY, maxY), p.y + dy));
    const overlaps = placed.filter(b => Math.abs(x - b.x) < (w + b.w) / 2 + 12 && Math.abs(y - b.y) < (h + b.h) / 2 + 12).length;
    const score = overlaps * 1e7 + (x - p.x) ** 2 + (y - p.y) ** 2;
    if (!best || score < best.score)best = { x, y, w, h, score };
   }
   placed.push(best); marker.setOffset([best.x - p.x, best.y - p.y]);
   const x = Math.max(best.x - w / 2, Math.min(best.x + w / 2, p.x)), y = Math.max(best.y - h / 2, Math.min(best.y + h / 2, p.y));
   if (Math.hypot(x - p.x, y - p.y) > 3)lines.push(`<line x1="${p.x}" y1="${p.y}" x2="${x}" y2="${y}"/><circle cx="${p.x}" cy="${p.y}" r="4"/>`);
  }
  this.lines.innerHTML = lines.join('');
 }
 drawRoute(route, view) {const { owner, map } = this, day = route.itinerary[view.day] || route.itinerary[0], coords = day.stops.map(s => s.coord); const data = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }; if (map.getSource('trip-path'))map.getSource('trip-path').setData(data); else {map.addSource('trip-path', { type: 'geojson', data }); map.addLayer({ id: 'trip-path-halo', type: 'line', source: 'trip-path', paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': .9 } }); map.addLayer({ id: 'trip-path', type: 'line', source: 'trip-path', paint: { 'line-color': route.color, 'line-width': 3, 'line-dasharray': [1.5, 1.5] } });}map.setPaintProperty('trip-path', 'line-color', route.color); day.stops.forEach((stop, i) => {const el = document.createElement('button'); el.className = 'trip-stop-marker' + (view.stop === stop.id ? ' selected' : ''); el.style.setProperty('--trip-color', route.color); el.dataset.stopId = stop.id; el.setAttribute('aria-label', '第 ' + (i + 1) + ' 站 ' + stop.name); el.innerHTML = `<span>${i + 1}</span>${view.stop === stop.id ? `<strong>${e(stop.name)}</strong>` : ''}`; el.onclick = () => owner.onSelect?.(stop.id, 'travel-stop'); const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(stop.coord).addTo(map); owner.markers.push(marker); this.stops.push({ marker, el, coord: stop.coord });}); this.layoutStops(); const key = route.id + '-' + view.day; if (this.fitKey !== key) {this.fitKey = key; requestAnimationFrame(() => this.fit());}}
 layoutStops() {
  const placed = [], lines = [];
  for (const { marker, el, coord } of this.stops) {
const p = this.map.project(coord); let best = null;
   for (const [dx, dy] of [[0, 0], [0, -38], [38, 0], [-38, 0], [0, 38], [30, -30], [-30, 30]]) {const x = p.x + dx, y = p.y + dy, score = placed.filter(q => Math.hypot(x - q.x, y - q.y) < 37).length * 1e6 + dx * dx + dy * dy; if (!best || score < best.score)best = { x, y, dx, dy, score };}
   placed.push(best); const circle = el.querySelector('span').offsetWidth; marker.setOffset([best.dx + (el.offsetWidth - circle) / 2, best.dy]);
   if (best.dx || best.dy)lines.push(`<line x1="${p.x}" y1="${p.y}" x2="${best.x}" y2="${best.y}"/>`);
  } this.lines.innerHTML = lines.join('');
 }
 padding() {
  const mobile = innerWidth <= 760, height = this.owner.container.clientHeight, panel = document.querySelector('.trip-detail[data-open="true"]'); let bottom = 130;
  if (mobile && panel?.offsetParent) {const mapTop = this.owner.container.getBoundingClientRect().top, panelTop = panel.offsetTop + panel.offsetParent.getBoundingClientRect().top - mapTop; bottom = Math.min(height - 205, height - panelTop + 30);}
  return mobile ? { top: 145, bottom, left: 58, right: 65 } : { top: 170, bottom: 140, left: panel ? 500 : 160, right: 170 };
 }
 fit() {const { owner, map } = this; if (owner.layer !== 'travel' || owner.container.classList.contains('hidden') || !owner.container.clientHeight) return; const view = owner.travelView || {}, route = view.route, points = route ? (route.itinerary[view.day] || route.itinerary[0]).stops : owner.items; if (!points.length) return; const b = points.reduce((bounds, p) => bounds.extend(p.coord), new maplibregl.LngLatBounds()); map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 }); map.fitBounds(b, { padding: this.padding(), maxZoom: route ? 16 : 9, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750 });}
 focus(id) {const view = this.owner.travelView || {}, stop = view.route?.itinerary[view.day]?.stops.find(s => s.id === id); if (!stop) return; const p = this.padding(); this.map.easeTo({ center: stop.coord, padding: { top: 0, bottom: 0, left: 0, right: 0 }, offset: [(p.left - p.right) / 2, (p.top - p.bottom) / 2], duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500 });}
}
