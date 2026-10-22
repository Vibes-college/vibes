/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'node:assert';
import { beforeAll, describe, test } from 'vitest';
import { api, castAsError, createAppToken, post, signup } from '../utils.js';
import type * as misskey from 'misskey-js';

const entity = {
	id: 'housing:lojo-test', type: 'housing' as const, title: 'LOJO test building',
	lat: 22.54, lng: 113.95, route: '/lojo#building/lojo-test', mapLayer: 'housing' as const,
	status: 'demo' as const, data: { description: 'A synthetic test entity.' },
};

describe('LOJO maps: account isolation, catalog and canonical Notes', () => {
	let admin: misskey.entities.SignupResponse;
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;

	beforeAll(async () => {
		const registered = await api('signup', { username: 'lojo_admin', password: 'test' });
		assert.strictEqual(registered.status, 200, JSON.stringify({ status: registered.status, contentType: registered.headers.get('content-type'), error: (registered.body as unknown as { error?: unknown } | null)?.error }));
		admin = registered.body;
		assert.ok(admin?.token, 'Signup did not return a token');
		alice = await signup({ username: 'lojo_alice' });
		bob = await signup({ username: 'lojo_bob' });
		const seeded = await api('lojo/entities/import', { entities: [entity] }, admin);
		assert.strictEqual(seeded.status, 200);
	}, 120000);

	test('requires a login and enforces account token scopes', async () => {
		assert.strictEqual((await api('lojo/state/show', {})).status, 401);
		const token = await createAppToken(alice, ['read:account']);
		assert.strictEqual((await api('lojo/state/show', {}, { token })).status, 200);
		assert.strictEqual((await api('lojo/state/update', { expectedRevision: 0, state: { version: 1 } }, { token })).status, 403);
	});

	test('keeps private state per actor and rejects stale writes including concurrent first saves', async () => {
		const first = await api('lojo/state/show', {}, alice);
		assert.deepStrictEqual(first.body, { revision: 0, state: null });
		const state = { version: 1, saved: ['coffee'], tripDrafts: [{ id: 'private', title: 'Only Alice' }] };
		const writes = await Promise.all([
			api('lojo/state/update', { expectedRevision: 0, state }, alice),
			api('lojo/state/update', { expectedRevision: 0, state }, alice),
		]);
		assert.deepStrictEqual(writes.map(result => result.status).sort(), [200, 400]);
		assert.strictEqual(castAsError(writes.find(result => result.status === 400)!.body).error.code, 'STATE_CONFLICT');
		assert.deepStrictEqual((await api('lojo/state/show', {}, bob)).body, { revision: 0, state: null });
		const spoof = await api('lojo/state/update', {
			expectedRevision: 0, state: { version: 1, saved: ['bob-only'] }, userId: alice.id,
		} as never, bob);
		assert.strictEqual(spoof.status, 200);
		assert.deepStrictEqual((await api('lojo/state/show', {}, alice)).body.state, state);
		const second = await api('lojo/state/update', { expectedRevision: 1, state: { ...state, saved: ['bakery'] } }, alice);
		assert.strictEqual(second.body.revision, 2);
		const stale = await api('lojo/state/update', { expectedRevision: 1, state }, alice);
		assert.strictEqual(castAsError(stale.body).error.code, 'STATE_CONFLICT');
		assert.strictEqual((await api('lojo/state/show', {}, alice)).body.revision, 2);
	});

	test('rejects unknown top-level fields, prototype keys, oversized and excessively nested JSON', async () => {
		const states = [
			{ version: 1, accessToken: 'never-store-credentials' },
			JSON.parse('{"version":1,"cards":[{"__proto__":{"polluted":true}}]}'),
			{ version: 1, cards: [{ photo: 'x'.repeat(12 * 1024 * 1024) }] },
			{ version: 1, cards: [Array.from({ length: 30 }).reduce(value => ({ child: value }), {} as object)] },
		];
		for (const state of states) {
			const response = await api('lojo/state/update', { expectedRevision: 0, state } as never, bob);
			assert.strictEqual(response.status, 400);
		}
	});

	test('only administrators can publish catalog entries and valid prefixes are enforced', async () => {
		const denied = await api('lojo/entities/import', { entities: [entity] }, alice);
		assert.strictEqual(denied.status, 403);
		const invalid = await api('lojo/entities/import', { entities: [{ ...entity, type: 'food' }] }, admin);
		assert.strictEqual(castAsError(invalid.body).error.code, 'INVALID_LOJO_ENTITY');
		const wrongRoute = await api('lojo/entities/import', { entities: [{ ...entity, route: 'https://other.example' }] }, admin);
		assert.strictEqual(wrongRoute.status, 400);
		assert.deepStrictEqual((await api('lojo/entities/show', { entityId: entity.id })).body, entity);
		assert.strictEqual((await api('lojo/entities/list', { type: 'housing' })).body.length, 1);
		assert.strictEqual((await api('lojo/entities/list', { type: 'food' })).body.length, 0);
	});

	test('links the author’s canonical Note idempotently and rejects other authors', async () => {
		const note = await post(alice, { text: 'A public building experience', localOnly: true });
		const params = { entityId: entity.id, noteId: note.id };
		assert.strictEqual((await api('lojo/notes/link', params)).status, 401);
		const denied = await api('lojo/notes/link', params, bob);
		assert.strictEqual(castAsError(denied.body).error.code, 'NOT_YOUR_NOTE');
		assert.strictEqual((await api('lojo/notes/link', params, alice)).status, 200);
		assert.strictEqual((await api('lojo/notes/link', params, alice)).status, 200);
		const notes = (await api('lojo/notes/list', { entityId: entity.id })).body;
		assert.strictEqual(notes.filter(item => item.id === note.id).length, 1);
		assert.strictEqual(notes.find(item => item.id === note.id)?.text, note.text);
		await api('notes/delete', { noteId: note.id }, alice);
		assert.ok(!(await api('lojo/notes/list', { entityId: entity.id })).body.some(item => item.id === note.id));
		// Deleting an experience does not delete the building archive.
		assert.strictEqual((await api('lojo/entities/show', { entityId: entity.id })).status, 200);
	});

	test('does not leak private, followers-only or blocked Notes through the map', async () => {
		const author = await signup();
		const viewer = await signup();
		const publicNote = await post(author, { text: 'Public local note', localOnly: true });
		const privateNote = await post(author, { text: 'Private itinerary', visibility: 'specified', visibleUserIds: [alice.id] });
		const followersNote = await post(author, { text: 'Followers only', visibility: 'followers' });
		for (const note of [publicNote, privateNote, followersNote]) {
			assert.strictEqual((await api('lojo/notes/link', { entityId: entity.id, noteId: note.id }, author)).status, 200);
		}
		const guestNotes = (await api('lojo/notes/list', { entityId: entity.id })).body;
		assert.ok(guestNotes.some(item => item.id === publicNote.id));
		assert.ok(!guestNotes.some(item => item.id === privateNote.id || item.id === followersNote.id));
		const allowedNotes = (await api('lojo/notes/list', { entityId: entity.id }, alice)).body;
		assert.ok(allowedNotes.some(item => item.id === privateNote.id));
		await api('blocking/create', { userId: author.id }, viewer);
		const blockedNotes = (await api('lojo/notes/list', { entityId: entity.id }, viewer)).body;
		assert.ok(!blockedNotes.some(item => item.userId === author.id));
	});
});

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
