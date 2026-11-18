/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	applyMemoryUpdate,
	emptyMemory,
	LojoTutorInvalidResponse,
	normalizeMemoryUpdate,
	normalizeTutorCard,
	normalizeTutorReply,
	proactiveDecision,
	proactiveSentToday,
	tutorFixedPrompt,
	tutorPublic,
	tutorSystemPrompt,
	tutorContextMessage,
	asksToRememberOrForget,
} from '@/misc/lojo-tutor.js';
import type { ProactiveState } from '@/misc/lojo-tutor.js';
import { testPrompts } from '../misc/lojo-tutor-prompts.js';

const HOUR = 60 * 60 * 1000;
// 2026-10-25 15:00 in Beijing (UTC+8).
const afternoon = new Date('2026-10-25T07:00:00Z');
const opts = { tz: 'Asia/Shanghai', startHour: 9, endHour: 21 };
const fresh: ProactiveState = { muted: false, lastProactiveAt: null, lastCheckInAt: null, proactiveTimes: [], unanswered: 0, lastLearnerAt: null, lastTutorAt: null };

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
		expect(proactiveDecision({ ...fresh, lastCheckInAt: afternoon.getTime() - 3 * HOUR }, afternoon, opts).reason).toBe('already today');
		// A plan message earlier today does not use up the check-in; five messages of any kind do (founder 2026-11-15).
		const early = afternoon.getTime() - 5 * HOUR; // 10:00 Beijing, the same day
		expect(proactiveDecision({ ...fresh, lastProactiveAt: early, proactiveTimes: [early] }, afternoon, opts).ok).toBe(true);
		expect(proactiveDecision({ ...fresh, proactiveTimes: [1, 2, 3, 4, 5].map(i => early + i) }, afternoon, opts).reason).toBe('daily limit');
		expect(proactiveDecision({ ...fresh, proactiveTimes: [1, 2, 3, 4].map(i => early + i) }, afternoon, opts).ok).toBe(true);
		expect(proactiveDecision({ ...fresh, proactiveTimes: [1, 2, 3, 4, 5].map(i => early - 24 * HOUR + i) }, afternoon, opts).ok).toBe(true);
		expect(proactiveSentToday([early, early - 24 * HOUR], afternoon, 'Asia/Shanghai')).toBe(1);
		expect(proactiveDecision({ ...fresh, lastLearnerAt: afternoon.getTime() - HOUR }, afternoon, opts).reason).toBe('chatting recently');
		expect(proactiveDecision({ ...fresh, unanswered: 1, lastProactiveAt: afternoon.getTime() - 30 * HOUR }, afternoon, opts).reason).toBe('waiting for a reply');
		expect(proactiveDecision({ ...fresh, unanswered: 1, lastProactiveAt: afternoon.getTime() - 80 * HOUR }, afternoon, opts).ok).toBe(true);
		expect(proactiveDecision({ ...fresh, unanswered: 3, lastProactiveAt: afternoon.getTime() - 200 * HOUR }, afternoon, opts).reason).toBe('stopped after 3 unanswered');
	});

	test('puts the card and notes into her private words; what changes goes in the last message', () => {
		const card = normalizeTutorCard({ name: '  ', personality: 'Calm and precise.' }, testPrompts.card);
		expect(card.name).toBe(testPrompts.card.name);
		expect(card.description).toBe(testPrompts.card.description);
		expect(card.personality).toBe('Calm and precise.');
		// without her words there is no persona text in the code at all, only the voice
		expect(normalizeTutorCard(undefined)).toMatchObject({ name: '', description: '', extensions: { vibes: { voice: 'uk-brit' } } });
		const prompt = tutorSystemPrompt(testPrompts, card, { ...emptyMemory(), facts: [{ id: 'f1', text: 'Exam on 12 December.', updatedAt: '' }] }, {});
		// the default name from tutorPublic, the same for every learner (prompt cache)
		expect(prompt.startsWith(`SYSTEM ${tutorPublic.name}\nDESC\nCalm and precise.\nSCEN\n\nRULES\n\n\nFORMAT plain\n\nNOTES:\n`)).toBe(true);
		expect(prompt).toContain('- Exam on 12 December.');
		expect(tutorSystemPrompt(testPrompts, card, emptyMemory(), {}).endsWith('FORMAT plain\n\nNOTES:\nNOTES EMPTY')).toBe(true);
		expect(tutorSystemPrompt(testPrompts, card, emptyMemory(), { questKnowledge: 'QK' })).toContain('FORMAT quest "next"\n\nQK\n\nNOTES:\n');
		// the Mastra pilot gets the same start without the notes
		expect(prompt.startsWith(`${tutorFixedPrompt(testPrompts, card)}\n\nNOTES:`)).toBe(true);
		// a card text with {{…}} or $& in it goes in as it is
		const odd = normalizeTutorCard({ description: 'Uses {{format}} and $& as is' }, testPrompts.card);
		expect(tutorSystemPrompt(testPrompts, odd, emptyMemory(), {})).toContain('\nUses {{format}} and $& as is\n');
		// What changes from call to call goes after the chat, so the start of the prompt stays cached.
		expect(prompt).not.toContain('Sunday');
		// Every learner shares the same start: the names go in the last message (Momo, 2026-11-17).
		expect(tutorContextMessage(testPrompts, { now: 'x', learnerName: 'Lin' })).toBe('NOW x\nLEARNER Lin');
		expect(tutorContextMessage(testPrompts, { now: 'x', tutorName: 'Kiki' })).toBe('NOW x\nTUTOR NAME Kiki');
		expect(tutorContextMessage(testPrompts, { now: 'x' })).toBe('NOW x');
		// 界面语言第②批: what she writes first is in the learner's interface language, told last; no cue in the words, no line
		const cue = { ...testPrompts, uiLanguage: 'WRITE IN {{language}}' };
		expect(tutorContextMessage(cue, { now: 'x', uiLang: 'en' })).toBe('NOW x\n\nWRITE IN English');
		expect(tutorContextMessage(cue, { now: 'x', uiLang: 'zh' })).toBe('NOW x\n\nWRITE IN Chinese');
		expect(tutorContextMessage(cue, { now: 'x' })).toBe('NOW x');
		expect(tutorContextMessage(testPrompts, { now: 'x', uiLang: 'en' })).toBe('NOW x');
		expect(prompt).not.toContain('Kiki');
		const context = tutorContextMessage(testPrompts, {
			now: '2026-10-25 Sunday afternoon (Beijing time)', opener: { reason: 'DAILY', recentPosts: ['Vibes 编辑部: Quick fix: "We discussed the plan"'] },
		});
		expect(context).toBe('NOW 2026-10-25 Sunday afternoon (Beijing time)\n\nOPENER (DAILY)\nPOST Vibes 编辑部: Quick fix: "We discussed the plan"');
		expect(asksToRememberOrForget('Please remember that I study after work.')).toBe(true);
		expect(asksToRememberOrForget('帮我记住考试日期')).toBe(true);
		expect(asksToRememberOrForget('I can never remember phrasal verbs.')).toBe(false);
	});
});
