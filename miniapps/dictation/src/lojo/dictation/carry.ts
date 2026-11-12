/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// From a gate's result to 听写: the gaps missed there with a dictation tag (spelling, numbers, plural) go along, so the
// learner practises exactly those. The community's result page (lojo/dictation/carry.ts there) keeps them in this tab's
// sessionStorage under the attempt and links to /apps/dictation/?gate=<attemptId>&tag=<tag>; same site, same tab, so
// this mini app reads them here. Only the reading side is in the mini app.
import type { GateLimit, GateReason } from '@/lojo/gates/player.js';

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
