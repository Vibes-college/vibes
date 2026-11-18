/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Vibes' own words on the site's frame, in Chinese and English (founder 2026-11-17: the UI follows 设置 › 语言; zh-*
// gets Chinese, every other language English). Used like i18n.ts: vt.nav.quest. Content (posts, guides, questions,
// words, the mini apps' own pages) is not here and is not translated. Misskey's own words stay in i18n.ts.
// New words go here in both languages; scripts/check-vibes-i18n.mjs fails on new Chinese written straight into the
// system files.
import { agentText } from './agent.js';
import { appActionText } from './appAction.js';
import { chatText } from './chat.js';
import { learnText } from './learn.js';
import { miniAppsText } from './miniapps.js';
import { momoText } from './momo.js';
import { navText } from './nav.js';
import { postText } from './post.js';
import { settingsText } from './settings.js';
import { signupText } from './signup.js';
import { vibiText } from './vibi.js';

export const vt = {
	agent: agentText,
	appAction: appActionText,
	chat: chatText,
	learn: learnText,
	miniapps: miniAppsText,
	momo: momoText,
	nav: navText,
	post: postText,
	settings: settingsText,
	signup: signupText,
	vibi: vibiText,
};

export { vibesLang, isZhUi } from './lang.js';
