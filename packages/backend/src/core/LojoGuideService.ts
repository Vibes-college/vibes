/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import type { EntityManager } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { MiLojoGuide, MiLojoGuideBookmark, MiLojoGuideComment, MiLojoGuideLike, MiLojoGuideThread } from '@/models/LojoGuide.js';
import type { GuideAnchor, GuideBlock } from '@/models/LojoGuide.js';
import { MiNote } from '@/models/Note.js';
import { MiUser } from '@/models/User.js';
import type { MiLocalUser } from '@/models/User.js';
import { MiDriveFile } from '@/models/DriveFile.js';
import { MiBlocking } from '@/models/Blocking.js';
import { ApiError } from '@/server/api/error.js';
import { lojoGuideErrors } from '@/server/api/lojo-guide-schemas.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { IdService } from './IdService.js';
import { UserEntityService } from './entities/UserEntityService.js';
import { NoteEntityService } from './entities/NoteEntityService.js';
import { NoteCreateService } from './NoteCreateService.js';
import { NoteDeleteService } from './NoteDeleteService.js';
import { NotificationService } from './NotificationService.js';
import { UserBlockingService } from './UserBlockingService.js';
import { RoleService } from './RoleService.js';
import { isSafeGuideUrl, LojoGuideValidationError, validateGuideAnchor, validateGuideBlocks } from './LojoGuideValidation.js';

type Viewer = MiLocalUser | null;
type ThreadInput = { guideId: string; threadId?: string; anchor?: GuideAnchor };
type SaveInput = {
	guideId?: string;
	expectedRevision?: number;
	title: string;
	summary: string;
	category: string;
	city: string;
	coverUrl?: string | null;
	blocks: GuideBlock[];
	status: 'draft' | 'published';
	isDemo?: boolean;
};

@Injectable()
export class LojoGuideService {
	constructor(
		@Inject(DI.db) private db: DataSource,
		private idService: IdService,
		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private noteCreateService: NoteCreateService,
		private noteDeleteService: NoteDeleteService,
		private notificationService: NotificationService,
		private userBlockingService: UserBlockingService,
		private roleService: RoleService,
	) {}

	private validate<T>(fn: () => T): T {
		try {
			return fn();
		} catch (error) {
			if (error instanceof LojoGuideValidationError) {
				const key = error.code === 'STALE_GUIDE' ? 'staleGuide' : error.code === 'INVALID_ANCHOR' ? 'invalidAnchor' : 'invalidGuide';
				throw new ApiError(lojoGuideErrors[key], { reason: error.message });
			}
			throw error;
		}
	}

	private async assertNotBlocked(userId: string, otherId: string) {
		if (userId === otherId) return;
		const blocked = await Promise.all([
			this.userBlockingService.checkBlocked(userId, otherId),
			this.userBlockingService.checkBlocked(otherId, userId),
		]);
		if (blocked.some(Boolean)) throw new ApiError(lojoGuideErrors.blocked);
	}

	private async getGuide(me: Viewer, guideId: string, manager = this.db.manager, lock = false) {
		const query = manager.getRepository(MiLojoGuide).createQueryBuilder('guide').where('guide.id = :guideId', { guideId });
		if (lock) query.setLock('pessimistic_write');
		const guide = await query.getOne();
		if (!guide || (guide.status !== 'published' && guide.authorId !== me?.id)) throw new ApiError(lojoGuideErrors.noSuchGuide);
		const author = await manager.getRepository(MiUser).findOneBy({ id: guide.authorId, isSuspended: false });
		if (!author) throw new ApiError(lojoGuideErrors.noSuchGuide);
		return guide;
	}

	private async interactiveGuide(me: MiLocalUser, guideId: string, manager: EntityManager) {
		const guide = await this.getGuide(me, guideId, manager, true);
		if (guide.status !== 'published') throw new ApiError(lojoGuideErrors.accessDenied);
		await this.assertNotBlockedInTransaction(me.id, guide.authorId, manager);
		return guide;
	}

	private async assertNotBlockedInTransaction(userId: string, otherId: string, manager: EntityManager) {
		if (userId === otherId) return;
		if (await manager.getRepository(MiBlocking).existsBy([
			{ blockerId: userId, blockeeId: otherId },
			{ blockerId: otherId, blockeeId: userId },
		])) throw new ApiError(lojoGuideErrors.blocked);
	}

