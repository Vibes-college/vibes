/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* global URL:readonly */
import { travelRoutes, travelSources } from './travel-data.js';
import { addDays, validDateRange } from './event-dates.js';

const MAX_STOPS = 150;
const kinds = new Set(['place', 'food', 'stay', 'transit']);
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
const reservedDayIds = new Set(['all', 'pool', 'new']);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,100}$/.test(value) && !forbidden.has(value);
let serial = 0;
const uid = prefix => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + (++serial).toString(36) + '-' + Math.random().toString(36).slice(2));
const timestamp = () => new Date().toISOString();
const text = (value, max, label, required = false) => {if (value == null)value = ''; if (typeof value !== 'string') throw new Error(label + '格式不正确'); const result = value.trim(); if (required && !result) throw new Error('请填写' + label); if (result.length > max) throw new Error(label + '不能超过 ' + max + ' 字'); return result;};
const clipped = (value, max, fallback = '') => typeof value === 'string' ? value.trim().slice(0, max) : fallback;
const validStart = value => value === '' || (typeof value === 'string' && validDateRange(value, value));
const startDate = value => {if (!validStart(value)) throw new Error('请选择有效的出发日期'); return value;};
const countDays = value => {const n = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN; if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error('旅行需要安排 1–5 天'); return n;};
const validCoord = value => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90;
const coordinate = value => {if (value == null) return null; if (!validCoord(value)) throw new Error('地点坐标无效'); return [...value];};
const numberOrNull = (value, max, label, integer = false) => {if (value == null || value === '') return null; if (typeof value === 'boolean' || (typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim()))) throw new Error(label + '格式不正确'); const n = Number(value); if (!Number.isFinite(n) || n < 0 || n > max || (integer && !Number.isInteger(n)) || (!integer && Math.abs(n * 100 - Math.round(n * 100)) > 1e-7)) throw new Error(label + '格式不正确'); return integer ? n : Math.round(n * 100) / 100;};
const time = value => {const result = text(value, 5, '开始时间'); if (result && !/^([01]\d|2[0-3]):[0-5]\d$/.test(result)) throw new Error('开始时间格式应为 HH:mm'); return result;};
const url = (value, image = false) => {const result = text(value, 1200, image ? '图片地址' : '来源链接'); if (!result) return ''; if (image && /^\/assets\/[A-Za-z0-9_./-]+$/.test(result) && !result.includes('..')) return result; try {const parsed = new URL(result); if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(); return parsed.href;} catch {throw new Error(image ? '图片地址无效' : '来源链接无效');}};
const safely = (fn, fallback) => {try {return fn();} catch {return fallback;}};
const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : '';
const clone = trip => ({ ...trip, days: trip.days.map(day => ({ ...day, stopIds: [...day.stopIds] })), pool: [...trip.pool], stops: Object.fromEntries(Object.entries(trip.stops).map(([id, stop]) => [id, { ...stop, coord: stop.coord ? [...stop.coord] : null }])) });

function requireTrip(trip) {if (!record(trip) || !validId(trip.id) || !Array.isArray(trip.days) || !trip.days.length || !record(trip.stops) || !Array.isArray(trip.pool)) throw new Error('旅行不存在，请重新打开');}

function touch(trip) {trip.updatedAt = timestamp(); return trip;}

function targetList(trip, target) {if (target === 'pool') return trip.pool; const day = trip.days.find(day => day.id === target); if (!day) throw new Error('没有找到这一天'); return day.stopIds;}

function stopFields(place) {
 if (!record(place)) throw new Error('地点资料无效');
 const kind = place.kind ?? 'place'; if (!kinds.has(kind)) throw new Error('地点类型无效');
 return { placeId: text(place.placeId ?? place.id ?? '', 120, '地点编号'), name: text(place.name, 120, '地点名称', true), address: text(place.address, 280, '地点地址'), coord: coordinate(place.coord), kind, at: time(place.at), minutes: numberOrNull(place.minutes, 1440, '停留分钟', true), cost: numberOrNull(place.cost, 1000000, '费用'), note: text(place.note, 1200, '备注'), source: text(place.source, 120, '地点来源'), sourceUrl: url(place.sourceUrl), image: url(place.image, true) };
}

