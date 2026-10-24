/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const urlRe = /https?:\/\/\S+/g;
const mentionRe = /@[\w.-]+(?:@[\w.-]+)?/g;
const emojiCodeRe = /:[\w+-]+:/g;
const cjkRe = /[㐀-鿿豈-﫿]/g;
const latinRe = /[A-Za-z]/g;

function stripMarkup(text: string): string {
	return text.replace(urlRe, ' ').replace(mentionRe, ' ').replace(emojiCodeRe, ' ');
}

function count(text: string, re: RegExp): number {
	return text.match(re)?.length ?? 0;
}

// One Chinese character is roughly one English word of about four letters.
export function looksChinese(text: string | null | undefined): boolean {
	if (!text) return false;
	const plain = stripMarkup(text);
	const cjk = count(plain, cjkRe);
	return cjk >= 2 && cjk * 4 >= count(plain, latinRe);
}

export function looksEnglish(text: string | null | undefined): boolean {
	if (!text) return false;
	const plain = stripMarkup(text);
	return count(plain, latinRe) >= 6 && !looksChinese(text);
}

// Leading @mentions (a reply's addressees) stay as typed; only the body goes to the AI.
export function splitMentions(text: string): { prefix: string; body: string } {
	const prefix = text.match(/^(?:\s*@[\w.-]+(?:@[\w.-]+)?)+\s+/)?.[0] ?? '';
	return { prefix, body: text.slice(prefix.length) };
}

// What the speech engine should read: no links, handles, emoji codes or MFM syntax.
export function speechText(text: string): string {
	return stripMarkup(text)
		.replace(/<\/?(small|center|plain|i|b)>/g, ' ')
		.replace(/\$\[[\w.,=-]+\s/g, '')
		.replace(/[\]*_~`<>]/g, ' ')
		.replace(/#(\w+)/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}
