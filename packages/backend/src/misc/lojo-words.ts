/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 生词本 spaced review: a learner's words, each with two cards scheduled by FSRS (ts-fsrs):
//   - 认得 (recognize): see the word, recall the meaning, then say 忘了 or 记得;
//   - 拼写 (spell): hear it and see the meaning, type it; the client grades the spelling.
// Plain functions here, so the rules can be tested without a database (test/unit/LojoWords.ts).

import { createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import type { Card, Grade } from 'ts-fsrs';

export const WORD_KINDS = ['word', 'phrase', 'idiom', 'slang', 'grammar'] as const;
export type WordKind = typeof WORD_KINDS[number];
// Where a word came from: a post's explanation, a gate's mistakes, dictation, typed in by hand, or a vocabulary stop's
// list and practice (5 号线).
export const WORD_SOURCES = ['post', 'gate', 'dictation', 'manual', 'vocab'] as const;
export type WordSource = typeof WORD_SOURCES[number];
export const CARD_KINDS = ['recognize', 'spell'] as const;
export type CardKind = typeof CARD_KINDS[number];
export const CARD_STATES = ['new', 'learning', 'review', 'relearning'] as const;
export type CardStateName = typeof CARD_STATES[number];

// Founder, 2026-10-29: 10 new words a day, and each brings both of its cards.
export const NEW_WORDS_PER_DAY = 10;
export const MAX_WORDS = 2000;
// One fetch of today's queue; the client asks again when it runs out.
export const QUEUE_MAX = 100;
// Cards in their first minutes may come a little early when nothing else is left, as in Anki.
export const LEARN_AHEAD_MS = 20 * 60 * 1000;

// Desired retention 0.9 with short steps (docs/research/english-oss.md, 2026-10-26): a new card comes back after
// 1 and 10 minutes, a forgotten one after 10 minutes.
export const scheduler = fsrs({ request_retention: 0.9, learning_steps: ['1m', '10m'], relearning_steps: ['10m'], enable_fuzz: true });

// The FSRS state as stored in lojo_word_card's columns.
export type CardColumns = {
	due: Date;
	stability: number;
	difficulty: number;
	elapsedDays: number;
	scheduledDays: number;
	learningSteps: number;
	reps: number;
	lapses: number;
	state: number;
	lastReview: Date | null;
};

// One row of lojo_word_review: the card as it was before the review, the rating and when.
export type ReviewColumns = {
	rating: number;
	state: number;
	due: Date;
	stability: number;
	difficulty: number;
	elapsedDays: number;
	lastElapsedDays: number;
	scheduledDays: number;
	learningSteps: number;
	reviewedAt: Date;
};

// One spelling of a word per learner: case, width and spacing don't make a second word.
export function wordKey(text: string): string {
	return text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

// The key column holds 256 characters; NFKC can make a word longer (… becomes ...).
export const KEY_MAX = 256;
export const validKey = (key: string) => key !== '' && key.length <= KEY_MAX;

// ts-fsrs counts whole days by the UTC calendar. Dates go in shifted to the learner's wall clock and come back
// unshifted, so for a learner in China a review at 21:00 and the next at 07:30 the next morning are a day apart.
// tzOffset is the client's Date#getTimezoneOffset() (-480 in China); 0 leaves the dates as they are.
const toWall = (d: Date, tzOffset: number) => new Date(d.getTime() - tzOffset * 60_000);
const fromWall = (d: Date, tzOffset: number) => new Date(d.getTime() + tzOffset * 60_000);

function toFsrs(c: CardColumns, tzOffset: number): Card {
	return {
		due: toWall(c.due, tzOffset),
		stability: c.stability,
		difficulty: c.difficulty,
		elapsed_days: c.elapsedDays,
		scheduled_days: c.scheduledDays,
		learning_steps: c.learningSteps,
		reps: c.reps,
		lapses: c.lapses,
		state: c.state as State,
		last_review: c.lastReview ? toWall(c.lastReview, tzOffset) : undefined,
	};
}

function fromFsrs(c: Card, tzOffset: number): CardColumns {
	return {
		due: fromWall(c.due, tzOffset),
		stability: c.stability,
		difficulty: c.difficulty,
		elapsedDays: c.elapsed_days,
		scheduledDays: c.scheduled_days,
		learningSteps: c.learning_steps,
		reps: c.reps,
		lapses: c.lapses,
		state: c.state,
		lastReview: c.last_review ? fromWall(c.last_review, tzOffset) : null,
	};
}

export function newCard(now: Date): CardColumns {
	return fromFsrs(createEmptyCard(now), 0);
}

// A review can't come before the last one (two tabs, a clock that is off): ts-fsrs would refuse it.
const notBefore = (c: CardColumns, now: Date) => c.lastReview != null && now < c.lastReview ? c.lastReview : now;

export function stateName(state: number): CardStateName {
	return CARD_STATES[state] ?? 'new';
}

// When the card would come back after each answer, for the labels on the buttons ("10 分钟", "3 天").
export function preview(c: CardColumns, now: Date, tzOffset = 0): Record<'again' | 'hard' | 'good' | 'easy', Date> {
	const r = scheduler.repeat(toFsrs(c, tzOffset), toWall(notBefore(c, now), tzOffset));
	const due = (rating: Grade) => fromWall(r[rating].card.due, tzOffset);
	return { again: due(Rating.Again), hard: due(Rating.Hard), good: due(Rating.Good), easy: due(Rating.Easy) };
}

// rating: 1 忘了 (Again), 2 Hard, 3 记得 (Good), 4 Easy.
export function review(c: CardColumns, now: Date, rating: number, tzOffset = 0): { card: CardColumns; log: ReviewColumns } {
	if (!Number.isInteger(rating) || rating < Rating.Again || rating > Rating.Easy) throw new Error(`bad rating ${rating}`);
	const at = notBefore(c, now);
	const next = scheduler.next(toFsrs(c, tzOffset), toWall(at, tzOffset), rating as Grade);
	return {
		card: fromFsrs(next.card, tzOffset),
		log: {
			rating,
			state: c.state,
			due: c.due,
			stability: c.stability,
			difficulty: c.difficulty,
			elapsedDays: next.log.elapsed_days,
			lastElapsedDays: next.log.last_elapsed_days,
			scheduledDays: next.log.scheduled_days,
			learningSteps: c.learningSteps,
			reviewedAt: at,
		},
	};
}

/* ---------- the learner's day ---------- */

// tzOffset is the client's Date#getTimezoneOffset(): minutes behind UTC (-480 in China).
// A day runs midnight to midnight in the learner's time zone.
function local(at: Date, tzOffset: number): Date {
	return new Date(at.getTime() - tzOffset * 60_000);
}

export function dayOf(at: Date, tzOffset: number): string {
	return local(at, tzOffset).toISOString().slice(0, 10);
}

export function dayStart(now: Date, tzOffset: number): Date {
	const d = local(now, tzOffset);
	d.setUTCHours(0, 0, 0, 0);
	return new Date(d.getTime() + tzOffset * 60_000);
}

export function dayEnd(now: Date, tzOffset: number): Date {
	return new Date(dayStart(now, tzOffset).getTime() + 24 * 60 * 60 * 1000);
}

function dayBefore(day: string): string {
	const d = new Date(`${day}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

// 连续复习: days in a row with at least one review, counting back from today, or from yesterday while today has none.
export function streak(days: Iterable<string>, today: string): number {
	const set = new Set(days);
	let day = set.has(today) ? today : dayBefore(today);
	let n = 0;
	while (set.has(day)) {
		n++;
		day = dayBefore(day);
	}
	return n;
}

// Whether a card that has been seen is up for review now. Cards in their first minutes wait for their step (or come
// up to LEARN_AHEAD_MS early); cards in review are due all day on their date. New cards come from the daily allowance.
export function isDue(c: Pick<CardColumns, 'state' | 'due'>, now: Date, end: Date): boolean {
	if (c.state === State.New) return false;
	if (c.state === State.Review) return c.due.getTime() < end.getTime();
	return c.due.getTime() <= now.getTime() + LEARN_AHEAD_MS;
}

// How many new words today may still bring in.
export function newLeft(introducedToday: number): number {
	return Math.max(0, NEW_WORDS_PER_DAY - introducedToday);
}