function copyStop(route, stop) {
 const source = sourceFor(route, stop), stay = clipped(stop.stay, 120), match = stay.match(/^约?\s*(\d+(?:\.\d+)?)\s*(分钟|小时|h|hrs?|mins?|m)$/i);
 const parsed = match ? Number(match[1]) * (/^(小时|h|hrs?)$/i.test(match[2]) ? 60 : 1) : null;
 const minutes = Number.isInteger(parsed) && parsed >= 0 && parsed <= 1440 ? parsed : null;
 const at = safely(() => time(stop.at), '');
 const notes = [clipped(stop.note, 900), minutes === null && stay ? '停留参考：' + stay : '', !at && stop.at ? '原时段：' + clipped(stop.at, 100) : '', stop.transfer ? '接驳参考：' + clipped(stop.transfer, 120) : '', stop.optional ? '可选停靠。' : ''].filter(Boolean);
 const kind = ['food', 'restaurant', 'cafe'].includes(stop.kind) ? 'food' : ['transport', 'transit'].includes(stop.kind) ? 'transit' : ['hotel', 'stay', 'lodging'].includes(stop.kind) ? 'stay' : 'place';
 return { placeId: stop.id, name: stop.name, address: route.city, coord: stop.coord, kind, at, minutes, cost: null, note: notes.join('\n').slice(0, 1200), source: source?.title || '精选路线', sourceUrl: source?.url || '', image: stop.image || '' };
}

/** A private editable copy; authored route budgets are deliberately not imported as expenses. */
export function createTrip(values = {}, route = null) {
 const isCopy = record(route) && Array.isArray(route.itinerary);
 const dayCount = countDays(isCopy ? route.itinerary.length : values.dayCount ?? 2);
 const now = timestamp();
 let trip = { id: uid('trip'), name: text(values.name ?? (isCopy ? route.name : ''), 80, '旅行名称', true), base: '深圳', destination: text(values.destination ?? (isCopy ? route.city : ''), 80, '目的地', true), start: startDate(values.start ?? ''), days: Array.from({ length: dayCount }, (_, i) => ({ id: uid('day'), title: isCopy ? clipped(route.itinerary[i].title, 80) : '', stopIds: [] })), pool: [], stops: {}, sourceRoute: isCopy && validId(route.id) ? route.id : null, createdAt: now, updatedAt: now };
 if (isCopy) for (const [index, day] of route.itinerary.entries()) for (const stop of day.stops || []) {
  trip = addStop(trip, copyStop(route, stop), trip.days[index].id);
 }
 return trip;
}

/** Repair local archives, retaining recoverable places in the unassigned pool. */
export function normalizeTrip(value) {
 if (!record(value) || !validId(value.id) || !Array.isArray(value.days) || !value.days.length || !record(value.stops)) return null;
 const name = clipped(value.name, 80), destination = clipped(value.destination, 80); if (!name || !destination) return null;
 const stops = {};
 for (const [id, stop] of Object.entries(value.stops).slice(0, MAX_STOPS)) {
  if (!validId(id) || !record(stop) || !clipped(stop.name, 120)) continue;
  stops[id] = { id, placeId: clipped(stop.placeId, 120), name: clipped(stop.name, 120), address: clipped(stop.address, 280), coord: validCoord(stop.coord) ? [...stop.coord] : null, kind: kinds.has(stop.kind) ? stop.kind : 'place', at: safely(() => time(stop.at), ''), minutes: safely(() => numberOrNull(stop.minutes, 1440, '停留分钟', true), null), cost: safely(() => numberOrNull(stop.cost, 1000000, '费用'), null), note: clipped(stop.note, 1200), source: clipped(stop.source, 120), sourceUrl: safely(() => url(stop.sourceUrl), ''), image: safely(() => url(stop.image, true), '') };
 }
 const assigned = new Set(), dayIds = new Set();
 const days = value.days.slice(0, 5).map((day, index) => {
  let id = validId(day?.id) && !reservedDayIds.has(day.id) && !dayIds.has(day.id) ? day.id : 'day-restored-' + index;
  while (dayIds.has(id))id += 'x'; dayIds.add(id);
  const stopIds = []; for (const stopId of Array.isArray(day?.stopIds) ? day.stopIds : []) if (typeof stopId === 'string' && own(stops, stopId) && !assigned.has(stopId)) {assigned.add(stopId); stopIds.push(stopId);}
  return { id, title: clipped(day?.title, 80), stopIds };
 });
 const pool = []; for (const id of [...(Array.isArray(value.pool) ? value.pool : []), ...Object.keys(stops)]) if (typeof id === 'string' && own(stops, id) && !assigned.has(id)) {assigned.add(id); pool.push(id);}
 return { id: value.id, name, base: '深圳', destination, start: validStart(value.start) ? value.start : '', days, pool, stops, sourceRoute: validId(value.sourceRoute) ? value.sourceRoute : null, createdAt: stamp(value.createdAt), updatedAt: stamp(value.updatedAt) };
}

