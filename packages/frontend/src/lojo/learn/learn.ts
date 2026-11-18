/*
 * SPDX-FileCopyrightText: Vibes
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 资料页「学习」标签的数据：问社区自己的后端（lojo/learn/show，2026-11-17 起；之前是单独的个人主页小程序）。
// 谁能看到什么由后端挑好（默认公开；本人关掉或被管理员下架，外人什么都看不到），这里只管画。
import { learnText as learnLabels } from '@/lojo/locales/learn.js';
import { misskeyApi } from '@/utility/misskey-api.js';

export type LearnDay = { day: string; n: number; text: string };
export type LearnSide = { text: string; image: string };
export type LearnItem = { kind: string; url: string; label?: string };
export type LearnWork = {
	major: string; createdAt: string; title: string; oneLine: string; items: LearnItem[];
	reflection: string;
	score: LearnSide | null;
	before: LearnSide | null; after: LearnSide | null;
	journey: [string, string][];
};
export type LearnMe = {
	isPublic: boolean; takenDown: boolean; public: boolean;
	major: string;
	share: { name: string; major: string; title: string; line: string; url: string };
};
export type LearnView = {
	owner: boolean; visible: boolean; today?: string;
	grid?: LearnDay[] | null; how?: [string, string][] | null;
	studying?: string[]; works?: LearnWork[];
	contact?: { href: string } | null;
	me?: LearnMe | null;
};

/** 登录了就带上凭证（后端认出是本人，给全部）；没登录也能看公开的 */
export async function fetchLearn(username: string): Promise<LearnView> {
	return await misskeyApi('lojo/learn/show', { username }) as unknown as LearnView;
}

/** 专业的名字、要交什么、复盘和成绩单叫什么：系统文字，跟着界面语言走。没登记的专业就用它的 id。 */
export function majorText(major: string) {
	const m = learnLabels.majors[major] as typeof learnLabels.majors[string] | undefined;
	return {
		name: m?.name ?? major,
		capstone: m?.capstone ?? '',
		reflection: m?.reflection ?? learnLabels.reflectionFallback,
		score: m?.score ?? learnLabels.scoreFallback,
	};
}

/** 交作品是哪半年（北京时间）：「2026 下半年」 */
export function halfYear(iso: string): string {
	const t = new Date(Date.parse(iso) + 8 * 3600_000);
	return learnLabels.half(t.getUTCFullYear(), t.getUTCMonth() < 6 ? 1 : 2);
}

export type GridCell = { day: string; n: number; level: number; tip: string; col: number; row: number };

/** 学习格子：过去一年（53 周），每天一格，周日在最上面。today 是北京时间的「今天」（后端给的），跟格子里的日子一个算法。 */
export function buildGrid(days: LearnDay[], today: string): { cells: GridCell[]; months: { col: number; label: string }[]; learned: number } {
	const DAY = 86400_000;
	const by = new Map(days.map(d => [d.day, d]));
	const t0 = Date.parse(`${today}T00:00:00Z`);
	const start = t0 - (52 * 7 + new Date(t0).getUTCDay()) * DAY;
	const cells: GridCell[] = [];
	const months: { col: number; label: string }[] = [];
	let learned = 0;
	let lastMonth = -1;
	for (let w = 0; w < 53; w++) {
		for (let d = 0; d < 7; d++) {
			const t = new Date(start + (w * 7 + d) * DAY);
			if (t.getTime() > t0) continue;
			const key = t.toISOString().slice(0, 10);
			const hit = by.get(key);
			const n = hit?.n ?? 0;
			if (n > 0) learned++;
			const date = learnLabels.day(t.getUTCMonth() + 1, t.getUTCDate());
			cells.push({ day: key, n, level: level(n), tip: learnLabels.dayTip(date, n > 0 ? hit!.text : learnLabels.noRecord), col: w + 1, row: d + 1 });
			if (d === 0 && t.getUTCMonth() !== lastMonth && w < 52) {
				lastMonth = t.getUTCMonth();
				months.push({ col: w + 1, label: learnLabels.month(t.getUTCMonth() + 1) });
			}
		}
	}
	// 第一列刚好是月底那一周，下一个月的字紧挨着，两个字会叠在一起：去掉第一个
	if (months.length > 1 && months[1].col - months[0].col < 3) months.shift();
	return { cells, months, learned };
}

export const level = (n: number): number => (n <= 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);

/** 链接只放 http(s) 和 mailto；别的（比如 javascript:）不给点。后端存的时候已经挑过，这里再挡一道。 */
export const safeHref = (url: string | null | undefined): string | undefined => (url != null && /^(https?:\/\/|mailto:)/i.test(url) ? url : undefined);

/** 外人看：一样能看的都没有，就只显示一行空状态 */
export function nothingToShow(v: LearnView): boolean {
	if (!v.visible) return true;
	return (v.works ?? []).length === 0 && !(v.grid ?? []).some(d => d.n > 0) && (v.how ?? []).length === 0;
}
