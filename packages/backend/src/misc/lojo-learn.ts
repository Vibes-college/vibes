/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 资料页「学习」标签 (pages/user → frontend lojo/learn/LearnTab.vue): the learning grid, pinned graduation works and
// 「我是怎么学的」. Moved here from the 个人主页 mini app (miniapps/works/learn.mjs, majors.mjs) on 2026-11-17 when the
// founder chose to make it part of the community; the wording and the arithmetic did not change. Pure: no DB.
// Only what was done, never a ranking or a comparison. Lines are plain text (the frontend escapes them); the day
// text, 「我是怎么学的」 and 「怎么学出来的」 lines are content, written in Chinese, and are not translated.
//
// Who sees what (founder 2026-11-17: 默认公开; 「不需要搞什么年龄规则」): everything is public unless the owner turns it
// off or a moderator took it down. Outsiders are only told visible: false, never why.

// Majors that take a graduation work. Only IELTS for now (品牌策略 2026-11-12「先只给雅思这一个专业做」). Their labels
// (capstone, 错题复盘, 模考成绩单) are system text in the frontend's locales/learn.ts; here only what the content lines need.
export const LEARN_MAJORS: Record<string, { id: string; zh: string; reflectionRequired: boolean }> = {
	ielts: { id: 'ielts', zh: '雅思', reflectionRequired: true },
};

// Mini app id → the name shown in the lines. Apps not listed are left out.
export const LEARN_APP_NAMES: Record<string, string> = {
	typing: '机考打字',
	dictation: '听写',
	vocab: '词汇线',
	grammar: '语法线',
	wordbook: '生词本',
	synonym: '同义词连连看',
	'photo-words': '拍照单词',
	photo: '拍照单词',
	read: '分级阅读',
};

export type LearnDayIn = { day: string; n: number; apps: Record<string, number> };
export type LearnRecord = { days: LearnDayIn[]; levels: { id: string; at: string }[]; joinedAt: string };
export type LearnSettings = { isPublic: boolean; sources: string[]; contact: string; takenDown: boolean };
export const LEARN_DEFAULTS: LearnSettings = { isPublic: true, sources: [], contact: '', takenDown: false };
export type LearnSide = { text: string; image: string };
export type LearnItem = { kind: 'link' | 'image' | 'video' | 'file'; url: string; label: string };
export type LearnJourney = { levels: { id: string; at: string }[]; startedAt: string | null; apps: string[]; chapters: string[] };
export type LearnWorkRow = {
	major: string; title: string; oneLine: string; items: LearnItem[];
	before: LearnSide | null; after: LearnSide | null; reflection: string;
	score: LearnSide | null; journey: LearnJourney | null; createdAt: Date | string;
};

// —— dates, all in Beijing time ——
const bj = (d: Date | string | number) => new Date(new Date(d).getTime() + 8 * 3600_000);
export const learnDayKey = (d: Date | string | number): string => bj(d).toISOString().slice(0, 10);
const half = (d: Date | string) => { const t = bj(d); return `${t.getUTCFullYear()} ${t.getUTCMonth() < 6 ? '上半年' : '下半年'}`; };

function season(d: Date | string): string {
	const t = bj(d);
	const m = t.getUTCMonth() + 1;
	const y = m <= 2 ? t.getUTCFullYear() - 1 : t.getUTCFullYear();
	return `${y} 年${m >= 3 && m <= 5 ? '春季' : m >= 6 && m <= 8 ? '夏季' : m >= 9 && m <= 11 ? '秋季' : '冬季'}`;
}

const md = (key: string) => { const [, m, d] = key.split('-'); return `${Number(m)} 月 ${Number(d)} 日`; };
const isStart = (id: string) => /(^|-)start$/.test(id);

// What was done that day: 「过了 2 关，听写练了 1 次」
export function learnDayText(apps: Record<string, number>): string {
	const parts: string[] = [];
	if (apps.quest) parts.push(`过了 ${apps.quest} 关`);
	if (apps.works) parts.push('更新了毕业作品');
	for (const [a, n] of Object.entries(apps).sort((x, y) => y[1] - x[1])) {
		if (a === 'quest' || a === 'works') continue;
		const name = LEARN_APP_NAMES[a] as string | undefined;
		if (name == null) continue;
		parts.push(a === 'wordbook' ? `生词本复习了 ${n} 次` : `${name}练了 ${n} 次`);
	}
	return parts.join('，');
}

