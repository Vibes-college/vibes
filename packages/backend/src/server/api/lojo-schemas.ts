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

export const lojoEnglishErrors = {
	unavailable: { message: 'The English helper is not configured on this server.', code: 'LOJO_ENGLISH_UNAVAILABLE', id: '79d4b55b-fd55-447e-a477-467c859dffa5' },
	failed: { message: 'The English helper could not answer. Try again later.', code: 'LOJO_ENGLISH_FAILED', id: 'f5feab2b-7d08-43dc-94fb-0a8c76144c22' },
	noSuchNote: { message: 'No such note.', code: 'NO_SUCH_NOTE', id: '0d2d55c3-4320-4700-953c-a2c4a1e97adc' },
	invisibleNote: { message: 'This note is not visible to you.', code: 'INVISIBLE_NOTE', id: '88c5a908-abda-42cb-985c-7aa3c81eafd3' },
	emptyNote: { message: 'This note has no text.', code: 'EMPTY_NOTE', id: '1701ecb1-46cd-4d5f-8be2-12b9cb291a80' },
	quotaExceeded: { message: 'The English helper has used up today\'s quota.', code: 'LOJO_ENGLISH_QUOTA_EXCEEDED', id: '6ea5eb7d-ccb8-4499-abf9-d8d634d78033' },
} as const;

const str = { type: 'string', optional: false, nullable: false } as const;

export const lojoEnglishExplanationRes = {
	type: 'object', optional: false, nullable: false,
	properties: {
		sourceLang: { type: 'string', optional: false, nullable: false, enum: ['en', 'zh', 'other'] },
		translation: str,
		tone: str,
		items: {
			type: 'array', optional: false, nullable: false,
			items: {
				type: 'object', optional: false, nullable: false,
				properties: {
					text: str,
					kind: { type: 'string', optional: false, nullable: false, enum: ['word', 'phrase', 'idiom', 'slang', 'grammar'] },
					meaning: str, usage: str, example: str, exampleZh: str,
				},
			},
		},
	},
} as const;

export const lojoEnglishDraftRes = {
	type: 'object', optional: false, nullable: false,
	properties: {
		sourceLang: { type: 'string', optional: false, nullable: false, enum: ['en', 'zh', 'mixed', 'other'] },
		feedback: str,
		versions: {
			type: 'array', optional: false, nullable: false,
			items: {
				type: 'object', optional: false, nullable: false,
				properties: {
					style: { type: 'string', optional: false, nullable: false, enum: ['casual', 'slang', 'formal'] },
					text: str,
					notes: {
						type: 'array', optional: false, nullable: false,
						items: { type: 'object', optional: false, nullable: false, properties: { phrase: str, explanation: str } },
					},
				},
			},
		},
	},
} as const;

export const lojoEnglishReplyIdeasRes = {
	type: 'object', optional: false, nullable: false,
	properties: {
		ideas: {
			type: 'array', optional: false, nullable: false,
			items: { type: 'object', optional: false, nullable: false, properties: { angle: str, text: str, zh: str } },
		},
	},
} as const;

export const lojoGateErrors = {
	noSuchCourse: { message: 'No such gate course on this server.', code: 'NO_SUCH_COURSE', id: 'c9e7df59-a61e-4f25-a69e-50d497fa08b3' },
	noSuchStation: { message: 'No such station on this route map.', code: 'NO_SUCH_STATION', id: 'da6e78fa-2cf8-4f9c-9958-b7d8c075d8da' },
	notReady: { message: 'This gate has no question sets yet.', code: 'GATE_NOT_READY', id: '1f404a59-5db8-4c56-91e3-561baa1dff02' },
	noSuchAttempt: { message: 'No such attempt.', code: 'NO_SUCH_ATTEMPT', id: '8541081d-f0ee-4db8-87c5-3272196dd9e4' },
	invalidCourse: { message: 'The gate course data is not valid.', code: 'INVALID_GATE_COURSE', id: '7930866a-c1aa-4870-bd1f-44e63034d7bd' },
} as const;

const req = { optional: false, nullable: false } as const;
const nul = { optional: false, nullable: true } as const;
const strings = { type: 'array', ...req, items: { type: 'string', ...req } } as const;
const gateLimit = { type: 'object', ...nul, properties: { words: { type: 'integer', ...req }, number: { type: 'boolean', ...req } } } as const;
// A reading passage: paragraphs (or figures) with their letters; `answers` (which questions each one answers) stays
// empty until the paper is handed in.
const gatePassage = {
	type: 'object', ...nul,
	properties: {
		title: { type: 'string', ...req },
		subtitle: { type: 'string', ...nul },
		paragraphs: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: {
					label: { type: 'string', ...nul },
					heading: { type: 'string', ...nul },
					text: { type: 'string', ...nul },
					image: { type: 'string', ...nul },
					caption: { type: 'string', ...nul },
					answers: { type: 'array', ...req, items: { type: 'integer', ...req } },
				},
			},
		},
		glossary: { type: 'array', ...req, items: { type: 'object', ...req, properties: { word: { type: 'string', ...req }, meaning: { type: 'string', ...req } } } },
	},
} as const;

