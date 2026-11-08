/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 创作讲解: for people who turned on 生产者视角, the button under a post makes marketing plans from it (by the
// 形式卡, the formats Vibes took apart from viral posts), then writes the copy from the plan they pick and their own
// idea, then checks that copy once more against the post and the rules below. The 形式卡 are private: they come from
// the Vibes workspace through lojo/create/import (scripts/create-import.mjs) and are kept out of this source.
// Tried and tuned first in the Vibes workspace prototype (prototypes/creator-workbench, 2026-11-03).

export type LojoCreateForm = {
	name: string;
	medium: string;
	orientation: string;
	length: string;
	mechanism: string;
	status: string;
	evidence: string;
	one: string;
	how: string;
	why: string;
	examples: string;
};

// What lojo/create/import stores: the formats, and the accounts whose posts anyone may make plans from (besides their own).
export type LojoCreateConfig = { forms: LojoCreateForm[]; sources: string[]; importedAt: string };

export type LojoCreatePlan = {
	source: 'ours' | 'common';
	form: string;
	name: string;
	platform: string;
	medium: string;
	hook: string;
	title: string;
	beats: string[];
	why: string;
	fit: string;
	effort: string;
	risk: string;
};

export type LojoCreateCheck = { level: 'must' | 'warn'; text: string };

export type LojoCreateCopy = {
	titles: string[];
	cover: string;
	body: string;
	script: string;
	pin: string;
	ai: string;
	checks: LojoCreateCheck[];
};

export type LojoCreateInput = { idea: string; story: string; standard: string; tone: string };

// The post: its text, the author's name and when it was posted (ISO).
export type LojoCreateSource = { text: string; author: string; createdAt: string };

export type LojoCreateDraft = LojoCreateCopy & {
	id: string;
	noteId: string;
	noteBy: string;
	noteUser: string;
	noteText: string;
	plan: LojoCreatePlan;
	// The format's how-to, copied in so the brief for the creator's agent can carry it.
	formHow: string;
	input: LojoCreateInput;
	chosenTitle: string;
	fixed: string[];
	model: string;
	reviewed: boolean;
	createdAt: string;
	updatedAt: string;
};

export type LojoCreateMessage = { role: 'system' | 'user'; content: string };

export class LojoCreateInvalidResponse extends Error {}

export const CREATE_PLATFORMS = ['小红书', '抖音', '视频号', 'B站'];
export const CREATE_TONES = ['像朋友聊天', '干脆利落', '温柔耐心', '有点毒舌'];
export const CREATE_DEFAULT_SOURCES = ['vibes_editors'];

export const CREATE_RULES = `规矩（违反就是错）：
- 原始内容里的事实一个字不能改，也不能加新的事实：原因、数字、日期、人物、效果，原文没写的一律不写。拿不准的写「要核实」。生产者自己给的经历也算数：里面的数字、细节照原样用，不要改成模糊说法。
- 不编数字：百分比、倍数、人数，原文和生产者给的经历里都没有的不写，「90%的人」「大多数人」这种说法也不行。
- 不许承诺效果和收入：不许出现提分、保过、包过、速成、躺赚、月入、治愈、根治、减肥多少斤这类话（广告法第二十四条等）。
- 不许导流：不许出现网址、二维码、微信号、电话、邮箱、「私信我」「看主页」。原帖里的官方电话、邮箱也不放，写「联系方式见官网」（平台会把联系方式当成站外导流）。
- 健康、饮食、健身、心理类：只讲常识和研究，不下诊断，不说能治病。
- 结尾不要测验（考考你、选择题、填空），形式卡里有测验也不用；换成一个让人想在评论区说自己经历的问题。
- 不编造用户、评价和数据。生产者没给的经历不要编，用「[这里放你的经历]」占位。
- 不替别人说话：考官、老师、专家、名人怎么想、喜欢什么、讨厌什么，原文没写的不写，「考官最讨厌」「老师都说」也不行。
- 不编造名人、真人的经历和言论，也不写「某名人」「某博主」这种查不到的。形式卡里的名人只是别人用过的例子，不能套到这条内容上；要用名人钩子，写「[换成一位真实名人的公开言论，附出处]」，让生产者自己去找。
- 原始内容里有日期、截止时间的，对照今天的日期。已经过期的，不要写成还有效。`;

// Today in Beijing time, so the model can tell a passed deadline in the post.
export function todayBeijing(now = new Date()): string {
	return now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

const day = (iso: string) => iso.slice(0, 10);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);
const isObject = (v: unknown): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v);

