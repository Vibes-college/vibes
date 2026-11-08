/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { copyFields, createConfigProblems, fixedList, normalizePlans, toCreateConfig, unnamedPeople, unsupportedNumbers, verifyFixed } from '@/misc/lojo-create.js';
import type { LojoCreateForm } from '@/misc/lojo-create.js';

const form = (name: string): LojoCreateForm => ({
	name, medium: '视频', orientation: '竖屏', length: '40秒', mechanism: 'm', status: '在试', evidence: '没查',
	one: 'one', how: 'how', why: 'why', examples: 'examples',
});
const forms = [form('示例做法甲：一句较长的做法名'), form('示例做法乙：先抛钩子再讲方法')];

describe('创作讲解 model answers', () => {
	test('a plan says ours only when it names one of our formats', () => {
		const plans = normalizePlans({
			plans: [
				{ source: 'ours', form: '示例做法甲：一句较长的做法名', name: '冷知识', platform: '小红书', medium: '竖屏视频', hook: '为什么？', beats: ['a', '', 'b'] },
				{ source: 'ours', form: '示例做法乙', name: '名人', platform: '抖音', medium: '图文 3:4', hook: '钩子' },
				{ source: 'ours', form: '我们没拆过的做法', name: '别的', platform: '微博', medium: '长图', hook: '钩子' },
				{ source: 'common', form: '示例做法甲：一句较长的做法名', name: '常见', hook: '钩子' },
				{ source: 'ours', name: '', hook: '没名字' },
			],
		}, forms);
		expect(plans.map(p => [p.source, p.form])).toEqual([
			['ours', '示例做法甲：一句较长的做法名'],
			['ours', '示例做法乙：先抛钩子再讲方法'],
			['common', ''],
			['common', ''],
		]);
		expect(plans[0].beats).toEqual(['a', 'b']);
		expect(plans[2].platform).toBe('小红书');
		expect(plans[2].medium).toBe('图文 3:4');
		expect(normalizePlans('not json', forms)).toEqual([]);
	});

	test('copy keeps the fields it got, and the checks get must or warn', () => {
		const copy = copyFields({ titles: ['一', '', '二', '三', '四'], body: '正文', checks: [{ level: '要改', text: '这句承诺了效果' }, { level: '提醒', reason: '这句要核实' }, '一句话', { level: '要改' }] });
		expect(copy.titles).toEqual(['一', '二', '三']);
		expect(copy.body).toBe('正文');
		expect('cover' in copy).toBe(false);
		expect(copy.checks).toEqual([
			{ level: 'must', text: '这句承诺了效果' },
			{ level: 'warn', text: '这句要核实' },
			{ level: 'warn', text: '一句话' },
		]);
	});

	test('the second pass lists only what it changed', () => {
		expect(fixedList({ fixed: ['删掉了电话', '结尾为开放性问题，无需修改。', { text: '把截止日期改成已经截止' }, '未发现编造事实'] })).toEqual(['删掉了电话', '把截止日期改成已经截止']);
		expect(fixedList({})).toEqual([]);
		expect(fixedList({ fixed: [
			'标题：将「考官最烦背答案」改为「考官最烦背答案」——常见观点，保留。',
			'正文：将「90%的人」改为「很多人」',
			'删掉了电话，保留了官网说明',
		] })).toEqual(['正文：将「90%的人」改为「很多人」', '删掉了电话，保留了官网说明']);
	});

	test('a change the second pass claims but did not make is not shown as fixed', () => {
		const first = { titles: ['t'], cover: 'c', body: '90%的人都错了', script: 's', pin: '我看看有多少人和我一样', ai: '', checks: [] };
		const final = { ...first, body: '很多人都错了' };
		expect(verifyFixed(first, final, ['正文删掉了「90%的人」', '置顶评论改成问经历', '删掉了编造的比例'])).toEqual({
			fixed: ['正文删掉了「90%的人」', '删掉了编造的比例'],
			unconfirmed: ['置顶评论改成问经历'],
		});
		expect(verifyFixed(first, first, ['删掉了编造的比例']).unconfirmed).toEqual(['删掉了编造的比例']);
		// The same fix listed again for fields that never had those words: dropped, not shown as a missed fix.
		expect(verifyFixed(first, final, ['正文删掉了「90%的人」', '标题：删掉「90%的人」', '置顶评论：把「有多少人和我一样」改成问经历'])).toEqual({
			fixed: ['正文删掉了「90%的人」'],
			unconfirmed: ['置顶评论：把「有多少人和我一样」改成问经历'],
		});
	});

	test('made-up percentages, multiples and head counts are found, numbers the post has are not', () => {
		const post = 'Jot down 3–4 keywords. About 40% of candidates fail. 200 students joined.';
		expect(unsupportedNumbers('90%的人都在做无用功', post)).toEqual(['90%']);
		expect(unsupportedNumbers('40%的考生没过', post)).toEqual([]);
		expect(unsupportedNumbers('200人报名', post)).toEqual([]);
		expect(unsupportedNumbers('效率提高3倍，10万人都在用', post)).toEqual(['3倍', '10万人']);
		expect(unsupportedNumbers('百分之八十的人、八成的人', post)).toEqual(['百分之八十', '八成']);
		expect(unsupportedNumbers('只记3-4个关键词，顺手记10个单词', post)).toEqual([]);
		expect(unsupportedNumbers('我们班30人里一半都这样', '我们班 30 人里一半都这样')).toEqual([]);
	});

	test('people nobody can look up are found with the words around them; placeholders and the post\'s own words are not', () => {
		expect(unnamedPeople('某名人公开说过，他学英语从不背语法书', '')).toEqual(['某名人公开说过']);
		expect(unnamedPeople('名人也在用的雅思口语Part 2技巧，原来这么简单', '')).toEqual(['名人也在用的雅思口语Part 2技巧']);
		expect(unnamedPeople('名人用AI学英语的截图：原来可以这样', '')).toEqual(['名人用AI学英语的截图']);
		expect(unnamedPeople('名人钩子：[换成一位真实名人的公开言论，附出处]\n名人钩子讲经典方法', '')).toEqual([]);
		expect(unnamedPeople('某位考官说过，别背模板', '某位考官说过，别背模板')).toEqual([]);
		expect(unnamedPeople('雅思口语考官说：准备一分钟，别写句子。', '')).toEqual(['雅思口语考官说']);
		expect(unnamedPeople('我老师说过别背模板', '')).toEqual([]);
	});
});

describe('创作讲解 config', () => {
	test('refuses formats without a how-to and sources that are not local usernames', () => {
		expect(createConfigProblems({ forms: [{ name: 'a', how: '' }], sources: ['vibes_editors', 'a@b.c'] })).toEqual([
			'form "a" has no 怎么做的',
			'source "a@b.c" is not a local username',
		]);
		expect(createConfigProblems({ forms: [{ name: 'a', how: 'b' }], sources: ['vibes_editors'] })).toEqual([]);
	});

	test('falls back to no formats and the editors when nothing was imported', () => {
		expect(toCreateConfig(null)).toEqual({ forms: [], sources: ['vibes_editors'], importedAt: '' });
		const config = toCreateConfig({ forms: [{ name: ' x ', how: 'y', extra: 1 }], sources: [] });
		expect(config.forms[0].name).toBe('x');
		expect(config.forms[0].medium).toBe('');
		expect(config.sources).toEqual(['vibes_editors']);
	});
});
