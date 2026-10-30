/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@/models/User.js';
import { MiLojoWord, MiLojoWordCard, MiLojoWordReview } from '@/models/LojoWord.js';
import { IdService } from '@/core/IdService.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { CARD_KINDS, LEARN_AHEAD_MS, MAX_WORDS, NEW_WORDS_PER_DAY, QUEUE_MAX, dayEnd, dayOf, dayStart, newCard, newLeft, preview, review, stateName, streak, validKey, wordKey } from '@/misc/lojo-words.js';
import type { CardColumns, CardKind, CardStateName, WordKind, WordSource } from '@/misc/lojo-words.js';
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

type Due = { recognize: number; spell: number };
// rows without their relations: inserting a relation set to null would null the column too
type WordRow = Omit<MiLojoWord, 'user'>;
type CardRow = Omit<MiLojoWordCard, 'word' | 'user'>;

const columnsOf = (c: CardRow): CardColumns => ({
	due: c.due,
	stability: c.stability,
	difficulty: c.difficulty,
	elapsedDays: c.elapsedDays,
	scheduledDays: c.scheduledDays,
	learningSteps: c.learningSteps,
	reps: c.reps,
	lapses: c.lapses,
	state: c.state,
	lastReview: c.lastReview,
});

// 生词本: words with two FSRS cards each (认得 and 拼写), today's queue and the reviews. Rules in misc/lojo-words.ts.
@Injectable()
export class LojoWordService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,
		private idService: IdService,
	) {
	}

	private packCard(c: CardRow): PackedWordCard {
		return {
			id: c.id,
			wordId: c.wordId,
			kind: c.kind as CardKind,
			state: stateName(c.state),
			due: c.due.toISOString(),
			reps: c.reps,
			lapses: c.lapses,
			lastReview: c.lastReview?.toISOString() ?? null,
		};
	}

	private pack(w: WordRow, cards: CardRow[]): PackedWord | null {
		const recognize = cards.find(x => x.kind === 'recognize');
		const spell = cards.find(x => x.kind === 'spell');
		// a word removed while this request ran has lost its cards
		if (recognize == null || spell == null) return null;
		return {
			id: w.id,
			text: w.text,
			kind: w.kind as WordKind,
			meaning: w.meaning,
			usage: w.usage,
			example: w.example,
			exampleZh: w.exampleZh,
			source: w.source as WordSource,
			noteId: w.noteId,
			createdAt: w.createdAt.toISOString(),
			recognize: this.packCard(recognize),
			spell: this.packCard(spell),
		};
	}

	private async packMany(words: MiLojoWord[]): Promise<Map<string, PackedWord>> {
		if (words.length === 0) return new Map();
		const cards = await this.db.getRepository(MiLojoWordCard).findBy({ wordId: In(words.map(w => w.id)) });
		const byWord = new Map<string, MiLojoWordCard[]>();
		for (const c of cards) byWord.set(c.wordId, [...(byWord.get(c.wordId) ?? []), c]);
		const packed = new Map<string, PackedWord>();
		for (const w of words) {
			const p = this.pack(w, byWord.get(w.id) ?? []);
			if (p) packed.set(w.id, p);
		}
		return packed;
	}

	// Every word, the newest first.
	public async list(me: MiLocalUser): Promise<PackedWord[]> {
		const words = await this.db.getRepository(MiLojoWord).find({ where: { userId: me.id }, order: { createdAt: 'DESC', id: 'DESC' }, take: MAX_WORDS });
		const packed = await this.packMany(words);
		return words.flatMap(w => packed.get(w.id) ?? []);
	}

	private async insert(userId: string, key: string, item: WordItem, source: WordSource, noteId: string | null, createdAt: Date, now: Date): Promise<PackedWord> {
		return await this.db.transaction(async em => {
			const word: WordRow = {
				id: this.idService.gen(createdAt.getTime()),
				userId,
				key,
				text: item.text.trim(),
				kind: item.kind,
				meaning: item.meaning,
				usage: item.usage ?? '',
				example: item.example ?? '',
				exampleZh: item.exampleZh ?? '',
				source,
				noteId,
				createdAt,
			};
			await em.insert(MiLojoWord, word);
			const cards: CardRow[] = CARD_KINDS.map(kind => ({ id: this.idService.gen(now.getTime()), wordId: word.id, userId, kind, ...newCard(now) }));
			await em.insert(MiLojoWordCard, cards);
			return this.pack(word, cards)!;
		});
	}

	// Saves a word unless the learner already has it; created says which.
	public async add(me: MiLocalUser, item: WordItem, source: WordSource, noteId: string | null): Promise<{ created: boolean; word: PackedWord }> {
		const key = wordKey(item.text);
		if (!validKey(key)) throw new ApiError(lojoWordErrors.invalidWord);
		const repo = this.db.getRepository(MiLojoWord);
		const existing = await repo.findOneBy({ userId: me.id, key });
		if (existing) return { created: false, word: (await this.packMany([existing])).get(existing.id)! };
		if (await repo.countBy({ userId: me.id }) >= MAX_WORDS) throw new ApiError(lojoWordErrors.tooManyWords);
		const now = new Date();
		try {
			return { created: true, word: await this.insert(me.id, key, item, source, noteId, now, now) };
		} catch (err) {
			// the same word saved twice at once
			if (!isDuplicateKeyValueError(err)) throw err;
			const word = await repo.findOneByOrFail({ userId: me.id, key });
			return { created: false, word: (await this.packMany([word])).get(word.id)! };
		}
	}

	public async remove(me: MiLocalUser, wordId: string): Promise<void> {
		const res = await this.db.getRepository(MiLojoWord).delete({ id: wordId, userId: me.id });
		if (!res.affected) throw new ApiError(lojoWordErrors.noSuchWord);
	}

	// Words saved before the wordbook had reviews lived in the account registry; the client sends them here once.
	// They keep the time they were saved, and come in as new words, ten a day like any others.
	public async import(me: MiLocalUser, entries: { item: WordItem; source: WordSource; noteId: string | null; addedAt: number }[]): Promise<{ added: number }> {
		const repo = this.db.getRepository(MiLojoWord);
		const have = new Set((await repo.find({ where: { userId: me.id }, select: { key: true } })).map(w => w.key));
		let room = MAX_WORDS - have.size;
		let added = 0;
		const now = new Date();
		for (const e of entries) {
			const key = wordKey(e.item.text);
			if (!validKey(key) || have.has(key)) continue;
			if (room <= 0) break;
			have.add(key);
			try {
				await this.insert(me.id, key, e.item, e.source, e.noteId, new Date(Math.min(e.addedAt, now.getTime())), now);
				added++;
				room--;
			} catch (err) {
				if (!isDuplicateKeyValueError(err)) throw err;
			}
		}
		return { added };
	}

	/* ---------- today ---------- */

	// The cards up now, in this order:
	//   1. cards already seen that are due: review cards due today, learning cards whose step is over;
	//   2. 拼写 cards of words whose 认得 card has been seen (a word's spelling comes the same day);
	//   3. new words, the newest first, up to today's allowance;
	//   4. learning cards whose step ends within LEARN_AHEAD_MS, once nothing else is left.
	public async today(me: MiLocalUser, tzOffset: number, now = new Date()) {
		const start = dayStart(now, tzOffset);
		const end = dayEnd(now, tzOffset);
		const ahead = new Date(now.getTime() + LEARN_AHEAD_MS);
		const cards = this.db.getRepository(MiLojoWordCard);

		const [seen, spellNew, introduced, unseen, reviewedToday, days, total, later] = await Promise.all([
			cards.createQueryBuilder('c')
				.where('c.userId = :userId', { userId: me.id })
				.andWhere('((c.state = 2 AND c.due < :end) OR (c.state IN (1, 3) AND c.due <= :ahead))', { end, ahead })
				.orderBy('c.due', 'ASC')
				.getMany(),
			cards.createQueryBuilder('c')
				.innerJoin(MiLojoWordCard, 'r', 'r.wordId = c.wordId AND r.kind = :recognize', { recognize: 'recognize' })
				.where('c.userId = :userId', { userId: me.id })
				.andWhere('c.kind = :spell AND c.state = 0 AND r.state <> 0', { spell: 'spell' })
				.orderBy('r.lastReview', 'ASC')
				.limit(QUEUE_MAX)
				.getMany(),
			this.db.getRepository(MiLojoWordReview).createQueryBuilder('v')
				.innerJoin(MiLojoWordCard, 'c', 'c.id = v.cardId')
				.where('v.userId = :userId AND v.reviewedAt >= :start AND v.state = 0 AND c.kind = :recognize', { userId: me.id, start, recognize: 'recognize' })
				.getCount(),
			cards.createQueryBuilder('c')
				.innerJoin(MiLojoWord, 'w', 'w.id = c.wordId')
				.where('c.userId = :userId AND c.kind = :recognize AND c.state = 0', { userId: me.id, recognize: 'recognize' })
				.orderBy('w.createdAt', 'DESC')
				.limit(NEW_WORDS_PER_DAY)
				.getMany(),
			this.db.getRepository(MiLojoWordReview).createQueryBuilder('v')
				.where('v.userId = :userId AND v.reviewedAt >= :start', { userId: me.id, start })
				.getCount(),
			// the days with a review in the learner's time zone, for the streak (the last 400 days are plenty)
			this.db.query<{ day: string }[]>(
				'SELECT DISTINCT to_char(("reviewedAt" AT TIME ZONE \'UTC\') - make_interval(mins => $2), \'YYYY-MM-DD\') AS day FROM "lojo_word_review" WHERE "userId" = $1 AND "reviewedAt" > $3',
				[me.id, tzOffset, new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000)],
			),
			this.db.getRepository(MiLojoWord).countBy({ userId: me.id }),
			cards.createQueryBuilder('c')
				.select('MIN(c.due)', 'due')
				.where('c.userId = :userId AND c.state IN (1, 3) AND c.due > :ahead', { userId: me.id, ahead })
				.getRawOne<{ due: Date | null }>(),
		]);

		const left = newLeft(introduced);
		const fresh = unseen.slice(0, left);
		const dueNow = seen.filter(c => c.state === 2 || c.due <= now);
		const soon = seen.filter(c => !(c.state === 2 || c.due <= now));
		const ordered = [...dueNow, ...spellNew, ...fresh, ...soon].slice(0, QUEUE_MAX);

		const wordIds = [...new Set(ordered.map(c => c.wordId))];
		const words = wordIds.length > 0 ? await this.db.getRepository(MiLojoWord).findBy({ id: In(wordIds) }) : [];
		const packed = await this.packMany(words);
		const due: Due = { recognize: 0, spell: 0 };
		// the tiles count what is up now; cards a few minutes from their step only join the queue's end
		for (const c of [...dueNow, ...spellNew]) due[c.kind as CardKind]++;
		const next = (c: CardRow) => {
			const p = preview(columnsOf(c), now, tzOffset);
			return { again: p.again.toISOString(), hard: p.hard.toISOString(), good: p.good.toISOString(), easy: p.easy.toISOString() };
		};

		return {
			queue: ordered.flatMap(c => {
				const word = packed.get(c.wordId);
				return word ? [{ word, card: this.packCard(c), first: c.state === 0, next: next(c) }] : [];
			}),
			recognizeDue: due.recognize,
			spellDue: due.spell,
			newLeft: fresh.length,
			newPerDay: NEW_WORDS_PER_DAY,
			reviewedToday,
			streak: streak(days.map(d => d.day), dayOf(now, tzOffset)),
			total,
			later: later?.due ? new Date(later.due).toISOString() : null,
		};
	}

	// rating: 1 忘了 (again), 2 hard, 3 记得 (good), 4 easy. The spelling card is graded by the client.
	// reps is the card's review count as the client showed it: when it no longer matches, this review was already saved
	// (a retry after a lost reply, or a second tab), so the card is left as it is and applied is false.
	public async review(me: MiLocalUser, cardId: string, rating: number, durationMs: number | null, reps: number | null, tzOffset: number): Promise<{ applied: boolean; card: PackedWordCard }> {
		return await this.db.transaction(async em => {
			const card = await em.findOne(MiLojoWordCard, { where: { id: cardId, userId: me.id }, lock: { mode: 'pessimistic_write' } });
			if (card == null) throw new ApiError(lojoWordErrors.noSuchCard);
			if (reps != null && reps !== card.reps) return { applied: false, card: this.packCard(card) };
			const now = new Date();
			const r = review(columnsOf(card), now, rating, tzOffset);
			await em.update(MiLojoWordCard, { id: card.id }, r.card);
			await em.insert(MiLojoWordReview, { id: this.idService.gen(now.getTime()), cardId: card.id, userId: me.id, ...r.log, durationMs });
			return { applied: true, card: this.packCard({ ...card, ...r.card }) };
		});
	}
}