// ---------- config (lojo/create/import) ----------

const FORM_FIELDS: [keyof LojoCreateForm, number][] = [
	['name', 80], ['medium', 20], ['orientation', 20], ['length', 40], ['mechanism', 400], ['status', 20], ['evidence', 40],
	['one', 600], ['how', 1600], ['why', 900], ['examples', 600],
];
const USERNAME = /^\w{1,20}$/;

export function createConfigProblems(raw: unknown): string[] {
	if (!isObject(raw)) return ['config is not an object'];
	const problems: string[] = [];
	if (!Array.isArray(raw.forms)) problems.push('forms is not a list');
	else {
		if (raw.forms.length > 60) problems.push(`${raw.forms.length} forms, at most 60`);
		raw.forms.forEach((f, i) => {
			if (!isObject(f) || typeof f.name !== 'string' || f.name.trim() === '') problems.push(`form ${i + 1} has no name`);
			else if (typeof f.how !== 'string' || f.how.trim() === '') problems.push(`form "${f.name}" has no 怎么做的`);
		});
	}
	if (!Array.isArray(raw.sources)) problems.push('sources is not a list');
	else for (const s of raw.sources) if (typeof s !== 'string' || !USERNAME.test(s)) problems.push(`source "${String(s)}" is not a local username`);
	return problems;
}

// A stored or imported config, cleaned; anything missing falls back to no formats and the editors' account.
export function toCreateConfig(raw: unknown): LojoCreateConfig {
	if (!isObject(raw)) return { forms: [], sources: CREATE_DEFAULT_SOURCES, importedAt: '' };
	const forms = (Array.isArray(raw.forms) ? raw.forms : []).filter(isObject).map((f) => {
		const out = {} as LojoCreateForm;
		for (const [k, max] of FORM_FIELDS) out[k] = str(f[k], max);
		return out;
	}).filter(f => f.name !== '').slice(0, 60);
	const sources = (Array.isArray(raw.sources) ? raw.sources : []).filter((s): s is string => typeof s === 'string' && USERNAME.test(s));
	return { forms, sources: sources.length > 0 ? sources : CREATE_DEFAULT_SOURCES, importedAt: str(raw.importedAt, 40) };
}

// The model may not copy a format's name exactly: an exact match first, then names that contain each other.
export function matchForm(forms: LojoCreateForm[], name: unknown): LojoCreateForm | null {
	const n = str(name, 200);
	if (!n) return null;
	return forms.find(f => f.name === n)
		?? forms.find(f => f.name.includes(n) || n.includes(f.name))
		?? forms.find(f => n.includes(f.name.slice(0, 6)))
		?? null;
}

// ---------- plans ----------