// 「我是怎么学的」: 信息、方向、工具、圈子; a row with no data is left out
function howRows(p: LearnSettings, works: LearnWorkRow[], L: LearnRecord, chapterTitle: string | null): [string, string][] {
	const rows: [string, string][] = [];
	if (p.sources.length > 0) rows.push(['信息', `在时间线上订了：${p.sources.join('、')}`]);
	const passed = L.levels.filter(l => !isStart(l.id)).length;
	if (passed > 0) rows.push(['方向', `在走雅思路线图：过了 ${passed} 关${chapterTitle ? `，现在在${chapterTitle}` : ''}`]);
	const tools: Record<string, number> = {};
	for (const d of L.days) {
		for (const [a, n] of Object.entries(d.apps)) {
			const name = LEARN_APP_NAMES[a] as string | undefined;
			if (name != null) tools[name] = (tools[name] ?? 0) + n;
		}
	}
	const top = Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 3);
	if (top.length > 0) rows.push(['工具', top.map(([name, n]) => `${name} ${n} 次`).join('、')]);
	// one part per major: graduated 「雅思，X 加入，Y 毕业」, still studying 「在学雅思，X 加入」 (same as 正在学 / 已毕业)
	const circle = works.map(w => `${(LEARN_MAJORS[w.major] as typeof LEARN_MAJORS[string] | undefined)?.zh ?? w.major}，${season(L.joinedAt)}加入，${half(w.createdAt)}毕业`);
	if ((passed > 0 || L.days.length > 0) && !works.some(w => w.major === 'ielts')) circle.push(`在学雅思，${season(L.joinedAt)}加入`);
	if (circle.length > 0) rows.push(['圈子', circle.join('；')]);
	return rows;
}

const CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

// By chapter: 「第一章 13 关、第二章 13 关」 (chapter 1's Boss is saved as `boss`, without a chapter number)
function byChapter(levels: { id: string }[]): string {
	const n: Record<number, number> = {};
	for (const l of levels) {
		const ch = Number(/^(\d+)-/.exec(l.id)?.[1] ?? 1);
		n[ch] = (n[ch] ?? 0) + 1;
	}
	return Object.entries(n).sort((a, b) => Number(a[0]) - Number(b[0])).map(([c, k]) => `第${CN[Number(c)] ?? c}章 ${k} 关`).join('、');
}

// A work's 「怎么学出来的」: written from the learning record when the work is handed in; the owner can't change it
function journeyRows(w: LearnWorkRow): [string, string][] {
	const j = w.journey;
	if (j == null) return [];
	const levels = j.levels.filter(l => !isStart(l.id));
	const days = j.startedAt ? Math.max(1, Math.round((new Date(w.createdAt).getTime() - new Date(j.startedAt).getTime()) / 86400_000)) : null;
	const rows: [string, string][] = [];
	if (days != null && j.startedAt != null) rows.push(['用时', `从 ${md(learnDayKey(j.startedAt))}（${bj(j.startedAt).getUTCFullYear()}）开始，到交作品用了 ${days} 天`]);
	if (levels.length > 0) rows.push(['关卡', `过了雅思路线图的 ${levels.length} 关：${byChapter(levels)}`]);
	if (j.chapters.length > 0) rows.push(['章节', `打过了 ${j.chapters.join('、')} 的 Boss`]);
	if (j.apps.length > 0) rows.push(['用到的小程序', j.apps.join('、')]);
	return rows;
}

const filled = (x: LearnSide | null) => (x != null && (x.text !== '' || x.image !== '') ? { text: x.text, image: x.image } : null);

function workView(w: LearnWorkRow) {
	return {
		major: w.major,
		createdAt: new Date(w.createdAt).toISOString(),
		title: w.title,
		oneLine: w.oneLine,
		items: w.items,
		reflection: w.reflection,
		score: filled(w.score),
		before: filled(w.before),
		after: filled(w.after),
		journey: journeyRows(w),
	};
}

