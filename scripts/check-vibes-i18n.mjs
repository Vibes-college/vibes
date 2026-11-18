/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// @ts-check
/**
 * Vibes: system UI words go through our own translation table (packages/frontend/src/lojo/locales/), never hard-coded
 * Chinese. Rule from the founder, 2026-11-17: the UI follows the language picked in settings; zh-* shows Chinese and
 * every other language shows English. Upstream words keep using i18n.ts (locales/*.yml, Crowdin).
 *
 * Only the system parts are checked: sidebar, bottom bar, site icon menu, settings, profile page, mini-app panel shell,
 * Momo chat, sign-up, site-wide notices and errors (SYSTEM below). Quests, learning pages, mini-app insides, guides and
 * the studio are content and are not checked.
 *
 * A line fails when, outside comments, it has a Chinese character and is not in the baseline (scripts/vibes-i18n-baseline.json,
 * the lines that were there on 2026-11-17 and still wait to be moved). Lines with Japanese kana are upstream and skipped.
 * A line that must stay Chinese (a message marker the server or the agent sends, a word list checked in any language)
 * carries a `vibes-i18n-keep: <why>` comment.
 *
 * Usage:
 *   node scripts/check-vibes-i18n.mjs            check (exit 1 on new hard-coded Chinese)
 *   node scripts/check-vibes-i18n.mjs --update   rewrite the baseline to what is there now (after moving lines out)
 *   node scripts/check-vibes-i18n.mjs --list     print every line still in the baseline
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'packages/frontend/src';
const BASELINE = join(ROOT, 'scripts/vibes-i18n-baseline.json');

// The system parts (paths under packages/frontend/src). A directory covers everything below it.
const SYSTEM = [
	'ui',
	'navbar.ts',
	'os.ts',
	'components/global',
	'components/MkMiniAppsLaunchPad.vue',
	'components/MkMiniAppIntro.vue',
	'components/MkSignupDialog.vue',
	'components/MkSignupDialog.form.vue',
	'components/MkSignupDialog.rules.vue',
	'components/MkUserSetupDialog.vue',
	'components/MkChatVoice.vue',
	'components/MkPostForm.vue',
	'components/MkUrlPreview.vue',
	'components/MkLojoEnglishBar.vue',
	'components/MkLojoEnglishCompose.vue',
	'components/MkNote.vue',
	'components/MkNoteDetailed.vue',
	'components/MkNotification.vue',
	'components/MkNotifications.vue',
	'components/MkDialog.vue',
	'components/MkToast.vue',
	'components/lojo/MkLojoInstallPrompt.vue',
	'pages/settings',
	'pages/user',
	'pages/chat',
	'pages/timeline.vue',
	'pages/notifications.vue',
	'pages/_error_.vue',
	'pages/admin/index.vue',
	'pages/not-found.vue',
	'utility/misskey-api.ts',
	'lojo/agent',
	'lojo/apps',
	'lojo/tutor',
	'lojo/plan',
	'lojo/miniapps',
	'lojo/install',
	'lojo/learn',
	'lojo/instance-menu.ts',
	'lojo/menu-default.ts',
	'lojo/boot-notices.ts',
	'lojo/later-ui.ts',
	'lojo/app-overlay.ts',
	'lojo/AppOverlay.vue',
	'lojo/english/api.ts',
	'lojo/english/speech.ts',
];

// Inside SYSTEM but allowed to hold Chinese: the translation table itself, and files that already pick zh or en
// themselves (both languages side by side). Content files (guild rules) are not UI words.
const ALLOWED = [
	'lojo/locales',
	'lojo/plan/strings.ts',
	'lojo/tutor/usage-text.ts',
	'lojo/install/labels.ts',
	'lojo/guild-rules.ts',
];

const EXTS = ['.ts', '.vue', '.js', '.mjs'];
const HAN = /[㐀-䶿一-鿿豈-﫿]/;
const KANA = /[ぁ-ゖァ-ヺ]/;
const KEEP = 'vibes-i18n-keep';

const under = (/** @type {string} */ p, /** @type {string[]} */ list) => list.some(x => p === x || p.startsWith(x + '/'));

/** @returns {string[]} */
function systemFiles() {
	/** @type {string[]} */
	const out = [];
	const walk = (/** @type {string} */ rel) => {
		const abs = join(ROOT, SRC, rel);
		if (!existsSync(abs)) return;
		if (statSync(abs).isDirectory()) {
			for (const name of readdirSync(abs).sort()) walk(rel === '' ? name : `${rel}/${name}`);
			return;
		}
		if (!EXTS.some(e => rel.endsWith(e))) return;
		if (/\.(test|spec|stories)\.|\.d\.ts$/.test(rel)) return;
		if (under(rel, ALLOWED)) return;
		out.push(rel);
	};
	for (const p of SYSTEM) walk(p);
	return [...new Set(out)];
}

