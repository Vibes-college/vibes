/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 小程序名册接管入口 (2026-11-17): the 小程序 launcher (MkMiniAppsLaunchPad.vue) no longer reads a list compiled into
// the frontend. The list is content kind `apps` on the server (backend misc/lojo-apps-roster.ts): an admin imports it
// with apps/community/scripts/apps-import.mjs, and an entry turned off there is gone from the launcher the next time
// it opens, without a rebuild. The device keeps the last list it got (local storage, the same for every account), so
// the launcher draws at once and only asks the server in the background whether it is still the version in use (a few
// bytes when it is). Nothing here may break the page: a list that cannot be read just shows no entries.
import { ref } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { openAppOverlay } from '@/lojo/app-overlay.js';
import { hasSeenMiniApp } from '@/lojo/miniapps/state.js';

export const MINI_APPS_KIND = 'apps';
const LOCAL_KEY = 'lojo:miniApps:roster';

export interface MiniAppDef {
	id: string;
	name: string;
	icon: string;
	/** /apps/<id>/… opens in the full-screen overlay; another site opens in this tab */
	href: string;
	/** ids this app had before (the intro is not shown again to someone who saw it under the old id) */
	formerIds?: string[];
	intro: {
		summary: string;
		audience: string;
		steps: string[];
		caveats: string[];
	};
}

type Kept = { hash: string; apps: MiniAppDef[] };

const isStr = (v: unknown): v is string => typeof v === 'string' && v !== '';
const isStrs = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === 'string');

function asApp(v: unknown): MiniAppDef | null {
	if (v == null || typeof v !== 'object') return null;
	const a = v as Record<string, unknown>;
	const intro = a.intro as Record<string, unknown> | null | undefined;
	if (!isStr(a.id) || !isStr(a.name) || !isStr(a.icon) || !isStr(a.href) || intro == null || typeof intro !== 'object') return null;
	if (!isStr(intro.summary) || !isStr(intro.audience) || !isStrs(intro.steps) || !isStrs(intro.caveats)) return null;
	return {
		id: a.id, name: a.name, icon: a.icon, href: a.href,
		formerIds: isStrs(a.formerIds) ? a.formerIds : [],
		intro: { summary: intro.summary, audience: intro.audience, steps: intro.steps, caveats: intro.caveats },
	};
}

/** The entries of a roster answer that have every part the launcher draws; anything else is left out. */
export function rosterApps(data: unknown): MiniAppDef[] | null {
	const apps = (data as { apps?: unknown } | null | undefined)?.apps;
	if (!Array.isArray(apps)) return null;
	return apps.map(asApp).filter((a): a is MiniAppDef => a != null);
}

function readLocal(): Kept | null {
	try {
		const raw = window.localStorage.getItem(LOCAL_KEY);
		if (raw == null) return null;
		const parsed = JSON.parse(raw) as { hash?: unknown; apps?: unknown };
		const apps = rosterApps(parsed);
		return isStr(parsed.hash) && apps != null ? { hash: parsed.hash, apps } : null;
	} catch {
		return null;
	}
}

function writeLocal(kept: Kept): void {
	try {
		window.localStorage.setItem(LOCAL_KEY, JSON.stringify(kept));
	} catch {
		// private mode or full storage: the next visit asks the server again
	}
}

const first = readLocal();
let hash: string | null = first?.hash ?? null;

/** The launcher's entries, in the roster's order. */
export const miniApps = ref<MiniAppDef[]>(first?.apps ?? []);
/** loading: no copy yet and the server has not answered; failed: no copy and the server could not be read */
export const miniAppsState = ref<'ready' | 'loading' | 'failed'>(first != null ? 'ready' : 'loading');

let asking: Promise<void> | null = null;

/** Ask the server whether the list changed (once at a time). Never throws. */
export function refreshMiniApps(): Promise<void> {
	asking ??= (async () => {
		try {
			const res = await misskeyApi('lojo/content/pack', hash != null ? { kind: MINI_APPS_KIND, have: hash } : { kind: MINI_APPS_KIND });
			if (res.data != null) {
				const apps = rosterApps(res.data);
				if (apps == null) throw new Error('lojo/content/pack: not a roster');
				miniApps.value = apps;
				hash = res.hash;
				writeLocal({ hash: res.hash, apps });
			}
			miniAppsState.value = 'ready';
		} catch {
			// offline, or nothing imported yet: the copy stays; without one the launcher says it could not read the list
			if (miniAppsState.value === 'loading') miniAppsState.value = 'failed';
		} finally {
			asking = null;
		}
	})();
	return asking;
}

/** For tests and for a page that already has the list. */
export function setMiniApps(apps: MiniAppDef[]): void {
	miniApps.value = apps;
	miniAppsState.value = 'ready';
}

export function openMiniApp(app: MiniAppDef): void {
	openAppOverlay(app.href);
}

export function hasSeenMiniAppIntro(app: MiniAppDef): boolean {
	return [app.id, ...(app.formerIds ?? [])].some(hasSeenMiniApp);
}

/** The roster's entries for these ids, in this order (an id an app had before counts too); one the roster does not have, or turned off, is left out. */
export function pickMiniApps(apps: readonly MiniAppDef[], ids: readonly string[]): MiniAppDef[] {
	return ids
		.map(id => apps.find(a => a.id === id || (a.formerIds ?? []).includes(id)))
		.filter((a): a is MiniAppDef => a != null)
		.filter((a, i, all) => all.indexOf(a) === i);
}

/** Where a mini app opens, from the roster; null when the roster does not have it (or is not read yet). */
export function miniAppHref(id: string): string | null {
	return miniApps.value.find(a => a.id === id)?.href ?? null;
}

/** The name of the mini app an address in the overlay belongs to. */
export function miniAppNameAt(src: string): string | null {
	return miniApps.value.find(a => src.startsWith(a.href))?.name ?? null;
}
