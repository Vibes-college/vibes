/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Read-aloud voices (Fish Audio community voices, picked for the closed beta).
// Before the community opens to the public these are replaced with voices we design ourselves.
export const lojoVoices = [
	{ id: 'us-sarah', referenceId: '933563129e564b19a115bedd57b7406a', name: 'Sarah', accent: 'us', label: '女声 · 亲切聊天' },
	{ id: 'us-energetic', referenceId: '802e3bc2b27e49c2995d23ef70e6ac89', name: 'Leo', accent: 'us', label: '男声 · 有活力' },
	{ id: 'us-ethan', referenceId: '536d3a5e000945adb7038665781a4aca', name: 'Ethan', accent: 'us', label: '男声 · 讲解清楚' },
	{ id: 'us-hannah', referenceId: '9a9cf47702da476aa4629e2506d4a857', name: 'Hannah', accent: 'us', label: '女声 · 专业自信' },
	{ id: 'us-selene', referenceId: 'b347db033a6549378b48d00acb0d06cd', name: 'Selene', accent: 'us', label: '女声 · 温柔偏慢' },
	{ id: 'uk-historian', referenceId: 'beb44e5fac1e4b33a15dfcdcc2a9421d', name: 'Oliver', accent: 'uk', label: '男声 · 沉稳' },
	{ id: 'uk-brit', referenceId: '3895ea6f0c0f48f8b200557c7a7c6ebb', name: 'Emma', accent: 'uk', label: '女声 · 亲切' },
	{ id: 'au-friendly', referenceId: '46e236a33f0e49ec977b6d5f3c639a41', name: 'Mia', accent: 'au', label: '女声 · 年轻' },
	{ id: 'au-felix', referenceId: '8062e83481fe4165a2a92cd753f9c06b', name: 'Felix', accent: 'au', label: '男声 · 放松' },
] as const;

export type LojoVoiceId = typeof lojoVoices[number]['id'];
export const lojoVoiceIds = lojoVoices.map(v => v.id);
export const lojoDefaultVoice: LojoVoiceId = 'us-sarah';

const urlRe = /https?:\/\/\S+/g;
const mentionRe = /@[\w.-]+(?:@[\w.-]+)?/g;
const emojiCodeRe = /:[\w+-]+:/g;

// What the voice should read: no links, handles, emoji codes or MFM syntax.
export function speechText(text: string): string {
	return text
		.replace(urlRe, ' ')
		.replace(mentionRe, ' ')
		.replace(emojiCodeRe, ' ')
		.replace(/<\/?(small|center|plain|i|b)>/g, ' ')
		.replace(/\$\[[\w.,=-]+\s/g, '')
		.replace(/[\]*_~`<>]/g, ' ')
		.replace(/#(\w+)/g, '$1')
		.replace(/[ \t]+/g, ' ')
		.replace(/\s*\n\s*/g, '\n')
		.trim();
}
