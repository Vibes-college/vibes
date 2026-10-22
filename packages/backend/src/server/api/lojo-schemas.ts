/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const lojoEntityTypes = ['housing', 'food', 'pets', 'events', 'travel'] as const;

export const lojoEntityId = { type: 'string', maxLength: 128, pattern: '^(housing|food|pets|events|travel):[A-Za-z0-9_-]+$' } as const;

export const lojoStateParam = {
	type: 'object',
	additionalProperties: false,
	properties: {
		version: { type: 'integer', minimum: 1, maximum: 1 },
		discovered: { type: 'array', maxItems: 2000, items: {} },
		saved: { type: 'array', maxItems: 2000, items: {} },
		visited: { type: 'array', maxItems: 2000, items: {} },
		cards: { type: 'array', maxItems: 2000, items: {} },
		housingSaved: { type: 'array', maxItems: 2000, items: {} },
		housingCompare: { type: 'array', maxItems: 2000, items: {} },
		housingVisits: { type: 'array', maxItems: 2000, items: {} },
		housingLeads: { type: 'array', maxItems: 2000, items: {} },
		housingContactDrafts: { type: 'array', maxItems: 2000, items: {} },
		tripDrafts: { type: 'array', maxItems: 2000, items: {} },
		tripSaved: { type: 'array', maxItems: 2000, items: {} },
		tripPlans: { type: 'array', maxItems: 2000, items: {} },
		tripInvites: { type: 'array', maxItems: 2000, items: {} },
		tripReports: { type: 'array', maxItems: 2000, items: {} },
		eventBookings: { type: 'array', maxItems: 2000, items: {} },
		eventSaved: { type: 'array', maxItems: 2000, items: {} },
		createdEvents: { type: 'array', maxItems: 2000, items: {} },
		observations: { type: 'array', maxItems: 2000, items: {} },
		posts: { type: 'array', maxItems: 2000, items: {} },
		replies: { type: 'array', maxItems: 2000, items: {} },
		liked: { type: 'array', maxItems: 2000, items: {} },
		guideSaved: { type: 'array', maxItems: 2000, items: {} },
		goals: { type: 'array', maxItems: 2000, items: {} },
	},
	required: ['version'],
} as const;

export const lojoStateResponse = {
	type: 'object', optional: false, nullable: false,
	properties: {
		revision: { type: 'integer', optional: false, nullable: false },
		state: { type: 'object', optional: false, nullable: true, additionalProperties: true },
	},
} as const;

export const lojoEntityParam = {
	type: 'object', additionalProperties: false,
	properties: {
		id: lojoEntityId,
		type: { type: 'string', enum: lojoEntityTypes },
		title: { type: 'string', minLength: 1, maxLength: 200 },
		lat: { type: 'number', minimum: -90, maximum: 90 },
		lng: { type: 'number', minimum: -180, maximum: 180 },
		route: { type: 'string', minLength: 1, maxLength: 240, pattern: '^(?:/lojo)?#?(map|building|housing-reference|place|animal|event|trip|travel|route)/[A-Za-z0-9_/-]+$' },
		mapLayer: { type: 'string', enum: lojoEntityTypes },
		status: { type: 'string', enum: ['demo', 'curated'] },
		data: { type: 'object', additionalProperties: true },
	},
	required: ['id', 'type', 'title', 'lat', 'lng', 'route', 'mapLayer', 'status', 'data'],
} as const;

export const lojoEntityResponse = {
	type: 'object', optional: false, nullable: false,
	properties: {
		id: { type: 'string', optional: false, nullable: false },
		type: { type: 'string', enum: lojoEntityTypes, optional: false, nullable: false },
		title: { type: 'string', optional: false, nullable: false },
		lat: { type: 'number', optional: false, nullable: false },
		lng: { type: 'number', optional: false, nullable: false },
		route: { type: 'string', optional: false, nullable: false },
		mapLayer: { type: 'string', optional: false, nullable: false },
		status: { type: 'string', enum: ['demo', 'curated'], optional: false, nullable: false },
		data: { type: 'object', additionalProperties: true, optional: false, nullable: false },
	},
} as const;

export const lojoErrors = {
	stateConflict: { message: 'The LOJO state changed on another client. Reload before saving.', code: 'STATE_CONFLICT', id: 'af0a1789-03be-4f1a-8d3d-bc5b8d7a60fa' },
	invalidState: { message: 'LOJO state must be safe JSON within 12 MiB.', code: 'INVALID_LOJO_STATE', id: '295df086-1ace-43b3-a753-251cc708835d' },
	invalidEntity: { message: 'Invalid LOJO entity.', code: 'INVALID_LOJO_ENTITY', id: '0fd047cd-9475-43f4-bb05-272fc993015c' },
	noSuchEntity: { message: 'No such LOJO entity.', code: 'NO_SUCH_LOJO_ENTITY', id: '4b7c9f67-d534-4276-ab16-6fb9acd9808e' },
	noSuchNote: { message: 'No such note.', code: 'NO_SUCH_NOTE', id: '4e572e8b-f80e-4c18-b367-05cd40506887' },
	notYourNote: { message: 'Only the author may link this note.', code: 'NOT_YOUR_NOTE', id: '99e988aa-40ca-4e5c-a601-7a4570065480' },
} as const;
