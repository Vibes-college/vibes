/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';
import type { LojoState, StateSnapshot } from './state-sync.js';
import { misskeyApi } from '@/utility/misskey-api.js';

export type LojoEntity = {
	id: string;
	title: string;
	route: string;
	type: 'housing' | 'food' | 'pets' | 'events' | 'travel';
	lat: number;
	lng: number;
	status: 'demo' | 'curated';
	data: Record<string, unknown>;
};

export const lojoApi = {
	state: (token: string) => misskeyApi<StateSnapshot>('lojo/state/show', {}, token),
	saveState: (state: LojoState, expectedRevision: number, token: string) => misskeyApi<StateSnapshot>('lojo/state/update', { state, expectedRevision }, token),
	entity: (entityId: string) => misskeyApi<LojoEntity>('lojo/entities/show', { entityId }),
	entities: () => misskeyApi<LojoEntity[]>('lojo/entities/list', { limit: 200 }),
	notes: (entityId: string, untilId?: string) => misskeyApi<Misskey.entities.Note[]>('lojo/notes/list', { entityId, limit: 30, ...(untilId ? { untilId } : {}) }),
	link: (entityId: string, noteId: string, token: string) => misskeyApi('lojo/notes/link', { entityId, noteId }, token),
};