	private async resolveReply(guideId: string, ps: ThreadInput & { replyToId?: string }, manager: EntityManager) {
		if (!ps.replyToId) return null;
		const comment = await manager.getRepository(MiLojoGuideComment).findOne({ where: { id: ps.replyToId }, relations: { thread: true, note: true } });
		if (!comment?.note || comment.thread?.guideId !== guideId || (ps.threadId && ps.threadId !== comment.threadId)) throw new ApiError(lojoGuideErrors.invalidReply);
		if (!['public', 'home'].includes(comment.note.visibility) || !await manager.getRepository(MiUser).existsBy({ id: comment.note.userId, isSuspended: false })) throw new ApiError(lojoGuideErrors.invalidReply);
		return comment;
	}

	private commentsQuery(me: Viewer) {
		const query = this.db.getRepository(MiLojoGuideComment).createQueryBuilder('comment')
			.innerJoinAndSelect('comment.note', 'note')
			.innerJoinAndSelect('comment.thread', 'thread')
			.innerJoin(MiUser, 'author', 'author.id = note.userId')
			.where('author.isSuspended = false')
			.andWhere('note.visibility IN (:...guideVisibilities)', { guideVisibilities: ['public', 'home'] });
		if (me) {
			query.andWhere('NOT EXISTS (SELECT 1 FROM "blocking" b WHERE (b."blockerId" = :viewerId AND b."blockeeId" = note."userId") OR (b."blockeeId" = :viewerId AND b."blockerId" = note."userId"))', { viewerId: me.id });
			query.andWhere('NOT EXISTS (SELECT 1 FROM "muting" m WHERE m."muterId" = :viewerId AND m."muteeId" = note."userId")', { viewerId: me.id });
		}
		return query;
	}

	private async packGuide(guide: MiLojoGuide, me: Viewer) {
		const [author, isSaved, commentCount] = await Promise.all([
			this.userEntityService.pack(guide.authorId, me),
			me ? this.db.getRepository(MiLojoGuideBookmark).existsBy({ guideId: guide.id, userId: me.id }) : false,
			this.commentsQuery(me).andWhere('thread.guideId = :guideId', { guideId: guide.id }).getCount(),
		]);
		return {
			id: guide.id, title: guide.title, summary: guide.summary, category: guide.category, city: guide.city,
			coverUrl: guide.coverUrl, status: guide.status, isDemo: guide.isDemo, featured: guide.featured, revision: guide.revision,
			blocks: guide.blocks, author, createdAt: guide.createdAt.toISOString(), updatedAt: guide.updatedAt.toISOString(),
			isSaved, commentCount,
		};
	}

	public async list(me: Viewer, ps: { featuredOnly?: boolean; category?: string; search?: string; savedOnly?: boolean; mine?: boolean; limit: number; offset: number }) {
		if ((ps.savedOnly || ps.mine) && !me) throw new ApiError(lojoGuideErrors.accessDenied);
		const query = this.db.getRepository(MiLojoGuide).createQueryBuilder('guide')
			.innerJoin(MiUser, 'author', 'author.id = guide.authorId').where('author.isSuspended = false');
		if (ps.mine && me) query.andWhere('guide.authorId = :authorId', { authorId: me.id });
		else query.andWhere('guide.status = :status', { status: 'published' });
		if (ps.featuredOnly) query.andWhere('guide.featured = true');
		if (ps.category) query.andWhere('guide.category = :category', { category: ps.category });
		if (ps.search?.trim()) query.andWhere('(guide.title ILIKE :search OR guide.summary ILIKE :search)', { search: `%${ps.search.trim().replace(/[\\%_]/gu, '\\$&')}%` });
		if (ps.savedOnly && me) query.innerJoin(MiLojoGuideBookmark, 'bookmark', 'bookmark.guideId = guide.id AND bookmark.userId = :viewerId', { viewerId: me.id });
		if (me) {
			query.andWhere('NOT EXISTS (SELECT 1 FROM "blocking" b WHERE (b."blockerId" = :viewerId AND b."blockeeId" = guide."authorId") OR (b."blockeeId" = :viewerId AND b."blockerId" = guide."authorId"))', { viewerId: me.id });
			query.andWhere('NOT EXISTS (SELECT 1 FROM "muting" m WHERE m."muterId" = :viewerId AND m."muteeId" = guide."authorId")', { viewerId: me.id });
		}
		const guides = await query.orderBy('guide.updatedAt', 'DESC').addOrderBy('guide.id', 'DESC').take(ps.limit).skip(ps.offset).getMany();
		return Promise.all(guides.map(guide => this.packGuide(guide, me)));
	}

	public async show(me: Viewer, guideId: string) {
		return this.packGuide(await this.getGuide(me, guideId), me);
	}

