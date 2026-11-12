/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { gateSkills, gateTypes } from '@/misc/lojo-gates.js';
import { WORD_SOURCES } from '@/misc/lojo-words.js';
import { questNoContent } from '@/misc/lojo-quest-content.js';

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
	// lojo/gates/import: a vocabulary or grammar question marks its own answers wrong, or a wrong answer of its tests right
	selfCheckFailed: { message: 'Some questions fail the import self-check.', code: 'GATE_SELF_CHECK_FAILED', id: '840455a4-4a71-4761-81ac-0b43205715bf' },
} as const;

const req = { optional: false, nullable: false } as const;
const nul = { optional: false, nullable: true } as const;
// only on some question types
const opt = { optional: true, nullable: false } as const;
const optNul = { optional: true, nullable: true } as const;
const integers = { type: 'array', ...req, items: { type: 'integer', ...req } } as const;
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
					type: { type: 'string', ...req, enum: gateTypes },
					skill: { type: 'string', ...req, enum: gateSkills },
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
								// spell: the word read out, and how many times it may be played
								audio: { type: 'string', ...opt },
								plays: { type: 'integer', ...opt },
								// build: the chips (options) include some that are not needed
								extra: { type: 'boolean', ...opt },
								// fix: pick the correction from options, or type it
								mode: { type: 'string', ...opt, enum: ['choose', 'type'] },
								// parse: the clauses are to be marked as well
								clauses: { type: 'boolean', ...opt },
								// translate: what the question practises
								focus: { type: 'string', ...opt },
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
					// the vocabulary and grammar sets: the question, why, and a right sentence (build, fix, translate)
					q: { type: 'string', ...optNul },
					why: { type: 'string', ...optNul },
					right: { type: 'string', ...optNul },
					// translate: what is right, what to fix (each makes it wrong), notes (misspellings and the like)
					feedback: { type: 'object', ...opt, properties: { good: strings, fix: strings, notes: strings } },
					// parse: the words of the subject and the verb, and each clause's first and last word
					key: {
						type: 'object', ...opt,
						properties: { s: integers, v: integers, c: { type: 'array', ...req, items: integers } },
					},
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

/* ---------- 生词本 spaced review (lojo/words/*) ---------- */

export const lojoWordErrors = {
	noSuchWord: { message: 'No such word in your wordbook.', code: 'NO_SUCH_WORD', id: '82bc92e0-4249-41a8-9980-0ff84804b2b8' },
	noSuchCard: { message: 'No such card in your wordbook.', code: 'NO_SUCH_CARD', id: '33a85d5d-41d9-41f0-b226-73d28428a5c1' },
	tooManyWords: { message: 'Your wordbook is full.', code: 'TOO_MANY_WORDS', id: '1e1246a9-a830-47b9-a824-c86983b84031' },
	invalidWord: { message: 'The word is empty or too long.', code: 'INVALID_WORD', id: '563f1463-04ba-4ccd-9bb4-04ff74de25b7' },
} as const;

// What a word needs to be saved: the same fields as an item of lojo/english/explain.
export const lojoWordItemParam = {
	type: 'object',
	properties: {
		text: { type: 'string', minLength: 1, maxLength: 256 },
		kind: { type: 'string', enum: ['word', 'phrase', 'idiom', 'slang', 'grammar'] },
		meaning: { type: 'string', maxLength: 1024 },
		usage: { type: 'string', maxLength: 2048 },
		example: { type: 'string', maxLength: 1024 },
		exampleZh: { type: 'string', maxLength: 1024 },
	},
	required: ['text', 'kind', 'meaning'],
} as const;

const date = { type: 'string', ...req, format: 'date-time' } as const;
export const lojoWordCardSchema = {
	type: 'object', ...req,
	properties: {
		id: { type: 'string', ...req, format: 'id' },
		wordId: { type: 'string', ...req, format: 'id' },
		kind: { type: 'string', ...req, enum: ['recognize', 'spell'] },
		state: { type: 'string', ...req, enum: ['new', 'learning', 'review', 'relearning'] },
		due: date,
		reps: { type: 'integer', ...req },
		lapses: { type: 'integer', ...req },
		lastReview: { type: 'string', ...nul, format: 'date-time' },
	},
} as const;

