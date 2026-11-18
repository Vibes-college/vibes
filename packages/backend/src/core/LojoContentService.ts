/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { DataSource, LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { MiLojoContent } from '@/models/LojoContent.js';
import { COURSE_PACK_KINDS, coursePackProblems, packHash } from '@/misc/lojo-course-pack.js';
import { VOCAB_PACK_KINDS, vocabPackProblems } from '@/misc/lojo-vocab-pack.js';
import { GRAMMAR_PACK_KINDS, grammarPackProblems } from '@/misc/lojo-grammar-pack.js';
import { TYPING_PACK_KINDS, typingPackProblems } from '@/misc/lojo-typing-pack.js';
import { DICTATION_PACK_KINDS, dictationPackProblems } from '@/misc/lojo-dictation-pack.js';
import { APPS_ROSTER_KIND, appsRosterProblems, appsRosterPublic } from '@/misc/lojo-apps-roster.js';

// 内容进数据库 (2026-11-17): private content that changes fast (first the 锦囊书屋 books and quizzes, later course
// content) is imported by an admin instead of being written into the open-source code. Each kind is registered by
// the service that uses it with a check (what is wrong with a batch, in plain words) and an apply (put the version in
// use into memory). An import is checked first and refused whole if anything is wrong; every import is a new version,
// the one before stays for rollback. Every process looks for a changed version every few seconds, so no restart.

export type LojoContentKind = {
	/** what is wrong with this data (empty = fine) */
	problems: (data: unknown) => string[];
	/** put this version in use (data has passed problems()) */
	apply: (data: unknown, id: number, version: string) => void;
	/** no version imported (or the table is empty) */
	clear?: () => void;
	/**
	 * The part of a version anyone may read through lojo/content/pack (course packs). Kinds without it (the 锦囊书屋
	 * quizzes, with their answers) are never served.
	 */
	publicPart?: (data: unknown) => unknown;
};

export type LojoPublicPack = { version: string; hash: string; data: unknown };

const CHECK_MS = 5_000;

@Injectable()
export class LojoContentService implements OnModuleInit, OnApplicationShutdown {
	private kinds = new Map<string, LojoContentKind>();
	/** kind → the id of the version in memory */
	private inMemory = new Map<string, { id: number; version: string }>();
	/** kind → the public part of the version in memory (kinds with publicPart only) */
	private publicPacks = new Map<string, LojoPublicPack>();
	private timer: NodeJS.Timeout | null = null;

	constructor(
		@Inject(DI.db)
		private db: DataSource,
	) {
		// Course content that only needs to be served (lojo/content/pack) is registered here: the route packs, the word
		// lists (read by the vocabulary mini app and the gate result page), the grammar lessons (the 语法课 mini app), the
		// typing line (the 机考打字 mini app), and the dictation sets (the 听写 mini app).
		const served = (problems: (data: unknown) => string[]): LojoContentKind => ({ problems, apply: () => {}, publicPart: data => (data as { pack: unknown }).pack });
		for (const kind of COURSE_PACK_KINDS) this.register(kind, served(coursePackProblems));
		for (const kind of VOCAB_PACK_KINDS) this.register(kind, served(vocabPackProblems));
		for (const kind of GRAMMAR_PACK_KINDS) this.register(kind, served(grammarPackProblems));
		for (const kind of TYPING_PACK_KINDS) this.register(kind, served(typingPackProblems));
		for (const kind of DICTATION_PACK_KINDS) this.register(kind, served(dictationPackProblems));
		// the 小程序 launcher's roster: anyone may read the entries that are on (lojo-apps-roster.ts)
		this.register(APPS_ROSTER_KIND, { problems: appsRosterProblems, apply: () => {}, publicPart: appsRosterPublic });
	}

	/** Call from the constructor of the service that uses the kind. */
	public register(kind: string, k: LojoContentKind): void {
		this.kinds.set(kind, k);
	}

	public has(kind: string): boolean {
		return this.kinds.has(kind);
	}

	public kindNames(): string[] {
		return [...this.kinds.keys()].sort();
	}

	async onModuleInit(): Promise<void> {
		await this.refresh().catch(() => { /* table not there yet (before the migration): the timer tries again */ });
		this.timer = setInterval(() => void this.refresh().catch(() => {}), CHECK_MS);
		this.timer.unref();
	}

	onApplicationShutdown(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}

	// One small query for every kind; the data only for a kind whose version changed.
	public async refresh(only?: string): Promise<void> {
		if (this.kinds.size === 0) return;
		const heads: { id: number; kind: string }[] = await this.db.query('SELECT DISTINCT ON ("kind") "id", "kind" FROM "lojo_content" WHERE "active" ORDER BY "kind", "id" DESC');
		const active = new Map(heads.map(h => [h.kind, h.id]));
		for (const [kind, k] of this.kinds) {
			if (only != null && kind !== only) continue;
			const id = active.get(kind);
			if (id == null) {
				if (this.inMemory.has(kind)) {
					this.inMemory.delete(kind);
					this.publicPacks.delete(kind);
					k.clear?.();
				}
				continue;
			}
			if (this.inMemory.get(kind)?.id === id) continue;
			const row = await this.db.getRepository(MiLojoContent).findOneBy({ id });
			if (row == null) continue;
			// a row put in by hand that fails the check is skipped: the version in memory stays
			if (k.problems(row.data).length > 0) continue;
			this.use(kind, k, row.data, row.id, row.version);
		}
	}

	// Check a batch and, if every check passes, make it the version in use. Nothing is written otherwise.
	public async import(kind: string, data: unknown, version: string, note: string): Promise<{ id: number; kind: string; version: string; from: number | null } | { problems: string[] }> {
		const k = this.kinds.get(kind);
		if (k == null) return { problems: [`没有这种内容: ${kind}`] };
		const problems = k.problems(data);
		if (problems.length > 0) return { problems };
		await this.refresh(kind);
		const from = this.inMemory.get(kind)?.id ?? null;
		const v = version.slice(0, 256);
		const id = await this.db.transaction(async em => {
			await em.query('LOCK TABLE "lojo_content" IN EXCLUSIVE MODE');
			await em.update(MiLojoContent, { kind, active: true }, { active: false });
			const saved = await em.save(MiLojoContent, em.create(MiLojoContent, { kind, version: v, data, active: true, createdAt: new Date(), note: note.slice(0, 512) }));
			return saved.id;
		});
		this.use(kind, k, data, id, v);
		return { id, kind, version: v, from };
	}

	// Go back to the version before the one in use (or to a given one of the same kind). The newer row stays.
	public async rollback(kind: string, to: number | null): Promise<{ id: number; kind: string; version: string; from: number | null } | { problems: string[] }> {
		const k = this.kinds.get(kind);
		if (k == null) return { problems: [`没有这种内容: ${kind}`] };
		await this.refresh(kind);
		const repo = this.db.getRepository(MiLojoContent);
		const current = this.inMemory.get(kind)?.id ?? null;
		const target = to != null
			? await repo.findOneBy({ id: to, kind })
			: current == null ? null : await repo.findOne({ where: { kind, id: LessThan(current) }, order: { id: 'DESC' } });
		if (target == null) return { problems: [to != null ? `${kind} 没有版本 ${to}` : `${kind} 没有更早的版本可以退回`] };
		// the rules may have changed since that version was imported
		const problems = k.problems(target.data);
		if (problems.length > 0) return { problems };
		await this.db.transaction(async em => {
			await em.query('LOCK TABLE "lojo_content" IN EXCLUSIVE MODE');
			await em.update(MiLojoContent, { kind, active: true }, { active: false });
			await em.update(MiLojoContent, { id: target.id }, { active: true });
		});
		this.use(kind, k, target.data, target.id, target.version);
		return { id: target.id, kind, version: target.version, from: current };
	}

	// The versions of one kind, newest first (the last 30), for the import script's list
	public async versions(kind: string): Promise<{ id: number; version: string; active: boolean; createdAt: string; note: string }[]> {
		const rows = await this.db.getRepository(MiLojoContent).find({ where: { kind }, select: { id: true, version: true, active: true, createdAt: true, note: true }, order: { id: 'DESC' }, take: 30 });
		return rows.map(r => ({ id: r.id, version: r.version, active: r.active, createdAt: r.createdAt.toISOString(), note: r.note }));
	}

	private use(kind: string, k: LojoContentKind, data: unknown, id: number, version: string): void {
		k.apply(data, id, version);
		this.inMemory.set(kind, { id, version });
		if (k.publicPart) {
			const part = k.publicPart(data);
			this.publicPacks.set(kind, { version, hash: packHash(part), data: part });
		}
	}

	/** Whether anyone may read this kind (lojo/content/pack). */
	public isPublic(kind: string): boolean {
		return this.kinds.get(kind)?.publicPart != null;
	}

	/** The public part of the version in use; null when nothing is imported yet. */
	public publicPack(kind: string): LojoPublicPack | null {
		return this.publicPacks.get(kind) ?? null;
	}

	public inUse(kind: string): { id: number | null; version: string | null } {
		const m = this.inMemory.get(kind);
		return { id: m?.id ?? null, version: m?.version ?? null };
	}
}
