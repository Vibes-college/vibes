/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// "My maps": the few courses a student is studying, shown as tabs on the route-map page.
// Stored in the account's registry next to each course's progress, so it follows the user across devices.
import { CATALOG, DEFAULT_COURSE, MY_MAX } from '@/lojo/route/courses/index.js';
import { misskeyApi } from '@/utility/misskey-api.js';

export const ROUTE_SCOPE = ['client', 'lojo', 'route'];
const MY_KEY = 'myMaps';

export type RouteRegistry = Record<string, unknown>;
export const readyCourses = CATALOG.filter(c => c.ready);
export const isReady = (id: string) => readyCourses.some(c => c.id === id);
export const coursePath = (id: string) => id === DEFAULT_COURSE ? '/map' : `/map/${id}`;

// get-all returns {} for a new user instead of a NO_SUCH_KEY error
export const loadRouteRegistry = (): Promise<RouteRegistry> =>
	misskeyApi('i/registry/get-all', { scope: ROUTE_SCOPE }).then(all => (all ?? {}) as RouteRegistry).catch(() => ({}));

export function myMaps(all: RouteRegistry): string[] {
	const list = Array.isArray(all[MY_KEY]) ? (all[MY_KEY] as unknown[]).filter((id): id is string => typeof id === 'string' && isReady(id)) : [];
	return [...new Set(list)];
}

export const saveMyMaps = (list: string[]) => misskeyApi('i/registry/set', { scope: ROUTE_SCOPE, key: MY_KEY, value: list });

// Opening a course adds it to "my maps" (at the end); past MY_MAX, the oldest one other than `keep` drops off.
export function withCourse(list: string[], id: string, keep = id): string[] {
	if (list.includes(id)) return list;
	const next = [...list, id];
	while (next.length > MY_MAX) next.splice(next.findIndex(x => x !== keep), 1);
	return next;
}

// Stations reached in a course, read from its saved progress ({ st: { '1.6': 'done', … } }).
export function doneCount(all: RouteRegistry, storeKey: string | undefined): number {
	const s = storeKey ? all[storeKey] as { st?: Record<string, string> } | undefined : undefined;
	if (!s || !s.st) return 0;
	return Object.entries(s.st).filter(([id, v]) => v === 'done' && /^\d+\.\d+$/.test(id)).length;
}