export const lojoWordSchema = {
	type: 'object', ...req,
	properties: {
		id: { type: 'string', ...req, format: 'id' },
		text: str,
		kind: { type: 'string', ...req, enum: ['word', 'phrase', 'idiom', 'slang', 'grammar'] },
		meaning: str,
		usage: str,
		example: str,
		exampleZh: str,
		source: { type: 'string', ...req, enum: WORD_SOURCES },
		noteId: { type: 'string', ...nul, format: 'id' },
		createdAt: date,
		recognize: lojoWordCardSchema,
		spell: lojoWordCardSchema,
	},
} as const;

// Today's reviews: the cards up now, in order, each with its word and when it would come back after each answer.
export const lojoWordTodaySchema = {
	type: 'object', ...req,
	properties: {
		queue: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: {
					word: lojoWordSchema,
					card: lojoWordCardSchema,
					// the first time this card is shown: the spelling card shows the letter boxes only then
					first: { type: 'boolean', ...req },
					next: {
						type: 'object', ...req,
						properties: { again: date, hard: date, good: date, easy: date },
					},
				},
			},
		},
		recognizeDue: { type: 'integer', ...req },
		spellDue: { type: 'integer', ...req },
		newLeft: { type: 'integer', ...req },
		newPerDay: { type: 'integer', ...req },
		reviewedToday: { type: 'integer', ...req },
		streak: { type: 'integer', ...req },
		total: { type: 'integer', ...req },
		// the next card still learning that is not up yet, when nothing else is
		later: { type: 'string', ...nul, format: 'date-time' },
	},
} as const;

// ---------- 创作讲解 (lojo/create/*) ----------

export const lojoCreateErrors = {
	unavailable: { message: 'Creator explain is not configured on this server.', code: 'LOJO_CREATE_UNAVAILABLE', id: '69b7ea9f-29f3-48a2-9e05-3aaef9f758f6' },
	failed: { message: 'Creator explain could not answer. Try again later.', code: 'LOJO_CREATE_FAILED', id: '97738b1e-843a-47bd-bbf4-fc2432bb9d3d' },
	noSuchNote: { message: 'No such note.', code: 'NO_SUCH_NOTE', id: 'e6fe95ad-d0d9-439d-b982-9a29bb41a0d6' },
	emptyNote: { message: 'This note has no text.', code: 'EMPTY_NOTE', id: 'c795cb90-3fbc-47b3-8880-c46e2e392159' },
	notASource: { message: 'For now, only your own notes and the editors\' notes can be used.', code: 'LOJO_CREATE_NOT_A_SOURCE', id: '2d15d725-a46d-4f63-b90f-ee92488a97fe' },
	plansExpired: { message: 'The plans for this note have expired. Make them again.', code: 'LOJO_CREATE_PLANS_EXPIRED', id: 'fe68264c-521c-40de-882b-95135a3c23cb' },
	quotaExceeded: { message: 'Creator explain has used up today\'s quota.', code: 'LOJO_CREATE_QUOTA_EXCEEDED', id: 'f3af4612-4c6d-47a0-bfda-e904dbd3d037' },
	invalidConfig: { message: 'Invalid creator explain config.', code: 'LOJO_CREATE_INVALID_CONFIG', id: 'a16152c9-db22-4bfc-9530-6ed7b0ec9621' },
} as const;

const createPlan = {
	type: 'object', ...req,
	properties: {
		source: { type: 'string', ...req, enum: ['ours', 'common'] },
		form: str, name: str, platform: str, medium: str, hook: str, title: str,
		beats: strings,
		why: str, fit: str, effort: str, risk: str,
	},
} as const;