export function plansMessages(src: LojoCreateSource, forms: LojoCreateForm[], now = new Date()): LojoCreateMessage[] {
	const cards = forms.map(f => `【形式卡】${f.name}\n- 机制：${f.mechanism}\n- 形态：${f.medium} ${f.orientation} ${f.length}\n- 状态：${f.status}；证据强度：${f.evidence}\n- 一句话：${f.one}\n- 例子和数据：${f.examples}\n- 为什么有效：${f.why.slice(0, 400)}`).join('\n\n');
	return [
		{ role: 'system', content: `你是 Vibes College 的内容策划。Vibes 是一个"大学习"社区（英语、AI 技能、健康、健身、心理、饮食）。社区里的生产者拿时间线上的原始内容，加上自己的观点、故事和讲法，做成小红书、抖音上的帖子。你给生产者出营销方案。今天是 ${todayBeijing(now)}（北京时间）。\n\n${CREATE_RULES}` },
		{ role: 'user', content: `原始内容（社区时间线，作者 ${src.author}，${day(src.createdAt)} 发）：\n"""\n${src.text}\n"""\n\n我们拆过爆款、在用或在试的做法（形式卡）：\n${cards || '（还没有）'}\n\n给 4 个方案，按适合程度排。4 个方案要真的不一样：每个换一个切入点（比如反常识、一个具体场景、前后对比、清单），name、hook、title 都不能重复，也不能只改几个字。\n- 至少 2 个用上面的做法：source 写 "ours"，form 照抄形式卡的名字（一个字都不改）。这条内容套不上的做法就别硬套。\n- 最多 2 个是常见做法：source 写 "common"，form 写空字符串，why 里写明"常见做法，我们还没拆过爆款"。\n原始内容里有已经过期的日期、截止时间，每个方案的 risk 都要写明。\n每个方案的字段：source、form、name（方案名，14 字以内，说清这个方案从哪个角度讲）、platform（${CREATE_PLATFORMS.join('/')} 选一个）、medium（"图文 3:4" 或 "竖屏视频"）、hook（封面或前 3 秒那一句。要用名人，写「[真实名人的一句原话]」占位，不写「某名人」「名人也在用」）、title（20 字以内）、beats（3 到 6 步，每步一句）、why（为什么有效，一两句。引用形式卡时写它的名字和例子的数据：哪个号、多少赞藏；不要写编号。形式卡是「在试」「待试」、证据「没查」的，不能说「已验证」「一定火」）、fit（适合谁看）、effort（做一条要多久、要准备什么）、risk（合规或平台风险，没有写"无"）。\n只返回 JSON：{"plans":[...]}` },
	];
}

export function normalizePlans(data: unknown, forms: LojoCreateForm[]): LojoCreatePlan[] {
	const list = isObject(data) && Array.isArray(data.plans) ? data.plans : [];
	return list.slice(0, 5).filter(isObject).map((p): LojoCreatePlan => {
		const form = p.source === 'common' ? null : matchForm(forms, p.form || p.name);
		const platform = str(p.platform, 10);
		return {
			source: form ? 'ours' : 'common',
			form: form?.name ?? '',
			name: str(p.name, 40),
			platform: CREATE_PLATFORMS.includes(platform) ? platform : '小红书',
			medium: /视频/.test(str(p.medium, 20)) ? '竖屏视频' : '图文 3:4',
			hook: str(p.hook, 120),
			title: str(p.title, 60),
			beats: (Array.isArray(p.beats) ? p.beats : []).map(b => str(b, 200)).filter(b => b !== '').slice(0, 8),
			why: str(p.why, 400),
			fit: str(p.fit, 200),
			effort: str(p.effort, 200),
			risk: str(p.risk, 300),
		};
	}).filter(p => p.name !== '' && p.hook !== '');
}

// ---------- copy ----------

