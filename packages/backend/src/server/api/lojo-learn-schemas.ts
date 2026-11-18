/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Shared by endpoints/lojo/learn/* (资料页「学习」标签, core/LojoLearnService.ts).

const LINK = '^https?://[^\\s<>"\']+$';
const LINK_OR_EMPTY = '^(https?://[^\\s<>"\']+)?$';

export const learnMajorParam = { type: 'string', pattern: '^[a-z0-9-]{1,32}$' } as const;

const side = (max: number) => ({
	type: 'object', nullable: true,
	properties: {
		text: { type: 'string', maxLength: max },
		image: { type: 'string', maxLength: 1000, pattern: LINK_OR_EMPTY },
	},
}) as const;

export const learnWorkParams = {
	title: { type: 'string', minLength: 1, maxLength: 40 },
	oneLine: { type: 'string', minLength: 1, maxLength: 80 },
	reflection: { type: 'string', maxLength: 6000 },
	items: {
		type: 'array', maxItems: 8,
		items: {
			type: 'object',
			properties: {
				kind: { type: 'string', enum: ['link', 'image', 'video', 'file'] },
				url: { type: 'string', maxLength: 1000, pattern: LINK },
				label: { type: 'string', maxLength: 60 },
			},
			required: ['kind', 'url'],
		},
	},
	score: side(600),
	before: side(2000),
	after: side(2000),
} as const;

export const lojoLearnErrors = {
	noSuchMajor: { message: 'This major does not take a graduation work.', code: 'NO_SUCH_MAJOR', id: '375840cb-17fd-4164-907f-77e2ad478aa1' },
	needTitle: { message: 'The title and the one line can not be blank.', code: 'NEED_TITLE', id: '9796b76c-e2e2-455a-9f53-5b4db23b14aa' },
	needReflection: { message: 'This major needs a reflection.', code: 'NEED_REFLECTION', id: '472a5a4b-937d-4836-a901-d2e8a57d2f7f' },
	emptyWork: { message: 'A work needs at least one link, image or file, or a reflection.', code: 'EMPTY_WORK', id: '5a11ab2d-201f-4efc-ae91-24b40626f5e6' },
	noSuchUser: { message: 'No such local user.', code: 'NO_SUCH_USER', id: '7803ab47-1cf5-4632-99f6-435350684f3d' },
} as const;
