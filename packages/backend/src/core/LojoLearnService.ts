/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 资料页「学习」标签 (2026-11-17): the learning grid, pinned graduation works and 「我是怎么学的」 on /@<username>/learn,
// and the owner's page to hand in works (/my/learn). Until 2026-11-17 this was the separate 个人主页 mini app
// (miniapps/works, its own container and schema app_works); the founder chose to make it part of the community
// (「这个功能其实是属于社区的功能…跟社区是一体的」). The lines and who-sees-what are in misc/lojo-learn.ts.
// - Local users only. No settings row = the defaults (public).
// - The grid is not stored twice: it is read from the summary index and passed quest levels (LojoAppsService.learner).
// - Handing in or changing a work adds a line to the summary index (app = works), so it counts as learning that day.

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { LojoAppsService } from '@/core/LojoAppsService.js';
import { LojoQuestService } from '@/core/LojoQuestService.js';
import { LEARN_DEFAULTS, LEARN_MAJORS, learnJourney, learnView, learnWorkInput } from '@/misc/lojo-learn.js';
import type { LearnRecord, LearnSettings, LearnWorkRow } from '@/misc/lojo-learn.js';

type LocalUser = { id: string; username: string; name: string | null; isSuspended: boolean };
export type LearnWorkIn = Parameters<typeof learnWorkInput>[1];

const EMPTY_RECORD: LearnRecord = { days: [], levels: [], joinedAt: new Date(0).toISOString() };

