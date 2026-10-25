/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	applyMemoryUpdate,
	defaultTutorCard,
	emptyMemory,
	LojoTutorInvalidResponse,
	normalizeMemoryUpdate,
	normalizeTutorCard,
	normalizeTutorReply,
	proactiveDecision,
	tutorSystemPrompt,
} from '@/misc/lojo-tutor.js';
import type { ProactiveState } from '@/misc/lojo-tutor.js';

const HOUR = 60 * 60 * 1000;
// 2026-10-25 15:00 in Beijing (UTC+8).
const afternoon = new Date('2026-10-25T07:00:00Z');
const opts = { tz: 'Asia/Shanghai', startHour: 9, endHour: 21 };
const fresh: ProactiveState = { muted: false, lastProactiveAt: null, unanswered: 0, lastLearnerAt: null, lastTutorAt: null };

describe('Vibes AI tutor', () => {
	test('keeps one to three short chat messages and the voice flag', () => {
		const reply = normalizeTutorReply({ messages: [' Hi! ', '', 'How was the mock test?', 'Third', 'Fourth'], voice: true });
		expect(reply.messages).toEqual(['Hi!', 'How was the mock test?', 'Third']);
		expect(reply.voice).toBe(true);
		expect(normalizeTutorReply({ message: 'Just one' }).messages).toEqual(['Just one']);
		expect(() => normalizeTutorReply({ messages: [] })).toThrow(LojoTutorInvalidResponse);
	});

	test('adds, updates and deletes learner notes, and keeps the summary when none is given', () => {
		let n = 0;
		const newId = () => `f${++n}`;
		const now = new Date('2026-10-25T07:00:00Z');
		let memory = applyMemoryUpdate(emptyMemory(), normalizeMemoryUpdate({
			profile: { exam: 'IELTS Academic', examDate: '2026-12-12', interests: ['football', 'football', 'films'] },
			facts: [{ op: 'add', text: 'Wants to study in Manchester.' }, { op: 'add', text: 'Finds Writing Task 2 hard.' }],
			summary: 'Talked about the December exam.',
		}), now, newId);
		expect(memory.profile).toEqual({ exam: 'IELTS Academic', examDate: '2026-12-12', interests: ['football', 'films'] });
		expect(memory.facts.map(f => f.text)).toEqual(['Wants to study in Manchester.', 'Finds Writing Task 2 hard.']);

		memory = applyMemoryUpdate(memory, normalizeMemoryUpdate({
			profile: { targetScore: '7.0' },
			facts: [{ op: 'update', id: 'f1', text: 'Wants to study in London now.' }, { op: 'delete', id: 'f2' }, { op: 'add', text: 'wants to study in london now.' }],
		}), now, newId);
		expect(memory.profile.targetScore).toBe('7.0');
		expect(memory.profile.exam).toBe('IELTS Academic');
		expect(memory.facts.map(f => f.text)).toEqual(['Wants to study in London now.']);
		expect(memory.summary).toBe('Talked about the December exam.');
		expect(() => normalizeMemoryUpdate('nope')).toThrow(LojoTutorInvalidResponse);
	});

	test('writes first only in the day, once a day, and backs off when the learner does not answer', () => {
		expect(proactiveDecision(fresh, afternoon, opts)).toEqual({ ok: true, reason: 'ok' });
		expect(proactiveDecision(fresh, new Date('2026-10-25T15:00:00Z'), opts).reason).toBe('quiet hours'); // 23:00 Beijing
		expect(proactiveDecision({ ...fresh, muted: true }, afternoon, opts).reason).toBe('muted');
		expect(proactiveDecision({ ...fresh, lastProactiveAt: afternoon.getTime() - 3 * HOUR }, afternoon, opts).reason).toBe('already today');
		expect(proactiveDecision({ ...fresh, lastLearnerAt: afternoon.getTime() - HOUR }, afternoon, opts).reason).toBe('chatting recently');
		expect(proactiveDecision({ ...fresh, unanswered: 1, lastProactiveAt: afternoon.getTime() - 30 * HOUR }, afternoon, opts).reason).toBe('waiting for a reply');
		expect(proactiveDecision({ ...fresh, unanswered: 1, lastProactiveAt: afternoon.getTime() - 80 * HOUR }, afternoon, opts).ok).toBe(true);
		expect(proactiveDecision({ ...fresh, unanswered: 3, lastProactiveAt: afternoon.getTime() - 200 * HOUR }, afternoon, opts).reason).toBe('stopped after 3 unanswered');
	});

	test('falls back to the default persona and keeps the honesty rule in the prompt', () => {
		const card = normalizeTutorCard({ name: '  ', personality: 'Calm and precise.' });
		expect(card.name).toBe(defaultTutorCard.name);
		expect(card.personality).toBe('Calm and precise.');
		const prompt = tutorSystemPrompt(card, { ...emptyMemory(), facts: [{ id: 'f1', text: 'Exam on 12 December.', updatedAt: '' }] }, {
			learnerName: 'Lin', now: '2026-10-25 Sunday 15:00 (Beijing time)', opener: { reason: 'a friendly daily check-in', recentPosts: ['Vibes 编辑部: Quick fix: "We discussed the plan"'] },
		});
		expect(prompt).toContain('Never claim to be human');
		expect(prompt).toContain('- Exam on 12 December.');
		expect(prompt).toContain('Recent post: Vibes 编辑部');
		expect(prompt).toContain('"messages"');
	});
});
