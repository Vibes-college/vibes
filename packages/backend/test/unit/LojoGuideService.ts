/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { LojoGuideService } from '@/core/LojoGuideService.js';
import { MiLojoGuide, MiLojoGuideComment, MiLojoGuideThread } from '@/models/LojoGuide.js';
import { MiUser } from '@/models/User.js';
import { MiDriveFile } from '@/models/DriveFile.js';
import { MiBlocking } from '@/models/Blocking.js';
import type { MiLocalUser } from '@/models/User.js';
import type { DataSource, EntityManager } from 'typeorm';
import type { IdService } from '@/core/IdService.js';
import type { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import type { NoteCreateService } from '@/core/NoteCreateService.js';
import type { NoteDeleteService } from '@/core/NoteDeleteService.js';
import type { NotificationService } from '@/core/NotificationService.js';
import type { UserBlockingService } from '@/core/UserBlockingService.js';
import type { RoleService } from '@/core/RoleService.js';

const owner = { id: 'owner' } as MiLocalUser;
const stranger = { id: 'stranger' } as MiLocalUser;
const published: MiLojoGuide = {
	id: 'guide', authorId: owner.id, author: null, title: '搬家前', summary: '', category: 'life', city: '深圳',
	coverUrl: null, status: 'published', isDemo: false, featured: false, revision: 3,
	blocks: [{ id: 'first', type: 'paragraph', text: '确认费用' }], createdAt: new Date(), updatedAt: new Date(),
};
const input = { title: '搬家前', summary: '', category: 'life', city: '深圳', blocks: published.blocks, status: 'published' as const };

describe('LOJO guide access and comment integrity', () => {
	let service: LojoGuideService;
	let manager: ReturnType<typeof mockDeep<EntityManager>>;
	let noteCreate: ReturnType<typeof mockDeep<NoteCreateService>>;
	let noteDelete: ReturnType<typeof mockDeep<NoteDeleteService>>;
	let blocking: ReturnType<typeof mockDeep<UserBlockingService>>;
	let repositories: Map<unknown, Record<string, ReturnType<typeof vi.fn>>>;
	let query: Record<string, ReturnType<typeof vi.fn>>;
	let transactionActive: boolean;

	beforeEach(() => {
		manager = mockDeep<EntityManager>();
		const db = mockDeep<DataSource>();
		Object.defineProperty(db, 'manager', { value: manager });
		transactionActive = false;
		db.transaction.mockImplementation(async (run: unknown) => {
			transactionActive = true;
			try {
				return await (run as (m: EntityManager) => Promise<unknown>)(manager);
			} finally {
				transactionActive = false;
			}
		});
		query = { where: vi.fn(), setLock: vi.fn(), getOne: vi.fn() };
		query.where.mockReturnValue(query);
		query.setLock.mockReturnValue(query);
		query.getOne.mockResolvedValue({ ...published });
		repositories = new Map([
			[MiLojoGuide, { createQueryBuilder: vi.fn(() => query), save: vi.fn(), countBy: vi.fn().mockResolvedValue(0) }],
			[MiUser, { findOneBy: vi.fn().mockResolvedValue(owner), existsBy: vi.fn().mockResolvedValue(true) }],
			[MiBlocking, { existsBy: vi.fn().mockResolvedValue(false) }],
			[MiDriveFile, { findBy: vi.fn().mockResolvedValue([]) }],
			[MiLojoGuideThread, { findOneBy: vi.fn().mockResolvedValue(null) }],
			[MiLojoGuideComment, { findOne: vi.fn().mockResolvedValue(null), save: vi.fn() }],
		]);
		manager.getRepository.mockImplementation((entity) => repositories.get(entity) as never);
		db.getRepository.mockImplementation((entity) => repositories.get(entity) as never);
		noteCreate = mockDeep<NoteCreateService>();
		noteDelete = mockDeep<NoteDeleteService>();
		noteDelete.delete.mockResolvedValue();
		blocking = mockDeep<UserBlockingService>();
		blocking.checkBlocked.mockResolvedValue(false);
		service = new LojoGuideService(db, mockDeep<IdService>(), mockDeep<UserEntityService>(), mockDeep<NoteEntityService>(), noteCreate, noteDelete, mockDeep<NotificationService>(), blocking, mockDeep<RoleService>());
	});

	test('anonymous and unrelated readers cannot open a private draft', async () => {
		query.getOne.mockResolvedValue({ ...published, status: 'draft' });
		await expect(service.show(null, 'guide')).rejects.toMatchObject({ code: 'NO_SUCH_GUIDE' });
		await expect(service.show(stranger, 'guide')).rejects.toMatchObject({ code: 'NO_SUCH_GUIDE' });
	});

	test('anonymous users cannot enumerate private saves or their drafts', async () => {
		await expect(service.list(null, { mine: true, limit: 30, offset: 0 })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
		await expect(service.list(null, { savedOnly: true, limit: 30, offset: 0 })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	});

	test('published guides cannot be overwritten by another user', async () => {
		await expect(service.save(stranger, { ...input, guideId: 'guide', expectedRevision: 3 })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
		expect(repositories.get(MiLojoGuide)!.save).not.toHaveBeenCalled();
	});

	test('updates require the current revision to prevent lost changes', async () => {
		await expect(service.save(owner, { ...input, guideId: 'guide', expectedRevision: 2 })).rejects.toMatchObject({ code: 'STALE_GUIDE' });
		await expect(service.save(owner, { ...input, guideId: 'guide' })).rejects.toMatchObject({ code: 'STALE_GUIDE' });
	});

	test('a public guide cannot turn its public comments into a purported private draft', async () => {
		await expect(service.save(owner, { ...input, guideId: 'guide', expectedRevision: 3, status: 'draft' })).rejects.toMatchObject({ code: 'INVALID_GUIDE' });
	});

	test('drafts cannot create public Notes or quote likes, even by their owner', async () => {
		query.getOne.mockResolvedValue({ ...published, status: 'draft' });
		await expect(service.createComment(owner, { guideId: 'guide', text: '意见' })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
		await expect(service.likeThread(owner, { guideId: 'guide', liked: true })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
		expect(noteCreate.create).not.toHaveBeenCalled();
	});

	test('either direction of blocking prevents new interaction', async () => {
		blocking.checkBlocked.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
		await expect(service.createComment(stranger, { guideId: 'guide', text: '意见' })).rejects.toMatchObject({ code: 'YOU_HAVE_BEEN_BLOCKED' });
		expect(noteCreate.create).not.toHaveBeenCalled();
	});

	test('quote likes check blocking using the active transaction connection', async () => {
		repositories.get(MiBlocking)!.existsBy.mockResolvedValue(true);
		await expect(service.likeThread(stranger, { guideId: 'guide', liked: true })).rejects.toMatchObject({ code: 'YOU_HAVE_BEEN_BLOCKED' });
		expect(blocking.checkBlocked).not.toHaveBeenCalled();
	});

	test('ordinary authors cannot place their own guide into the curated homepage', async () => {
		await expect(service.feature(owner, 'guide', true)).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	});

	test('comments cannot attach another account’s files', async () => {
		await expect(service.createComment(owner, { guideId: 'guide', text: '', fileIds: ['foreign-file'] })).rejects.toMatchObject({ code: 'NO_SUCH_FILE' });
		expect(noteCreate.create).not.toHaveBeenCalled();
	});

	test('reply IDs from a different guide are rejected before creating a Note', async () => {
		repositories.get(MiLojoGuideComment)!.findOne.mockResolvedValue({ id: 'reply', threadId: 'thread', thread: { guideId: 'other' }, note: { userId: owner.id } });
		await expect(service.createComment(owner, { guideId: 'guide', text: '意见', replyToId: 'reply' })).rejects.toMatchObject({ code: 'INVALID_REPLY' });
		expect(noteCreate.create).not.toHaveBeenCalled();
	});

	test('reply IDs from a different thread are rejected', async () => {
		repositories.get(MiLojoGuideComment)!.findOne.mockResolvedValue({ id: 'reply', threadId: 'other-thread', thread: { guideId: 'guide' }, note: { userId: owner.id } });
		await expect(service.createComment(owner, { guideId: 'guide', threadId: 'thread', text: '意见', replyToId: 'reply' })).rejects.toMatchObject({ code: 'INVALID_REPLY' });
	});

	test('a thread belonging to a different guide cannot be used', async () => {
		await expect(service.createComment(owner, { guideId: 'guide', threadId: 'foreign-thread', text: '意见' })).rejects.toMatchObject({ code: 'NO_SUCH_THREAD' });
		expect(repositories.get(MiLojoGuideThread)!.findOneBy).toHaveBeenCalledWith({ id: 'foreign-thread', guideId: 'guide' });
		expect(noteCreate.create).not.toHaveBeenCalled();
	});

	test('failed thread association compensates for a newly created Note', async () => {
		const note = { id: 'new-note', userId: owner.id };
		repositories.get(MiLojoGuideThread)!.findOneBy.mockResolvedValue({ id: 'thread', guideId: 'guide', anchor: null });
		noteCreate.create.mockImplementation(async () => {
			expect(transactionActive, 'Note creation must not run while holding a guide transaction connection').toBe(false);
			return note as never;
		});
		repositories.get(MiLojoGuideComment)!.save.mockRejectedValue(new Error('database write failed'));
		await expect(service.createComment(owner, { guideId: 'guide', threadId: 'thread', text: '意见' })).rejects.toThrow('database write failed');
		expect(noteDelete.delete).toHaveBeenCalledWith(owner, note, true);
	});
});