@Injectable()
export class LojoLearnService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.db)
		private db: DataSource,

		private lojoAppsService: LojoAppsService,
		private lojoQuestService: LojoQuestService,
	) {
	}

	private async localUser(where: { username: string } | { id: string }): Promise<LocalUser | null> {
		const [u] = await this.db.query<LocalUser[]>(
			'username' in where
				? 'SELECT "id","username","name","isSuspended" FROM "user" WHERE "usernameLower" = lower($1) AND "host" IS NULL AND "isDeleted" = false'
				: 'SELECT "id","username","name","isSuspended" FROM "user" WHERE "id" = $1 AND "host" IS NULL AND "isDeleted" = false',
			['username' in where ? where.username : where.id],
		);
		return u ?? null;
	}

	private async settings(userId: string): Promise<LearnSettings> {
		const [r] = await this.db.query<LearnSettings[]>(
			'SELECT "isPublic","sources","contact","takenDown" FROM "lojo_learn_profile" WHERE "userId" = $1', [userId],
		);
		return r ?? { ...LEARN_DEFAULTS };
	}

	private async works(userId: string): Promise<LearnWorkRow[]> {
		return await this.db.query<LearnWorkRow[]>(
			`SELECT "major","title","oneLine","items","before","after","reflection","score","journey","createdAt","updatedAt"
			 FROM "lojo_learn_work" WHERE "userId" = $1 ORDER BY "createdAt"`, [userId],
		);
	}

	private async record(userId: string): Promise<LearnRecord> {
		const L = await this.lojoAppsService.learner(userId, 371);
		return L == null ? EMPTY_RECORD : { days: L.days, levels: L.levels, joinedAt: L.joinedAt };
	}

	private shareUrl(username: string): string {
		return `${this.config.url}/@${username}/learn`;
	}

	/** The tab: anyone can read it (signed in or not); the owner also gets their status and the share card. */
	public async show(username: string, meId: string | null) {
		const u = await this.localUser({ username });
		const owner = u != null && meId === u.id;
		if (u == null || (u.isSuspended && !owner)) return { owner: false, visible: false };
		const [p, works, L, quest] = await Promise.all([
			this.settings(u.id), this.works(u.id), this.record(u.id), this.lojoQuestService.learnFacts(u.id),
		]);
		return learnView({ p, works, L, chapterTitle: quest?.chapterTitle ?? null, owner, name: u.name || u.username, shareUrl: this.shareUrl(u.username) });
	}

	/** The owner's page: settings, own works as typed, and the channels they follow (to pick 「信息」 from). */
	public async me(userId: string) {
		const u = await this.localUser({ id: userId });
		const [p, works, channels] = await Promise.all([
			this.settings(userId),
			this.works(userId),
			this.db.query<{ name: string }[]>(
				`SELECT c."name" FROM "channel_following" f JOIN "channel" c ON c."id" = f."followeeId"
				 WHERE f."followerId" = $1 ORDER BY f."id" DESC LIMIT 100`, [userId],
			),
		]);
		return {
			url: u != null ? this.shareUrl(u.username) : null,
			majors: Object.values(LEARN_MAJORS).map(m => ({ id: m.id, reflectionRequired: m.reflectionRequired })),
			settings: p,
			works: works.map(w => ({ ...w, createdAt: new Date(w.createdAt).toISOString() })),
			channels: [...new Set(channels.map(c => c.name).filter(n => n !== ''))],
		};
	}

	/** Changes the owner's settings; a field left out stays as it was. */
	public async update(userId: string, b: { isPublic?: boolean; sources?: string[]; contact?: string }): Promise<void> {
		const p = await this.settings(userId);
		const isPublic = b.isPublic ?? p.isPublic;
		const sources = b.sources != null ? [...new Set(b.sources.map(s => s.trim()).filter(s => s !== ''))].slice(0, 12) : p.sources;
		const contact = b.contact != null ? b.contact.trim() : p.contact;
		await this.db.query(
			`INSERT INTO "lojo_learn_profile" ("userId","isPublic","sources","contact") VALUES ($1,$2,$3,$4)
			 ON CONFLICT ("userId") DO UPDATE SET "isPublic" = excluded."isPublic", "sources" = excluded."sources",
			 "contact" = excluded."contact", "updatedAt" = now()`,
			[userId, isPublic, JSON.stringify(sources), contact],
		);
	}

	/** Hands in or changes the owner's work for a major (one per major). */
	public async saveWork(userId: string, major: string, b: LearnWorkIn): Promise<'empty' | 'reflection' | 'major' | 'title' | null> {
		const r = learnWorkInput(major, b);
		if ('error' in r) return r.error;
		const w = r.ok;
		const [L, quest] = await Promise.all([this.record(userId), this.lojoQuestService.learnFacts(userId)]);
		const journey = learnJourney(L, quest?.beaten ?? []);
		const j = (v: unknown) => (v == null ? null : JSON.stringify(v));
		const saved = await this.db.query<{ fresh: boolean }[]>(
			`INSERT INTO "lojo_learn_work" ("userId","major","title","oneLine","items","before","after","reflection","score","journey")
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			 ON CONFLICT ("userId","major") DO UPDATE SET "title" = excluded."title", "oneLine" = excluded."oneLine",
			 "items" = excluded."items", "before" = excluded."before", "after" = excluded."after", "reflection" = excluded."reflection",
			 "score" = excluded."score", "journey" = excluded."journey", "updatedAt" = now()
			 RETURNING ("xmax" = 0) AS "fresh"`,
			[userId, major, w.title, w.oneLine, JSON.stringify(w.items), j(w.before), j(w.after), w.reflection, j(w.score), JSON.stringify(journey)],
		);
		const zh = LEARN_MAJORS[major].zh;
		// The summary index, written directly: the works line is the community's own (no mini app to register)
		await this.db.query(
			'INSERT INTO "lojo_app_activity" ("userId","app","what","right","total","note","at") VALUES ($1,\'works\',$2,null,null,\'\',now())',
			[userId, saved[0]?.fresh ? `交了${zh}毕业作品` : `改了${zh}毕业作品`],
		);
		return null;
	}

	public async deleteWork(userId: string, major: string): Promise<void> {
		await this.db.query('DELETE FROM "lojo_learn_work" WHERE "userId" = $1 AND "major" = $2', [userId, major]);
	}

	/** Moderators: take a learner's tab down (outsiders see nothing, the owner sees 「已下架」); down: false puts it back. */
	public async takedown(username: string, down: boolean): Promise<{ username: string; takenDown: boolean } | null> {
		const u = await this.localUser({ username });
		if (u == null) return null;
		await this.db.query(
			`INSERT INTO "lojo_learn_profile" ("userId","takenDown") VALUES ($1,$2)
			 ON CONFLICT ("userId") DO UPDATE SET "takenDown" = excluded."takenDown", "updatedAt" = now()`,
			[u.id, down],
		);
		return { username: u.username, takenDown: down };
	}
}
