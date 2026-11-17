/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 右下角的探头（创始人 11-17 00:13 PT 选的 A）：有新任务的时候从旁边冒一句话。一天最多说一次，只对这台设备。

import { vibiLabels as L } from './labels.js';

type PlanDay = { date: string; rest: boolean; tasks: { status: string }[] };
type PlanToday = {
	plan: unknown;
	today?: string;
	days?: PlanDay[];
	// only when the week asked for is not this week (LojoPlanService.view); otherwise today is one of days
	todayView?: PlanDay | null;
} | null;

// What to say about today's plan (lojo/plan/show): how many tasks are not done yet. Nothing without a plan, on the
// rest day, or when all are done.
export function peekLine(d: PlanToday): string | null {
	if (d == null || d.plan == null) return null;
	const day = d.todayView ?? d.days?.find(x => x.date === d.today);
	if (day == null || day.rest) return null;
	const left = day.tasks.filter(t => t.status !== 'done').length;
	return left > 0 ? L.todayLeft(left) : null;
}

const SAID_KEY = 'vibes:momoSaid';

// The day on this device, YYYY-MM-DD.
export function localDay(now = new Date()): string {
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function saidToday(day = localDay()): boolean {
	try {
		return window.localStorage.getItem(SAID_KEY) === day;
	} catch {
		return true;
	}
}

export function markSaid(day = localDay()) {
	try {
		window.localStorage.setItem(SAID_KEY, day);
	} catch { /* blocked: it may say it again on the next visit */ }
}
