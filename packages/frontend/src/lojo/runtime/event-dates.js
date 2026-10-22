/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const EVENT_TZ = 'Asia/Hong_Kong';
export function localDay(value = new Date(), timeZone = EVENT_TZ) {const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value)).map(p => [p.type, p.value])); return `${p.year}-${p.month}-${p.day}`;}
export function addDays(day, n) {const date = new Date(day + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + n); return date.toISOString().slice(0, 10);}
export function validDateRange(from, to) {const valid = day => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day; return valid(from) && valid(to) && from <= to;}
export function inDateRange(event, filter = {}, now = new Date()) {
 if (!event.startAt || !event.endAt) return false;
 if (!filter.includePast && Date.parse(event.endAt) <= +new Date(now)) return false;
 const mode = filter.dateMode || 'all', today = localDay(now, event.timezone || EVENT_TZ);
 let from = filter.from, to = filter.to;
 if (mode === 'today')from = to = today;
 if (mode === 'week') {from = today; to = addDays(today, 6);}
 if (mode === 'all') return true;
 if (!validDateRange(from, to)) return false;
 return localDay(event.startAt, event.timezone) <= to && localDay(new Date(Date.parse(event.endAt) - 1), event.timezone) >= from;
}
export function dateFilterLabel(filter) {if (filter.dateMode === 'today') return '今天'; if (filter.dateMode === 'week') return '未来 7 天'; if (filter.dateMode === 'custom') {const crossYear = filter.from.slice(0, 4) !== filter.to.slice(0, 4), format = d => (crossYear ? d : d.slice(5)).replaceAll('-', '/'); return filter.from === filter.to ? filter.from.replaceAll('-', '/') : `${format(filter.from)}–${format(filter.to)}`;} return '全部日期';}
export function eventWhen(event, { full = false } = {}) {const d = new Date(event.startAt), end = new Date(event.endAt), opts = { timeZone: event.timezone || EVENT_TZ, hour: '2-digit', minute: '2-digit', hour12: false }; const time = v => new Intl.DateTimeFormat('zh-CN', opts).format(v); const date = localDay(d, event.timezone), last = localDay(end, event.timezone); const year = date.slice(0, 4) !== localDay().slice(0, 4) || full ? date.slice(0, 4) + '/' : ''; const short = year + date.slice(5).replace('-', '/'); if (!full) return short + ' ' + time(d); return `${short} ${time(d)}–${date === last ? '' : last.replaceAll('-', '/') + ' '}${time(end)}`;}
export function eventDuration(event) {const hours = (Date.parse(event.endAt) - Date.parse(event.startAt)) / 3600000; return hours >= 24 ? Math.round(hours / 24 * 10) / 10 + ' 天' : hours + ' 小时';}
export function toLocalInput(value) {const date = new Date(value); return localDay(date) + 'T' + new Intl.DateTimeFormat('en-GB', { timeZone: EVENT_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);}
