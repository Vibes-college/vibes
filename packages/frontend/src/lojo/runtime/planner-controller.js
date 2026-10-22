/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global innerWidth:readonly, matchMedia:readonly, FormData:readonly, CSS:readonly, Blob:readonly, URL:readonly, AbortController:readonly */
import { document, location, setTimeout, requestAnimationFrame } from './environment.js';
import { createTrip, normalizeTrip, updateTrip, addStop, updateStop, moveStop, removeStop, searchCatalog, exportTripText } from './planner-model.js';
import { travelRoutes } from './travel-data.js';
import { PlannerMap } from './planner-map.js';
import { searchPlaces } from './planner-search.js';
import { escapeHTML as e } from './model.js';
import * as ui from './planner-ui.js';

export function createPlannerController(api) {
 let trip = null, root = null, map = null, target = 'pool', selected = null, undo = null, mobileMap = false, results = [], searchAbort = null, searchSequence = 0, editing = null, pickReturn = null, addTarget = null, dragged = null;
 const active = () => !!root?.isConnected && !!trip && location.hash === '#planner/' + trip.id;
 const owner = id => trip.pool.includes(id) ? 'pool' : trip.days.find(d => d.stopIds.includes(id))?.id;
 const list = t => t === 'pool' ? trip.pool : trip.days.find(d => d.id === t)?.stopIds || [];

 function abortSearch() {searchSequence++; searchAbort?.abort(); searchAbort = null;}

 function showDialog(title, body) {abortSearch(); api.dialog(title, body); const dialog = document.querySelector('#dialog'); dialog.dataset.context = 'planner'; const header = document.createElement('div'); header.className = 'planner-dialog-head'; const close = dialog.querySelector('.dialog-close'), heading = dialog.querySelector('h2'); header.append(heading, close); dialog.prepend(header); close.focus({ preventScroll: true });}

 function fail(error, form) {const node = form?.querySelector('.planner-error'); if (node)node.textContent = error.message; else api.toast(error.message);}

 function save(next, label = '', { refresh = true } = {}) {const state = api.state(); if (!api.commit({ ...state, tripDrafts: [next, ...(state.tripDrafts || []).filter(t => t.id !== next.id)] })) throw new Error('未能保存，请释放浏览器存储空间后重试。'); if (label)undo = { trip, label }; trip = next; if (target !== 'pool' && target !== 'all' && !trip.days.some(d => d.id === target))target = 'pool'; if (refresh)paint(); return true;}

 function paint({ resetScroll = false } = {}) {if (!root?.isConnected || !trip) return; const scroller = root.querySelector('#planner-list'), top = resetScroll ? 0 : scroller.scrollTop; root.querySelector('#planner-header').innerHTML = ui.plannerHeader(trip); root.querySelector('#planner-tabs').innerHTML = ui.plannerTabs(trip, target); scroller.innerHTML = ui.plannerList(trip, target, selected); scroller.scrollTop = top; root.querySelector('#planner-footer').innerHTML = ui.plannerFooter(trip, target, undo); map?.setTrip(trip, target, selected);}

 function setMobileMap(value) {mobileMap = value; root?.classList.toggle('show-map', value); const b = root?.querySelector('[data-action="planner-toggle-map"]'); if (b)b.innerHTML = `<span class="icon lojo-icon" style="--lojo-icon:url(/lojo-assets/icons/${value ? 'checklist' : 'map'}.svg)" aria-hidden="true"></span> ${value ? '行程' : '地图'}`; requestAnimationFrame(() => map?.resize());}

 function openAdd() {addTarget = target === 'all' ? trip.days[0].id : target; showDialog('添加地点', ui.searchForm(trip, addTarget)); results = searchCatalog('', trip.destination).slice(0, 12); document.querySelector('#planner-search-results').innerHTML = ui.searchResults(results);}

 function captureEdit(form) {if (!form) return; editing = { ...(editing || {}), ...Object.fromEntries(new FormData(form)) }; addTarget = editing.target;}

 function openStop(stop = {}, isEditing = false) {editing = { ...stop, coord: stop.coord ? [...stop.coord] : null, isEditing }; showDialog(isEditing ? '编辑地点' : '添加地点', ui.stopForm(trip, editing, stop.target || addTarget || target, { editing: isEditing }));}

 function stopPicking() {map?.setPicking(false); const bar = root?.querySelector('#planner-pick-bar'); if (bar)bar.hidden = true;}

 function startPicking(fromEdit = false) {if (fromEdit) {captureEdit(document.querySelector('#planner-stop-form')); pickReturn = { ...editing };} else {pickReturn = null; editing = null; addTarget = document.querySelector('#planner-add-target')?.value || addTarget || target;}api.close(); abortSearch(); setMobileMap(true); map?.setPicking(true); root.querySelector('#planner-pick-bar').hidden = false;}

 function onPick(coord) {stopPicking(); const values = pickReturn ? { ...pickReturn, coord } : { coord, kind: 'place', source: '地图选点', sourceUrl: 'https://www.openstreetmap.org/?mlat=' + coord[1] + '&mlon=' + coord[0] + '#map=17/' + coord[1] + '/' + coord[0] }; openStop(values, !!values.isEditing); pickReturn = null;}

 function select(id, { fromMap = false } = {}) {selected = id; if (fromMap && owner(id) === 'pool')target = 'pool'; paint(); if (fromMap) {setMobileMap(false); requestAnimationFrame(() => root.querySelector(`[data-stop="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));} else {if (innerWidth <= 760 && trip.stops[id]?.coord)setMobileMap(true); requestAnimationFrame(() => requestAnimationFrame(() => map?.focus(id)));}}

 function copy(id) {const route = travelRoutes.find(r => r.id === id); if (!route) return; const next = createTrip({}, route); save(next, '', { refresh: false }); undo = null; api.goto('planner/' + next.id);}

 function exportText() {const blob = new Blob([exportTripText(trip)], { type: 'text/plain;charset=utf-8' }), href = URL.createObjectURL(blob), a = document.createElement('a'); a.href = href; a.download = trip.name.replace(/[\\/:*?"<>|]/g, '_') + '-行程.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);}

 const controller = {
  render(container, id) {this.leave(); root = container; if (id === 'new' || !id) {root.innerHTML = ui.newTripPage(); return;}trip = normalizeTrip((api.state().tripDrafts || []).find(t => t.id === id)); if (!trip) {root.innerHTML = '<div class="content-page"><h1>没有找到这份旅行</h1><a class="button" href="#planner/new">规划新旅行</a></div>'; return;}target = trip.days[0].id; selected = null; undo = null; mobileMap = false; root.innerHTML = ui.plannerShell(); root = root.querySelector('.planner-workspace'); map = new PlannerMap(root.querySelector('#planner-map'), { onSelect: id => select(id, { fromMap: true }), onPick }); paint();},
  leave() {abortSearch(); map?.destroy(); map = null; root = null; trip = null; editing = null; pickReturn = null; addTarget = null;},
  get trip() {return trip;}, get map() {return map;}
 };
 document.addEventListener('click', event => {
const el = event.target.closest('[data-action^="planner-"]'); if (!el) return; event.preventDefault(); const { action, id, value } = el.dataset; try {
  if (action === 'planner-new') {api.goto('planner/new'); return;}
  if (action === 'planner-copy') {copy(id); return;}
  if (!active()) return;
  if (action === 'planner-target') {stopPicking(); target = value; selected = null; addTarget = null; paint({ resetScroll: true });} else if (action === 'planner-add')openAdd();
  else if (action === 'planner-manual') {addTarget = document.querySelector('#planner-add-target')?.value || target; openStop();} else if (action === 'planner-pick')startPicking();
  else if (action === 'planner-locate-edit')startPicking(true);
  else if (action === 'planner-cancel-pick') {stopPicking(); if (pickReturn) {openStop(pickReturn, !!pickReturn.isEditing); pickReturn = null;} else setMobileMap(false);} else if (action === 'planner-add-result') {const p = results[Number(el.dataset.index)]; if (!p) return; addTarget = document.querySelector('#planner-add-target')?.value || target; const next = addStop(trip, p, addTarget), newId = Object.keys(next.stops).find(k => !trip.stops[k]); save(next, '已添加 ' + p.name); selected = newId; el.disabled = true; el.innerHTML = '<span class="icon lojo-icon" style="--lojo-icon:url(/lojo-assets/icons/check.svg)" aria-hidden="true"></span>'; el.setAttribute('aria-label', '已添加 ' + p.name); api.toast('已添加到' + ui.targetName(trip, addTarget));} else if (action === 'planner-edit') {addTarget = owner(id); openStop(trip.stops[id], true);} else if (action === 'planner-assign') {showDialog('安排到哪一天', `<form id="planner-move-form" data-id="${e(id)}"><label class="field-label">${e(trip.stops[id].name)}<select name="target">${ui.targetOptions(trip, trip.days[0].id)}</select></label><p class="planner-error" role="alert"></p><button class="button dark wide" type="submit">移动地点</button></form>`);} else if (action === 'planner-focus')select(id);
  else if (action === 'planner-up' || action === 'planner-down') {const t = owner(id), ids = list(t), index = ids.indexOf(id) + (action === 'planner-up' ? -1 : 1); if (index < 0 || index >= ids.length) return; save(moveStop(trip, id, t, index), '已调整顺序'); root.querySelector(`[data-action="${action}"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });} else if (action === 'planner-remove') {save(removeStop(trip, id), '已删除 ' + trip.stops[id].name); api.close(); selected = null;} else if (action === 'planner-undo') {const previous = undo?.trip; if (!previous) return; save(previous); undo = null; paint();} else if (action === 'planner-settings')showDialog('旅行信息', ui.settingsForm(trip));
  else if (action === 'planner-preview')showDialog('行程预览', ui.previewTrip(trip));
  else if (action === 'planner-export')exportText();
  else if (action === 'planner-fit')map?.fit();
  else if (action === 'planner-toggle-map') {stopPicking(); setMobileMap(!mobileMap);} else if (action === 'planner-delete')showDialog('删除这份旅行？', `<p>${e(trip.name)} · ${Object.keys(trip.stops).length} 个地点</p><p>这会移除账号中保存的这份计划。</p><form id="planner-delete-form"><p class="planner-error" role="alert"></p><button class="button dark wide" type="submit">删除旅行</button></form>`);
 } catch(error) {fail(error, document.querySelector('#dialog form'));}
});
 document.addEventListener('submit', async event => {
const form = event.target; if (!form.id?.startsWith('planner-')) return; event.preventDefault(); const values = Object.fromEntries(new FormData(form)); try {
  if (form.id === 'planner-create-form') {const next = createTrip(values); save(next, '', { refresh: false }); api.goto('planner/' + next.id); return;}
  if (!active()) return;
  if (form.id === 'planner-settings-form') {save(updateTrip(trip, values), '已修改旅行信息'); api.close();} else if (form.id === 'planner-stop-form') {const place = { ...editing, ...values }; delete place.isEditing; const next = form.dataset.id ? moveStop(updateStop(trip, form.dataset.id, place), form.dataset.id, values.target, owner(form.dataset.id) === values.target ? list(values.target).indexOf(form.dataset.id) : undefined) : addStop(trip, place, values.target); save(next, form.dataset.id ? '已修改地点' : '已添加地点'); api.close(); target = values.target; selected = form.dataset.id || Object.keys(next.stops).at(-1); setMobileMap(false); paint();} else if (form.id === 'planner-move-form') {save(moveStop(trip, form.dataset.id, values.target), '已移动地点'); api.close(); target = values.target; paint();} else if (form.id === 'planner-delete-form') {const state = api.state(); if (!api.commit({ ...state, tripDrafts: (state.tripDrafts || []).filter(t => t.id !== trip.id) })) throw new Error('删除未能保存，请重试。'); api.close(); api.goto('me');} else if (form.id === 'planner-search-form') {
   abortSearch(); searchAbort = new AbortController(); const signal = searchAbort.signal, sequence = searchSequence, tripId = trip.id, node = document.querySelector('#planner-search-results'); const query = values.query.trim(), city = values.city.trim(); results = searchCatalog(query, city).slice(0, 10); node.innerHTML = ui.searchResults(results, { loading: true });
   try {const response = await searchPlaces((city && !query.includes(city) ? city + ' ' : '') + query, { signal }); if (signal.aborted || sequence !== searchSequence || !active() || trip.id !== tripId || !node.isConnected) return; const remote = Array.isArray(response) ? response : response.places || []; const known = new Set(results.map(x => x.name)); results = [...results, ...remote.filter(x => !known.has(x.name))]; node.innerHTML = ui.searchResults(results, { queried: true });} catch(error) {if (signal.aborted || sequence !== searchSequence || !node.isConnected) return; node.innerHTML = ui.searchResults(results, { queried: true, error: error.message || '搜索暂时不可用，可手动添加或地图选点。' });}
  }
 } catch(error) {fail(error, form);}
});
 document.addEventListener('change', event => {if (event.target.matches('#planner-settings-form [name="dayCount"]'))document.querySelector('#planner-resize-note').hidden = Number(event.target.value) >= trip.days.length;});
 document.addEventListener('dragstart', event => {const handle = event.target.closest('[data-drag-stop]'); if (!handle || !active()) return; dragged = handle.dataset.dragStop; event.dataTransfer.setData('text/plain', dragged); event.dataTransfer.effectAllowed = 'move'; handle.closest('.planner-stop').classList.add('is-dragging');});
 document.addEventListener('dragover', event => {if (dragged && event.target.closest('[data-drop-target]')) {event.preventDefault(); event.dataTransfer.dropEffect = 'move';}});
 document.addEventListener('drop', event => {const zone = event.target.closest('[data-drop-target]'); if (!dragged || !zone || !active()) return; event.preventDefault(); const id = dragged; dragged = null; if (zone.dataset.stop === id) return; try {const to = zone.dataset.dropTarget, ids = list(to).filter(x => x !== id), index = zone.dataset.stop ? ids.indexOf(zone.dataset.stop) : undefined; save(moveStop(trip, id, to, index), '已调整地点顺序');} catch(error) {fail(error);}});
 document.addEventListener('dragend', () => {dragged = null; root?.querySelectorAll('.is-dragging').forEach(x => x.classList.remove('is-dragging'));});
 document.querySelector('#dialog')?.addEventListener('close', abortSearch);
 return controller;
}