export function updateTrip(trip, patch = {}) {
 requireTrip(trip); if (!record(patch)) throw new Error('旅行资料无效'); const next = clone(trip);
 if (own(patch, 'name'))next.name = text(patch.name, 80, '旅行名称', true);
 if (own(patch, 'destination'))next.destination = text(patch.destination, 80, '目的地', true);
 if (own(patch, 'start'))next.start = startDate(patch.start);
 if (own(patch, 'dayCount')) {const n = countDays(patch.dayCount); if (n < next.days.length) {next.pool.push(...next.days.slice(n).flatMap(day => day.stopIds)); next.days = next.days.slice(0, n);} while (next.days.length < n)next.days.push({ id: uid('day'), title: '', stopIds: [] });}
 return touch(next);
}
export function addStop(trip, place, target = 'pool') {
 requireTrip(trip); if (Object.keys(trip.stops).length >= MAX_STOPS) throw new Error('一条旅行最多保存 150 个地点'); const fields = stopFields(place), next = clone(trip), list = targetList(next, target), id = uid('stop'); next.stops[id] = { id, ...fields }; list.push(id); return touch(next);
}
export function updateStop(trip, id, patch = {}) {
 requireTrip(trip); if (!validId(id) || !own(trip.stops, id)) throw new Error('没有找到这个地点'); if (!record(patch)) throw new Error('地点资料无效'); const current = trip.stops[id];
 const editable = ['placeId', 'name', 'address', 'coord', 'kind', 'at', 'minutes', 'cost', 'note', 'source', 'sourceUrl', 'image']; const selected = Object.fromEntries(editable.filter(key => own(patch, key)).map(key => [key, patch[key]]));
 const next = clone(trip); next.stops[id] = { id, ...stopFields({ ...current, ...selected }) }; return touch(next);
}
/** index is the final zero-based position in the destination list after removal. */
export function moveStop(trip, id, target, index) {
 requireTrip(trip); if (!validId(id) || !own(trip.stops, id)) throw new Error('没有找到这个地点'); const next = clone(trip); targetList(next, target);
 next.pool = next.pool.filter(x => x !== id); for (const day of next.days)day.stopIds = day.stopIds.filter(x => x !== id); const list = targetList(next, target);
 const position = index === undefined ? list.length : index; if (!Number.isInteger(position) || position < 0 || position > list.length) throw new Error('地点顺序无效'); list.splice(position, 0, id); return touch(next);
}
export function removeStop(trip, id) {
 requireTrip(trip); if (!validId(id) || !own(trip.stops, id)) throw new Error('没有找到这个地点'); const next = clone(trip); delete next.stops[id]; next.pool = next.pool.filter(x => x !== id); for (const day of next.days)day.stopIds = day.stopIds.filter(x => x !== id); return touch(next);
}
export function tripStats(trip, target = 'all') {
 requireTrip(trip); const ids = target === 'all' ? [...trip.days.flatMap(day => day.stopIds), ...trip.pool] : targetList(trip, target); const stops = ids.map(id => trip.stops[id]).filter(Boolean); const cost = stops.reduce((sum, stop) => sum + Math.round((stop.cost ?? 0) * 100), 0) / 100;
 return { stops: stops.length, scheduled: target === 'all' ? trip.days.reduce((sum, day) => sum + day.stopIds.length, 0) : target === 'pool' ? 0 : stops.length, unscheduled: target === 'all' || target === 'pool' ? trip.pool.length : 0, minutes: stops.reduce((sum, stop) => sum + (stop.minutes ?? 0), 0), cost, unknownCost: stops.filter(stop => stop.cost === null).length, unknownMinutes: stops.filter(stop => stop.minutes === null).length };
}
export function dayDate(trip, index) {if (!Number.isInteger(index) || index < 0 || index >= trip.days.length) return ''; return trip.start ? addDays(trip.start, index) : '';}
const sourcesByStop = { talent: 'bay', 'bay-coast': 'bay', 'nantou-gate': 'nantou', 'nantou-lanes': 'nantou', zhongshan: 'nantou', 'hz-lake': 'huizhou', hejian: 'huizhou', shuidong: 'huizhou', shamian: 'shamian', gdmuseum: 'museum', jinding: 'coastMap', ermalu: 'streetMap', 'sw-station': 'rail' };