export function copyMessages(src: LojoCreateSource, plan: LojoCreatePlan, form: LojoCreateForm | null, input: LojoCreateInput, now = new Date()): LojoCreateMessage[] {
	const video = /视频/.test(plan.medium);
	return [
		{ role: 'system', content: `你是生产者的文案助手。照生产者自己的想法、故事、标准和口吻写，你只帮生产者把话说清楚、说好听。今天是 ${todayBeijing(now)}（北京时间）。\n\n${CREATE_RULES}` },
		{ role: 'user', content: `原始内容（${day(src.createdAt)} 发）：\n"""\n${src.text}\n"""\n\n选的方案：${JSON.stringify(plan)}\n${form ? `\n做法（形式卡）：${form.name}\n- 机制：${form.mechanism}\n- 怎么做的：${form.how.slice(0, 1200)}\n` : ''}\n生产者说：\n- 想怎么讲：${input.idea}\n- 自己的故事或经历：${input.story || '（没给，不要编，用占位）'}\n- 标准（要什么、不要什么）：${input.standard || '（没给）'}\n- 口吻：${input.tone || CREATE_TONES[0]}\n\n写：\n- titles：3 个标题，每个 20 字以内\n- cover：封面上的一句大字（12 字以内）\n- body：正文。小红书风格，短段落，口吻照上面；最后一行放 3 到 5 个话题标签\n- ${video ? 'script：口播稿，按时间分段，每段开头写 [0-3秒] 这样的时间' : 'script：每一页的大字，每页一行，开头写 [第1页] 这样的页码，6 到 9 页'}\n- pin：置顶评论，一句，引人说自己的经历\n- ai：AI 声明的建议（文字由 AI 辅助写的，就写"发布时打开平台的 AI 内容声明"）\n- checks：合规检查。逐条列出可能有问题的句子：{"level":"要改"或"提醒","text":"哪句、为什么"}。用了已经过期的日期、放了联系方式、承诺效果、编了经历，都是"要改"。没有就空数组\n只返回 JSON：{"titles":[],"cover":"","body":"","script":"","pin":"","ai":"","checks":[]}` },
	];
}

// Once more: against the post and the rules, fix what breaks them. The list of fixes comes first in the answer: written
// last, it named changes the fields never got (3 times on 2026-11-04). The first pass often adds a reason the post never
// gave, writes a passed deadline as still open, copies phone numbers, or ends with a quiz (all seen on 2026-11-03).
export function reviewMessages(src: LojoCreateSource, first: LojoCreateCopy, input: LojoCreateInput, video: boolean, numbers: string[] = [], people: string[] = [], now = new Date()): LojoCreateMessage[] {
	const draft = { ...first, checks: first.checks.map(c => ({ level: c.level === 'must' ? '要改' : '提醒', text: c.text })) };
	return [
		{ role: 'system', content: `你是严格的审稿编辑。今天是 ${todayBeijing(now)}（北京时间）。对照原始内容和规矩逐句检查文案，违反的地方直接改掉，其余一个字不动，口吻不变。\n\n${CREATE_RULES}` },
		{ role: 'user', content: `原始内容（${day(src.createdAt)} 发）：\n"""\n${src.text}\n"""\n\n生产者自己给的（照着用，不算编造，不要删）：\n- 想怎么讲：${input.idea}\n- 自己的故事或经历：${input.story || '（没给）'}\n\n文案：\n${JSON.stringify(draft)}\n\n逐句查，标题、封面、正文、${video ? '口播稿' : '每页大字'}、置顶评论都要查：\n1. 原始内容和生产者给的经历里都没有的事实（原因、数字、日期、人物、效果）：删掉，或改回原文的说法。「90%的人」「大多数人」这种比例、人数也算；「考官最讨厌」「老师都说」这种替别人说的话也算。${numbers.length > 0 ? `这几个数原文里没有，一定要删掉：${numbers.join('、')}。` : ''}\n2. 已经过期的日期、截止时间：不能写成还有效，改成「已经截止」这类说法，或者删掉。\n3. 电话、邮箱、网址、微信号：删掉，写「联系方式见官网」。\n4. 承诺效果、收入；编造的经历（生产者没给的，用「[这里放你的经历]」；生产者给了的，照着写）；编造的名人言论：改掉。${people.length > 0 ? `这几处的人查不到是谁，一定要删掉，或者换成「[换成一位真实名人的公开言论，附出处]」：${people.join('、')}。` : ''}\n5. 结尾的测验（考考你、选择题、填空）：改成让人在评论区说自己经历的问题。\n6. 生产者定的标准：${input.standard || '（没给）'}。没做到的照着改（比如字数超了就删短）。\n先定要改哪几处，再照着改。返回 JSON，fixed 放在最前面：{"fixed":[],"titles":[],"cover":"","body":"","script":"","pin":"","ai":"","checks":[]}。fixed 每条一句（改了哪一块、改了什么、为什么）；没要改的就是空数组 []，不要写「无需修改」。后面的字段写改好以后的全文：fixed 里说改了的，这里一定要真的改掉；没提到的一个字不动。checks 只留改完以后还剩的问题。` },
	];
}

