/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The 闯关 page's small helpers (assets/lojo/quest/quest-kit.js, a plain browser script moved out of quest.js on
// 2026-11-16). The script is loaded as the page loads it, with a window to put QuestKit on.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, test } from 'vitest';

const dir = fileURLToPath(new URL('../../assets/lojo/quest/', import.meta.url));
const read = (f: string) => readFileSync(dir + f, 'utf-8');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...args: any[]) => any;
const win: { QuestKit?: Record<string, Fn> } = {};
(vm.runInThisContext(`(function (window) {${read('quest-kit.js')}\n})`, { filename: 'quest-kit.js' }) as (w: typeof win) => void)(win);
const K = win.QuestKit!;

describe('how the page loads it', () => {
	test('index.html loads quest-kit.js before quest.js', () => {
		const scripts = [...read('index.html').matchAll(/<script src="\.\/([^"?]+)/g)].map(m => m[1]);
		expect(scripts.indexOf('quest-kit.js')).toBeGreaterThanOrEqual(0);
		expect(scripts.indexOf('quest-kit.js')).toBeLessThan(scripts.indexOf('quest.js'));
	});

	test('every name quest.js takes from QuestKit is there', () => {
		const taken = /const \{([^}]+)\} = window\.QuestKit;/.exec(read('quest.js'))![1].split(',').map(s => s.trim()).filter(s => s !== '');
		expect(taken.length).toBeGreaterThan(20);
		for (const name of taken) expect(typeof K[name], name).toBe('function');
	});
});

