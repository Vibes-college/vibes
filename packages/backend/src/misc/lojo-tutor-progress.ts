/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Mia's two lookups that do not go through the model:
// - the progress card: where a learner is on the quest map, the route map and in the wordbook, read from the database
//   on every reply and sent in the last message of the prompt (so the cached start stays the same);
// - the chat search: older messages of this learner with Mia that match words of what they just wrote, with Postgres
//   full-text search for English words and plain substring matching for Chinese (no extension needed; see
//   searchTerms).
// Both are also served to the Mastra pilot as tools (endpoint lojo/tutor/pilot-tool).

export type QuestProgressFacts = {
	chapter: { no: number; title: string };
	passed: number;
	total: number;
	bossBeaten: boolean;
	next: string | null;
	hearts: number;
	maxHearts: number;
	streakDays: number;
	lastFail: { level: string; cause: string | null; inARow: number; at: string | null } | null;
	updatedAt: string;
};

export type QuestMistakes = {
	level: string;
	tries: { at: string; passed: boolean; wrong: { question: string; cause: string | null }[] }[];
};

export type WordbookFacts = { words: number; dueToday: number; reviewedToday: number; updatedAt: string | null };

export type ProgressFacts = {
	quest: QuestProgressFacts | null;
	// LojoGateService.profileText: one line per route-map line
	gates: string | null;
	wordbook: WordbookFacts | null;
};

// About 600 tokens at most (mixed Chinese and English runs about 2-3 characters a token).
const CARD_MAX_CHARS = 1400;
const LINES_PER_PART = 3;
const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : 'unknown');

export function progressCardText(p: ProgressFacts): string {
	const parts: string[] = [];
	if (p.quest) {
		const q = p.quest;
		const lines = [
			`${q.chapter.title} (chapter ${q.chapter.no}): ${q.passed} of ${q.total} levels passed${q.bossBeaten ? ', Boss beaten' : ''}${q.next ? `; next level: ${q.next}` : ''}.`,
			`Hearts ${q.hearts}/${q.maxHearts}; streak ${q.streakDays} day(s).`,
		];
		if (q.lastFail) lines.push(`Last failed: ${q.lastFail.level}${q.lastFail.cause ? `, mostly ${q.lastFail.cause}` : ''}${q.lastFail.inARow > 1 ? `, ${q.lastFail.inARow} times in a row` : ''} (${day(q.lastFail.at)}).`);
		parts.push(section(`Quest map (updated ${day(q.updatedAt)})`, lines));
	} else {
		parts.push('Quest map: not started yet.');
	}
	if (p.gates) parts.push(section('Route map gates (practice levels, not official scores)', p.gates.split('\n')));
	else parts.push('Route map gates: none taken yet.');
	if (p.wordbook && p.wordbook.words > 0) {
		const w = p.wordbook;
		parts.push(section(`Wordbook (updated ${day(w.updatedAt)})`, [`${w.words} words saved; ${w.dueToday} due for review today; ${w.reviewedToday} reviewed today.`]));
	} else {
		parts.push('Wordbook: no words saved yet.');
	}
	const text = parts.join('\n');
	return text.length > CARD_MAX_CHARS ? text.slice(0, CARD_MAX_CHARS - 1) + '…' : text;
}

function section(title: string, lines: string[]): string {
	return [`${title}:`, ...lines.filter(l => l.trim() !== '').slice(0, LINES_PER_PART).map(l => `- ${l.slice(0, 300)}`)].join('\n');
}

// Shown before the card in the last message; the system prompt (and its cache) stays as it is.
export const PROGRESS_CARD_INTRO = 'Their progress on Vibes, read from the app just now (more reliable than the chat or your notes; if they ask where they are, answer from this, in your own words, and never say you cannot see it):';

/* ---------- chat search ---------- */

const STOP_EN = new Set('the a an and or but is are was were be been am do does did have has had i you me my your we our it its this that these those to of in on at for with from as by about what which who when where why how can could would should will just not no yes ok okay please thanks thank hi hello mia so if then than there here they them their he she his her do don dont really very too also more most some any one all get got like know think want need'.split(' '));
const STOP_ZH = new Set(['你还', '还记', '记得', '得我', '我上', '上次', '次跟', '跟你', '你说', '说我', '我之', '之前', '前说', '说的', '的是', '是哪', '哪个', '什么', '怎么', '一下', '我们', '你们', '他们', '这个', '那个', '吗？', '我在', '我的', '你的', '一个', '没有', '不是', '就是', '可以', '现在', '今天', '还有', '有几']);

// English words of three letters or more (Postgres to_tsvector('simple') matches them as words) and the two-character
// pieces of every run of Chinese characters (Postgres has no Chinese word splitter without an extension such as
// zhparser or pg_jieba, so Chinese is matched as substrings). At most 12 terms, the rarer-looking first.
export function searchTerms(text: string): { en: string[]; zh: string[] } {
	const en = [...new Set((text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []).map(w => w.replace(/'s$/, '')).filter(w => !STOP_EN.has(w)))].slice(0, 8);
	const zh: string[] = [];
	for (const run of text.match(/[一-鿿]+/g) ?? []) {
		for (let i = 0; i + 2 <= run.length; i++) {
			const pair = run.slice(i, i + 2);
			if (!STOP_ZH.has(pair) && !zh.includes(pair)) zh.push(pair);
		}
	}
	return { en, zh: zh.slice(0, 12 - Math.min(en.length, 6)) };
}

export type ChatHit = { id: string; at: string; who: 'learner' | 'tutor'; text: string; score: number };

// A message's score: the terms it contains (an English word counts 2, a Chinese pair 1).
export function hitScore(text: string, terms: { en: string[]; zh: string[] }): number {
	const lower = text.toLowerCase();
	let score = 0;
	for (const w of terms.en) if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)) score += 2;
	for (const z of terms.zh) if (text.includes(z)) score += 1;
	return score;
}

export const RECALL_MIN_SCORE = 2;

export function recallText(hits: ChatHit[]): string | null {
	if (hits.length === 0) return null;
	return [
		'Older messages in this chat that may be relevant (found by keyword just now; older than the chat above):',
		...hits.map(h => `- ${h.at.slice(0, 10)} ${h.who === 'learner' ? 'they said' : 'you said'}: ${h.text.replace(/\s+/g, ' ').slice(0, 200)}`),
		'Use them only if they answer what they are asking; they may be out of date, and anything they asked you to forget stays forgotten.',
	].join('\n');
}
