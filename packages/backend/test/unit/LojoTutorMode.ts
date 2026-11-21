/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { modeCardText, modeNoticeText, normalizeModeCard, normalizeTutorMode, TUTOR_MODES } from '@/misc/lojo-tutor-mode.js';

describe('聊天模式（点 Momo 的名字选她怎么回）', () => {
	test('the four modes; anything else reads as normal', () => {
		expect(TUTOR_MODES).toEqual(['normal', 'roast', 'chinglish', 'subtext']);
		for (const m of TUTOR_MODES) expect(normalizeTutorMode(m)).toBe(m);
		for (const m of [null, undefined, '', 'ROAST', 'evil', 3, { mode: 'roast' }]) expect(normalizeTutorMode(m)).toBe('normal');
	});

	test('a card needs what it seems to say and what it means; the phrase is optional', () => {
		expect(normalizeModeCard({ phrase: ' break a leg ', front: '摔断\n一条腿', back: '祝你顺利' })).toEqual({ phrase: 'break a leg', front: '摔断 一条腿', back: '祝你顺利' });
		expect(normalizeModeCard({ front: 'I very like', back: 'I really like', phrase: 3 })).toEqual({ phrase: null, front: 'I very like', back: 'I really like' });
		expect(normalizeModeCard({ front: 'x'.repeat(200), back: 'y' })?.front).toHaveLength(80);
		for (const c of [null, 'card', [], { front: 'a' }, { back: 'b' }, { front: ' ', back: 'b' }]) expect(normalizeModeCard(c)).toBeNull();
	});

	test('the card message the chat page draws as a card', () => {
		expect(modeCardText('roast', { phrase: 'break a leg', front: '摔断一条腿', back: '祝你顺利' })).toBe('【对照卡·roast】break a leg\n摔断一条腿\n→ 祝你顺利');
		expect(modeCardText('chinglish', { phrase: null, front: 'I very like it', back: 'I really like it' })).toBe('【对照卡·chinglish】\nI very like it\n→ I really like it');
	});

	test('the grey line when the mode changes, in the learner\'s language', () => {
		expect(modeNoticeText('roast', 'zh')).toBe('【说话方式】已切到毒舌（roast）');
		expect(modeNoticeText('normal', 'zh')).toBe('【说话方式】已换回正常（normal）');
		expect(modeNoticeText('subtext', 'en')).toBe('【说话方式】Switched to British subtext（subtext）');
		expect(modeNoticeText('normal', 'en')).toBe('【说话方式】Back to Normal（normal）');
	});
});
