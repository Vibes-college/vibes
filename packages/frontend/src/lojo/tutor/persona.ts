/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 每个学员自己的 Momo（创始人 2026-11-16 23:35 / 23:54、11-17 00:13 PT）：学员给自己那只 AI 学搭子挑的脸和起的名字。
// 学员自己看到 AI 学搭子账号（@tutor_mia）的地方，都换成 TA 那只：私信列表、私信顶上、消息头像、个人资料、任务页、
// 右下角。全站的头像和名字都由 MkAvatar / MkUserName 画，这两个来这里问，所以不用一处一处改。
// 没登录的人看到账号本来的样子（默认名 Momo）。
// 存在服务器上（lojo/tutor/persona/show、update），这台设备再记一份，下次打开不用等就是对的脸和名字。

import { computed, ref } from 'vue';
import { DEFAULT_TUTOR_NAME, defaultPersonaSeed, personaHeadUrl } from './persona-rules.js';
import { $i } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';

export type TutorPersona = {
	seed: string;
	name: string;
	// false until the learner picks a face or a name (or skips the step after signing up)
	chosen: boolean;
};

const IDS_KEY = 'vibes:tutorIds';
const personaKey = () => `vibes:momo:${$i?.id ?? ''}`;

function readLocal<T>(key: string): T | null {
	try {
		return JSON.parse(window.localStorage.getItem(key) ?? 'null') as T | null;
	} catch {
		return null;
	}
}

function writeLocal(key: string, value: unknown) {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch { /* full or blocked: only the server copy then */ }
}

// The AI tutor account(s) (lojo/tutor/public), remembered on this device so the first paint is already right.
const tutorIds = ref<string[]>(readLocal<string[]>(IDS_KEY) ?? []);
let idsAsking: Promise<string[]> | null = null;

function askIds(): Promise<string[]> {
	if (idsAsking != null) return idsAsking;
	idsAsking = misskeyApi('lojo/tutor/public').then(r => {
		tutorIds.value = r.ids;
		writeLocal(IDS_KEY, r.ids);
		return r.ids;
	}, () => {
		idsAsking = null;
		return tutorIds.value;
	});
	return idsAsking;
}

// The AI tutor account(s), read once per page load.
export function loadTutorIds(): Promise<string[]> {
	return askIds();
}

const saved = $i ? readLocal<TutorPersona>(personaKey()) : null;
const persona = ref<TutorPersona | null>(saved != null && typeof saved.seed === 'string' && typeof saved.name === 'string' ? saved : null);
let personaAsked: Promise<TutorPersona | null> | null = null;

function keep(r: TutorPersona): TutorPersona {
	const next = { seed: r.seed, name: r.name, chosen: r.chosen };
	persona.value = next;
	writeLocal(personaKey(), next);
	return next;
}

// Read once per page load; fresh = read again (after the learner changed it on another device, say).
export function loadPersona(fresh = false): Promise<TutorPersona | null> {
	if ($i == null) return Promise.resolve(null);
	if (personaAsked != null && !fresh) return personaAsked;
	personaAsked = misskeyApi('lojo/tutor/persona/show', {}).then(keep, () => {
		personaAsked = null;
		return persona.value;
	});
	return personaAsked;
}

// greet: after the sign-up step only. The learner's Momo says hello in a chat with no messages yet (server side).
export async function savePersona(change: { seed?: string; name?: string; greet?: boolean }): Promise<TutorPersona> {
	const next = keep(await misskeyApi('lojo/tutor/persona/update', change));
	personaAsked = Promise.resolve(next);
	return next;
}

// The learner's own Momo, defaults until it has loaded. Reading these starts the load.
export const myTutorName = computed(() => {
	void loadPersona();
	return persona.value?.name ?? DEFAULT_TUTOR_NAME;
});
export const myTutorSeed = computed(() => {
	void loadPersona();
	return persona.value?.seed ?? ($i ? defaultPersonaSeed($i.id) : 'momo');
});
export const myTutorChosen = computed(() => persona.value?.chosen === true);

export function isTutorUser(user: { id: string } | null | undefined): boolean {
	if (user == null) return false;
	void askIds();
	return tutorIds.value.includes(user.id);
}

// For MkUserName: the name this learner gave the AI tutor account, or null for anyone else (and when signed out).
export function personaNameFor(user: { id: string }): string | null {
	return $i != null && isTutorUser(user) ? myTutorName.value : null;
}

// For MkAvatar: the learner's own Momo's head, or null.
export function personaHeadFor(user: { id: string }): string | null {
	return $i != null && isTutorUser(user) ? personaHeadUrl(myTutorSeed.value) : null;
}

// Whether to show 「认识你的 Momo」 first in the sign-up dialog (components/MkUserSetupDialog.vue): only when the site
// has an AI tutor, this is not the AI tutor itself, and the learner has not picked (or skipped) yet. Read fresh, so a
// pick on another device counts. Anything unclear: no, the plain sign-up dialog.
export async function needsMomoStep(): Promise<boolean> {
	if ($i == null) return false;
	const me = $i.id;
	try {
		const [ids, r] = await Promise.all([askIds(), misskeyApi('lojo/tutor/persona/show', {})]);
		const now = keep(r);
		personaAsked = Promise.resolve(now);
		return ids.length > 0 && !ids.includes(me) && !now.chosen;
	} catch {
		return false;
	}
}