describe('small tools', () => {
	test('esc and md', () => {
		expect(K.esc('<a href="x">\'&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&lt;/a&gt;');
		expect(K.esc(null)).toBe('');
		expect(K.esc(0)).toBe('0');
		expect(K.md('**hi** <b>')).toBe('<b>hi</b> &lt;b&gt;');
		expect(K.nl('a<b>\nc')).toBe('a&lt;b&gt;<br>c');
	});

	test('errText: the server\'s codes in words, anything else is the network', () => {
		expect(K.errText({ code: 'NO_HEARTS' })).toBe('心打光了');
		expect(K.errText({ code: 'TRIAL_SAVE' })).toBe('存档后解锁');
		expect(K.errText({ code: 'PLACEMENT_TOO_SOON' })).toBe('30 天里能测一次');
		expect(K.errText({ code: 'RATE_LIMIT_EXCEEDED' })).toBe('点得太快了，歇一下再来');
		expect(K.errText({ code: 'HTTP_500' })).toBe('网卡了一下，再试一次');
		expect(K.errText(null)).toBe('网卡了一下，再试一次');
	});

	test('leftText: hours, minutes, seconds', () => {
		expect(K.leftText(0)).toBe('00:00:00');
		expect(K.leftText(3723000)).toBe('01:02:03');
		expect(K.leftText(1499)).toBe('00:00:01');
		expect(K.leftText(-5000)).toBe('00:00:00');
	});

	test('heartSVG: full and empty colors', () => {
		expect(K.heartSVG(true)).toContain('fill="#E8603F"');
		expect(K.heartSVG(false)).toContain('fill="#E9E1D2"');
	});

	test('chapter names: the word before 「 · 」 and what follows', () => {
		expect(K.chWord({ title: '专项关 · 听读' })).toBe('专项关');
		expect(K.chSub({ title: '专项关 · 听读' })).toBe('听读');
		expect(K.chSub({ title: '基础关' })).toBe('');
		expect(K.chWord({ title: 3 })).toBe('3');
	});

	test('newsSnippet: no opening line, tags or More/Source lines; 80 characters', () => {
		expect(K.newsSnippet('Stop 1-4 · Listening drills. Real text here #ielts\nMore: https://x')).toBe('Real text here');
		expect(K.newsSnippet('Chapter 1 boss · The gate. Go  now\nSources: a')).toBe('Go now');
		expect(K.newsSnippet('a'.repeat(100))).toBe('a'.repeat(80) + '…');
		expect(K.newsSnippet(null)).toBe('');
	});
});

describe('questions and results', () => {
	test('isPick and limitText', () => {
		expect(['choice', 'TFNG', 'YNNG', 'multi', 'gap', 'build'].map(t => K.isPick(t))).toEqual([true, true, true, true, false, false]);
		expect(K.limitText(null)).toBe('');
		expect(K.limitText({ words: 2, number: true })).toBe('不超过 2 个词，和/或一个数字');
		expect(K.limitText({ words: 3 })).toBe('不超过 3 个词');
		expect(K.limitText({ number: true })).toBe('填一个数字');
		expect(K.limitText({})).toBe('');
	});

	test('reviewHtml: wrong first, more than 2 wrong folds the rest', () => {
		const html = K.reviewHtml({ review: [
			{ n: 1, correct: true, answer: 'A' },
			{ n: 2, correct: false, answer: 'B', given: 'C', why: 'because', evidence: 'line 3' },
			{ n: 3, correct: false, half: true, answer: 'D', given: '' },
			{ n: 4, correct: false, timeout: true, answer: '<E>' },
		] });
		expect([...html.matchAll(/第 (\d) 题/g)].map(m => m[1])).toEqual(['2', '3', '4', '1']);
		expect(html.match(/data-more style="display:none"/g)).toHaveLength(2);
		expect(html).toContain('<button class="more" data-more-btn>还有 2 题 · 展开</button>');
		expect(html).toContain('<i>✓</i><span>第 1 题：A。</span>');
		expect(html).toContain('你填 C，答案 <b>B</b>。because<span class="evid" style="display:block">line 3</span>');
		expect(html).toContain('<div class="half"><i>½</i><span>第 3 题：对一半，你填 （空），答案 <b>D</b>。');
		expect(html).toContain('<div data-more style="display:none" class="no"><i>✕</i><span>第 4 题：没答（时间到），答案 <b>&lt;E&gt;</b>');
		const two = K.reviewHtml({ review: [{ n: 1, correct: false, answer: 'A', given: 'B' }, { n: 2, correct: true, answer: 'C', evidence: 'hidden' }] });
		expect(two).not.toContain('data-more');
		expect(two).not.toContain('hidden');
	});
});

describe('timed levels', () => {
	test('tmFmt rounds up, tmUsed splits the seconds, tplFill fills {names}', () => {
		expect([0, 59.2, 61, -3, 600].map(s => K.tmFmt(s))).toEqual(['0:00', '1:00', '1:01', '0:00', '10:00']);
		expect(K.tmUsed({ elapsedSeconds: 125 })).toEqual({ m: 2, s: 5 });
		expect(K.tmUsed(undefined)).toEqual({ m: 0, s: 0 });
		expect(K.tplFill('还剩 {n} 秒，{x}', { n: 5 })).toBe('还剩 5 秒，');
		expect(K.tplFill('{n}', { n: 0 })).toBe('0');
		expect(K.tplFill(null, {})).toBe('');
	});
});

describe('dates', () => {
	test('dayD and ymd go through the local day', () => {
		expect(K.ymd(K.dayD('2026-11-16'))).toBe('2026-11-16');
		expect(K.ymd(new Date(2026, 0, 5))).toBe('2026-01-05');
		expect(K.dayD('2026-11-16').getHours()).toBe(0);
	});

	test('bjMD: month and day in Beijing time', () => {
		expect(K.bjMD('2026-11-15T16:30:00Z')).toBe('11 月 16 日');
		expect(K.bjMD('2026-11-15T15:59:00Z')).toBe('11 月 15 日');
	});
});

describe('placement test: reading the script aloud', () => {
	const part = { script: ['a b c d e f', 'a b c d e f g h i j k l', 'x'], rate: 1 };

	test('words, line lengths, when each line starts and the whole length', () => {
		expect(K.plWords('  a  b\tc\n')).toBe(3);
		expect(K.plWords('')).toBe(0);
		expect(K.plDur('a b c d e f', { rate: 1 })).toBe(2.5);
		expect(K.plDur('a b c d e f', {})).toBe(2.5);
		expect(K.plDur('a b c d e f', { rate: 2 })).toBe(1.25);
		expect(K.plCues(part)).toEqual([0, 2.5, 7.5]);
		expect(K.plLen(part)).toBe(8);
		expect(K.plLen({ script: ['a'] })).toBe(5);
	});

	test('which line is playing, and where to pick up again', () => {
		expect([0, 2.4, 2.495, 7.5, 100].map(t => K.plLineAt(part, t))).toEqual([0, 0, 1, 2, 2]);
		expect([6, 3, 8, 9].map(t => K.plResumePoint(part, t))).toEqual([2.5, 0, 2.5, 7.5]);
		expect(K.plResumePoint({ script: [] }, 10)).toBe(7);
		expect(K.plResumePoint({ script: [] }, 1)).toBe(0);
	});

	test('plFmt rounds to the second', () => {
		expect([0, 59.6, 125.4, -1].map(s => K.plFmt(s))).toEqual(['0:00', '1:00', '2:05', '0:00']);
	});
});