// The model's copy, cleaned into the fixed fields; missing ones are left out so the earlier pass fills them.
export function copyFields(d: unknown): Partial<LojoCreateCopy> {
	const o = isObject(d) ? d : {};
	const out: Partial<LojoCreateCopy> = {};
	const titles = (Array.isArray(o.titles) ? o.titles : []).map(t => str(t, 60)).filter(t => t !== '').slice(0, 3);
	if (titles.length > 0) out.titles = titles;
	if (typeof o.cover === 'string') out.cover = str(o.cover, 60);
	if (typeof o.body === 'string') out.body = str(o.body, 4000);
	if (typeof o.script === 'string') out.script = str(o.script, 4000);
	if (typeof o.pin === 'string') out.pin = str(o.pin, 300);
	if (typeof o.ai === 'string') out.ai = str(o.ai, 120);
	if (Array.isArray(o.checks)) {
		out.checks = o.checks.map((c): LojoCreateCheck => {
			const r: Record<string, unknown> = isObject(c) ? c : { text: c };
			return { level: r.level === '要改' || r.level === 'must' ? 'must' : 'warn', text: str(r.text ?? r.reason, 300) };
		}).filter(c => c.text !== '').slice(0, 12);
	}
	return out;
}

// What the second pass changed. The model also lists things it left alone: "无需修改", "…，保留。", or 「A」改为「A」
// (nine of those in one answer on 2026-11-04). Only real changes are kept.
const NOT_A_FIX = /无需|不需要|未发现|没发现|符合要求|没有问题|无问题|未出现|不作修改|不做修改|保留[。.]?$/;
const REPLACED = /「([^」]*)」\s*(?:改为|改成|换成)\s*「([^」]*)」/;

export function fixedList(d: unknown): string[] {
	const o = isObject(d) ? d : {};
	const unchanged = (f: string) => {
		const m = f.match(REPLACED);
		return m != null && m[1] === m[2];
	};
	return (Array.isArray(o.fixed) ? o.fixed : [])
		.map(f => str(isObject(f) ? f.text : f, 300))
		.filter(f => f !== '' && !NOT_A_FIX.test(f) && !unchanged(f))
		.slice(0, 12);
}

// Numbers the model made up most often: percentages, multiples and head counts ("90%的人", "3 倍", "10 万人") that
// the post does not have. Found ones are named to the second pass, and what is left is marked 要改.
const NUMBER_CLAIM = /(\d+(?:\.\d+)?)\s*(%|％|倍|(?:万|千)?(?:多)?人)|百分之[一二三四五六七八九十百]+|[一二三四五六七八九]成/g;

// Backed by the post: the same words, or the same number with the same unit in English ("90%", "90 percent", "3 times").
function inSource(claim: string, num: string | undefined, unit: string | undefined, source: string): boolean {
	const s = source.toLowerCase();
	// The claim has its spaces taken out (「30 人」 → 「30人」), so the source is compared without them too.
	if (s.replace(/\s+/g, '').includes(claim.toLowerCase())) return true;
	if (num == null || unit == null) return false;
	const n = num.replace('.', '\\.');
	if (unit === '%' || unit === '％') return new RegExp(`(^|[^\\d.])${n}\\s*(%|％|percent|per cent)`).test(s);
	if (unit === '倍') return new RegExp(`(^|[^\\d.])${n}\\s*(x|times)\\b`).test(s);
	if (unit === '人' || unit === '多人') return new RegExp(`(^|[^\\d.])${n}\\s*(people|students|candidates|learners|persons)`).test(s);
	return false;
}

