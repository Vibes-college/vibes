/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { localDay, addDays, validDateRange } from './event-dates.js';
const WEEK = 7 * 24 * 3600000;
export function occurrence(event, filter = {}, now = new Date()) {
 if (event.closedAt) return event;
 const originalStart = Date.parse(event.seriesStartAt || event.startAt), duration = Date.parse(event.seriesEndAt || event.endAt) - originalStart;
 const today = localDay(now, event.timezone), mode = filter.dateMode || 'all'; let from = filter.from, to = filter.to;
 if (mode === 'today')from = to = today; if (mode === 'week') {from = today; to = addDays(today, 6);}
 if (mode !== 'all' && !validDateRange(from, to)) return null;
 if (event.recurrence?.frequency !== 'weekly') return event;
 let threshold = mode === 'all' ? -Infinity : Date.parse(from + 'T00:00:00+08:00');
 if (!filter.includePast)threshold = Math.max(threshold, +now);
 if (mode === 'all' && filter.includePast)threshold = +now;
 let n = Number.isFinite(threshold) ? Math.max(0, Math.floor((threshold - originalStart - duration) / WEEK) + 1) : 0;
 let start = originalStart + n * WEEK;
 if (event.recurrence.until && localDay(new Date(start), event.timezone) > event.recurrence.until) {if (mode === 'all' && filter.includePast) {n = 0; start = originalStart;} else return null;}
 if (mode !== 'all' && (localDay(new Date(start), event.timezone) > to || localDay(new Date(start + duration - 1), event.timezone) < from)) return null;
 return { ...event, seriesStartAt: event.seriesStartAt || event.startAt, seriesEndAt: event.seriesEndAt || event.endAt, startAt: new Date(start).toISOString(), endAt: new Date(start + duration).toISOString(), occurrenceOf: event.id };
}
export function repeatLabel(event) {if (event.recurrence?.frequency !== 'weekly') return ''; const d = new Date(event.seriesStartAt || event.startAt), weekday = new Intl.DateTimeFormat('zh-CN', { timeZone: event.timezone || 'Asia/Hong_Kong', weekday: 'long' }).format(d).replace('星期', ''); return '每周' + weekday;}
export function nextOccurrences(event, count = 3, now = new Date()) {if (!event.recurrence) return []; const output = []; let cursor = now; for (let i = 0; i < count; i++) {const next = occurrence(event, {}, cursor); if (!next) break; output.push(next); cursor = new Date(next.endAt);} return output;}
