/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 小程序名册接管入口 (2026-11-17): the 小程序 launcher in the side bar used to read a list written into the frontend
// (lojo/miniapps/manifest.ts), so adding, hiding or rewording a mini app meant a rebuild. The list is now content kind
// `apps`, imported by an admin (apps/community/scripts/apps-import.mjs, the file lives outside the open-source code)
// and read by the launcher through lojo/content/pack. Order in the file is the order in the launcher; `visible: false`
// takes an entry out of the launcher within seconds without deleting it.
// This file is also loaded by the import script with Node's type stripping, so: no imports, no enums.

export const APPS_ROSTER_KIND = 'apps';

export const APPS_ROSTER_RULES = {
	maxApps: 64,
	maxBytes: 64 * 1024,
	maxVersion: 256,
	maxName: 20,
	maxText: 400,
	maxList: 12,
	/** a category or one tag (第 6 步: what Vibi searches when a learner asks for an app) */
	maxTag: 20,
} as const;

/** server: its own container at /apps/<id>/; static: files served at /apps/<id>/…; external: another site */
export const APPS_ROSTER_TYPES = ['server', 'static', 'external'] as const;

export type AppsRosterEntry = {
	id: string;
	name: string;
	icon: string;
	href: string;
	type: typeof APPS_ROSTER_TYPES[number];
	visible: boolean;
	/** ids this entry had before, so people who already saw the intro under the old id do not see it again */
	formerIds?: string[];
	/** one word for the shelf it sits on (听力, 单词…); Vibi can narrow a search to it */
	category?: string;
	/** words a learner might use for it, in Chinese and English (听写, dictation…); searched with the name and the intro */
	tags?: string[];
	intro: { summary: string; audience: string; steps: string[]; caveats: string[] };
	/** 界面语言第②批 (2026-11-18): the name and intro for learners whose interface is not Chinese. Each field is optional;
	 * the launcher falls back to the Chinese one, never to nothing. What is inside the app is content and not translated. */
	en?: { name?: string; intro?: Partial<AppsRosterEntry['intro']> };
};