	public async save(me: MiLocalUser, ps: SaveInput) {
		const blocks = this.validate(() => validateGuideBlocks(ps.blocks));
		if (!ps.title.trim() || (ps.coverUrl != null && !isSafeGuideUrl(ps.coverUrl)) || (ps.status === 'published' && blocks.length === 0)) throw new ApiError(lojoGuideErrors.invalidGuide);
		const guide = await this.db.transaction(async manager => {
			let previous: MiLojoGuide | null = null;
			if (ps.guideId) {
				previous = await this.getGuide(me, ps.guideId, manager, true);
				if (previous.authorId !== me.id) throw new ApiError(lojoGuideErrors.accessDenied);
				if (ps.expectedRevision !== previous.revision) throw new ApiError(lojoGuideErrors.staleGuide);
				// Public discussions remain public Notes. A published guide cannot be made a private draft.
				if (previous.status === 'published' && ps.status === 'draft') throw new ApiError(lojoGuideErrors.invalidGuide);
			} else {
				if (await manager.getRepository(MiLojoGuide).countBy({ authorId: me.id }) >= 200) throw new ApiError(lojoGuideErrors.rateLimited);
			}
			const now = new Date();
			return manager.getRepository(MiLojoGuide).save({
				id: previous?.id ?? this.idService.gen(), authorId: me.id,
				title: ps.title.trim(), summary: ps.summary.trim(), category: ps.category, city: ps.city.trim(),
				coverUrl: ps.coverUrl ?? null, status: ps.status, isDemo: ps.isDemo ?? previous?.isDemo ?? false,
				featured: previous?.featured ?? false, revision: (previous?.revision ?? 0) + 1, blocks, createdAt: previous?.createdAt ?? now, updatedAt: now,
			});
		});
		return this.packGuide(guide, me);
	}

	public async feature(me: MiLocalUser, guideId: string, featured: boolean) {
		if (!await this.roleService.isModerator(me)) throw new ApiError(lojoGuideErrors.accessDenied);
		const guide = await this.db.transaction(async manager => {
			const current = await this.getGuide(me, guideId, manager, true);
			if (current.status !== 'published') throw new ApiError(lojoGuideErrors.accessDenied);
			await manager.getRepository(MiLojoGuide).update({ id: guideId }, { featured });
			return { ...current, featured };
		});
		return this.packGuide(guide, me);
	}

	public async bookmark(me: MiLocalUser, guideId: string, saved: boolean) {
		await this.getGuide(me, guideId);
		const repository = this.db.getRepository(MiLojoGuideBookmark);
		if (saved) await repository.createQueryBuilder().insert().values({ id: this.idService.gen(), userId: me.id, guideId }).orIgnore().execute();
		else await repository.delete({ userId: me.id, guideId });
		return { saved };
	}

	private anchorKey(anchor: GuideAnchor | null) {
		return anchor ? createHash('sha256').update(JSON.stringify([
			anchor.revision, anchor.startBlockId, anchor.startOffset, anchor.endBlockId, anchor.endOffset,
		])).digest('hex') : 'article';
	}

	private async resolveThread(guide: MiLojoGuide, ps: ThreadInput, manager: EntityManager, create = true) {
		const repository = manager.getRepository(MiLojoGuideThread);
		if (ps.threadId) {
			const thread = await repository.findOneBy({ id: ps.threadId, guideId: guide.id });
			if (!thread) throw new ApiError(lojoGuideErrors.noSuchThread);
			if (ps.anchor) {
				const anchor = this.validate(() => validateGuideAnchor(guide.blocks, guide.revision, ps.anchor!));
				if (this.anchorKey(anchor) !== thread.anchorKey) throw new ApiError(lojoGuideErrors.invalidAnchor);
			}
			// Existing historical threads retain their quote; only new anchors require the current revision.
			return thread;
		}
		const anchor = ps.anchor ? this.validate(() => validateGuideAnchor(guide.blocks, guide.revision, ps.anchor!)) : null;
		const anchorKey = this.anchorKey(anchor);
		const existing = await repository.findOneBy({ guideId: guide.id, anchorKey });
		if (existing) return existing;
		if (!create) throw new ApiError(lojoGuideErrors.noSuchThread);
		if (await repository.countBy({ guideId: guide.id }) >= 1000) throw new ApiError(lojoGuideErrors.rateLimited);
		// All writers lock the guide row first; the unique index is the final concurrency guard.
		await repository.createQueryBuilder().insert().values({ id: this.idService.gen(), guideId: guide.id, anchorKey, anchor, createdAt: new Date() }).orIgnore().execute();
		return repository.findOneByOrFail({ guideId: guide.id, anchorKey });
	}

