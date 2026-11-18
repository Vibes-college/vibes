/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The sign-up dialog's frame (components/MkSignupDialog*.vue). The guild rules themselves are in lojo/guild-rules.ts.
import { pickLang } from './lang.js';

const zh = {
	title: '注册',
	rulesLead: '开打之前，看一眼公会守则。',
	guildRules: '公会守则',
	agree: '我看过了，同意',
	adult: '我已年满 18 岁',
	cancel: '算了',
	next: '下一步',
	passwordShort: (min: number, now: number) => `至少 ${min} 位，现在 ${now} 位`,
	passwordHint: (min: number) => `至少 ${min} 位，别和别的网站用同一个`,
};

const en: typeof zh = {
	title: 'Sign up',
	rulesLead: 'Before you start, take a look at the guild rules.',
	guildRules: 'Guild rules',
	agree: 'I\'ve read this and agree',
	adult: 'I am 18 or older',
	cancel: 'Not now',
	next: 'Next',
	passwordShort: (min: number, now: number) => `At least ${min} characters (${now} so far)`,
	passwordHint: (min: number) => `At least ${min} characters. Don't reuse a password from another site`,
};

export const signupTable = { zh, en };
export const signupText = pickLang(signupTable);
