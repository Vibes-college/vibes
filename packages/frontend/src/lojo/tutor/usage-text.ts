/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The usage line under a chat with Vibi (founder, 2026-11-11): how much of the 5-hour and weekly allowance is used and
// when it comes back; when it is used up, whether gems are in use. Only this line talks about it: Vibi never does.
// There is no way to buy gems yet, so there is no buy button.

export type VibiUsage = {
	fivePct: number; fiveResetAt: string | null;
	weekPct: number; weekResetAt: string | null;
	state: 'ok' | 'gems' | 'out';
	backAt: string | null;
	gems: number; // thousandths of a gem
	siteFullUntil?: string | null; // the whole-site fuse has blown until then
};

const WEEKDAYS_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "今天 14:00", "明天 09:30", "周四 14:00" (within a week), else "11月20日 14:00"; in the viewer's own time.
export function whenText(iso: string, now: Date, zh: boolean): string {
	const at = new Date(iso);
	const hm = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
	const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	const days = Math.round((day(at) - day(now)) / 86400000);
	if (days <= 0) return zh ? `今天 ${hm}` : `today ${hm}`;
	if (days === 1) return zh ? `明天 ${hm}` : `tomorrow ${hm}`;
	if (days < 7) return zh ? `${WEEKDAYS_ZH[at.getDay()]} ${hm}` : `${WEEKDAYS_EN[at.getDay()]} ${hm}`;
	return zh ? `${at.getMonth() + 1}月${at.getDate()}日 ${hm}` : `${at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${hm}`;
}

export function gemsText(milli: number): string {
	return milli >= 10000 ? String(Math.floor(milli / 1000)) : String(Math.floor(milli / 100) / 10);
}

export function usageText(u: VibiUsage, now: Date, zh: boolean): string {
	// The whole-site fuse (a daily cap for everyone together) comes before the learner's own allowance.
	if (u.siteFullUntil) {
		const at = whenText(u.siteFullUntil, now, zh);
		return zh
			? `今天找 Vibi 的人太多，全站暂停回复，${at} 恢复。没扣你的额度。`
			: `Vibi is too busy today and is pausing for everyone. Back ${at}; nothing was taken from your allowance.`;
	}
	const back = u.backAt ? whenText(u.backAt, now, zh) : null;
	if (u.state === 'out') {
		return zh
			? `额度用完了，${back ?? '稍后'}恢复。在那之前 Vibi 先不回复。`
			: `You've used up your allowance. It's back ${back ?? 'soon'}; Vibi won't reply until then.`;
	}
	if (u.state === 'gems') {
		return zh
			? `额度用完了，现在在用宝石（还剩 ${gemsText(u.gems)} 颗）。额度${back ? ` ${back}` : '稍后'}恢复。`
			: `You've used up your allowance, so gems are being used now (${gemsText(u.gems)} left). Allowance back ${back ?? 'soon'}.`;
	}
	const week = u.weekPct > 0 && u.weekResetAt
		? (zh ? `本周已用 ${u.weekPct}%，${whenText(u.weekResetAt, now, zh)} 恢复` : `This week: ${u.weekPct}% used, resets ${whenText(u.weekResetAt, now, zh)}`)
		: (zh ? `本周已用 ${u.weekPct}%` : `This week: ${u.weekPct}% used`);
	const five = zh ? `5 小时内已用 ${u.fivePct}%` : `Last 5 hours: ${u.fivePct}%`;
	return `${week} · ${five}`;
}

// The usage card in the chat's ⋯ menu (founder, 2026-11-11 23:29): one line under each bar.
// 5 hours: "约 2 小时 15 分后恢复"; it rolls, so this is when the oldest use in the window drops out.
export function fiveBackText(u: VibiUsage, now: Date, zh: boolean): string {
	if (u.fivePct <= 0 || u.fiveResetAt == null) return zh ? '还没用，随时可聊' : 'Nothing used yet';
	const mins = Math.max(1, Math.ceil((new Date(u.fiveResetAt).getTime() - now.getTime()) / 60000));
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	if (zh) return `约 ${h > 0 ? `${h} 小时 ` : ''}${h > 0 && m === 0 ? '' : `${m} 分`}后恢复`.replace(' 后', '后');
	return `Back in about ${h > 0 ? `${h}h ` : ''}${h > 0 && m === 0 ? '' : `${m}m`}`.trim();
}

// The week: "周四 14:00 恢复", always the weekday and time, in the viewer's own time zone.
export function weekBackText(u: VibiUsage, zh: boolean): string {
	if (u.weekPct <= 0 || u.weekResetAt == null) return zh ? '本周还没用' : 'Nothing used this week';
	const at = new Date(u.weekResetAt);
	const hm = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
	return zh ? `${WEEKDAYS_ZH[at.getDay()]} ${hm} 恢复` : `Resets ${WEEKDAYS_EN[at.getDay()]} ${hm}`;
}
