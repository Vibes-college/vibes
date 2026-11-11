/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 闯关定级 (冲刺1111): an optional 8-minute listening test that puts a learner further along chapter 1.
// Rules: 路线图 定级规则.json, version placement-2026-11-11b. Questions: courses/english/ielts/gates/placement-1.js
// (copied here as they are; change them there first). Screens: 闯关体验设计 定级原型 (11-11, quit pauses the recording,
// a handed-in first part is kept).
//
// First part: 5 gaps at 5.5. 3 or more right goes on to the high part (7.0), fewer to the low part (4.5). The total
// right of both parts gives a station (1.1–1.9); the station lights the levels before it with 1 star and 0 XP.

export const PLACEMENT_VERSION = 'placement-2026-11-11b';
export const PLACEMENT_COOLDOWN_DAYS = 30;
export const PLACEMENT_XP = 20;

type Item = { n: number; answer: string[] };
export type PlacementPart = {
	band: number; rate: number;
	instructions: { en: string; zh: string }; title: string; lines: string[]; items: Item[];
	// the recording's lines in order, the 20-second reading pause left out (the page shows it as 「先看题」)
	script: string[];
};

const FIRST: PlacementPart = {
	band: 5.5, rate: 1,
	instructions: { en: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.', zh: '补全下面的笔记。每空只写一个单词和/或一个数字。' },
	title: 'Changes to recycling',
	lines: [
		'Recycling will be collected once a (1) ______.',
		'Food waste goes in the (2) ______ box.',
		'Put bins out by (3) ______ am on collection day.',
		'Old electrical goods: take to the recycling centre on (4) ______ Lane.',
		'Quickest way to get help: use the council\'s (5) ______.',
	],
	items: [
		{ n: 1, answer: ['week'] }, { n: 2, answer: ['brown'] }, { n: 3, answer: ['7', 'seven'] }, { n: 4, answer: ['Mill'] }, { n: 5, answer: ['app'] },
	],
	script: [
		'You will hear an announcement about changes to a city\'s recycling service. First, you have some time to look at questions 1 to 5.',
		'Now listen carefully and answer questions 1 to 5.',
		'Good morning. This is a message from Hartfield City Council about changes to recycling, starting next month. From the first of March, recycling will be collected every week, instead of every two weeks.',
		'Every home will get a new green bin for glass, paper and cans. Food waste, though, goes in the small brown box, not in the green bin.',
		'Please don\'t put your bins out the night before, as foxes have been a real problem. Put them out by seven in the morning on collection day.',
		'Large items like furniture can still be collected for a small fee. Old electrical goods, however, must be taken to the recycling centre on Mill Lane.',
		'If you have any questions, our phone line is open on weekdays, but the quickest way to get help is through the council\'s app.',
		'That is the end of this part.',
	],
};

const HIGH: PlacementPart = {
	band: 7.0, rate: 1.1,
	instructions: { en: 'Complete the notes below. Write ONE WORD ONLY for each answer.', zh: '补全下面的笔记。每空只写一个单词。' },
	title: 'The London Underground',
	lines: [
		'1863: the first trains were pulled by (1) ______ engines.',
		'The name "the Tube" comes from the shape of the (2) ______.',
		'Harry Beck\'s map was inspired by (3) ______ circuit diagrams.',
		'Beck\'s map ignored the real (4) ______ between stations.',
		'In the Second World War, stations were used as (5) ______.',
	],
	items: [
		{ n: 1, answer: ['steam'] }, { n: 2, answer: ['tunnels'] }, { n: 3, answer: ['electrical'] }, { n: 4, answer: ['distances'] }, { n: 5, answer: ['shelters'] },
	],
	script: [
		'You will hear part of a lecture about the history of the London Underground. First, you have some time to look at questions 1 to 5.',
		'Now listen carefully and answer questions 1 to 5.',
		'The London Underground opened in 1863, and it was the first underground railway in the world. It may surprise you that the earliest trains were pulled by steam engines, which filled the stations with smoke.',
		'Later lines were dug much deeper and ran on electricity. Londoners soon nicknamed the system the Tube, because of the round shape of its tunnels.',
		'Perhaps the most famous part of the Underground is its map. In the 1930s, an engineering draughtsman called Harry Beck redesigned it, taking his inspiration from electrical circuit diagrams.',
		'Beck\'s key decision was to ignore the real distances between stations. Lines became straight, and stations were spaced evenly, which made the map far easier to read.',
		'The system has played other roles, too. During the Second World War, thousands of Londoners slept on the platforms at night, using the stations as shelters from the bombing.',
		'That is the end of the recording.',
	],
};

const LOW: PlacementPart = {
	band: 4.5, rate: 0.95,
	instructions: { en: 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.', zh: '补全下面的表格。每空只写一个单词和/或一个数字。' },
	title: 'Bus pass',
	lines: [
		'Type of pass: (1) ______',
		'Price: £(2) ______',
		'Surname: (3) ______',
		'Starts on: (4) ______ May',
		'Collect the pass on: (5) ______',
	],
	items: [
		{ n: 1, answer: ['monthly'] }, { n: 2, answer: ['48'] }, { n: 3, answer: ['Tanaka'] }, { n: 4, answer: ['1', '1st', 'first'] }, { n: 5, answer: ['Friday'] },
	],
	script: [
		'You will hear a man buying a bus pass. First, you have some time to look at questions 1 to 5.',
		'Now listen carefully and answer questions 1 to 5.',
		'Hello, how can I help?',
		'Hi. I\'d like a weekly bus pass. Oh, actually, I take the bus every day, so a monthly pass is cheaper for me.',
		'That\'s right. A monthly pass is forty-eight pounds.',
		'OK.',
		'Can I have your surname, please?',
		'It\'s Tanaka. T, A, N, A, K, A.',
		'Thank you. When would you like it to start?',
		'From the first of May, please.',
		'Fine. The pass will be ready on Thursday. Oh, sorry, Thursday is a holiday. You can collect it on Friday.',
		'Friday is good. Thanks.',
		'That is the end of the recording.',
	],
};

export const PLACEMENT_PARTS = { first: FIRST, high: HIGH, low: LOW } as const;
export type PlacementPath = 'high' | 'low';

const TO_HIGH_AT = 3;
const PLACE: Record<PlacementPath, [number, string][]> = {
	high: [[9, '1.9'], [7, '1.8'], [5, '1.7'], [4, '1.6'], [0, '1.5']],
	low: [[6, '1.4'], [4, '1.3'], [2, '1.2'], [0, '1.1']],
};

// 定级规则.json mapping. Levels of chapter 2 (2-1…2-3) are kept on the record and lit once chapter 2 is loaded.
const MAIN = ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6'];
export const PLACEMENT_MAP: Record<string, { lit: string[]; startAt: string; prepWaived: boolean; ch2: string[] }> = {
	'1.1': { lit: [], startAt: '1-1', prepWaived: false, ch2: [] },
	'1.2': { lit: MAIN.slice(0, 1), startAt: '1-2', prepWaived: false, ch2: [] },
	'1.3': { lit: MAIN.slice(0, 2), startAt: '1-3', prepWaived: false, ch2: [] },
	'1.4': { lit: MAIN.slice(0, 3), startAt: '1-4', prepWaived: false, ch2: [] },
	'1.5': { lit: MAIN, startAt: 'boss', prepWaived: true, ch2: [] },
	...Object.fromEntries(['1.6', '1.7', '1.8', '1.9'].map(s => [s, { lit: MAIN, startAt: '2-4', prepWaived: true, ch2: ['2-1', '2-2', '2-3'] }])),
};

// Same as the gates: trim, ignore case, drop a full stop or comma at the end.
export function normalizePlacement(s: string): string {
	return String(s ?? '').trim().toLowerCase().replace(/[.,]+$/, '').trim();
}

export function gradePart(part: PlacementPart, given: string[]): boolean[] {
	return part.items.map((it, i) => {
		const g = normalizePlacement(given[i] ?? '');
		return g !== '' && it.answer.some(a => normalizePlacement(a) === g);
	});
}

export function pathAfterFirst(right: number): PlacementPath {
	return right >= TO_HIGH_AT ? 'high' : 'low';
}

export function stationOf(path: PlacementPath, total: number): string {
	for (const [min, st] of PLACE[path]) if (total >= min) return st;
	return path === 'high' ? '1.5' : '1.1';
}

// What the page gets for a part: no answers. The script goes out for the placeholder recording (the browser reads it
// aloud) until the real recordings come in; it gives the answers away to anyone reading the page's code, which is
// accepted for a practice placement (闯关体验设计 说明 第 4 节).
export function publicPart(part: PlacementPart, from: number) {
	return {
		rate: part.rate, instructions: part.instructions, title: part.title,
		lines: part.lines.map(l => l.replace(/\((\d)\)/, (_, n) => `(${Number(n) + from - 1})`)),
		from, script: part.script,
	};
}