export function unsupportedNumbers(text: string, source: string): string[] {
	const found = new Set<string>();
	for (const m of text.matchAll(NUMBER_CLAIM)) {
		const claim = m[0].replace(/\s+/g, '');
		if (!inSource(claim, m[1], m[2], source)) found.add(claim);
	}
	return [...found].slice(0, 6);
}

// People nobody can look up, the other thing the model makes up: 「某名人公开说过」「名人也在用的技巧」 (in 3 of 4 posts'
// plans on 2026-11-04, though the rules forbid it), and advice from the post given to someone else (「考官说」). 老师 is
// left out of the last kind: 「我老师说」 is a common way to tell one's own story. A [placeholder] for the creator to fill is fine, and so is what the
// post itself says. Each is named with the words around it, so the creator can find it.
const UNNAMED_PERSON = /某[一位个些]*(?:名人|明星|博主|大佬|网红|专家|教授|老师|学霸|考官|大V)|名人(?:也在用|都在用|也|都|说|曾|公开|用|推荐|亲测)|(?:明星|博主|大佬|网红|专家|教授|学霸|考官)(?:说|表示|建议|透露|曾说|亲口说|公开说)/g;
const CLAUSE_END = /[，。！？；：,.!?;:\n「」“”"]/;

function clauseAround(text: string, start: number, end: number): string {
	let a = start;
	while (a > 0 && !CLAUSE_END.test(text[a - 1]) && start - a < 20) a--;
	let b = end;
	while (b < text.length && !CLAUSE_END.test(text[b]) && b - end < 20) b++;
	return text.slice(a, b).trim();
}

export function unnamedPeople(text: string, source: string): string[] {
	const outside = text.replace(/\[[^\]]*\]|【[^】]*】/g, '');
	const found = new Set<string>();
	for (const m of outside.matchAll(UNNAMED_PERSON)) {
		if (!source.includes(m[0])) found.add(clauseAround(outside, m.index, m.index + m[0].length));
	}
	return [...found].slice(0, 6);
}

export const copyText = (c: LojoCreateCopy) => [...c.titles, c.cover, c.body, c.script, c.pin].join('\n');
export const planText = (p: LojoCreatePlan) => [p.name, p.hook, p.title, ...p.beats].join('\n');

// What the second pass said it changed, checked against what changed: a claim about a field that came back the same
// ("改了置顶评论" with the same 置顶评论, seen 2026-11-04) is not shown as fixed, but as something to look at.
const FIELD_WORDS: [keyof LojoCreateCopy, RegExp][] = [
	['titles', /标题/], ['cover', /封面/], ['pin', /置顶评论|置顶/], ['script', /口播稿|每页|每一页|大字|分镜/], ['body', /正文/],
];

// A claim that quotes words the field never had (the same fix listed again under 标题 and 口播稿, seen 2026-11-04) is
// dropped: there was nothing there to fix.
export function verifyFixed(first: LojoCreateCopy, final: LojoCreateCopy, fixed: string[]): { fixed: string[]; unconfirmed: string[] } {
	const changed = (k: keyof LojoCreateCopy) => JSON.stringify(first[k]) !== JSON.stringify(final[k]);
	const anyChanged = FIELD_WORDS.some(([k]) => changed(k));
	const text = (k: keyof LojoCreateCopy) => {
		const v = first[k];
		return Array.isArray(v) ? v.map(x => (typeof x === 'string' ? x : x.text)).join('\n') : v;
	};
	const out = { fixed: [] as string[], unconfirmed: [] as string[] };
	for (const item of fixed) {
		const fields = FIELD_WORDS.filter(([, re]) => re.test(item)).map(([k]) => k);
		if (fields.length === 0) {
			(anyChanged ? out.fixed : out.unconfirmed).push(item);
			continue;
		}
		if (fields.some(changed)) {
			out.fixed.push(item);
			continue;
		}
		const quoted = [...item.matchAll(/「([^」]+)」/g)].map(m => m[1]);
		if (quoted.length === 0 || fields.some(k => quoted.some(q => text(k).includes(q)))) out.unconfirmed.push(item);
	}
	return out;
}
