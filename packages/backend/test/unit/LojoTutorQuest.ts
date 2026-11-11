/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { defaultTutorCard, emptyMemory, normalizeTutorReply, tutorSystemPrompt } from '@/misc/lojo-tutor.js';
import { normalizeQuestKnowledge, normalizeQuestTry, questNextLine, questPromptSection } from '@/misc/lojo-tutor-quest.js';

// Sample data (示例), shaped like 闯关上线/Mia接入.md section 2.
const sampleTry = {
	v: 1,
	attemptId: 'a1b2c3',
	at: '2026-11-10T13:18:00Z',
	chapter: '第一章 · 打底',
	level: { id: '1-6', name: '阅读 · 判断题', kind: 'level', skill: 'reading', type: 'TFNG' },
	result: { correct: 3, total: 5, needed: 4, passed: false, failStreak: 1 },
	wrong: [
		{ n: 5, question: 'Sales rose sharply after 2010.', evidence: 'Before 2010, sales rose sharply.', picked: 'TRUE', answer: 'FALSE', cause: 'same-word', why: 'The text says before 2010.' },
	],
	cause: 'same-word',
	hearts: { now: 3, max: 5, nextRefill: '20:00', refilledToday: { guide: false, gear: false } },
	streak: { days: 6, doneToday: false, freezeCards: 1 },
	boss: null,
	next: [
		{ id: 'guide:j5', label: '锦囊 5 · 一字不差的多半不是答案', url: '/guides/j5', recommended: true, readToday: false },
		{ id: 'retry', label: '再打 1-6（换新题）', url: '/quest/1-6' },
		{ id: 'evil', label: 'bad link', url: 'javascript:alert(1)' },
	],
};
const knowledge = {
	version: 'ch1-test',
	rules: 'QUEST MODE. Test rules.',
	causes: { 'same-word': { zh: '找一模一样的词', technique: 'Think of two other ways to say it.', guide: 'j5' }, vocab: { zh: '不认识', technique: 'Wordbook.' } },
};

describe('Vibes AI tutor in the quest map', () => {
	test('keeps a valid try and drops links that are not web pages', () => {
		const t = normalizeQuestTry(sampleTry)!;
		expect(t.level.id).toBe('1-6');
		expect(t.wrong[0].picked).toBe('TRUE');
		expect(t.wrong[0].why).toBe('The text says before 2010.');
		expect(t.next.map(n => n.id)).toEqual(['guide:j5', 'retry']);
		expect(normalizeQuestTry({ level: {} })).toBeNull();
		expect(normalizeQuestKnowledge({ version: 'x' })).toBeNull();
	});

	test('the prompt has the rules, this cause only, ids without URLs', () => {
		const section = questPromptSection(normalizeQuestKnowledge(knowledge)!, normalizeQuestTry(sampleTry)!);
		expect(section).toContain('QUEST MODE. Test rules.');
		expect(section).toContain('same-word: 找一模一样的词. Technique: Think of two other ways');
		expect(section).not.toContain('Wordbook.');
		expect(section).toContain('- guide:j5: 锦囊 5 · 一字不差的多半不是答案 (recommended)');
		expect(section).toContain('"picked":"TRUE"');
		expect(section).not.toContain('/guides/j5');
		const prompt = tutorSystemPrompt(defaultTutorCard, emptyMemory(), { learnerName: 'Lin', now: 'now', quest: section });
		expect(prompt).toContain('"next"');
		const plain = tutorSystemPrompt(defaultTutorCard, emptyMemory(), { learnerName: 'Lin', now: 'now' });
		expect(plain).not.toContain('QUEST MODE');
		expect(plain).not.toContain('"next"');
		expect(section).not.toContain('Do not repeat the hearts');
		const followUp = questPromptSection(normalizeQuestKnowledge(knowledge)!, normalizeQuestTry(sampleTry)!, true);
		expect(followUp).toContain('Do not repeat the hearts');
	});

	test('the app writes the link for the chosen step; unknown steps are dropped', () => {
		const t = normalizeQuestTry(sampleTry)!;
		const reply = normalizeTutorReply({ messages: ['a', 'b'], voice: false, next: 'retry' });
		expect(reply.next).toBe('retry');
		expect(questNextLine(t, reply.next, 'https://lan.example/')).toBe('👉 再打 1-6（换新题） https://lan.example/quest/1-6');
		expect(questNextLine(t, 'evil', 'https://lan.example')).toBeNull();
		expect(questNextLine(t, undefined, 'https://lan.example')).toBeNull();
		expect(normalizeTutorReply({ messages: ['a'] }).next).toBeUndefined();
	});
});