// Blank out JS/TS comments, keeping strings, regex literals and line breaks where they were.
function stripJs(/** @type {string} */ src) {
	let out = '';
	let i = 0;
	/** @type {('code'|'tpl')[]} */
	const stack = ['code'];
	/** @type {number[]} */
	const braces = [0];
	let prev = ''; // last significant code character
	let word = ''; // last identifier, for `return /re/`
	const blank = (/** @type {string} */ s) => s.replace(/[^\n]/g, ' ');
	while (i < src.length) {
		const c = src[i];
		const top = stack[stack.length - 1];
		if (top === 'tpl') {
			if (c === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
			if (c === '`') { out += c; i++; stack.pop(); braces.pop(); prev = '`'; continue; }
			if (c === '$' && src[i + 1] === '{') { out += '${'; i += 2; stack.push('code'); braces.push(0); prev = '{'; continue; }
			out += c; i++; continue;
		}
		if (c === '/' && src[i + 1] === '/') {
			const end = src.indexOf('\n', i);
			const stop = end === -1 ? src.length : end;
			out += blank(src.slice(i, stop)); i = stop; continue;
		}
		if (c === '/' && src[i + 1] === '*') {
			const end = src.indexOf('*/', i + 2);
			const stop = end === -1 ? src.length : end + 2;
			out += blank(src.slice(i, stop)); i = stop; continue;
		}
		if (c === '\'' || c === '"') {
			let j = i + 1;
			while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
			out += src.slice(i, j + 1); i = j + 1; prev = c; word = ''; continue;
		}
		if (c === '`') { out += c; i++; stack.push('tpl'); braces.push(0); continue; }
		if (c === '/') {
			const regexStart = prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || ['return', 'typeof', 'case', 'in', 'of', 'void', 'delete', 'throw', 'else', 'do'].includes(word);
			if (regexStart) {
				let j = i + 1;
				let cls = false;
				while (j < src.length && src[j] !== '\n') {
					if (src[j] === '\\') { j += 2; continue; }
					if (src[j] === '[') cls = true;
					else if (src[j] === ']') cls = false;
					else if (src[j] === '/' && !cls) break;
					j++;
				}
				out += src.slice(i, j + 1); i = j + 1; prev = '/'; word = ''; continue;
			}
		}
		if (c === '{') braces[braces.length - 1]++;
		if (c === '}') {
			if (braces[braces.length - 1] === 0 && stack.length > 1) { out += c; i++; stack.pop(); braces.pop(); prev = '}'; continue; }
			braces[braces.length - 1]--;
		}
		if (/[A-Za-z_$0-9]/.test(c)) word = /[A-Za-z_$0-9]/.test(prev) ? word + c : c;
		else if (!/\s/.test(c)) word = '';
		if (!/\s/.test(c)) prev = c;
		out += c; i++;
	}
	return out;
}

// Blank out HTML comments in a template, keeping line breaks.
function stripHtml(/** @type {string} */ src) {
	return src.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
}

// The lines of a file as checked: comments blanked, style blocks dropped.
function codeLines(/** @type {string} */ rel, /** @type {string} */ text) {
	if (!rel.endsWith('.vue')) return stripJs(text).split('\n');
	const raw = text.split('\n');
	/** @type {string[]} */
	const out = new Array(raw.length).fill('');
	let mode = 'tpl';
	let start = 0;
	const flush = (/** @type {number} */ end) => {
		const part = raw.slice(start, end).join('\n');
		if (mode === 'style') return;
		const done = (mode === 'script' ? stripJs(part) : stripHtml(part)).split('\n');
		done.forEach((l, k) => { out[start + k] = l; });
	};
	raw.forEach((line, n) => {
		if (/^<script\b/.test(line) || /^<style\b/.test(line)) { flush(n); mode = line.startsWith('<script') ? 'script' : 'style'; start = n + 1; return; }
		if (/^<\/(script|style)>/.test(line)) { flush(n); mode = 'tpl'; start = n + 1; }
	});
	flush(raw.length);
	// Search words in settings (SearchMarker :keywords) are matched against what people type, in any language.
	return out.map(l => l.replace(/:keywords="[^"]*"/g, ''));
}

function findings() {
	/** @type {Record<string, { line: number, text: string }[]>} */
	const by = {};
	for (const rel of systemFiles()) {
		const text = readFileSync(join(ROOT, SRC, rel), 'utf8');
		const raw = text.split('\n');
		const code = codeLines(rel, text);
		code.forEach((l, n) => {
			if (!HAN.test(l)) return;
			if (raw[n].includes(KEEP) || KANA.test(raw[n])) return;
			(by[rel] ??= []).push({ line: n + 1, text: raw[n].trim() });
		});
	}
	return by;
}

const args = process.argv.slice(2);
const found = findings();

if (args.includes('--update')) {
	/** @type {Record<string, string[]>} */
	const base = {};
	for (const [f, list] of Object.entries(found)) base[f] = list.map(x => x.text);
	writeFileSync(BASELINE, JSON.stringify(base, null, '\t') + '\n');
	const n = Object.values(base).reduce((a, l) => a + l.length, 0);
	console.log(`vibes-i18n: baseline rewritten, ${n} lines in ${Object.keys(base).length} files still to move.`);
	process.exit(0);
}

/** @type {Record<string, string[]>} */
const base = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};

if (args.includes('--list')) {
	for (const [f, list] of Object.entries(base)) for (const t of list) console.log(`${SRC}/${f}: ${t}`);
	process.exit(0);
}

/** @type {string[]} */
const bad = [];
let left = 0;
let gone = 0;
for (const f of new Set([...Object.keys(found), ...Object.keys(base)])) {
	const pool = [...(base[f] ?? [])];
	for (const x of found[f] ?? []) {
		const k = pool.indexOf(x.text);
		if (k >= 0) { pool.splice(k, 1); left++; } else bad.push(`  ${SRC}/${f}:${x.line}  ${x.text}`);
	}
	gone += pool.length;
}

if (bad.length > 0) {
	console.error('vibes-i18n: new hard-coded Chinese in system UI. Put the words in packages/frontend/src/lojo/locales/ (zh and en) and use vt.*:');
	console.error(bad.join('\n'));
	console.error('A line that must stay Chinese (a message marker, a word list) gets a `// vibes-i18n-keep: <why>` comment.');
	process.exit(1);
}
console.log(`vibes-i18n: OK (${left} older lines still on the list${gone > 0 ? `; ${gone} moved out, run with --update to shorten the list` : ''}).`);