function sourceFor(route, stop) {return travelSources[sourcesByStop[stop.id]] || travelSources[route.sources?.find(key => key !== 'rail')];}

export function placeCatalog() {
 const catalog = new Map();
 for (const route of travelRoutes) for (const day of route.itinerary) for (const stop of day.stops) {
  if (['food', 'rest'].includes(stop.kind) || catalog.has(stop.id)) continue;
  const source = sourceFor(route, stop);
  catalog.set(stop.id, { id: stop.id, placeId: stop.id, name: stop.name, city: route.city, address: route.city, coord: [...stop.coord], kind: stop.kind === 'transport' ? 'transit' : 'place', image: stop.image || '', source: source?.title || '精选路线', sourceUrl: source?.url || '', at: '', minutes: null, cost: null, note: '' });
 }
 return [...catalog.values()];
}
export function searchCatalog(query = '', destination = '') {
 const q = typeof query === 'string' ? query.trim().toLocaleLowerCase() : ''; const dest = typeof destination === 'string' ? destination.trim().toLocaleLowerCase() : '';
 const terms = q.split(/\s+/).filter(Boolean); return placeCatalog().filter(place => terms.every(term => [place.name, place.city, place.address].join(' ').toLocaleLowerCase().includes(term))).sort((a, b) => Number(!!dest && b.city.toLocaleLowerCase().includes(dest)) - Number(!!dest && a.city.toLocaleLowerCase().includes(dest)));
}
export function exportTripText(trip) {
 requireTrip(trip); const lines = [trip.name, `${trip.base}出发 · ${trip.destination} · ${trip.days.length} 天${trip.start ? ' · ' + trip.start : ''}`];
 const describe = id => {const stop = trip.stops[id]; return `${stop.at ? stop.at + ' ' : ''}${stop.name}${stop.minutes !== null ? ' · ' + stop.minutes + ' 分钟' : ''}${stop.cost !== null ? ' · ¥' + stop.cost : ''}${stop.address ? '\n  ' + stop.address : ''}${stop.note ? '\n  ' + stop.note : ''}`;};
 trip.days.forEach((day, index) => {lines.push('', `第 ${index + 1} 天${dayDate(trip, index) ? ' · ' + dayDate(trip, index) : ''}${day.title ? ' · ' + day.title : ''}`, ...day.stopIds.map((id, i) => (i + 1) + '. ' + describe(id)));});
 if (trip.pool.length)lines.push('', '待安排', ...trip.pool.map(id => '• ' + describe(id))); const totals = tripStats(trip); lines.push('', `已填写费用：¥${totals.cost}${totals.unknownCost ? '（' + totals.unknownCost + ' 个地点未填）' : ''}`); return lines.join('\n');
}
