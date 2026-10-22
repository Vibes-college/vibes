/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global FormData:readonly, navigator:readonly, fetch:readonly */
import { document, window, location, requestAnimationFrame } from './environment.js';
import { housingAreas, housingBuildings, housingReferences } from './housing-data.js';
import { housingGeometry } from './housing-geometry.js';
import { HousingMap } from './housing-map.js';
import { selectHousing, buildingById, referenceById, contactById, makeContactDraft, toggleHousingSaved, toggleHousingCompare, makeHousingNote, makeHousingLead } from './housing-model.js';
import { escapeHTML as e } from './model.js';
import { validDateRange } from './event-dates.js';
import * as ui from './housing-ui.js';
const defaults = () => ({ area: 'all', budgetMax: null, mode: 'all', layout: 'all', elevator: false, pet: false, saved: false, contact: 'all', layer: 'history' });
export function createHousingController(api) {
 let root = null, map = null, filter = defaults(), view = '2d', surroundings = false, context = null, routeView = 'map', routeId = 'housing', panelOpen = false, panelMode = 'list', detailTab = 'record', focusId = null, loadVersion = 0, editingFromMe = false, pendingTab = null, panelExpanded = false;
 const active = () => !!root?.isConnected;
 const selected = () => routeView === 'building' ? buildingById(routeId) : ['rental', 'housing-reference'].includes(routeView) ? buildingById(referenceById(routeId)?.buildingId) : routeView === 'housing-note' ? buildingById(routeId) : null;

 function fail(error, form) {const node = form?.isConnected ? form.querySelector('.housing-error') : null; if (node)node.textContent = error.message; else api.toast(error.message || '操作未完成');}

 function commit(values) {if (!api.commit({ ...api.state(), ...values })) throw new Error('未能保存，请稍后重试。');}

 function showDialog(title, body) {api.dialog(title, body); const dialog = document.querySelector('#dialog'); dialog.dataset.context = 'housing'; const header = document.createElement('div'); header.className = 'housing-dialog-head'; header.append(dialog.querySelector('h2'), dialog.querySelector('.dialog-close')); dialog.prepend(header); header.querySelector('button')?.focus({ preventScroll: true });}

 function goBuilding(id) {detailTab = 'record'; api.goto('building/' + id);}

 function rows() {return selectHousing(filter, api.state());}

 function syncMap() {if (!active()) return; const data = rows(), b = selected(); if (b && !data.some(r => r.building.id === b.id))data.push({ building: b, listings: housingReferences.filter(l => l.buildingId === b.id) }); const geometry = surroundings && context ? { type: 'FeatureCollection', features: [...housingGeometry.features, ...context.features] } : housingGeometry; map.setData({ buildings: data.map(({ building: b, listings }) => ({ ...b, label: b.shortName, referenceText: ui.priceLabel(listings), referenceCount: listings.length })), selectedId: b?.id || null, geometry, areas: housingAreas, areaId: filter.area === 'all' ? null : filter.area, view, surroundings, layer: filter.layer });}

 function paint() {
if (!active()) return; const state = api.state(), data = rows(), panel = root.querySelector('#housing-panel'); root.querySelector('#housing-toolbar').innerHTML = ui.toolbar(filter, data.length); root.querySelector('#housing-map-actions').innerHTML = ui.mapActions(view, surroundings); const compare = (state.housingCompare || []).filter(id => buildingById(id)); root.querySelector('#housing-compare-dock').innerHTML = compare.length ? `<a href="#housing-compare">比较 <b>${compare.length}</b></a>` : ''; const b = selected(), l = ['rental', 'housing-reference'].includes(routeView) ? referenceById(routeId) : null, noteNode = routeView === 'housing-note' ? panel.querySelector('#housing-note-form') : null, noteData = noteNode ? new FormData(noteNode) : null, noteDraft = noteData ? { ...Object.fromEntries(noteData), checkedIds: noteData.getAll('checkedIds') } : {}; let title = '', body = '', back = null;
  if (routeView === 'building' && b) {title = b.name; body = ui.buildingDetail(b, state, detailTab, data.find(r => r.building.id === b.id)?.listings.map(l => l.id) || []);} else if (['rental', 'housing-reference'].includes(routeView) && l) {title = '历史住房参考'; body = ui.rentalDetail(l, state); back = '#building/' + l.buildingId;} else if (routeView === 'housing-note' && b) {title = '记录看房'; body = ui.noteForm(b, noteDraft); back = '#building/' + b.id;} else if (routeView === 'housing-compare') {title = '楼栋比较'; body = ui.compare(state);} else if (routeView !== 'map') {title = '没有找到这条记录'; body = '<a class="button" href="#map/housing">返回租房地图</a>';} else if (panelMode.startsWith('area:')) {const id = panelMode.slice(5); title = housingAreas.find(a => a.id === id)?.name || '精选街区'; body = ui.areaDetail(id, data, state);} else {title = `精选街区 · ${data.length} 栋`; body = ui.overview(data, filter, state);}
  const top = panel.querySelector('.housing-panel-body')?.scrollTop || 0; panel.classList.toggle('is-open', panelOpen); panel.classList.toggle('is-detail', routeView !== 'map'); panel.classList.toggle('is-compare', routeView === 'housing-compare'); panel.classList.toggle('is-expanded', panelExpanded); panel.hidden = !panelOpen; if (panelOpen) {panel.innerHTML = ui.panel(title, body, { back, detail: routeView !== 'map', action: compare.length && routeView !== 'housing-compare' ? `<a class="housing-inline-compare" href="#housing-compare">比较 ${compare.length}</a>` : '', footer: b && routeView !== 'housing-note' ? ui.contactBar(b, l?.id || '') : '' }); panel.querySelector('.housing-panel-body').scrollTop = top; const expand = panel.querySelector('.housing-expand'); expand.textContent = panelExpanded ? '收起' : '展开'; expand.setAttribute('aria-expanded', String(panelExpanded));}root.querySelector('.housing-list-launcher').setAttribute('aria-expanded', String(panelOpen)); syncMap(); requestAnimationFrame(() => map?.resize());
 }

 function closePanel() {panelOpen = false; panelMode = 'list'; if (routeView !== 'map')api.goto('map/housing'); else {paint(); map?.fit();}}

 function reset() {filter = defaults(); panelMode = 'list'; api.close(); if (routeView !== 'map') {panelOpen = true; api.goto('map/housing');} else {paint(); map?.fit();}}

 function openLead(lead) {editingFromMe = location.hash === '#me'; showDialog(lead ? '编辑线索' : '提供租房线索', ui.leadForm(lead));}

 function editNote(note) {const b = buildingById(note?.buildingId); if (!b) return; editingFromMe = location.hash === '#me'; showDialog('编辑看房记录', ui.noteForm(b, note));}

 function openContact(contactId, buildingId, referenceId = '', draft = {}) {const b = buildingById(buildingId), c = contactById(contactId); if (!b || !c) throw new Error('联系资料不存在'); editingFromMe = location.hash === '#me'; showDialog(c.role === 'landlord' ? '联系房东' : '联系带看', ui.contactEditor(b, c, referenceId || '', draft));}

 async function copyMessage(form) {if (!form) return; const field = form.querySelector('[name="message"]'), message = field.value; try {if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(message); else {field.focus(); field.select(); if (!document.execCommand('copy')) throw new Error('copy failed');}api.toast('文字已复制，尚未发送');} catch {field.focus(); field.select(); api.toast('请复制已选中的文字');}}

 async function loadContext() {const token = loadVersion; try {const response = await fetch('/lojo-assets/assets/housing-context.geojson'); if (!response.ok) throw new Error('unavailable'); const data = await response.json(); if (data.type === 'FeatureCollection' && token === loadVersion) {context = data; if (active() && surroundings)syncMap();}} catch {if (active() && surroundings)api.toast('周边轮廓暂时不可用，仍可查看样板楼栋。');}}

 const controller = {
  render(container, nextView, nextId) {
const wasView = routeView, wasId = routeId; routeView = nextView; routeId = nextId; const isNew = !active(); if (isNew) {panelExpanded = false; container.innerHTML = ui.shell(); root = container.querySelector('.housing-screen'); panelOpen = nextView !== 'map'; panelMode = 'list'; map = new HousingMap(root.querySelector('#housing-map'), { onSelect: goBuilding, onArea: id => {filter.area = id; panelMode = 'area:' + id; panelOpen = true; paint();} }); loadContext();}
   if (nextView !== 'map')panelOpen = true; if (wasView !== nextView || wasId !== nextId) {detailTab = pendingTab || 'record'; pendingTab = null; root.querySelector('#housing-panel').innerHTML = '';}paint(); const b = selected(); if (b && (focusId !== b.id || isNew)) {focusId = b.id; requestAnimationFrame(() => requestAnimationFrame(() => map?.focus(b.id)));} else if (!b)focusId = null;
  },
  leave() {if (!root && !map) return; loadVersion++; map?.destroy(); map = null; root = null; focusId = null; panelOpen = false; context = null;},
  resize() {map?.resize();}, get map() {return map;}
 };
 document.addEventListener('click', event => {
const el = event.target.closest('[data-action^="housing-"]'); if (!el) return; event.preventDefault(); const { action, id, value } = el.dataset; try {
  if (action === 'housing-edit-contact') {const draft = (api.state().housingContactDrafts || []).find(d => d.id === id); if (draft)openContact(draft.contactId, draft.buildingId, draft.referenceId, draft); return;}
  if (action === 'housing-delete-contact') {showDialog('删除联系草稿？', `<form id="housing-delete-form" data-id="${e(id)}" data-type="contact"><p>这会删除你的私人草稿。</p><p class="housing-error" role="alert"></p><button class="button dark wide" type="submit">删除</button></form>`); return;}
  if (action === 'housing-copy-message') {copyMessage(document.querySelector('#housing-contact-form')); return;}
  if (action === 'housing-edit-note') {editNote((api.state().housingVisits || []).find(n => n.id === id)); return;}
  if (action === 'housing-edit-lead') {openLead((api.state().housingLeads || []).find(n => n.id === id)); return;}
  if (action === 'housing-delete-note' || action === 'housing-delete-lead') {const type = action.endsWith('note') ? 'note' : 'lead'; showDialog(type === 'note' ? '删除看房记录？' : '删除线索草稿？', `<form id="housing-delete-form" data-id="${e(id)}" data-type="${type}"><p>这会删除你的这条私人记录。</p><p class="housing-error" role="alert"></p><button class="button dark wide" type="submit">删除</button></form>`); return;}
  if (!active()) return;
  if (action === 'housing-list') {if (routeView !== 'map') {panelMode = 'list'; panelOpen = true; api.goto('map/housing');} else {panelOpen = !panelOpen; panelMode = 'list'; paint(); map.fit();}} else if (action === 'housing-close')closePanel();
  else if (action === 'housing-expand') {panelExpanded = !panelExpanded; paint(); requestAnimationFrame(() => selected() ? map?.focus(selected().id) : map?.fit());} else if (action === 'housing-area')showDialog('选择街区', `<div class="housing-area-choices">${[['all', '下沙 · 上沙'], ...housingAreas.map(a => [a.id, a.name])].map(([key, name]) => `<button data-action="housing-set-area" data-id="${key}" class="${filter.area === key ? 'active' : ''}">${name}<span>${key === 'all' ? '8' : 4} 栋样板</span></button>`).join('')}</div>`);
  else if (action === 'housing-set-area') {filter.area = id; api.close(); panelMode = 'list'; if (routeView !== 'map')api.goto('map/housing'); else paint();} else if (action === 'housing-area-focus') {filter.area = id; panelMode = 'area:' + id; panelOpen = true; paint();} else if (action === 'housing-filter')showDialog('居住条件与历史参考', ui.filterForm(filter));
  else if (action === 'housing-reset')reset();
  
  else if (action === 'housing-view') {view = view === '2d' ? '3d' : '2d'; paint(); if (selected())requestAnimationFrame(() => map?.focus(selected().id));} else if (action === 'housing-surroundings') {surroundings = !surroundings; paint();} else if (action === 'housing-fit')map.fit();
  else if (action === 'housing-save') {commit({ housingSaved: toggleHousingSaved(api.state().housingSaved, id) }); paint();} else if (action === 'housing-compare' || action === 'housing-compare-remove') {commit({ housingCompare: toggleHousingCompare(api.state().housingCompare, id) }); paint();} else if (action === 'housing-tab') {if (value === 'community') {const b = selected(); if (b)api.openDiscussion('housing:' + b.id);} else {detailTab = value; paint();}} else if (action === 'housing-community')api.openDiscussion('housing:' + id);
  else if (action === 'housing-sources')showDialog('数据与来源', ui.sources());
  else if (action === 'housing-criteria')showDialog('我们如何筛选', ui.criteria());
  else if (action === 'housing-contribute') {showDialog('补充居住资料', `<div class="housing-area-choices"><button data-action="housing-contribution-experience">写居住经验<span>关联到楼栋社区</span></button><button data-action="housing-lead">补充楼栋或历史资料<span>先存为私人草稿</span></button></div>`);} else if (action === 'housing-contribution-experience') {const b = selected(); if (b)showDialog('写居住经验', ui.experienceForm(b)); else showDialog('选择楼栋', `<div class="housing-area-choices">${housingBuildings.map(b => `<button data-action="housing-experience" data-id="${b.id}">${e(b.name)}</button>`).join('')}</div>`);} else if (action === 'housing-experience') {const b = buildingById(id); if (b)showDialog('写居住经验', ui.experienceForm(b));} else if (action === 'housing-contacts') {const b = buildingById(id); showDialog(el.dataset.role === 'agent' ? '精选带看' : '直联房东', ui.contactList(b, el.dataset.role, el.dataset.reference));} else if (action === 'housing-contact-compose')openContact(id, el.dataset.building, el.dataset.reference);
  else if (action === 'housing-lead')openLead();
  else if (action === 'housing-plan') {const l = referenceById(id); editingFromMe = false; showDialog('加入看房清单', ui.noteForm(buildingById(l.buildingId), { listingId: id }));}
 } catch(error) {fail(error, document.querySelector('#dialog form'));}
});
 document.addEventListener('submit', async event => {
const form = event.target; if (!form.id?.startsWith('housing-')) return; event.preventDefault(); const data = new FormData(form), values = Object.fromEntries(data); try {
  if (form.id === 'housing-filter-form') {filter = { ...filter, ...values, budgetMax: data.has('budgetMax') ? (values.budgetMax ? Number(values.budgetMax) : null) : filter.budgetMax, elevator: data.has('elevator'), pet: data.has('pet'), saved: data.has('saved') }; panelMode = 'list'; api.close(); if (routeView !== 'map')api.goto('map/housing'); else {paint(); map?.fit();}} else if (form.id === 'housing-note-form') {const note = makeHousingNote({ ...values, id: form.dataset.id, buildingId: form.dataset.building, checkedIds: data.getAll('checkedIds') }); commit({ housingVisits: [note, ...(api.state().housingVisits || []).filter(n => n.id !== note.id)] }); api.close(); api.toast('看房记录已保存'); if (editingFromMe) {editingFromMe = false; api.goto('me');} else {detailTab = 'notes'; if (routeView === 'building') {paint();} else {pendingTab = 'notes'; api.goto('building/' + note.buildingId);}}} else if (form.id === 'housing-lead-form') {const lead = makeHousingLead({ ...values, id: form.dataset.id }); commit({ housingLeads: [lead, ...(api.state().housingLeads || []).filter(l => l.id !== lead.id)] }); api.close(); api.toast('已保存私人线索草稿'); if (editingFromMe) {editingFromMe = false; api.goto('me');}} else if (form.id === 'housing-contact-form') {const draft = makeContactDraft({ ...values, id: form.dataset.id, buildingId: form.dataset.building, contactId: form.dataset.contact, referenceId: form.dataset.reference }); commit({ housingContactDrafts: [draft, ...(api.state().housingContactDrafts || []).filter(d => d.id !== draft.id)] }); api.close(); api.toast('联系草稿已保存，尚未发送'); if (editingFromMe) {editingFromMe = false; api.goto('me');}} else if (form.id === 'housing-experience-form') {const b = buildingById(form.dataset.building), message = String(values.text || '').trim(), date = String(values.date || ''); if (!b || !message) throw new Error('请写下居住经验或问题'); if (message.length > 2000) throw new Error('请控制在2000字内'); if (!validDateRange(date, date) || !date || date > new Date().toISOString().slice(0, 10)) throw new Error('请选择有效的记录日期，不能晚于今天'); const kind = values.kind === 'question' ? '楼栋问题' : values.kind === 'visit' ? '看房经验' : '居住经验'; api.close(); await api.compose({ entityKey: 'housing:' + b.id, text: `${b.name} · ${kind} · ${date}\n\n${message}` });} else if (form.id === 'housing-delete-form') {const key = form.dataset.type === 'note' ? 'housingVisits' : form.dataset.type === 'contact' ? 'housingContactDrafts' : 'housingLeads'; commit({ [key]: (api.state()[key] || []).filter(x => x.id !== form.dataset.id) }); api.close(); if (location.hash === '#me')api.goto('me'); else paint();}
 } catch(error) {fail(error, form);}
});
 document.addEventListener('keydown', event => {if (event.key === 'Escape' && active() && panelOpen && !document.querySelector('#dialog').open) {event.preventDefault(); closePanel();}});
 return controller;
}
