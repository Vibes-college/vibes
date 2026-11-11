/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { defaultTutorCard, emptyMemory, normalizeTutorReply, tutorSystemPrompt } from '@/misc/lojo-tutor.js';
import { normalizeQuestKnowledge, normalizeQuestTry, pickQuestKnowledge, questChapterNo, questAwayMessage, questKnowledgeSection, questNextLine, questPromptSection, questTrySection } from '@/misc/lojo-tutor-quest.js';

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
	causes: { 'same-word': { zh: '找一模一样的词', technique: 'Think of two other ways to say it.', tipZh: '先想两种别的说法，再去原文找意思。', guide: 'j5' }, vocab: { zh: '不认识', technique: 'Wordbook.' } },
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
		const prompt = tutorSystemPrompt(defaultTutorCard, emptyMemory(), { learnerName: 'Lin', questKnowledge: questKnowledgeSection(normalizeQuestKnowledge(knowledge)!) });
		expect(prompt).toContain('"next"');
		expect(prompt).toContain('QUEST MODE. Test rules.');
		expect(prompt).not.toContain('"picked":"TRUE"');
		expect(questTrySection(normalizeQuestKnowledge(knowledge)!, normalizeQuestTry(sampleTry)!)).toContain('"picked":"TRUE"');
		const plain = tutorSystemPrompt(defaultTutorCard, emptyMemory(), { learnerName: 'Lin' });
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

	test('away message: cause, first technique sentence, next step by the hearts rules, no answers', () => {
		const k = normalizeQuestKnowledge(knowledge)!;
		const t = normalizeQuestTry(sampleTry)!;
		const full = questAwayMessage(k, t);
		expect(full.messages).toHaveLength(1);
		expect(full.messages[0]).toMatch(/^Mia 这会儿不在线/);
		expect(full.messages[0]).not.toMatch(/FALSE|402|余额|出错/);
		expect(full.next).toBe('retry');
		expect(full.messages[0]).toContain('先想两种别的说法');
		expect(full.messages[0]).not.toContain('Think of');
		const noTip = normalizeQuestKnowledge({ ...knowledge, causes: { 'same-word': { zh: '找一模一样的词', technique: 'Think.' } } })!;
		expect(questAwayMessage(noTip, t).messages[0].split('\n')).toHaveLength(2);
		const low = { ...t, hearts: { ...t.hearts, now: 1 } };
		expect(questAwayMessage(k, low).next).toBe('guide:j5');
		const used = { ...low, hearts: { ...low.hearts, refilledToday: { guide: true, gear: true } } };
		expect(questAwayMessage(k, used).messages[0]).toContain('20:00 回满');
		expect(questAwayMessage(null, low).messages[0].split('\n')).toHaveLength(2);
	});

	describe('reads the knowledge of the try\'s chapter (按章读知识-需求.md)', () => {
		const ch1 = { ...knowledge, version: 'ch1-2-test' };
		const ch3 = { ...knowledge, version: 'ch3-test' };
		const tryAt = (id: string, chapterNo?: number) => normalizeQuestTry({ ...sampleTry, level: { ...sampleTry.level, id }, ...(chapterNo != null ? { chapterNo } : {}) })!;
		const store = (items: Record<string, unknown>) => async (key: string) => items[key];
		const pick = async (t: ReturnType<typeof tryAt>, items: Record<string, unknown>) => (await pickQuestKnowledge(t, store(items)));

		test('chapterNo 3 with quest-ch3 reads quest-ch3', async () => {
			expect(await pick(tryAt('3-4', 3), { quest: ch1, 'quest-ch3': ch3 })).toMatchObject({ key: 'quest-ch3', fellBackFrom: null, knowledge: { version: 'ch3-test' } });
		});
		test('chapterNo 3 without quest-ch3 falls back to quest', async () => {
			expect(await pick(tryAt('3-4', 3), { quest: ch1 })).toMatchObject({ key: 'quest', fellBackFrom: 'quest-ch3' });
		});
		test('chapterNo 3 with empty rules in quest-ch3 falls back to quest', async () => {
			expect(await pick(tryAt('3-4', 3), { quest: ch1, 'quest-ch3': { ...ch3, rules: '' } })).toMatchObject({ key: 'quest', fellBackFrom: 'quest-ch3' });
		});
		test('the Boss of chapter 3 reads quest-ch3 by chapterNo', async () => {
			expect(await pick(tryAt('boss', 3), { quest: ch1, 'quest-ch3': ch3 })).toMatchObject({ key: 'quest-ch3' });
		});
		test('without chapterNo, a 3-4 level id means chapter 3', async () => {
			expect(questChapterNo(tryAt('3-4'))).toBe(3);
			expect(await pick(tryAt('3-4'), { quest: ch1, 'quest-ch3': ch3 })).toMatchObject({ key: 'quest-ch3' });
		});
		test('without chapterNo, the Boss reads quest', async () => {
			expect(await pick(tryAt('boss'), { quest: ch1, 'quest-ch3': ch3 })).toMatchObject({ key: 'quest', fellBackFrom: null });
		});
		test('chapter 2 reads quest (there is no quest-ch2)', async () => {
			expect(await pick(tryAt('2-1', 2), { quest: ch1, 'quest-ch3': ch3 })).toMatchObject({ key: 'quest', fellBackFrom: 'quest-ch2' });
		});
		test('chapter 1 without quest has no knowledge (off)', async () => {
			expect(await pick(tryAt('1-4', 1), { 'quest-ch3': ch3 })).toBeNull();
		});
		test('chapterNo that is not a whole number is dropped', () => {
			expect(normalizeQuestTry({ ...sampleTry, chapterNo: '3' })!.chapterNo).toBeUndefined();
			expect(normalizeQuestTry({ ...sampleTry, chapterNo: 2.5 })!.chapterNo).toBeUndefined();
			expect(normalizeQuestTry({ ...sampleTry, chapterNo: 3 })!.chapterNo).toBe(3);
		});
	});
});
