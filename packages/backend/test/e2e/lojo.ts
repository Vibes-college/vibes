/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'node:assert';
import { beforeAll, describe, test } from 'vitest';
import { api, castAsError, createAppToken, signup } from '../utils.js';
import type * as misskey from 'misskey-js';

const guideInput = {
	title: '搬家前确认费用', summary: '测试攻略', category: 'life' as const, city: '深圳', status: 'published' as const,
	blocks: [{ id: 'intro', type: 'paragraph' as const, text: '提前确认费用，并记录双方约定。' }],
};

describe('LOJO guides: persistent reading and quote discussions', () => {
	let author: misskey.entities.SignupResponse;
	let reader: misskey.entities.SignupResponse;
	let guideId: string;
	let revision: number;

	beforeAll(async () => {
		author = await signup({ username: 'guide_author' });
		reader = await signup({ username: 'guide_reader' });
		const created = await api('lojo/guides/save', guideInput, author);
		assert.strictEqual(created.status, 200);
		guideId = created.body.id;
		revision = created.body.revision;
	});

	test('drafts remain private and token scopes protect private reads', async () => {
		const draft = await api('lojo/guides/save', { ...guideInput, title: '私人草稿', status: 'draft' }, author);
		assert.strictEqual(draft.status, 200);
		assert.strictEqual((await api('lojo/guides/show', { guideId: draft.body.id }, author)).status, 200);
		assert.strictEqual(castAsError((await api('lojo/guides/show', { guideId: draft.body.id }, reader)).body).error.code, 'NO_SUCH_GUIDE');
		assert.strictEqual(castAsError((await api('lojo/guides/show', { guideId: draft.body.id })).body).error.code, 'NO_SUCH_GUIDE');
		const publicList = await api('lojo/guides/list', {});
		assert.ok(!publicList.body.some(guide => guide.id === draft.body.id));
		assert.strictEqual(castAsError((await api('lojo/guides/comments/create', { guideId: draft.body.id, text: '不应公开' }, author)).body).error.code, 'ACCESS_DENIED');
		const token = await createAppToken(author, ['read:account']);
		assert.strictEqual((await api('lojo/guides/list', { mine: true }, { token })).status, 403);
	});

	test('published guides are not automatically featured and authors cannot curate themselves', async () => {
		assert.strictEqual((await api('lojo/guides/show', { guideId })).body.featured, false);
		assert.ok(!(await api('lojo/guides/list', { featuredOnly: true })).body.some(guide => guide.id === guideId));
		assert.strictEqual((await api('lojo/guides/feature', { guideId, featured: true }, author)).status, 403);
	});

	test('bookmarks are idempotent and isolated per account', async () => {
		await Promise.all([api('lojo/guides/bookmark', { guideId, saved: true }, reader), api('lojo/guides/bookmark', { guideId, saved: true }, reader)]);
		assert.strictEqual((await api('lojo/guides/show', { guideId }, reader)).body.isSaved, true);
		assert.strictEqual((await api('lojo/guides/show', { guideId }, author)).body.isSaved, false);
		assert.strictEqual((await api('lojo/guides/list', { savedOnly: true }, reader)).body.filter(guide => guide.id === guideId).length, 1);
		await api('lojo/guides/bookmark', { guideId, saved: false }, reader);
		assert.strictEqual((await api('lojo/guides/show', { guideId }, reader)).body.isSaved, false);
	});

	test('the exact same quote shares one discussion and one like per reader', async () => {
		const anchor = { revision, startBlockId: 'intro', startOffset: 2, endBlockId: 'intro', endOffset: 6, exact: '确认费用', prefix: '', suffix: '' };
		const likes = await Promise.all([
			api('lojo/guides/threads/like', { guideId, anchor, liked: true }, reader),
			api('lojo/guides/threads/like', { guideId, anchor, liked: true }, reader),
		]);
		assert.ok(likes.every(result => result.status === 200));
		assert.strictEqual(likes[0].body.id, likes[1].body.id);
		assert.strictEqual(likes[1].body.likeCount, 1);
		const comment = await api('lojo/guides/comments/create', { guideId, anchor, text: '也确认楼层费用。' }, reader);
		assert.strictEqual(comment.status, 200);
		assert.strictEqual(comment.body.thread.id, likes[0].body.id);
		assert.strictEqual(comment.body.comment.note.localOnly, true);
		assert.strictEqual(comment.body.comment.note.visibility, 'home');
		assert.strictEqual(comment.body.thread.anchor?.exact, '确认费用');
		const reply = await api('lojo/guides/comments/create', { guideId, replyToId: comment.body.comment.id, text: '已记下。' }, author);
		assert.strictEqual(reply.status, 200);
		assert.strictEqual(reply.body.comment.note.replyId, comment.body.comment.note.id);
		const reloaded = await api('lojo/guides/threads/list', { guideId }, reader);
		assert.strictEqual(reloaded.body.find(thread => thread.id === comment.body.thread.id)?.commentCount, 2);
		const comments = await api('lojo/guides/comments/list', { guideId, threadId: comment.body.thread.id });
		assert.strictEqual(comments.body.length, 2);
		assert.ok(comments.body.every(item => item.anchor?.exact === '确认费用'));
	});

	test('forged quotes and foreign discussion replies cannot create a Note', async () => {
		const forged = await api('lojo/guides/comments/create', {
			guideId, text: '错误位置', anchor: { revision, startBlockId: 'intro', startOffset: 2, endBlockId: 'intro', endOffset: 6, exact: '错误原文' },
		}, reader);
		assert.strictEqual(castAsError(forged.body).error.code, 'INVALID_ANCHOR');
		const other = await api('lojo/guides/save', { ...guideInput, title: '另一篇攻略' }, author);
		const foreign = await api('lojo/guides/comments/create', { guideId: other.body.id, text: '另一篇讨论' }, author);
		const invalidReply = await api('lojo/guides/comments/create', { guideId, replyToId: foreign.body.comment.id, text: '不可串楼' }, reader);
		assert.strictEqual(castAsError(invalidReply.body).error.code, 'INVALID_REPLY');
	});

	test('updates preserve historical quotes and reject stale anchors and overwrites', async () => {
		const before = await api('lojo/guides/threads/list', { guideId }, reader);
		const quote = before.body.find(thread => thread.anchor)!;
		const updated = await api('lojo/guides/save', { ...guideInput, guideId, expectedRevision: revision, blocks: [{ id: 'intro', type: 'paragraph', text: '修改后的正文。' }] }, author);
		assert.strictEqual(updated.status, 200);
		assert.strictEqual(updated.body.revision, revision + 1);
		assert.strictEqual(castAsError((await api('lojo/guides/save', { ...guideInput, guideId, expectedRevision: revision }, author)).body).error.code, 'STALE_GUIDE');
		const stale = await api('lojo/guides/comments/create', { guideId, anchor: quote.anchor!, text: '过期选区' }, reader);
		assert.strictEqual(castAsError(stale.body).error.code, 'STALE_GUIDE');
		const historical = await api('lojo/guides/comments/create', { guideId, threadId: quote.id, text: '继续原句的讨论' }, reader);
		assert.strictEqual(historical.status, 200);
		assert.strictEqual(historical.body.thread.anchor?.exact, '确认费用');
	});

	test('deleting a canonical Note removes its linked comment and updates counts', async () => {
		const added = await api('lojo/guides/comments/create', { guideId, text: '稍后撤回的评论' }, reader);
		assert.strictEqual(added.status, 200);
		assert.strictEqual(castAsError((await api('lojo/guides/comments/delete', { commentId: added.body.comment.id }, author)).body).error.code, 'ACCESS_DENIED');
		await api('notes/delete', { noteId: added.body.comment.note.id }, reader);
		const remaining = await api('lojo/guides/comments/list', { guideId, threadId: added.body.thread.id });
		assert.ok(!remaining.body.some(comment => comment.id === added.body.comment.id));
	});
});