	private async packThread(thread: MiLojoGuideThread, me: Viewer) {
		const [likeCount, isLiked, commentCount] = await Promise.all([
			this.db.getRepository(MiLojoGuideLike).countBy({ threadId: thread.id }),
			me ? this.db.getRepository(MiLojoGuideLike).existsBy({ threadId: thread.id, userId: me.id }) : false,
			this.commentsQuery(me).andWhere('comment.threadId = :threadId', { threadId: thread.id }).getCount(),
		]);
		return { id: thread.id, guideId: thread.guideId, anchor: thread.anchor, likeCount, isLiked, commentCount, createdAt: thread.createdAt.toISOString() };
	}

	public async listThreads(me: Viewer, guideId: string) {
		await this.getGuide(me, guideId);
		const threads = await this.db.getRepository(MiLojoGuideThread).find({ where: { guideId }, order: { id: 'ASC' }, take: 1000 });
		if (threads.length === 0) return [];
		// Fetch counts together instead of issuing three queries for every marked sentence.
		const [likes, comments, mine] = await Promise.all([
			this.db.getRepository(MiLojoGuideLike).createQueryBuilder('like')
				.innerJoin('like.thread', 'thread').where('thread.guideId = :guideId', { guideId })
				.select('like.threadId', 'threadId').addSelect('COUNT(*)', 'count').groupBy('like.threadId').getRawMany<{ threadId: string; count: string }>(),
			this.commentsQuery(me).andWhere('thread.guideId = :guideId', { guideId })
				.select('comment.threadId', 'threadId').addSelect('COUNT(*)', 'count').groupBy('comment.threadId').getRawMany<{ threadId: string; count: string }>(),
			me ? this.db.getRepository(MiLojoGuideLike).createQueryBuilder('like')
				.innerJoin('like.thread', 'thread').where('thread.guideId = :guideId', { guideId }).andWhere('like.userId = :userId', { userId: me.id })
				.select('like.threadId', 'threadId').getRawMany<{ threadId: string }>() : [],
		]);
		const likeCounts = new Map(likes.map(row => [row.threadId, Number(row.count)]));
		const commentCounts = new Map(comments.map(row => [row.threadId, Number(row.count)]));
		const liked = new Set(mine.map(row => row.threadId));
		return threads.map(thread => ({
			id: thread.id, guideId: thread.guideId, anchor: thread.anchor, createdAt: thread.createdAt.toISOString(),
			likeCount: likeCounts.get(thread.id) ?? 0, commentCount: commentCounts.get(thread.id) ?? 0, isLiked: liked.has(thread.id),
		})).filter(thread => thread.commentCount > 0 || thread.likeCount > 0);
	}

	public async likeThread(me: MiLocalUser, ps: ThreadInput & { liked: boolean }) {
		const thread = await this.db.transaction(async manager => {
			const guide = await this.interactiveGuide(me, ps.guideId, manager);
			const resolved = await this.resolveThread(guide, ps, manager, ps.liked);
			const repository = manager.getRepository(MiLojoGuideLike);
			if (ps.liked) await repository.createQueryBuilder().insert().values({ id: this.idService.gen(), threadId: resolved.id, userId: me.id }).orIgnore().execute();
			else await repository.delete({ threadId: resolved.id, userId: me.id });
			return resolved;
		});
		return this.packThread(thread, me);
	}

	private async packComment(comment: MiLojoGuideComment, me: Viewer, thread: MiLojoGuideThread) {
		return {
			id: comment.id, threadId: comment.threadId, replyToId: comment.replyToId,
			note: await this.noteEntityService.pack(comment.note ?? comment.noteId, me), anchor: thread.anchor,
		};
	}

	public async listComments(me: Viewer, ps: { guideId: string; threadId?: string; limit: number; untilId?: string }) {
		await this.getGuide(me, ps.guideId);
		const query = this.commentsQuery(me).andWhere('thread.guideId = :guideId', { guideId: ps.guideId });
		if (ps.threadId) {
			if (!await this.db.getRepository(MiLojoGuideThread).existsBy({ id: ps.threadId, guideId: ps.guideId })) throw new ApiError(lojoGuideErrors.noSuchThread);
			query.andWhere('comment.threadId = :threadId', { threadId: ps.threadId });
		}
		if (ps.untilId) query.andWhere('comment.id < :untilId', { untilId: ps.untilId });
		const comments = await query.orderBy('comment.id', 'DESC').take(ps.limit).getMany();
		return Promise.all(comments.map(comment => this.packComment(comment, me, comment.thread!)));
	}

