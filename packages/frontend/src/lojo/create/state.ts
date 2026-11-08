/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 生产者视角 and 创作讲解. The switch and the drafts live in the account registry (scope lojo/create), so they follow
// the account across devices. The server saves a draft when it writes the copy; edits are saved from here.
import { ref } from 'vue';
import type * as Misskey from 'misskey-js';
import { createLabels } from './labels.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

export const SCOPE = ['lojo', 'create'];
const SETTINGS_KEY = 'settings';
const DRAFT_PREFIX = 'draft:';

export type CreatePlans = Misskey.Endpoints['lojo/create/plans']['res'];
export type CreatePlan = CreatePlans['plans'][number];
export type CreateDraft = Misskey.Endpoints['lojo/create/copy']['res'];

export const creatorView = ref(false);
export const createStatus = ref<Misskey.Endpoints['lojo/create/status']['res'] | null>(null);

const errorCode = (err: unknown) => (err as { code?: string } | null)?.code;

let loading: Promise<void> | null = null;

// Read once per visit; a failed read is tried again on the next call.
export function loadCreateState(): Promise<void> {
	if ($i == null) return Promise.resolve();
	loading ??= Promise.all([
		misskeyApi('i/registry/get', { scope: SCOPE, key: SETTINGS_KEY }).then((value) => {
			creatorView.value = (value as { creator?: unknown } | null)?.creator === true;
		}, (err) => {
			if (errorCode(err) !== 'NO_SUCH_KEY') throw err;
			creatorView.value = false;
		}),
		misskeyApi('lojo/create/status', {}).then((status) => {
			createStatus.value = status;
		}),
	]).then(() => undefined, () => {
		loading = null;
	});
	return loading;
}

export async function setCreatorView(on: boolean): Promise<void> {
	const before = creatorView.value;
	creatorView.value = on;
	try {
		await misskeyApi('i/registry/set', { scope: SCOPE, key: SETTINGS_KEY, value: { creator: on } });
	} catch (err) {
		creatorView.value = before;
		throw err;
	}
}

// 创作讲解 shows under the person's own posts and the listed accounts' (the editors') while 生产者视角 is on.
// Other people's posts keep 翻译讲解: using them needs their permission, and that rule is not written yet.
export function canCreateFrom(note: Misskey.entities.Note): boolean {
	const status = createStatus.value;
	if (!creatorView.value || $i == null || status == null || !status.available) return false;
	if ((note.text ?? '').trim() === '' && (note.cw ?? '').trim() === '') return false;
	if (note.userId === $i.id) return true;
	return note.user.host == null && status.sources.includes(note.user.username);
}

export function createErrorText(err: unknown): string {
	switch (errorCode(err)) {
		case 'LOJO_CREATE_UNAVAILABLE': return createLabels.errors.unavailable;
		case 'LOJO_CREATE_NOT_A_SOURCE': return createLabels.errors.notASource;
		case 'LOJO_CREATE_PLANS_EXPIRED': return createLabels.errors.expired;
		case 'LOJO_CREATE_QUOTA_EXCEEDED': return createLabels.errors.quota;
		case 'RATE_LIMIT_EXCEEDED': return createLabels.errors.rateLimited;
		case 'NO_SUCH_NOTE': return createLabels.errors.noSuchNote;
		default: return createLabels.errors.failed;
	}
}

// Plans per note for this visit; the server keeps them a week per person.
const plansCache = new Map<string, CreatePlans>();

export async function getPlans(noteId: string, refresh = false): Promise<CreatePlans> {
	const hit = plansCache.get(noteId);
	if (hit != null && !refresh) return hit;
	const res = await misskeyApi('lojo/create/plans', { noteId, refresh });
	plansCache.set(noteId, res);
	return res;
}

// ---------- drafts ----------

function isDraft(v: unknown): v is CreateDraft {
	return v != null && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'string' && typeof (v as { body?: unknown }).body === 'string';
}

export async function listDrafts(): Promise<CreateDraft[]> {
	const all = await misskeyApi('i/registry/get-all', { scope: SCOPE }) as Record<string, unknown>;
	return Object.entries(all)
		.filter(([key]) => key.startsWith(DRAFT_PREFIX))
		.map(([, value]) => value)
		.filter(isDraft)
		.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getDraft(id: string): Promise<CreateDraft | null> {
	try {
		const value = await misskeyApi('i/registry/get', { scope: SCOPE, key: `${DRAFT_PREFIX}${id}` });
		return isDraft(value) ? value : null;
	} catch (err) {
		if (errorCode(err) === 'NO_SUCH_KEY') return null;
		throw err;
	}
}

export async function saveDraft(draft: CreateDraft): Promise<void> {
	const value = { ...draft, updatedAt: new Date().toISOString() };
	await misskeyApi('i/registry/set', { scope: SCOPE, key: `${DRAFT_PREFIX}${draft.id}`, value: JSON.parse(JSON.stringify(value)) });
}

export async function removeDraft(id: string): Promise<void> {
	await misskeyApi('i/registry/remove', { scope: SCOPE, key: `${DRAFT_PREFIX}${id}` });
}

// How long ago, for drafts and plans: 刚刚, 5 分钟前, 3 小时前, 2 天前, then the date.
export function ago(iso: string): string {
	const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
	if (minutes < 1) return '刚刚';
	if (minutes < 60) return `${minutes} 分钟前`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} 小时前`;
	const days = Math.round(hours / 24);
	if (days < 7) return `${days} 天前`;
	const d = new Date(iso);
	return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// Copy text. The LAN test site is plain http, where navigator.clipboard is missing, so fall back to a hidden textarea.
export async function copyText(text: string): Promise<boolean> {
	try {
		if (navigator.clipboard != null && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// fall through to the old way
	}
	const ta = window.document.createElement('textarea');
	ta.value = text;
	ta.setAttribute('readonly', '');
	ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
	window.document.body.appendChild(ta);
	ta.select();
	ta.setSelectionRange(0, text.length);
	let ok = false;
	try {
		ok = window.document.execCommand('copy');
	} catch {
		ok = false;
	}
	ta.remove();
	return ok;
}
