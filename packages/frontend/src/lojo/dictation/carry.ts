/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// From a gate's result to 听写: the gaps missed there with a dictation tag (spelling, numbers, plural) go along, so the
// learner practises exactly those. The result page keeps them in this tab's sessionStorage under the attempt and
// links to /apps/dictation/?gate=<attemptId>&tag=<tag> (the dictation mini app, same origin and tab, so it reads them
// there); a reload of either page finds them again.
import type { GateAttempt, GateLimit, GateReason, GateResult } from '@/lojo/gates/player.js';

export const DICTATION_PATH = '/apps/dictation/';
// The tags whose PRACTICE app (courses/english/ielts/content.js) is dictation.
export const DICTATION_TAGS: readonly string[] = ['spelling', 'numbers', 'plural'];

export type CarriedGap = {
	// `${part}-${n}`: the part of a placement test (0 for a gate), then the question number
	id: string;
	// the question's dictation tags
	tags: string[];
	// the accepted forms, the expected one first
	answer: string[];
	given: string;
	reason: GateReason | null;
	ignoreSpaces: boolean;
	limit: GateLimit | null;
	instructions: { en: string; zh: string } | null;
	// its line on the paper, with {} for the gap
	line: string | null;
	// what the recording said there (the answer itself for a reading question)
	say: string;
};

export type Carry = {
	v: 1;
	attemptId: string;
	course: string;
	// the station to try again on the map; null after a placement test
	station: string | null;
	// "听力 4.5"
	where: string;
	gaps: CarriedGap[];
	// rounds practised from here (in this tab)
	runs: number;
};

const GAP = /\((\d+)\)\s*_{3,}/g;
const CELL = ' | ';

// The paper's line with question n's gap as {} and any other gap as a blank; a table row reads "Monday · Yoga · {}".
export function gapLine(lines: string[], n: number): string | null {
	const line = lines.find(l => [...l.matchAll(GAP)].some(m => Number(m[1]) === n));
	if (line == null) return null;
	return line.split(CELL).map(cell => cell.trim()).join(' · ')
		.replace(GAP, (_, k: string) => (Number(k) === n ? '{}' : '___'));
}

// Phones and postcodes: the gates mark them with ignoreSpaces, which the result doesn't send, so it is told by shape.
const PHONE = /^\+?\d[\d ]{5,}$/;
const POSTCODE = /^[a-z]{1,2}\d[a-z\d]? ?\d[a-z]{2}$/i;
export const looksSpaceless = (answer: string): boolean => PHONE.test(answer.trim()) || POSTCODE.test(answer.trim());

const DIGIT_WORDS = ['oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const sayChars = (s: string) => Array.from(s.replace(/\s/g, '')).map(c => (/\d/.test(c) ? DIGIT_WORDS[Number(c)] : c.toUpperCase())).join(', ');

// What to read when there is no recording line (a reading question): the answer, a phone or postcode a character at a
// time, as a recording would.
export function spokenForm(answer: string): string {
	const a = answer.trim();
	if (PHONE.test(a)) return `${a.split(/\s+/).map(part => Array.from(part).map(c => DIGIT_WORDS[Number(c)] ?? c).join(' ')).join(', ')}.`;
	if (POSTCODE.test(a)) return `${sayChars(a)}.`;
	return /[.?!]$/.test(a) ? a : `${a}.`;
}

type Part = { result: GateResult; attempt: GateAttempt };

// The missed gaps with a dictation tag, from the parts of a placement test or the one paper of a gate.
export function carryFromResult(parts: Part[], where: string, station: string | null): Carry | null {
	const last = parts.at(-1);
	if (last == null) return null;
	const gaps: CarriedGap[] = [];
	parts.forEach(({ result, attempt }, p) => {
		for (const item of result.items) {
			const tags = item.tags.filter(t => DICTATION_TAGS.includes(t));
			if (item.correct || tags.length === 0) continue;
			const group = attempt.groups.find(g => g.items.some(it => it.n.includes(item.n)));
			if (group == null || group.type !== 'form') continue;
			const asked = group.items.find(it => it.n.includes(item.n));
			const answer = [...new Set([item.expected, ...item.accepted])].filter(a => a.trim() !== '');
			if (answer.length === 0) continue;
			const said = result.script.flatMap(l => (l.text != null && l.answers.includes(item.n) ? [l.text.trim()] : [])).join(' ');
			gaps.push({
				id: `${p}-${item.n}`,
				tags,
				answer,
				given: item.given,
				reason: item.reason ?? null,
				ignoreSpaces: answer.every(looksSpaceless),
				limit: asked?.limit ?? group.limit ?? null,
				instructions: group.instructions,
				line: gapLine(group.lines, item.n),
				say: said !== '' ? said : spokenForm(answer[0]),
			});
		}
	});
	if (gaps.length === 0) return null;
	return { v: 1, attemptId: last.result.attemptId, course: last.result.course, station, where, gaps, runs: 0 };
}

export const carryPath = (attemptId: string, tag: string): string =>
	`${DICTATION_PATH}?gate=${encodeURIComponent(attemptId)}&tag=${encodeURIComponent(tag)}`;

const storeKey = (attemptId: string) => `vibes:dictation:gate:${attemptId}`;

function storage(): Storage | null {
	try {
		return window.sessionStorage;
	} catch {
		return null;
	}
}

const isGap = (v: unknown): v is CarriedGap => {
	const g = v as Partial<CarriedGap> | null;
	return g != null && typeof g.id === 'string' && Array.isArray(g.tags) && Array.isArray(g.answer) && g.answer.length > 0
		&& g.answer.every(a => typeof a === 'string') && typeof g.given === 'string' && typeof g.say === 'string';
};

export function loadCarry(attemptId: string): Carry | null {
	try {
		const raw = storage()?.getItem(storeKey(attemptId));
		const c = raw ? JSON.parse(raw) as Partial<Carry> : null;
		if (c?.v !== 1 || c.attemptId !== attemptId || !Array.isArray(c.gaps) || !c.gaps.every(isGap)) return null;
		return { ...c as Carry, runs: typeof c.runs === 'number' ? c.runs : 0 };
	} catch {
		return null;
	}
}

// Seeing the result again keeps the count of rounds already practised from it.
export function saveCarry(carry: Carry): void {
	const runs = loadCarry(carry.attemptId)?.runs ?? carry.runs;
	try {
		storage()?.setItem(storeKey(carry.attemptId), JSON.stringify({ ...carry, runs }));
	} catch {
		// Storage full or off: the link still opens dictation, only without these gaps.
	}
}

export function countRun(attemptId: string): number {
	const c = loadCarry(attemptId);
	if (c == null) return 0;
	c.runs++;
	try {
		storage()?.setItem(storeKey(attemptId), JSON.stringify(c));
	} catch {
		// not kept; nothing else depends on it
	}
	return c.runs;
}
