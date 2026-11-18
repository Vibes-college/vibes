/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 第 6 步 (2026-11-17): Vibi finds a mini app by what the learner said ("有没有练听写的小程序", "我想背单词用哪个").
// One list for Vibi, two sources joined by id:
// - the roster (content kind `apps`, lojo-apps-roster.ts): what the launcher shows: name, link, intro, category, tags;
// - the directory (lojo_app): what each running app registered: the kinds of data it answers and its OpenAPI spec.
// An app in the roster but not running yet still has a link; an app running but not in the launcher (or hidden) has
// no link (url null): Vibi may read its data but must not send the learner there.
// Plain word matching, no vectors: the roster is a few dozen entries at most, and a match must be explainable.
// No imports at run time, so the unit tests need no database.

export type AppSearchRosterEntry = {
	id: string; name: string; href: string; type: string;
	category?: string; tags?: string[];
	intro: { summary: string; audience: string; steps: string[]; caveats: string[] };
};

export type AppSearchDirectoryEntry = {
	id: string; name: string; summary: string;
	kinds: Record<string, string>;
	/** caller → the kinds it may read, plus `<kind>:do` for the writes it may ask the learner to confirm */
	defaultGrants: Record<string, string[]>;
	spec: unknown;
};

export type AppSearchItem = {
	id: string;
	name: string;
	summary: string;
	audience: string;
	category: string | null;
	tags: string[];
	/** full address to open it (this site's /apps/<id>/…, or the other site for external ones); null: not in the launcher */
	url: string | null;
	inLauncher: boolean;
	kinds: { kind: string; about: string; granted: boolean }[];
	/** it has at least one write this caller may ask the learner to confirm */
	writes: boolean;
};

export const APP_SEARCH_LIMIT = 20;
/**
 * An app counts as found from this score up. A word only in "who it is for" (0.5) is not enough on its own: the
 * grammar line is for people who want to avoid grammar mistakes in writing and 口语, but it is not a 口语 app.
 */
export const APP_SEARCH_MIN_SCORE = 1;

// Words in a request that say nothing about which app: asking, wanting, "mini app", and what every app here is about
// (English, IELTS). Longest first, so 有没有 goes before 有.
const FILLER = [
	'有没有', '小程序', '用哪个', '哪一个', '能不能', '可不可以', '推荐一下', '推荐', '有什么', '什么', '哪个', '哪些',
	'我想要', '我想', '我要', '想要', '帮我', '给我', '一下', '可以', '应用', '工具', '练习', '训练', '学习',
	'英语', '雅思', '用来', '用于', '的', '吗', '呢', '吧', '啊', '呀', '个', '练', '学', '用', '想', '有', '要', '在', '和', '跟', '我',
	'mini', 'apps', 'app', 'ielts', 'english', 'practice', 'practise', 'want', 'which', 'what', 'is', 'there', 'any', 'for', 'to', 'the', 'a', 'an', 'i', 'my', 'me', 'do', 'you', 'have', 'use',
].sort((a, b) => b.length - a.length);
const FILLER_WORDS = new Set(FILLER.filter(f => /^[a-z]+$/.test(f)));
const FILLER_CJK = FILLER.filter(f => !/^[a-z]+$/.test(f));
const CJK = /[㐀-鿿]/;

/** The words of a request worth matching (lower case). Empty: the request names nothing, show every app. */
export function searchTerms(query: string): string[] {
	const parts = query.normalize('NFKC').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
	const out: string[] = [];
	for (const part of parts) {
		if (!CJK.test(part)) {
			if (!FILLER_WORDS.has(part) && part.length > 1) out.push(part);
			continue;
		}
		let rest = part;
		for (const f of FILLER_CJK) rest = rest.split(f).join(' ');
		for (const t of rest.split(/\s+/)) if (t !== '') out.push(t);
	}
	return [...new Set(out)];
}

type Field = { text: string; weight: number; exact?: boolean };

function fieldsOf(a: AppSearchItem, steps: string[]): Field[] {
	return [
		{ text: a.id, weight: 3 },
		{ text: a.name, weight: 3 },
		...a.tags.map(t => ({ text: t, weight: 3, exact: true })),
		{ text: a.category ?? '', weight: 2 },
		{ text: a.summary, weight: 1 },
		{ text: a.audience, weight: 0.5 },
		...steps.map(s => ({ text: s, weight: 1 })),
		...a.kinds.map(k => ({ text: k.about, weight: 1 })),
	].map(f => ({ ...f, text: f.text.normalize('NFKC').toLowerCase() }));
}

function termScore(fields: Field[], term: string): number {
	let best = 0;
	for (const f of fields) {
		if (f.text === '') continue;
		// a tag that is exactly the word counts a bit more than a tag that only contains it
		const w = f.exact && f.text === term ? f.weight + 1 : f.text.includes(term) ? f.weight : 0;
		if (w > best) best = w;
	}
	return best;
}

