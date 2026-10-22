/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const guideIdParam = { type: 'string', format: 'misskey:id' } as const;

export const guideAnchorParam = {
	type: 'object', additionalProperties: false,
	properties: {
		revision: { type: 'integer', minimum: 1 },
		startBlockId: { type: 'string', minLength: 1, maxLength: 80 },
		startOffset: { type: 'integer', minimum: 0, maximum: 20000 },
		endBlockId: { type: 'string', minLength: 1, maxLength: 80 },
		endOffset: { type: 'integer', minimum: 0, maximum: 20000 },
		exact: { type: 'string', minLength: 1, maxLength: 10000 },
		prefix: { type: 'string', maxLength: 200, default: '' },
		suffix: { type: 'string', maxLength: 200, default: '' },
	},
	required: ['revision', 'startBlockId', 'startOffset', 'endBlockId', 'endOffset', 'exact'],
} as const;

export const guideBlockParam = {
	type: 'object', additionalProperties: false,
	properties: {
		id: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,80}$' },
		type: { type: 'string', enum: ['heading', 'paragraph', 'image', 'video', 'audio', 'checklist', 'resource'] },
		text: { type: 'string', maxLength: 20000 },
		level: { type: 'integer', enum: [2, 3] },
		url: { type: 'string', maxLength: 2048 },
		caption: { type: 'string', maxLength: 1000 },
		items: { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 2000 } },
		resource: {
			type: 'object', additionalProperties: false,
			properties: {
				kind: { type: 'string', enum: ['tool', 'service', 'map', 'guide'] },
				title: { type: 'string', minLength: 1, maxLength: 200 },
				description: { type: 'string', maxLength: 2000 },
				url: { type: 'string', maxLength: 2048 },
				meta: { type: 'string', maxLength: 500 },
			},
			required: ['kind', 'title', 'description', 'url'],
		},
	},
	required: ['id', 'type'],
} as const;

export const guideAnchorResponse = {
	type: 'object', optional: false, nullable: true,
	properties: {
		revision: { type: 'integer', optional: false, nullable: false },
		startBlockId: { type: 'string', optional: false, nullable: false },
		startOffset: { type: 'integer', optional: false, nullable: false },
		endBlockId: { type: 'string', optional: false, nullable: false },
		endOffset: { type: 'integer', optional: false, nullable: false },
		exact: { type: 'string', optional: false, nullable: false },
		prefix: { type: 'string', optional: false, nullable: false },
		suffix: { type: 'string', optional: false, nullable: false },
	},
} as const;

export const guideBlockResponse = {
	type: 'object', optional: false, nullable: false,
	properties: {
		id: { type: 'string', optional: false, nullable: false },
		type: { type: 'string', enum: ['heading', 'paragraph', 'image', 'video', 'audio', 'checklist', 'resource'], optional: false, nullable: false },
		text: { type: 'string', optional: true, nullable: false },
		level: { type: 'integer', enum: [2, 3], optional: true, nullable: false },
		url: { type: 'string', optional: true, nullable: false },
		caption: { type: 'string', optional: true, nullable: false },
		items: { type: 'array', optional: true, nullable: false, items: { type: 'string', optional: false, nullable: false } },
		resource: {
			type: 'object', optional: true, nullable: false,
			properties: {
				kind: { type: 'string', enum: ['tool', 'service', 'map', 'guide'], optional: false, nullable: false },
				title: { type: 'string', optional: false, nullable: false },
				description: { type: 'string', optional: false, nullable: false },
				url: { type: 'string', optional: false, nullable: false },
				meta: { type: 'string', optional: true, nullable: false },
			},
		},
	},
} as const;