export const lojoCreatePlansRes = {
	type: 'object', ...req,
	properties: {
		plans: { type: 'array', ...req, items: createPlan },
		model: str,
		at: { type: 'string', ...req, format: 'date-time' },
	},
} as const;

export const lojoCreateDraftRes = {
	type: 'object', ...req,
	properties: {
		id: str, noteId: str, noteBy: str, noteUser: str, noteText: str,
		plan: createPlan,
		formHow: str,
		input: {
			type: 'object', ...req,
			properties: { idea: str, story: str, standard: str, tone: str },
		},
		titles: strings, chosenTitle: str,
		cover: str, body: str, script: str, pin: str, ai: str,
		checks: {
			type: 'array', ...req,
			items: {
				type: 'object', ...req,
				properties: { level: { type: 'string', ...req, enum: ['must', 'warn'] }, text: str },
			},
		},
		fixed: strings,
		model: str,
		reviewed: { type: 'boolean', ...req },
		createdAt: { type: 'string', ...req, format: 'date-time' },
		updatedAt: { type: 'string', ...req, format: 'date-time' },
	},
} as const;

// 闯关 (lojo/quest/*)
export const lojoQuestErrors = {
	noSuchLevel: { message: 'No such level.', code: 'NO_SUCH_LEVEL', id: '0f7b0d39-6a4e-4d0c-9a51-6f0f1b3c2a11' },
	levelLocked: { message: 'This level is not open yet.', code: 'LEVEL_LOCKED', id: '7c2e8f61-3b4a-4f0e-8d2c-1a9e5b6c7d22' },
	noHearts: { message: 'No hearts left. Earn one back or wait for the next refill.', code: 'NO_HEARTS', id: 'b3d1e2f4-5a6b-4c7d-8e9f-0a1b2c3d4e33' },
	bossNotReady: { message: 'The Boss needs a guide, a gear set and a timeline post first.', code: 'BOSS_NOT_READY', id: 'c4e2f3a5-6b7c-4d8e-9f0a-1b2c3d4e5f44' },
	noSuchAttempt: { message: 'No such try, or it has ended.', code: 'NO_SUCH_ATTEMPT', id: 'd5f3a4b6-7c8d-4e9f-a01b-2c3d4e5f6a55' },
	wrongQuestion: { message: 'Answer the questions in order.', code: 'WRONG_QUESTION', id: 'e6a4b5c7-8d9e-4fa0-b12c-3d4e5f6a7b66' },
	noSuchBook: { message: 'No such guide in the bookshop.', code: 'NO_SUCH_BOOK', id: 'f7b5c6d8-9eaf-40b1-c23d-4e5f6a7b8c77' },
	notRetestable: { message: 'Only a passed level that has faded can be retested.', code: 'NOT_RETESTABLE', id: 'e0460462-4416-4d2d-90d7-14af868e4ecc' },
	noAudio: { message: 'This question has no recording.', code: 'NO_AUDIO', id: 'a51cf114-7082-44ab-9d53-ba4ade721be9' },
	invalidExamDate: { message: 'The exam date must be a day after today and within two years (YYYY-MM-DD).', code: 'INVALID_EXAM_DATE', id: '2982c072-7c22-4e4a-9541-457ae50f700e' },
	placementTooSoon: { message: 'The placement test can be taken once in 30 days.', code: 'PLACEMENT_TOO_SOON', id: 'e21fe3c9-26fe-4f67-be40-fdc1f9161c95' },
	placementNoFirstPart: { message: 'Hand in the first part of the placement test first.', code: 'PLACEMENT_NO_FIRST_PART', id: '986f5e1a-607b-4ec9-97a0-25834023b2df' },
	invalidContent: { message: 'The quest levels were not imported:', code: 'INVALID_QUEST_CONTENT', id: '2f6c1a8e-0d4b-4c7a-9e35-7b1d0c6f4a21' },
	noContent: questNoContent,
} as const;
