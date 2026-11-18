/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 课程内容进数据库 (2026-11-17): a course's route pack (lines and stops, their words, the map layout, the tour captions)
// is no longer compiled into the frontend. The server hands out the version in use (lojo/content/pack; an admin imports
// new versions with apps/community/scripts/content-import.mjs, no rebuild). A signed-in device keeps a copy (kept.ts)
// and draws from it at once, asking the server in the background whether it is still the version in use (a few bytes
// when it is); a newer version is used from the next open. Without a copy (first visit, visitors) it waits for the server.

import { misskeyApi } from '@/utility/misskey-api.js';
import { keep, readKept } from '@/lojo/kept.js';

type Bilingual = { zh: string; en: string };
/** The parts every page reads; the rest (LINES, POS, TOUR…) is read by the page that needs it (gates/player.ts, gate-map.js). */
export type CoursePack = {
	META: { id: string; kind: string; storeKey: string; tag?: string; group: Bilingual };
	TEXT: Record<'zh' | 'en', { title: string; legal: string }>;
	[part: string]: unknown;
};

type Kept = { hash: string; version: string; data: Record<string, unknown> };

const keptName = (kind: string): string => `pack:${kind}`;
/** kind → this page load's copy (one request per kind per page load) */
const loaded = new Map<string, Promise<Record<string, unknown>>>();

async function ask(kind: string, have: Kept | null): Promise<Kept> {
	const res = await misskeyApi('lojo/content/pack', have != null ? { kind, have: have.hash } : { kind });
	if (res.data == null) {
		// the copy is the version in use
		if (have == null) throw new Error(`lojo/content/pack: no data for ${kind}`);
		return have;
	}
	const next: Kept = { hash: res.hash, version: res.version, data: res.data as Record<string, unknown> };
	keep(keptName(kind), next);
	return next;
}

export function loadPack(kind: string): Promise<Record<string, unknown>> {
	const known = loaded.get(kind);
	if (known != null) return known;
	const p = (async () => {
		const kept = await readKept<Kept>(keptName(kind));
		if (kept != null && typeof kept.hash === 'string' && kept.data != null) {
			void ask(kind, kept).then(next => {
				if (next.hash !== kept.hash) loaded.set(kind, Promise.resolve(next.data));
			}).catch(() => { /* offline: the copy stays */ });
			return kept.data;
		}
		return (await ask(kind, null)).data;
	})();
	loaded.set(kind, p);
	// a failed load is tried again the next time a page asks
	p.catch(() => { if (loaded.get(kind) === p) loaded.delete(kind); });
	return p;
}

/** A course's route pack (kind course-<catalog id>). */
export function loadCourse(id: string): Promise<CoursePack> {
	return loadPack(`course-${id}`) as Promise<CoursePack>;
}
