/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Pure helpers for the 生词本 review (pages/lojo/wordbook*.vue): when a card comes back, how a spelling compares
// letter by letter, and how a spelling attempt is graded. No Vue and no API, so the unit tests run them as they are.

export type ReviewLang = 'zh' | 'en';
// 1 忘了 (again), 2 hard, 3 记得 (good). The page never sends 4 (easy).
export type ReviewRating = 1 | 2 | 3;
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/* ---------- when a card comes back ---------- */

const UNITS = {
	zh: {
		min: (n: number) => `${n} 分钟`,
		hour: (n: number) => `${n} 小时`,
		day: (n: number) => `${n} 天`,
		month: (n: string) => `${n} 个月`,
		year: (n: string) => `${n} 年`,
	},
	en: {
		min: (n: number) => `${n} min`,
		hour: (n: number) => `${n} h`,
		day: (n: number) => (n === 1 ? '1 day' : `${n} days`),
		month: (n: string) => `${n} mo`,
		year: (n: string) => `${n} yr`,
	},
} as const;

// at most one decimal: 1.5 个月, 2 年
function oneDecimal(x: number): string {
	return String(Math.round(x * 10) / 10);
}

// How long until a card comes back, for the answer buttons: "1 分钟", "10 分钟", "3 天". As in Anki: minutes and
// hours while a card is being learned, then days, months and years.
export function intervalText(ms: number, lang: ReviewLang): string {
	const u = UNITS[lang];
	const minutes = Math.max(1, Math.round(ms / MIN));
	if (minutes < 60) return u.min(minutes);
	const hours = Math.round(ms / HOUR);
	if (hours < 24) return u.hour(hours);
	const days = Math.max(1, Math.round(ms / DAY));
	if (days < 30) return u.day(days);
	if (days < 365) return u.month(oneDecimal(days / 30));
	return u.year(oneDecimal(days / 365));
}

// The answer a rating stands for, in the `next` dates the server sends with each card.
export function nextKey(rating: ReviewRating): 'again' | 'hard' | 'good' {
	return rating === 1 ? 'again' : rating === 2 ? 'hard' : 'good';
}

// The button label for a rating: the server's date for that answer, measured from when the queue was fetched (the
// server worked the dates out then).
export function ratingInterval(next: Record<'again' | 'hard' | 'good', string>, rating: ReviewRating, fetchedAt: number, lang: ReviewLang): string {
	return intervalText(Date.parse(next[nextKey(rating)]) - fetchedAt, lang);
}

export type DueTone = 'new' | 'due' | 'soon' | 'later';

const DUE = {
	zh: { new: '新词', now: '现在', overdue: '该复习了', today: '今天', tomorrow: '明天', after: (s: string) => `${s}后` },
	en: { new: 'New', now: 'Now', overdue: 'Due', today: 'Today', tomorrow: 'Tomorrow', after: (s: string) => `in ${s}` },
} as const;

// the calendar day a moment falls on, in the learner's own time zone
function dayNumber(t: number): number {
	const d = new Date(t);
	return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}

// When a card is next up, for the word list: 新词 / 10 分钟后 / 明天 / 3 天后. A card being learned counts in
// minutes; a card in review is up all day on its date, so it counts in calendar days.
export function dueText(card: { state: CardState; due: string }, now: number, lang: ReviewLang): { text: string; tone: DueTone } {
	const t = DUE[lang];
	if (card.state === 'new') return { text: t.new, tone: 'new' };
	const due = Date.parse(card.due);
	const ms = due - now;
	if (card.state !== 'review' && ms < DAY) {
		if (ms <= 0) return { text: t.now, tone: 'due' };
		return { text: t.after(intervalText(ms, lang)), tone: 'soon' };
	}
	const days = dayNumber(due) - dayNumber(now);
	if (days < 0) return { text: t.overdue, tone: 'due' };
	if (days === 0) return { text: t.today, tone: 'due' };
	if (days === 1) return { text: t.tomorrow, tone: 'later' };
	return { text: t.after(intervalText(days * DAY, lang)), tone: 'later' };
}

const WEEK_ZH = '日一二三四五六';
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The date on top of 今日: 10 月 30 日 周五 / Fri, Oct 30.
export function dateText(d: Date, lang: ReviewLang): string {
	if (lang === 'zh') return `${d.getMonth() + 1} 月 ${d.getDate()} 日 周${WEEK_ZH[d.getDay()]}`;
	return `${WEEK_EN[d.getDay()]}, ${MONTH_EN[d.getMonth()]} ${d.getDate()}`;
}

// Time a card was on screen, within what the server takes (0 to an hour).
export function durationMs(shownAt: number, now: number): number {
	return Math.min(60 * MIN, Math.max(0, Math.round(now - shownAt)));
}

/* ---------- spelling ---------- */