export type LearnViewIn = {
	p: LearnSettings; works: LearnWorkRow[]; L: LearnRecord; chapterTitle: string | null;
	owner: boolean; name: string; shareUrl: string; now?: Date;
};

export function learnView({ p, works, L, chapterTitle, owner, name, shareUrl, now = new Date() }: LearnViewIn) {
	const pub = !p.takenDown && p.isPublic;
	const show = owner || pub;
	const studying = show && (L.levels.length > 0 || L.days.length > 0) && !works.some(w => w.major === 'ielts') ? ['ielts'] : [];
	const shown = show ? works : [];
	const w0 = works.at(0);
	return {
		owner,
		visible: show,
		today: learnDayKey(now),
		grid: show ? L.days.map(d => ({ day: d.day, n: d.n, text: learnDayText(d.apps) || `学了 ${d.n} 次` })) : null,
		how: show ? howRows(p, works, L, chapterTitle) : null,
		studying,
		works: shown.map(workView),
		contact: show && p.contact !== '' ? { href: /^https?:/i.test(p.contact) ? p.contact : `mailto:${p.contact}` } : null,
		me: owner ? {
			isPublic: p.isPublic, takenDown: p.takenDown, public: pub,
			major: 'ielts',
			share: { name, major: w0?.major ?? 'ielts', title: w0?.title ?? '', line: w0?.oneLine ?? '', url: shareUrl },
		} : null,
	};
}

// 「怎么学出来的」 when a work is handed in: passed levels, the first day anything was recorded, the mini apps used,
// the chapters whose Boss was beaten.
export function learnJourney(L: LearnRecord, beaten: string[]): LearnJourney {
	const used = new Set<string>();
	for (const d of L.days) {
		for (const a of Object.keys(d.apps)) {
			const name = LEARN_APP_NAMES[a] as string | undefined;
			if (name != null) used.add(name);
		}
	}
	const firstDay = [L.levels.at(0)?.at, L.days.at(0)?.day].filter((x): x is string => x != null).sort().at(0) ?? null;
	return { levels: L.levels.map(l => ({ id: l.id, at: l.at })), startedAt: firstDay, apps: [...used], chapters: beaten };
}

// Cleans what the owner typed into a work (the endpoint's schema already checked lengths and link shapes).
// Errors: 'major' can't hand in for it, 'title' title or one line blank, 'reflection' this major needs one,
// 'empty' no item and no reflection.
export function learnWorkInput(major: string, b: {
	title: string; oneLine: string; reflection?: string;
	items?: { kind: string; url: string; label?: string }[];
	score?: { text?: string; image?: string } | null;
	before?: { text?: string; image?: string } | null;
	after?: { text?: string; image?: string } | null;
}): { ok: Omit<LearnWorkRow, 'major' | 'journey' | 'createdAt'> } | { error: 'empty' | 'reflection' | 'major' | 'title' } {
	const m = LEARN_MAJORS[major] as typeof LEARN_MAJORS[string] | undefined;
	if (m == null) return { error: 'major' };
	if (b.title.trim() === '' || b.oneLine.trim() === '') return { error: 'title' };
	const kinds = ['link', 'image', 'video', 'file'] as const;
	const items = (b.items ?? []).map(it => ({
		kind: (kinds as readonly string[]).includes(it.kind) ? it.kind as LearnItem['kind'] : 'link' as const,
		url: it.url.trim(),
		label: (it.label ?? '').trim(),
	})).filter(it => it.url !== '');
	const reflection = (b.reflection ?? '').trim();
	if (m.reflectionRequired && reflection === '') return { error: 'reflection' };
	if (items.length === 0 && reflection === '') return { error: 'empty' };
	const side = (x: { text?: string; image?: string } | null | undefined) => filled(x == null ? null : { text: (x.text ?? '').trim(), image: (x.image ?? '').trim() });
	return {
		ok: {
			title: b.title.trim(), oneLine: b.oneLine.trim(), items, reflection,
			score: side(b.score), before: side(b.before), after: side(b.after),
		},
	};
}
