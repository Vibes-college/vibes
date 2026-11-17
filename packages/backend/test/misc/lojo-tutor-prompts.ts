/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { TutorPrompts } from '@/misc/lojo-tutor-prompts.js';

// Stand-in words for the tests. The real ones are private (misc/lojo-tutor-prompts.ts); these are short markers, so a
// test can check where each piece goes without knowing what she is told.
export const testPrompts: TutorPrompts = {
	version: 'test-1',
	card: {
		name: 'Testy',
		description: 'DESC',
		personality: 'PERS',
		scenario: 'SCEN',
		first_mes: 'HELLO',
		system_prompt: '',
		post_history_instructions: '',
		extensions: { vibes: { voice: 'uk-brit' } },
	},
	system: 'SYSTEM {{name}}\n{{description}}\n{{personality}}\n{{scenario}}\n{{system_prompt}}\nRULES\n{{post_history_instructions}}\n\n{{format}}',
	formatPlain: 'FORMAT plain',
	formatQuest: 'FORMAT quest "next"',
	notesHead: 'NOTES:',
	notesEmpty: 'NOTES EMPTY',
	now: 'NOW {{now}}',
	learnerName: 'LEARNER {{name}}',
	tutorName: 'TUTOR NAME {{name}}',
	progressIntro: 'PROGRESS:',
	progressAfter: 'PROGRESS END',
	gatesIntro: 'GATES:',
	gatesAfter: 'GATES END',
	opener: 'OPENER ({{reason}})',
	recentPost: 'POST {{post}}',
	openerFirst: 'FIRST',
	openerExam: 'EXAM IN {{days}}',
	openerDaily: 'DAILY',
	recallHead: 'RECALL:',
	recallFoot: 'RECALL END',
	questNextHead: 'NEXT:',
	questNextNone: '- NEXT NONE',
	questFollowUp: 'FOLLOW UP',
	cueEmpty: 'CUE EMPTY',
	cueWriteFirst: 'CUE FIRST',
	cueQuest: 'CUE QUEST',
	notesTask: 'NOTES TASK',
};