export const guideResponse = {
	type: 'object', optional: false, nullable: false,
	properties: {
		id: { type: 'string', optional: false, nullable: false },
		title: { type: 'string', optional: false, nullable: false },
		summary: { type: 'string', optional: false, nullable: false },
		category: { type: 'string', optional: false, nullable: false },
		city: { type: 'string', optional: false, nullable: false },
		coverUrl: { type: 'string', optional: false, nullable: true },
		status: { type: 'string', enum: ['draft', 'published'], optional: false, nullable: false },
		isDemo: { type: 'boolean', optional: false, nullable: false },
		featured: { type: 'boolean', optional: false, nullable: false },
		revision: { type: 'integer', optional: false, nullable: false },
		blocks: { type: 'array', optional: false, nullable: false, items: guideBlockResponse },
		author: { type: 'object', ref: 'UserLite', optional: false, nullable: false },
		createdAt: { type: 'string', format: 'date-time', optional: false, nullable: false },
		updatedAt: { type: 'string', format: 'date-time', optional: false, nullable: false },
		isSaved: { type: 'boolean', optional: false, nullable: false },
		commentCount: { type: 'integer', optional: false, nullable: false },
	},
} as const;

export const guideThreadResponse = {
	type: 'object', optional: false, nullable: false,
	properties: {
		id: { type: 'string', optional: false, nullable: false },
		guideId: { type: 'string', optional: false, nullable: false },
		anchor: guideAnchorResponse,
		likeCount: { type: 'integer', optional: false, nullable: false },
		isLiked: { type: 'boolean', optional: false, nullable: false },
		commentCount: { type: 'integer', optional: false, nullable: false },
		createdAt: { type: 'string', format: 'date-time', optional: false, nullable: false },
	},
} as const;

export const guideCommentResponse = {
	type: 'object', optional: false, nullable: false,
	properties: {
		id: { type: 'string', optional: false, nullable: false },
		threadId: { type: 'string', optional: false, nullable: false },
		replyToId: { type: 'string', optional: false, nullable: true },
		note: { type: 'object', ref: 'Note', optional: false, nullable: false },
		anchor: guideAnchorResponse,
	},
} as const;

export const lojoGuideErrors = {
	noSuchGuide: { message: 'No such guide.', code: 'NO_SUCH_GUIDE', id: '72ad29c4-eada-49a0-aa34-44d853a1eca1' },
	accessDenied: { message: 'Access denied.', code: 'ACCESS_DENIED', id: '8d0360f1-6da4-4ef5-ac91-34933445f322' },
	invalidGuide: { message: 'Invalid guide content.', code: 'INVALID_GUIDE', id: '02309b71-6955-48c2-acca-f2041a4060b6' },
	invalidAnchor: { message: 'Selected text does not match the guide.', code: 'INVALID_ANCHOR', id: '6c4e8c29-a1d1-4e34-9137-0075a536cc40' },
	staleGuide: { message: 'The guide has changed. Reload before saving or selecting text.', code: 'STALE_GUIDE', id: '9b8f55d5-9275-40e8-b3e7-280bf36c7c20' },
	noSuchThread: { message: 'No such guide discussion.', code: 'NO_SUCH_THREAD', id: 'f1901a65-39a0-4275-ab0b-015222aefa83' },
	noSuchComment: { message: 'No such guide comment.', code: 'NO_SUCH_COMMENT', id: '1c08de8a-4ee4-4736-a3a3-bdf4fec3e82b' },
	invalidReply: { message: 'Reply must belong to the same guide discussion.', code: 'INVALID_REPLY', id: '963ced43-916d-4911-a868-eedc566d9a46' },
	noSuchFile: { message: 'No such owned file.', code: 'NO_SUCH_FILE', id: 'ae678eb0-934b-4fcc-9468-e281098055da' },
	blocked: { message: 'Interaction is unavailable between these accounts.', code: 'YOU_HAVE_BEEN_BLOCKED', id: 'e2946e4c-958a-44b4-9ec5-6d29abe50bcf' },
	prohibitedWords: { message: 'Content contains prohibited words.', code: 'CONTAINS_PROHIBITED_WORDS', id: '9c22117a-a1bf-48d2-8a23-19fc698af55a' },
	rateLimited: { message: 'Guide content limit reached.', code: 'GUIDE_LIMIT_REACHED', id: 'fcb64fa2-35cf-4cc8-8564-99dd74b8cfb2' },
} as const;
