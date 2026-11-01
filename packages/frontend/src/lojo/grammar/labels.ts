/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Copy for 6 号线 · 语法's lessons (/grammar/6.2), kept apart from upstream Crowdin translations. Chinese first, short
// sentences. The lessons themselves are in Chinese only (grammar.js). Never promise a score: a band is a practice level.
import { learnLang } from '@/lojo/learn-lang.js';
import type { LegendKey } from './marks.js';

const zh = {
	pageTitle: (band: string, title: string) => `语法 · ${band} ${title}`,
	fallbackTitle: '语法',
	lineTag: (n: number, name: string) => `${n} 号线 · ${name}`,
	eyebrow: (band: string) => `${band} · 讲解`,
	meta: (sections: number, minutes: number | null) => (minutes != null ? `${sections} 小节 · 约 ${minutes} 分钟` : `${sections} 小节`),
	level: '练习难度，不是官方分数',
	toGate: '去闯关',
	toMap: '线路图',
	missing: '没有这一站的讲解。',
	backToMap: '回线路图',

	toc: '小节',
	legendTitle: '例句里的标记',
	legendMarks: '画线的词，下面写着它是什么。',
	legendClause: '从句用方括号括起来，带底色。',
	// the name written under a marked word
	marks: { s: '主语', v: '谓语', o: '宾语', p: '表语', c: '从句' } as Record<LegendKey, string>,
	// how each mark is drawn, so the colours aren't the only cue
	markStyles: { s: '实线', v: '双线', o: '虚线', p: '点线', c: '方括号' } as Record<LegendKey, string>,
	// between a name and its line, for screen readers (on screen, a gap)
	legendSep: '：',
	clauseSr: '（从句）',
	sayHint: '点喇叭，听英音朗读',
	say: (sentence: string) => `朗读：${sentence}`,
	stopSay: '停止朗读',

	mistakesTitle: '常见错误',
	wrongSr: '错：',
	rightSr: '对：',
	writingTitle: '写作里用得上',
	// the one table so far (6.6) has no head of its own
	tableHead: ['关系词', '用在', '例子'],

	endTitle: '读完了？去闯关',
	endTypes: (types: string) => `题型：${types}。`,
	endNote: '交卷以后，每题都有答案和一句为什么。',
	lineNav: (line: string) => `${line}的其他站`,
	prev: '上一站',
	next: '下一站',
	stopName: (band: string, title: string) => `${band} ${title}`,
};

const en: typeof zh = {
	pageTitle: (band, title) => `Grammar · ${band} ${title}`,
	fallbackTitle: 'Grammar',
	lineTag: (n, name) => `Line ${n} · ${name}`,
	eyebrow: band => `${band} · Lesson`,
	meta: (sections, minutes) => (minutes != null ? `${sections} parts · about ${minutes} min` : `${sections} parts`),
	level: 'A practice level, not an official band score',
	toGate: 'Take the gate',
	toMap: 'Route map',
	missing: 'There is no lesson for this stop.',
	backToMap: 'Back to the route map',

	toc: 'Parts',
	legendTitle: 'Marks in the examples',
	legendMarks: 'A marked part has its name under it.',
	legendClause: ' A clause is in square brackets, shaded.',
	// short, as under the words in a grammar book
	marks: { s: 'S', v: 'V', o: 'O', p: 'C', c: 'Clause' },
	markStyles: { s: 'subject, solid line', v: 'verb, double line', o: 'object, dashed line', p: 'complement, dotted line', c: 'in square brackets' },
	legendSep: ': ',
	clauseSr: ' (clause)',
	sayHint: 'Tap the speaker to hear it in a British voice',
	say: sentence => `Read aloud: ${sentence}`,
	stopSay: 'Stop reading',

	mistakesTitle: 'Common mistakes',
	wrongSr: 'Wrong: ',
	rightSr: 'Right: ',
	writingTitle: 'For your writing',
	tableHead: ['Word', 'Used for', 'Example'],

	endTitle: 'Done reading? Take the gate',
	endTypes: types => `Question types: ${types}.`,
	endNote: 'Once you hand in, every question shows its answer and a line on why.',
	lineNav: line => `Other stops on the ${line} line`,
	prev: 'Previous stop',
	next: 'Next stop',
	stopName: (band, title) => `${band} ${title}`,
};

export const grammarLang: 'zh' | 'en' = learnLang;
export const grammarLabels = grammarLang === 'zh' ? zh : en;
