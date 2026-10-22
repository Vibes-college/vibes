/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Guide } from '@/lojo/guides/types.js';

export type GuideShelf = {
	id: string;
	no: string;
	title: string;
	tagline: string;
	hue: string;
	// Topics still missing from the shelf, drawn as dashed placeholder spines.
	ghosts: string[];
};

export const guideShelves: GuideShelf[] = [
	{ id: 'housing', no: '01', title: '租房', tagline: '住处，是落脚的第一步', hue: '#E8603F', ghosts: ['看房清单', '交房拍照', '合同第十条', '退租'] },
	{ id: 'ai', no: '02', title: 'AI 技能', tagline: '技能，是在城市里生根', hue: '#2340A3', ghosts: ['第一个作品', '陪跑营怎么选', '提示词', '退款条款'] },
	{ id: 'career', no: '03', title: '求职', tagline: '换一条路之前，先看清这条路', hue: '#B8871B', ghosts: ['简历', '面试', '薪资谈判', '背景调查'] },
	{ id: 'abroad', no: '04', title: '留学申请', tagline: '走得远，也要走得明白', hue: '#3F8F86', ghosts: ['选校', '文书', '签证', '中介合同'] },
];

// Book cloth: the brand palette plus a few quiet bindings so a shelf never reads as a flag.
const cloths = [
	{ c: '#2340A3', ink: '#F6F1E7' },
	{ c: '#E8603F', ink: '#FFF6EC' },
	{ c: '#F2C14E', ink: '#14204F' },
	{ c: '#14204F', ink: '#F2EBDD' },
	{ c: '#3F8F86', ink: '#F6F1E7' },
	{ c: '#EBA9A0', ink: '#3A1E1A' },
	{ c: '#A9C1EC', ink: '#14204F' },
	{ c: '#EFE6D3', ink: '#14204F' },
	{ c: '#6E4F8F', ink: '#F6F1E7' },
	{ c: '#2F5D4A', ink: '#F2EBDD' },
	{ c: '#D8C19C', ink: '#3A2A12' },
	{ c: '#3B3B42', ink: '#EDE7DA' },
];

const decos = ['plain', 'bands', 'checker', 'stripes', 'emblem', 'bigtype'] as const;

export type BookLook = {
	t: number;
	hr: string;
	c: string;
	ink: string;
	deco: typeof decos[number];
	minutes: number;
	// Bookmark ribbon; coral books get a mustard one so it stays visible.
	ribbon: string;
};

function hash(value: string): number {
	let h = 2166136261;
	for (let i = 0; i < value.length; i++) {
		h ^= value.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

export function readingMinutes(guide: Guide): number {
	let chars = guide.summary.length;
	let extra = 0;
	for (const block of guide.blocks) {
		chars += (block.text ?? '').length + (block.items ?? []).join('').length + (block.caption ?? '').length;
		if (block.type === 'video' || block.type === 'audio') extra += 3;
		if (block.type === 'image') extra += 0.2;
	}
	return Math.max(1, Math.round(chars / 450 + extra));
}

// Thickness follows how much there is to read. Height and binding come from the id, so a book
// keeps its look between visits; a neighbour never shares its cloth.
export function bookLooks(guides: Guide[]): BookLook[] {
	const looks: BookLook[] = [];
	for (const guide of guides) {
		const h = hash(guide.id);
		const minutes = readingMinutes(guide);
		const t = Math.round(Math.min(64, Math.max(28, 22 + Math.sqrt(minutes) * 8)));
		let ci = (h >>> 7) % cloths.length;
		if (looks.at(-1)?.c === cloths[ci].c) ci = (ci + 5) % cloths.length;
		let deco: BookLook['deco'] = decos[(h >>> 11) % decos.length];
		if (deco === 'bigtype' && t < 40) deco = 'bands';
		if (deco === 'checker' && t < 34) deco = 'emblem';
		looks.push({ t, hr: (0.78 + ((h >>> 3) % 20) / 100).toFixed(2), ...cloths[ci], deco, minutes, ribbon: cloths[ci].c === '#E8603F' ? '#F2C14E' : '#E8603F' });
	}
	return looks;
}