	public async createComment(me: MiLocalUser, ps: ThreadInput & { text: string; fileIds?: string[]; replyToId?: string }) {
		const text = ps.text.trim();
		const fileIds = ps.fileIds ?? [];
		if ((!text && fileIds.length === 0) || text.length > 3000) throw new ApiError(lojoGuideErrors.invalidGuide);
		const files = fileIds.length ? await this.db.getRepository(MiDriveFile).findBy({ id: In(fileIds), userId: me.id }) : [];
		if (files.length !== fileIds.length) throw new ApiError(lojoGuideErrors.noSuchFile);

		// Misskey's Note pipeline uses its own connections. Complete it before taking any
		// guide row lock, then revalidate and associate using one transaction connection.
		const initialGuide = await this.getGuide(me, ps.guideId);
		if (initialGuide.status !== 'published') throw new ApiError(lojoGuideErrors.accessDenied);
		await this.assertNotBlocked(me.id, initialGuide.authorId);
		const initialReply = await this.resolveReply(initialGuide.id, ps, this.db.manager);
		if (initialReply?.note) await this.assertNotBlocked(me.id, initialReply.note.userId);
		const threadId = ps.threadId ?? initialReply?.threadId;
		if (threadId) {
			await this.resolveThread(initialGuide, { ...ps, threadId }, this.db.manager, false);
		} else if (ps.anchor) {
			this.validate(() => validateGuideAnchor(initialGuide.blocks, initialGuide.revision, ps.anchor!));
		}

		let createdNote: MiNote | null = null;
		let committed = false;
		try {
			const note = await this.noteCreateService.create(me, { text: text || null, files, reply: initialReply?.note ?? null, visibility: 'home', localOnly: true });
			createdNote = note;
			const result = await this.db.transaction(async manager => {
				const guide = await this.interactiveGuide(me, ps.guideId, manager);
				const replyComment = await this.resolveReply(guide.id, ps, manager);
				if (replyComment?.note) await this.assertNotBlockedInTransaction(me.id, replyComment.note.userId, manager);
				if ((replyComment?.noteId ?? null) !== (initialReply?.noteId ?? null)) throw new ApiError(lojoGuideErrors.invalidReply);
				const thread = await this.resolveThread(guide, { ...ps, threadId }, manager);
				if (replyComment && replyComment.threadId !== thread.id) throw new ApiError(lojoGuideErrors.invalidReply);
				const comment = await manager.getRepository(MiLojoGuideComment).save({ id: this.idService.gen(), threadId: thread.id, noteId: note.id, replyToId: replyComment?.id ?? null });
				comment.note = note;
				return { guide, thread, comment, reply: replyComment?.note ?? null };
			});
			committed = true;
			if (result.guide.authorId !== me.id && result.reply?.userId !== result.guide.authorId) {
				this.notificationService.createNotification(result.guide.authorId, 'app', {
					appAccessTokenId: null,
					customHeader: '攻略有新评论',
					customBody: `[${result.guide.title.replace(/[\[\]\\]/gu, '')}](/lojo/guides/${result.guide.id})\n\n${text.slice(0, 500)}`,
					customIcon: null,
				}, me.id);
			}
			return { thread: await this.packThread(result.thread, me), comment: await this.packComment(result.comment, me, result.thread) };
		} catch (error) {
			// A failed association must not leave an orphan public Note behind.
			if (createdNote && !committed) await this.noteDeleteService.delete(me, createdNote, true).catch(() => undefined);
			if (error instanceof IdentifiableError && error.id === '689ee33f-f97c-479a-ac49-1b9f8140af99') throw new ApiError(lojoGuideErrors.prohibitedWords);
			throw error;
		}
	}

	public async deleteComment(me: MiLocalUser, commentId: string) {
		const comment = await this.db.getRepository(MiLojoGuideComment).findOne({ where: { id: commentId }, relations: { note: true } });
		if (!comment?.note) throw new ApiError(lojoGuideErrors.noSuchComment);
		if (comment.note.userId !== me.id && !await this.roleService.isModerator(me)) throw new ApiError(lojoGuideErrors.accessDenied);
		const author = await this.db.getRepository(MiUser).findOneByOrFail({ id: comment.note.userId });
		await this.noteDeleteService.delete(author, comment.note, false, me);
		return { deleted: true };
	}
}