// What counts as the same spelling: any case, a run of spaces as one, curly or straight apostrophes, any dash, accents
// left off (cafe for café), full-width letters from a Chinese keyboard as plain ones.
function fold(s: string, keepCase: boolean): string {
	const plain = s.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.replace(/[‘’ʼ`´′]/g, '\'')
		.replace(/[‐‑‒–—―−]/g, '-')
		.replace(/\s+/g, ' ');
	return keepCase ? plain : plain.toLowerCase();
}

export function foldSpelling(s: string): string {
	return fold(s, false);
}

// what has been typed, as compared: leading spaces dropped, trailing ones kept (the next word may follow)
function typedFold(typed: string): string {
	return foldSpelling(typed).replace(/^ /, '');
}

function answerFold(answer: string): string {
	return foldSpelling(answer).trim();
}

export function spellingMatches(typed: string, answer: string): boolean {
	return typedFold(typed).trim() === answerFold(answer);
}

// Typed as many letters as the answer has (spaces at the end not counted): the card checks itself.
export function spellingFilled(typed: string, answer: string): boolean {
	const t = typedFold(typed).trim();
	return t.length > 0 && t.length >= answerFold(answer).length;
}

export type LetterState = 'ok' | 'bad' | 'extra' | 'empty';
export type LetterCell = { ch: string; state: LetterState; space: boolean };
export type LetterMarks = {
	cells: LetterCell[];
	// the first wrong cell, or -1 while everything typed is right
	firstWrong: number;
	typed: number;
	length: number;
};

// The answer letter by letter against what has been typed: ok (right), bad (wrong), extra (past the end) or empty
// (not typed yet). The spaces of a phrase are cells too, so the boxes show the gaps between words.
export function letterMarks(typed: string, answer: string): LetterMarks {
	const t = typedFold(typed);
	const a = answerFold(answer);
	const kept = fold(answer, true).trim();
	const shown = kept.length === a.length ? kept : a;
	const cells: LetterCell[] = [];
	let firstWrong = -1;
	for (let i = 0; i < Math.max(a.length, t.length); i++) {
		const want = i < a.length ? a[i] : null;
		const got = i < t.length ? t[i] : null;
		if (got == null) {
			cells.push({ ch: '', state: 'empty', space: want === ' ' });
		} else if (got === want) {
			cells.push({ ch: shown[i], state: 'ok', space: want === ' ' });
		} else {
			cells.push({ ch: got, state: want == null ? 'extra' : 'bad', space: want === ' ' || got === ' ' });
			if (firstWrong < 0) firstWrong = i;
		}
	}
	return { cells, firstWrong, typed: t.length, length: a.length };
}

// "第 4 个字母": a cell's place among the answer's letters, not counting the spaces between words.
export function letterNumber(answer: string, index: number): number {
	return answerFold(answer).slice(0, index).replace(/ /g, '').length + 1;
}

export function letterCount(answer: string): { letters: number; words: number } {
	const a = answerFold(answer);
	return { letters: a.replace(/ /g, '').length, words: a === '' ? 0 : a.split(' ').length };
}

// Whether the letters just typed (past what was there before) went wrong. A slip, fixed later, makes a right answer
// count as 2 instead of 3.
export function slipped(before: string, after: string, answer: string): boolean {
	const from = typedFold(before).length;
	const marks = letterMarks(after, answer);
	for (let i = from; i < marks.typed; i++) {
		const s = marks.cells[i].state;
		if (s === 'bad' || s === 'extra') return true;
	}
	return false;
}

export type SpellAttempt = { right: boolean; slips: number; gaveUp: boolean };

// 拼写 grading: right the first time 3 (记得); right after fixing a slip 2; wrong or gave up 1 (忘了).
export function spellRating(a: SpellAttempt): ReviewRating {
	if (a.gaveUp || !a.right) return 1;
	return a.slips > 0 ? 2 : 3;
}

// "我会，只是手误" after a wrong answer
export const TYPO_RATING: ReviewRating = 2;

/* ---------- the example sentence ---------- */

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The expression inside its example, to mark it: any case, any spacing between its words, either apostrophe.
export function highlightParts(sentence: string, expression: string): { text: string; hit: boolean }[] {
	const words = expression.trim().split(/\s+/).filter(w => w !== '');
	if (words.length === 0) return [{ text: sentence, hit: false }];
	const re = new RegExp(words.map(w => escapeRe(w).replace(/['’ʼ]/g, '[\'’ʼ]')).join('\\s+'), 'i');
	const m = re.exec(sentence);
	if (m == null) return [{ text: sentence, hit: false }];
	return [
		{ text: sentence.slice(0, m.index), hit: false },
		{ text: m[0], hit: true },
		{ text: sentence.slice(m.index + m[0].length), hit: false },
	].filter(p => p.text !== '');
}
