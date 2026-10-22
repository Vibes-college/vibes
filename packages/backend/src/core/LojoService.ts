/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { MiLojoState } from '@/models/LojoState.js';
import { MiLojoEntity } from '@/models/LojoEntity.js';
import type { LojoEntityType } from '@/models/LojoEntity.js';
import { MiLojoEntityNote } from '@/models/LojoEntityNote.js';
import { MiNote } from '@/models/Note.js';
import { isSafeLojoJson, LOJO_STATE_MAX_BYTES } from '@/misc/lojo-json.js';
import { ApiError } from '@/server/api/error.js';
import { lojoErrors } from '@/server/api/lojo-schemas.js';

type PublicEntity = Omit<MiLojoEntity, 'updatedAt'>;

@Injectable()
export class LojoService {
	constructor(@Inject(DI.db) private db: DataSource) {}

	public async showState(userId: string) {
		const row = await this.db.getRepository(MiLojoState).findOneBy({ userId });
		return row ? { revision: row.revision, state: row.state } : { revision: 0, state: null };
	}

	public async updateState(userId: string, expectedRevision: number, state: Record<string, unknown>) {
		if (!isSafeLojoJson(state, LOJO_STATE_MAX_BYTES)) throw new ApiError(lojoErrors.invalidState);
		// A conditional INSERT/UPDATE provides an atomic compare-and-swap, including two first saves.
		const rows: { revision: number }[] = expectedRevision === 0
			? await this.db.query('INSERT INTO "lojo_state" ("userId", "revision", "state", "updatedAt") VALUES ($1, 1, $2::jsonb, now()) ON CONFLICT ("userId") DO NOTHING RETURNING "revision"', [userId, JSON.stringify(state)])
			: await this.db.query('WITH updated AS (UPDATE "lojo_state" SET "state" = $2::jsonb, "revision" = "revision" + 1, "updatedAt" = now() WHERE "userId" = $1 AND "revision" = $3 RETURNING "revision") SELECT "revision" FROM updated', [userId, JSON.stringify(state), expectedRevision]);
		if (rows.length === 0) throw new ApiError(lojoErrors.stateConflict);
		return { revision: rows[0].revision, state };
	}

	public packEntity(entity: MiLojoEntity): PublicEntity {
		return {
			id: entity.id, type: entity.type, title: entity.title, lat: entity.lat, lng: entity.lng,
			route: entity.route, mapLayer: entity.mapLayer, status: entity.status, data: entity.data,
		};
	}

	public async showEntity(entityId: string) {
		const entity = await this.db.getRepository(MiLojoEntity).findOneBy({ id: entityId });
		if (!entity) throw new ApiError(lojoErrors.noSuchEntity);
		return this.packEntity(entity);
	}

	public async listEntities(type: LojoEntityType | undefined, limit: number, offset: number) {
		const entities = await this.db.getRepository(MiLojoEntity).find({
			where: type ? { type } : {}, order: { id: 'ASC' }, take: limit, skip: offset,
		});
		return entities.map(entity => this.packEntity(entity));
	}

	public async importEntities(entities: PublicEntity[]) {
		for (const entity of entities) {
			if (!entity.id.startsWith(`${entity.type}:`) || entity.mapLayer !== entity.type || !isSafeLojoJson(entity.data, 256 * 1024)) {
				throw new ApiError(lojoErrors.invalidEntity);
			}
		}
		await this.db.getRepository(MiLojoEntity).upsert(entities.map(entity => ({ ...entity, updatedAt: new Date() })), ['id']);
		return { count: entities.length };
	}

	public async linkNote(entityId: string, noteId: string, userId: string) {
		await this.showEntity(entityId);
		const note = await this.db.getRepository(MiNote).findOneBy({ id: noteId });
		if (!note) throw new ApiError(lojoErrors.noSuchNote);
		if (note.userId !== userId) throw new ApiError(lojoErrors.notYourNote);
		// The Note stays canonical; visibility, edits and deletion are never copied into a public blob.
		await this.db.getRepository(MiLojoEntityNote).createQueryBuilder().insert()
			.values({ entityId, noteId }).orIgnore().execute();
		return { entityId, noteId };
	}
}