/** How well an app matches the words (0 = not at all). */
export function appScore(a: AppSearchItem, steps: string[], terms: string[]): number {
	const fields = fieldsOf(a, steps);
	let score = 0;
	for (const term of terms) {
		const whole = termScore(fields, term);
		if (whole > 0) {
			score += whole;
			continue;
		}
		// a longer Chinese word not found whole (背单词 when the tag says 单词): its two-character pieces, at half
		// weight, and only when most of them are found, so one common character pair does not make a match
		if (CJK.test(term) && term.length >= 3) {
			const pairs = Array.from({ length: term.length - 1 }, (_, i) => term.slice(i, i + 2));
			const hits = pairs.map(p => termScore(fields, p)).filter(s => s > 0);
			if (hits.length * 2 >= pairs.length) score += Math.max(...hits) / 2;
		}
	}
	return score;
}

/** The address a learner opens: this site's own page for /apps/…, the other site as it is. */
export function appUrl(siteUrl: string, href: string): string {
	if (/^https:\/\//.test(href)) return href;
	return `${siteUrl.replace(/\/+$/, '')}/${href.replace(/^\/+/, '')}`;
}

/** Ops in a spec that change something and say how to ask the learner (x-vibes-action), by kind. */
export function actionKinds(spec: unknown): string[] {
	const out = new Set<string>();
	const paths = (spec as { paths?: Record<string, Record<string, unknown>> } | null)?.paths ?? {};
	for (const ops of Object.values(paths)) {
		if (ops == null || typeof ops !== 'object') continue;
		for (const [method, op] of Object.entries(ops)) {
			if (method === 'get' || op == null || typeof op !== 'object') continue;
			const o = op as Record<string, unknown>;
			if (o['x-vibes-action'] != null && typeof o['x-vibes-kind'] === 'string') out.add(o['x-vibes-kind']);
		}
	}
	return [...out];
}

/**
 * The roster (launcher order) joined with the directory: one entry per id. Apps only in the directory come after the
 * roster, by id, with no link.
 */
export function mergeApps(roster: AppSearchRosterEntry[], directory: AppSearchDirectoryEntry[], callerId: string, siteUrl: string): { item: AppSearchItem; steps: string[] }[] {
	const dir = new Map(directory.map(d => [d.id, d]));
	const kindsOf = (d: AppSearchDirectoryEntry | undefined) => {
		if (d == null) return { kinds: [], writes: false };
		const grants = d.defaultGrants[callerId] ?? [];
		return {
			kinds: Object.entries(d.kinds).map(([kind, about]) => ({ kind, about, granted: grants.includes(kind) })),
			writes: actionKinds(d.spec).some(k => grants.includes(`${k}:do`)),
		};
	};
	const out: { item: AppSearchItem; steps: string[] }[] = [];
	for (const r of roster) {
		out.push({
			item: {
				id: r.id, name: r.name, summary: r.intro.summary, audience: r.intro.audience,
				category: r.category ?? null, tags: r.tags ?? [], url: appUrl(siteUrl, r.href), inLauncher: true,
				...kindsOf(dir.get(r.id)),
			},
			steps: r.intro.steps,
		});
	}
	const inRoster = new Set(roster.map(r => r.id));
	for (const d of [...directory].sort((a, b) => a.id.localeCompare(b.id))) {
		if (inRoster.has(d.id)) continue;
		out.push({ item: { id: d.id, name: d.name, summary: d.summary, audience: '', category: null, tags: [], url: null, inLauncher: false, ...kindsOf(d) }, steps: [] });
	}
	return out;
}

/**
 * What Vibi gets from listApps. Without words (or only filler words): every app, in order. With words: the apps that
 * match, best first; total 0 means there is none, and Vibi must say so instead of inventing one.
 */
export function searchApps(apps: { item: AppSearchItem; steps: string[] }[], opts: { query?: string | null; category?: string | null; limit?: number }) {
	const limit = opts.limit ?? APP_SEARCH_LIMIT;
	const query = opts.query?.trim() ? opts.query.trim() : null;
	const category = opts.category?.trim() ? opts.category.trim() : null;
	const categories = [...new Set(apps.map(a => a.item.category).filter((c): c is string => c != null))];
	let pool = apps.map((a, i) => ({ ...a, i, score: 0 }));
	if (category != null) {
		const c = category.normalize('NFKC').toLowerCase();
		pool = pool.filter(a => (a.item.category ?? '').normalize('NFKC').toLowerCase() === c);
	}
	const terms = query == null ? [] : searchTerms(query);
	if (terms.length > 0) {
		pool = pool.map(a => ({ ...a, score: appScore(a.item, a.steps, terms) })).filter(a => a.score >= APP_SEARCH_MIN_SCORE);
		pool.sort((a, b) => b.score - a.score || a.i - b.i);
	}
	return { query, category, terms, total: pool.length, categories, apps: pool.slice(0, limit).map(a => a.item) };
}