const ID = /^[a-z][a-z0-9-]{1,30}$/;
const ICON = /^ti ti-[a-z0-9-]+$/;
const ENTRY_KEYS = ['id', 'name', 'icon', 'href', 'type', 'visible', 'formerIds', 'category', 'tags', 'intro', 'en'];
const INTRO_KEYS = ['summary', 'audience', 'steps', 'caveats'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v != null && !Array.isArray(v);
const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim() !== '' && v.length <= max;
const texts = (v: unknown, min: number): boolean => Array.isArray(v) && v.length >= min && v.length <= APPS_ROSTER_RULES.maxList && v.every(s => isStr(s, APPS_ROSTER_RULES.maxText));

function hrefProblem(type: unknown, href: unknown): string | null {
	if (typeof href !== 'string' || href.length > 512) return '要有 href（打开的地址）';
	if (type === 'external') {
		try {
			return new URL(href).protocol === 'https:' ? null : 'external 的 href 要是 https:// 开头的完整地址';
		} catch {
			return 'external 的 href 要是 https:// 开头的完整地址';
		}
	}
	return /^\/apps\/[a-z0-9-]+\/\S*$/.test(href) ? null : 'server、static 的 href 要是 /apps/<名字>/ 开头';
}

function entryProblems(v: unknown, where: string): string[] {
	if (!isObj(v)) return [`${where}: 不是一条小程序`];
	const out: string[] = [];
	const extra = Object.keys(v).filter(k => !ENTRY_KEYS.includes(k));
	if (extra.length > 0) out.push(`${where}: 不认识的字段 ${extra.join('、')}（拼错了？）`);
	if (!isStr(v.name, APPS_ROSTER_RULES.maxName)) out.push(`${where}: 要有 name（最多 ${APPS_ROSTER_RULES.maxName} 字）`);
	if (typeof v.icon !== 'string' || !ICON.test(v.icon)) out.push(`${where}: icon 要像 ti ti-camera 这样（Tabler 图标名）`);
	if (!(APPS_ROSTER_TYPES as readonly unknown[]).includes(v.type)) out.push(`${where}: type 要是 ${APPS_ROSTER_TYPES.join('、')} 之一`);
	const href = hrefProblem(v.type, v.href);
	if (href != null) out.push(`${where}: ${href}`);
	if (typeof v.visible !== 'boolean') out.push(`${where}: visible 要写 true 或 false`);
	if (v.formerIds != null && (!Array.isArray(v.formerIds) || !v.formerIds.every(f => typeof f === 'string' && ID.test(f)))) {
		out.push(`${where}: formerIds 要是旧 id 的列表`);
	}
	if (v.category != null && !isStr(v.category, APPS_ROSTER_RULES.maxTag)) out.push(`${where}: category（分类）要是一个词，最多 ${APPS_ROSTER_RULES.maxTag} 字`);
	if (v.tags != null && !(Array.isArray(v.tags) && v.tags.length <= APPS_ROSTER_RULES.maxList && v.tags.every(t => isStr(t, APPS_ROSTER_RULES.maxTag)))) {
		out.push(`${where}: tags（学员可能怎么叫它）要是词的列表，最多 ${APPS_ROSTER_RULES.maxList} 个、每个最多 ${APPS_ROSTER_RULES.maxTag} 字`);
	}
	out.push(...enProblems(v.en, where));
	const intro = v.intro;
	if (!isObj(intro)) {
		out.push(`${where}: 要有 intro（第一次打开时的介绍）`);
		return out;
	}
	const introExtra = Object.keys(intro).filter(k => !INTRO_KEYS.includes(k));
	if (introExtra.length > 0) out.push(`${where}: intro 里不认识的字段 ${introExtra.join('、')}`);
	if (!isStr(intro.summary, APPS_ROSTER_RULES.maxText)) out.push(`${where}: intro.summary（是什么）不能空`);
	if (!isStr(intro.audience, APPS_ROSTER_RULES.maxText)) out.push(`${where}: intro.audience（给谁用）不能空`);
	if (!texts(intro.steps, 1)) out.push(`${where}: intro.steps（怎么用）要有 1 到 ${APPS_ROSTER_RULES.maxList} 步`);
	if (!texts(intro.caveats, 0)) out.push(`${where}: intro.caveats（注意什么）要是列表，没有就写 []`);
	return out;
}

// The English name and intro: every field may be left out (then the Chinese one is shown), but what is there must be right.
function enProblems(en: unknown, where: string): string[] {
	if (en == null) return [];
	if (!isObj(en)) return [`${where}: en（英文名和英文介绍）要是 { name, intro }`];
	const out: string[] = [];
	const extra = Object.keys(en).filter(k => k !== 'name' && k !== 'intro');
	if (extra.length > 0) out.push(`${where}: en 里不认识的字段 ${extra.join('、')}`);
	if (en.name != null && !isStr(en.name, APPS_ROSTER_RULES.maxName)) out.push(`${where}: en.name（英文名）最多 ${APPS_ROSTER_RULES.maxName} 个字母，不能空`);
	if (en.intro == null) return out;
	if (!isObj(en.intro)) return [...out, `${where}: en.intro 要是 { summary, audience, steps, caveats }`];
	const intro = en.intro;
	const introExtra = Object.keys(intro).filter(k => !INTRO_KEYS.includes(k));
	if (introExtra.length > 0) out.push(`${where}: en.intro 里不认识的字段 ${introExtra.join('、')}`);
	if (intro.summary != null && !isStr(intro.summary, APPS_ROSTER_RULES.maxText)) out.push(`${where}: en.intro.summary 不能空，最多 ${APPS_ROSTER_RULES.maxText} 字`);
	if (intro.audience != null && !isStr(intro.audience, APPS_ROSTER_RULES.maxText)) out.push(`${where}: en.intro.audience 不能空，最多 ${APPS_ROSTER_RULES.maxText} 字`);
	if (intro.steps != null && !texts(intro.steps, 1)) out.push(`${where}: en.intro.steps 要有 1 到 ${APPS_ROSTER_RULES.maxList} 步`);
	if (intro.caveats != null && !texts(intro.caveats, 0)) out.push(`${where}: en.intro.caveats 要是列表`);
	return out;
}

/** What is wrong with a roster file (empty = fine), in plain words for the import script. */
export function appsRosterProblems(data: unknown): string[] {
	if (!isObj(data) || !isObj(data.pack) || !Array.isArray(data.pack.apps)) return ['不是小程序名册（要 { version, source, pack: { apps: [...] } }）'];
	const out: string[] = [];
	if (!isStr(data.version, APPS_ROSTER_RULES.maxVersion)) out.push('缺 version');
	const bytes = Buffer.byteLength(JSON.stringify(data.pack));
	if (bytes > APPS_ROSTER_RULES.maxBytes) out.push(`名册太大：${Math.round(bytes / 1024)} KB（最多 ${APPS_ROSTER_RULES.maxBytes / 1024} KB）`);
	const extra = Object.keys(data.pack).filter(k => k !== 'apps');
	if (extra.length > 0) out.push(`pack 里不认识的字段 ${extra.join('、')}`);
	const apps: unknown[] = data.pack.apps;
	if (apps.length === 0) out.push('名册里一个小程序都没有');
	if (apps.length > APPS_ROSTER_RULES.maxApps) out.push(`小程序太多：${apps.length} 个（最多 ${APPS_ROSTER_RULES.maxApps} 个）`);
	const ids = new Map<string, string>();
	apps.forEach((v, i) => {
		const id = isObj(v) && typeof v.id === 'string' ? v.id : '';
		const where = id !== '' ? `第 ${i + 1} 个（${id}）` : `第 ${i + 1} 个`;
		if (!ID.test(id)) out.push(`${where}: id 要是小写字母开头、只有小写字母数字和 -，2 到 31 个字`);
		out.push(...entryProblems(v, where));
		const own = [id, ...(isObj(v) && Array.isArray(v.formerIds) ? v.formerIds.filter((f): f is string => typeof f === 'string') : [])];
		for (const one of own) {
			if (one === '') continue;
			const before = ids.get(one);
			if (before != null) out.push(`${where}: id ${one} 和${before}重复`);
			else ids.set(one, where);
		}
	});
	return out;
}

/** What the launcher may read: the entries that are on, in the order of the file. */
export function appsRosterPublic(data: unknown): { apps: AppsRosterEntry[] } {
	const apps = (data as { pack: { apps: AppsRosterEntry[] } }).pack.apps;
	return { apps: apps.filter(a => a.visible) };
}
