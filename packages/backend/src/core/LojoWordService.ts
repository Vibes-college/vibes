/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { MiLocalUser } from '@/models/User.js';
import type { CardKind, CardStateName, WordKind, WordSource } from '@/misc/lojo-words.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';
import { ApiError } from '@/server/api/error.js';
import { lojoWordErrors } from '@/server/api/lojo-schemas.js';

export type WordItem = { text: string; kind: WordKind; meaning: string; usage?: string; example?: string; exampleZh?: string };

export type PackedWordCard = {
	id: string;
	wordId: string;
	kind: CardKind;
	state: CardStateName;
	due: string;
	reps: number;
	lapses: number;
	lastReview: string | null;
};

export type PackedWord = {
	id: string;
	text: string;
	kind: WordKind;
	meaning: string;
	usage: string;
	example: string;
	exampleZh: string;
	source: WordSource;
	noteId: string | null;
	createdAt: string;
	recognize: PackedWordCard;
	spell: PackedWordCard;
};

export type WordToday = {
	queue: { word: PackedWord; card: PackedWordCard; first: boolean; next: { again: string; hard: string; good: string; easy: string } }[];
	recognizeDue: number;
	spellDue: number;
	newLeft: number;
	newPerDay: number;
	reviewedToday: number;
	streak: number;
	total: number;
	later: string | null;
};

export type WordStats = {
	words: number;
	dueNow: number;
	newLeft: number;
	reviewedToday: number;
	streak: number;
	lastAt: string | null;
	dueBefore?: number;
	reviewsBetween?: number;
};

const TIMEOUT_MS = 5000;
const ERRORS: Record<string, typeof lojoWordErrors[keyof typeof lojoWordErrors]> = {
	NO_SUCH_WORD: lojoWordErrors.noSuchWord,
	NO_SUCH_CARD: lojoWordErrors.noSuchCard,
	TOO_MANY_WORDS: lojoWordErrors.tooManyWords,
	INVALID_WORD: lojoWordErrors.invalidWord,
};

// 生词本 moved out of the community (小程序搬出社区, founder 2026-11-12): the words, their two FSRS cards (认得 and
// 拼写) and the reviews live in the wordbook mini app (miniapps/wordbook, its own schema app_wordbook), and the rules
// with it (a copy of misc/lojo-words.ts). This service is now a client of that app: the lojo/words/* endpoints stay as
// they were for the community's own callers (the "翻译讲解" under posts, a gate's mistakes), and 闯关 and Mia read the
// counts from here. Calls go inside the network with the shared service key, always for one learner (x-vibes-user),
// as caller "community" with wordbook:write; the app checks both again.
@Injectable()
export class LojoWordService {
	constructor(
		private lojoAppsService: LojoAppsService,
	) {
	}

	private async base(): Promise<string> {
		const app = await this.lojoAppsService.get('wordbook').catch(() => null);
		return app?.internal ?? process.env.WORDBOOK_URL ?? 'http://wordbook:8080/';
	}

	private async call<T>(userId: string, method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<T> {
		const res = await fetch(`${await this.base()}api/v1/${path}`, {
			method,
			headers: {
				'x-vibes-service': process.env.MINIAPP_SERVICE_KEY ?? '',
				'x-vibes-user': userId,
				'x-vibes-caller': 'community',
				'x-vibes-scopes': 'wordbook:write wordbook:words wordbook:reviews',
				...(body !== undefined ? { 'content-type': 'application/json' } : {}),
			},
			body: body !== undefined ? JSON.stringify(body) : undefined,
			signal: AbortSignal.timeout(TIMEOUT_MS),
			redirect: 'error',
		});
		if (res.status === 204) return undefined as T;
		const json = await res.json().catch(() => null) as any;
		if (!res.ok) {
			const known = ERRORS[json?.error?.code ?? ''];
			if (known) throw new ApiError(known);
			throw new Error(`wordbook app ${method} ${path}: ${res.status} ${json?.error?.code ?? ''}`);
		}
		return json as T;
	}

	// Every word, the newest first.
	public async list(me: Pick<MiLocalUser, 'id'>): Promise<PackedWord[]> {
		return (await this.call<{ items: PackedWord[] }>(me.id, 'GET', 'words?limit=2000')).items;
	}

	// The newest few words, for Mia.
	public async recent(userId: string, limit: number): Promise<PackedWord[]> {
		return (await this.call<{ items: PackedWord[] }>(userId, 'GET', `words?limit=${limit}`)).items;
	}

	// Saves a word unless the learner already has it; created says which.
	public async add(me: Pick<MiLocalUser, 'id'>, item: WordItem, source: WordSource, noteId: string | null): Promise<{ created: boolean; word: PackedWord }> {
		return this.call(me.id, 'POST', 'words', { item, source, noteId });
	}

	public async remove(me: Pick<MiLocalUser, 'id'>, wordId: string): Promise<void> {
		await this.call(me.id, 'DELETE', `words/${encodeURIComponent(wordId)}`);
	}

	public async import(me: Pick<MiLocalUser, 'id'>, entries: { item: WordItem; source: WordSource; noteId: string | null; addedAt: number }[]): Promise<{ added: number }> {
		return this.call(me.id, 'POST', 'words/import', { entries });
	}

	public async today(me: Pick<MiLocalUser, 'id'>, tzOffset: number): Promise<WordToday> {
		return this.call(me.id, 'GET', `today?tzOffset=${tzOffset}`);
	}

	public async review(me: Pick<MiLocalUser, 'id'>, cardId: string, rating: number, durationMs: number | null, reps: number | null, tzOffset: number): Promise<{ applied: boolean; card: PackedWordCard }> {
		return this.call(me.id, 'POST', 'reviews', { cardId, rating, durationMs, reps, tzOffset });
	}

	// The counts: words, cards up now and reviewed today (in the learner's day, tzOffset as Date#getTimezoneOffset()),
	// the streak and the last change; with dueBefore, the cards due before then; with reviewsFrom/To, the reviews then.
	public async stats(userId: string, q: { tzOffset?: number; dueBefore?: Date; reviewsFrom?: Date; reviewsTo?: Date } = {}): Promise<WordStats> {
		const qs = new URLSearchParams({ tzOffset: String(q.tzOffset ?? -480) });
		if (q.dueBefore) qs.set('dueBefore', q.dueBefore.toISOString());
		if (q.reviewsFrom && q.reviewsTo) {
			qs.set('reviewsFrom', q.reviewsFrom.toISOString());
			qs.set('reviewsTo', q.reviewsTo.toISOString());
		}
		return this.call(userId, 'GET', `stats?${qs}`);
	}
}
