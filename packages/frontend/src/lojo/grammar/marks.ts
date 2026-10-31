/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 6 号线 · 语法: the markup of grammar.js (courses/english/ielts/grammar.js in the Vibes workspace). Pure: no Vue, no data.
// Examples mark the parts of a sentence: {s:主语} {v:谓语} {o:宾语} {p:表语} [c:从句]. A clause may hold marks of its own
// ([c:who {v:lives} nearby]); marks don't nest. Paragraphs write English in backticks: `It is hot today.`
// Malformed markup never shows its signs: what is left is read as plain text, and exampleIssues() says what was wrong.

export const MARK_KINDS = ['s', 'v', 'o', 'p'] as const;
export type MarkKind = typeof MARK_KINDS[number];
// what the legend lists, in this order: the four marks and the clause
export const LEGEND_KEYS = ['s', 'v', 'o', 'p', 'c'] as const;
export type LegendKey = typeof LEGEND_KEYS[number];

export type TextSegment = { kind: 'text'; text: string };
// tail: the punctuation right after the marked words. It stays on their line: a marked word is drawn as one block, and
// a comma after it could otherwise start the next line on its own.
export type MarkSegment = { kind: 'mark'; mark: MarkKind; text: string; tail: string };
// A clause wraps like ordinary text; its brackets and colour show where it starts and ends.
export type ClauseSegment = { kind: 'clause'; parts: (TextSegment | MarkSegment)[] };
export type Segment = TextSegment | MarkSegment | ClauseSegment;

export type InlinePart = { text: string; en: boolean };

const isMarkKind = (k: string): k is MarkKind => (MARK_KINDS as readonly string[]).includes(k);

// {x:…} with nothing that could be markup inside
const MARK = /^\{([a-z]):([^{}[\]]*)\}/;
// [c:…]; marks may be inside, brackets may not
const CLAUSE = /^\[c:([^[\]]*)\]/;
// the opening of markup that was never closed: {s: or [c:
const OPENER = /^[{[][a-z]:/;
// punctuation that belongs to the word before it
const TAIL = /^[,.;:!?…)'"’”]+/;

function scan(src: string, inClause: boolean, issues: string[]): Segment[] {
	const out: Segment[] = [];
	let text = '';
	const flush = () => {
		if (text !== '') out.push({ kind: 'text', text });
		text = '';
	};
	let i = 0;
	while (i < src.length) {
		const rest = src.slice(i);
		const mark = MARK.exec(rest);
		if (mark) {
			i += mark[0].length;
			const [, kind, words] = mark;
			if (!isMarkKind(kind)) {
				issues.push(`unknown mark "${mark[0]}"`);
				text += words;
				continue;
			}
			if (words.trim() === '') issues.push(`empty mark "${mark[0]}"`);
			else if (words !== words.trim()) issues.push(`spaces inside "${mark[0]}"`);
			const tail = TAIL.exec(src.slice(i))?.[0] ?? '';
			i += tail.length;
			flush();
			out.push({ kind: 'mark', mark: kind, text: words, tail });
			continue;
		}
		const clause = inClause ? null : CLAUSE.exec(rest);
		if (clause) {
			i += clause[0].length;
			if (clause[1].trim() === '') issues.push(`empty clause "${clause[0]}"`);
			flush();
			out.push({ kind: 'clause', parts: scan(clause[1], true, issues) as ClauseSegment['parts'] });
			continue;
		}
		if ('{}[]'.includes(src[i])) {
			issues.push(`stray "${src[i]}" in "${src}"`);
			// leave the sign out, and the "s:" of an opening with it
			i += OPENER.exec(rest)?.[0].length ?? 1;
			continue;
		}
		text += src[i];
		i++;
	}
	flush();
	return out;
}

// An example sentence as segments. Never throws.
export function parseExample(src: string): Segment[] {
	return scan(src, false, []);
}

// What is wrong with an example's markup; empty when it is fine.
export function exampleIssues(src: string): string[] {
	const issues: string[] = [];
	scan(src, false, issues);
	return issues;
}

// Segments back to markup: parseExample(src) written out again is src.
export function toMarkup(segments: Segment[]): string {
	return segments.map(s => {
		if (s.kind === 'text') return s.text;
		if (s.kind === 'mark') return `{${s.mark}:${s.text}}${s.tail}`;
		return `[c:${toMarkup(s.parts)}]`;
	}).join('');
}

function segmentText(segments: Segment[]): string {
	return segments.map(s => (s.kind === 'text' ? s.text : s.kind === 'mark' ? s.text + s.tail : segmentText(s.parts))).join('');
}

// The sentence read aloud and named on its speaker button: no markup, and "(that)" read as "that".
export function plainText(src: string): string {
	return segmentText(parseExample(src)).replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
}

// The legend keys the examples use, in legend order.
export function keysUsed(examples: Segment[][]): LegendKey[] {
	const used = new Set<LegendKey>();
	const visit = (segments: Segment[]) => {
		for (const s of segments) {
			if (s.kind === 'mark') used.add(s.mark);
			else if (s.kind === 'clause') {
				used.add('c');
				visit(s.parts);
			}
		}
	};
	examples.forEach(visit);
	return LEGEND_KEYS.filter(k => used.has(k));
}

// A paragraph: English in backticks set apart. A lone backtick stays as it is.
export function inlineParts(src: string): InlinePart[] {
	const out: InlinePart[] = [];
	let last = 0;
	for (const m of src.matchAll(/`([^`]+)`/g)) {
		if (m.index > last) out.push({ text: src.slice(last, m.index), en: false });
		out.push({ text: m[1], en: true });
		last = m.index + m[0].length;
	}
	if (last < src.length) out.push({ text: src.slice(last), en: false });
	return out;
}

// "写作里用得上：…" loses its prefix: the box's title already says it.
export function writingText(src: string): string {
	return src.replace(/^\s*写作里用得上\s*[：:]\s*/, '');
}
