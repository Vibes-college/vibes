/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global FormData:readonly */
import { document } from './environment.js';
import { tripById, selectTrips, makeTripPlan, makeTripInvite, makeTripReport } from './travel-model.js';
import * as tripUI from './travel-ui.js';
import { localDay, validDateRange } from './event-dates.js';
export function createTravelController(api) {
 const controller = { filter: { days: 'all', theme: 'all', transport: 'all', budget: 'all', date: '', saved: false }, group: null, view: { route: null, day: 0, section: 'itinerary', stop: null, date: '', expanded: false },
  items() {return selectTrips(this.filter, api.state());},
  prepare(id, day) {const route = tripById(id); if (this.view.route?.id !== id) {this.view = { route, day: 0, section: 'itinerary', stop: null, date: this.filter.date || api.state().tripPlans.find(p => p.route === id)?.start || '', expanded: false };} if (route && Number.isInteger(Number(day)) && Number(day) >= 0 && Number(day) < route.days && this.view.day !== Number(day)) {this.view.day = Number(day); this.view.stop = null;} return route;},
  overview() {this.view.route = null; const items = this.items(), listed = this.group ? items.filter(r => this.group.includes(r.id)) : items; return tripUI.tripList(listed, api.state(), !!this.group) + (!items.length ? '<div class="trip-list-empty-note">暂无符合的路线<br><button class="button" data-action="travel-reset">重置筛选</button></div>' : '');},
  select(id, kind) {if (kind === 'travel-stop') {this.view.stop = id; api.panel(true); api.render(); api.map()?.travel?.focus(id); const el = document.getElementById('trip-stop-' + id), scroller = document.querySelector('.trip-detail-scroll'); if (el && scroller)scroller.scrollTop = el.offsetTop - scroller.offsetTop - 15;} else api.goto('trip/' + id);},
  openDate(plan = false, id) {const route = tripById(id) || this.view.route; api.dialog(plan ? '存为我的行程' : '出发日期', tripUI.tripDateForm(this.view.date || this.filter.date, route, plan));},
  onGroup(ids) {this.group = ids; api.panel(true); api.render();},
  reset() {this.filter = { ...this.filter, days: 'all', theme: 'all', transport: 'all', budget: 'all', saved: false }; this.group = null; api.render(); api.map()?.recenter();}
 };
 document.addEventListener('click', event => {
const target = event.target.closest('[data-action^="travel-"]'); if (!target) return; const { action, id, value } = target.dataset; event.preventDefault(); const state = api.state();
  if (action === 'travel-back') {controller.group = null; api.goto('map/travel');} else if (action === 'travel-duration') {controller.filter.days = value; controller.group = null; api.render(); api.map()?.recenter();} else if (action === 'travel-filters')api.dialog('筛选路线', tripUI.tripFilterForm(controller.filter));
  else if (action === 'travel-reset')controller.reset();
  else if (action === 'travel-day') {controller.view.day = Number(value); controller.view.stop = null; controller.view.section = 'itinerary'; api.goto('trip/' + controller.view.route.id + '/' + value);} else if (action === 'travel-section') {controller.view.section = value; api.render();} else if (action === 'travel-stop') {if (controller.view.stop === id) {controller.view.stop = null; api.render();} else controller.select(id, 'travel-stop');} else if (action === 'travel-expand') {controller.view.expanded = !controller.view.expanded; api.render();} else if (action === 'travel-sources') {const route = tripById(id); if (route)api.dialog('路线资料', tripUI.tripSources(route));} else if (action === 'travel-date')controller.openDate();
  else if (action === 'travel-clear-date') {controller.filter.date = ''; controller.view.date = ''; api.close(); api.render();} else if (action === 'travel-plan')controller.openDate(true, id);
  else if (action === 'travel-save') {const next = state.tripSaved.includes(id) ? state.tripSaved.filter(x => x !== id) : [...state.tripSaved, id]; if (api.commit({ ...state, tripSaved: next }))api.render();} else if (action === 'travel-remove-plan') {if (api.commit({ ...state, tripPlans: state.tripPlans.filter(p => p.id !== id) }))api.render();} else if (action === 'travel-community')api.openDiscussion('travel:' + (id || controller.view.route?.id));
  else if (action === 'travel-report')api.dialog('记录路线', tripUI.tripReportForm(id || controller.view.route?.id));
 });
 document.addEventListener('submit', async event => {
const form = event.target; if (!['trip-filter-form', 'trip-date-form', 'trip-invite-form', 'trip-report-form'].includes(form.id)) return; event.preventDefault(); const values = Object.fromEntries(new FormData(form)), state = api.state(); try {
  if (form.id === 'trip-filter-form') {Object.assign(controller.filter, values, { saved: form.elements.saved.checked }); controller.group = null; api.close(); api.render(); api.map()?.recenter();} else if (form.id === 'trip-date-form') {if (!validDateRange(values.start, values.start) || values.start < localDay()) throw new Error('请选择今天或之后的出发日期'); controller.filter.date = values.start; controller.view.date = values.start; if (form.dataset.plan === 'true') {const plan = makeTripPlan(tripById(form.dataset.route), values.start); if (!api.commit({ ...state, tripPlans: [...state.tripPlans.filter(p => p.id !== plan.id), plan] })) return; api.toast('行程已保存');}api.close(); api.render();} else if (form.id === 'trip-invite-form') {const draft = makeTripInvite(tripById(form.dataset.route), { ...values, id: form.dataset.id }); if (!api.commit({ ...state, tripInvites: [...state.tripInvites.filter(x => x.route !== draft.route), draft] })) return; api.goto('me'); api.toast('同行草稿已保存');} else if (form.id === 'trip-report-form') {const route = tripById(values.route), report = makeTripReport(route, values); api.close(); await api.compose({ entityKey: 'travel:' + report.route, text: `${route.name} · ${report.type} · ${report.date}\n\n${report.text}` });}
 } catch(error) {const output = form.isConnected ? form.querySelector('.trip-form-error') : null; if (output)output.textContent = error.message; else api.toast(error.message);}
});
 return controller;
}