// lojo/gates/start: the paper as the learner sees it, without answers.
export const lojoGateAttemptSchema = {
	type: 'object', ...req,
	properties: {
		attemptId: { type: 'string', ...req, format: 'misskey:id' },
		course: { type: 'string', ...req },
		station: { type: 'string', ...req },
		set: { type: 'string', ...req },
		band: { type: 'number', ...req },
		part: { type: 'integer', ...nul },
		pass: { type: 'integer', ...req },
		total: { type: 'integer', ...req },
		startedAt: { type: 'string', ...req, format: 'date-time' },
		// placement tests: which part this is; null for a gate
		stage: { type: 'string', ...nul, enum: ['first', 'high', 'low'] },
		// reading: minutes for the reading questions, from when the passage is shown
		time: { type: 'number', ...nul },
		passage: gatePassage,
		audio: {
			type: 'object', ...nul,
			properties: {
				url: { type: 'string', ...req },
				duration: { type: 'number', ...req },
				pauses: { type: 'array', ...req, items: { type: 'object', ...req, properties: { at: { type: 'number', ...req }, length: { type: 'number', ...req } } } },
			},
		},
		groups: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: {
					type: { type: 'string', ...req, enum: ['form', 'choice', 'multi', 'map', 'match', 'judge', 'bank'] },
					skill: { type: 'string', ...req, enum: ['listening', 'reading'] },
					instructions: { type: 'object', ...req, properties: { en: { type: 'string', ...req }, zh: { type: 'string', ...req } } },
					title: { type: 'string', ...nul },
					lines: strings,
					limit: gateLimit,
					image: { type: 'string', ...nul },
					letters: strings,
					options: strings,
					items: {
						type: 'array', ...req,
						items: {
							type: 'object', ...req,
							properties: {
								n: { type: 'array', ...req, items: { type: 'integer', ...req } },
								q: { type: 'string', ...nul },
								options: strings,
								choose: { type: 'integer', ...req },
								limit: gateLimit,
							},
						},
					},
				},
			},
		},
	},
} as const;

// lojo/gates/submit: the mark, with answers, the transcript and what to do next.
export const lojoGateResultSchema = {
	type: 'object', ...req,
	properties: {
		attemptId: { type: 'string', ...req, format: 'misskey:id' },
		course: { type: 'string', ...req },
		station: { type: 'string', ...req },
		set: { type: 'string', ...req },
		band: { type: 'number', ...req },
		score: { type: 'integer', ...req },
		total: { type: 'integer', ...req },
		pass: { type: 'integer', ...req },
		passed: { type: 'boolean', ...req },
		missing: { type: 'integer', ...req },
		durationMs: { type: 'integer', ...req },
		items: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: {
					n: { type: 'integer', ...req },
					correct: { type: 'boolean', ...req },
					given: { type: 'string', ...req },
					expected: { type: 'string', ...req },
					accepted: strings,
					reason: { type: 'string', ...nul, enum: ['blank', 'word-limit', 'wrong'] },
					tags: strings,
				},
			},
		},
		weak: { type: 'array', ...req, items: { type: 'object', ...req, properties: { tag: { type: 'string', ...req }, count: { type: 'integer', ...req } } } },
		passage: gatePassage,
		script: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: {
					who: { type: 'string', ...nul },
					text: { type: 'string', ...nul },
					pause: { type: 'number', ...nul },
					answers: { type: 'array', ...req, items: { type: 'integer', ...req } },
				},
			},
		},
		failStreak: { type: 'integer', ...req },
		unlocked: strings,
		next: { type: 'string', ...nul },
		// placement tests: after the first part, which second part follows; after the second, where the learner starts
		placement: {
			type: 'object', ...nul,
			properties: {
				stage: { type: 'string', ...req, enum: ['first', 'high', 'low'] },
				next: { type: 'string', ...nul, enum: ['high', 'low'] },
				placedAt: { type: 'string', ...nul },
				score: { type: 'integer', ...req },
				total: { type: 'integer', ...req },
			},
		},
		tutor: {
			type: 'object', ...nul,
			properties: { id: { type: 'string', ...req, format: 'misskey:id' }, username: { type: 'string', ...req }, name: { type: 'string', ...nul } },
		},
	},
} as const;

// lojo/gates/progress: every station of a gate map with its state for this learner.
// 同路人: who else tried a gate lately (lojo/gates/peers)
export const lojoGatePeersSchema = {
	type: 'object', ...req,
	properties: {
		total: { type: 'integer', ...req },
		users: { type: 'array', ...req, items: { type: 'object', ...req, ref: 'UserLite' } },
	},
} as const;

export const lojoGateProgressSchema = {
	type: 'object', ...req,
	properties: {
		course: { type: 'string', ...req },
		lines: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: {
					line: { type: 'integer', ...req },
					live: { type: 'boolean', ...req },
					current: { type: 'string', ...nul },
					passed: { type: 'integer', ...req },
					total: { type: 'integer', ...req },
					placement: {
						type: 'object', ...req,
						properties: {
							available: { type: 'boolean', ...req },
							station: { type: 'string', ...nul },
							at: { type: 'string', ...nul, format: 'date-time' },
						},
					},
				},
			},
		},
		stations: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: {
					id: { type: 'string', ...req },
					line: { type: 'integer', ...req },
					gate: { type: 'string', ...req },
					state: { type: 'string', ...req, enum: ['passed', 'open', 'locked', 'soon'] },
					sets: { type: 'integer', ...req },
					attempts: { type: 'integer', ...req },
					best: { type: 'integer', ...nul },
					total: { type: 'integer', ...nul },
					pass: { type: 'integer', ...nul },
					time: { type: 'number', ...nul },
					failStreak: { type: 'integer', ...req },
					passedAt: { type: 'string', ...nul, format: 'date-time' },
					via: { type: 'string', ...nul, enum: ['gate', 'higher', 'placement'] },
				},
			},
		},
		last: { type: 'object', ...nul, properties: { station: { type: 'string', ...req }, at: { type: 'string', ...req, format: 'date-time' } } },
	},
} as const;
