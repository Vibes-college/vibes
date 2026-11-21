/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 聊天模式（创始人 2026-11-20 22:57 PT「可以，去做吧」）：学员点私信顶上 Momo 的名字（右下角面板也一样），选她怎么回自己：
// 正常、毒舌、抓中式英语、英式潜台词。存在服务器上（lojo/tutor/mode/show、update），这台设备再记一份，打开就是对的。
// 学员在聊天里说「开毒舌」「正常点」时 Momo 自己换，服务器改了会推过来（registryUpdated），顶上跟着变。
// 只有回话来自新版 Momo（Mastra）的学员看得到菜单（available）。
// 她回话里的两种标记消息也在这里认（服务器 misc/lojo-tutor-mode.ts 写的）：
//   【对照卡·roast】break a leg\n摔断一条腿\n→ 祝你顺利   画成会动的对照卡（ContrastCard.vue）
//   【说话方式】已切到毒舌（roast）                         画成一行灰字（ModeNotice.vue）

import { computed, ref } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { useStream } from '@/stream.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { vt } from '@/lojo/locales/index.js';

export const TUTOR_MODES = ['normal', 'roast', 'chinglish', 'subtext'] as const;
export type TutorMode = typeof TUTOR_MODES[number];
export type CardMode = Exclude<TutorMode, 'normal'>;

export const MODE_ICONS: Record<TutorMode, string> = {
	normal: 'ti ti-mood-smile',
	roast: 'ti ti-bolt',
	chinglish: 'ti ti-school',
	subtext: 'ti ti-coffee',
};

export function normalizeMode(raw: unknown): TutorMode {
	return typeof raw === 'string' && (TUTOR_MODES as readonly string[]).includes(raw) ? raw as TutorMode : 'normal';
}

type Saved = { mode: TutorMode; available: boolean };
const localKey = () => `vibes:tutorMode:${$i?.id ?? ''}`;

function readLocal(): Saved | null {
	try {
		const v = JSON.parse(window.localStorage.getItem(localKey()) ?? 'null') as Partial<Saved> | null;
		return v == null ? null : { mode: normalizeMode(v.mode), available: v.available === true };
	} catch {
		return null;
	}
}

const saved = $i ? readLocal() : null;
export const tutorMode = ref<TutorMode>(saved?.mode ?? 'normal');
export const modesAvailable = ref(saved?.available ?? false);

function keep(mode: TutorMode, available = modesAvailable.value) {
	tutorMode.value = mode;
	modesAvailable.value = available;
	try {
		window.localStorage.setItem(localKey(), JSON.stringify({ mode, available }));
	} catch { /* full or blocked: the server copy only */ }
}

let listening = false;

function listen() {
	if (listening) return;
	listening = true;
	useStream().useChannel('main').on('registryUpdated', ev => {
		if (ev.scope?.join('/') === 'lojo/tutor' && ev.key === 'mode') keep(normalizeMode(ev.value));
	});
}

let asked: Promise<void> | null = null;
// Read once per page load (fresh: again, e.g. when her chat opens). Signed out: nothing.
export function loadTutorMode(fresh = false): Promise<void> {
	if ($i == null) return Promise.resolve();
	listen();
	if (asked != null && !fresh) return asked;
	asked = misskeyApi('lojo/tutor/mode/show', {}).then(r => keep(normalizeMode(r.mode), r.available), () => {
		asked = null;
	});
	return asked;
}

export async function setTutorMode(mode: TutorMode): Promise<void> {
	const was = tutorMode.value;
	if (mode === was) return;
	keep(mode);
	try {
		keep(normalizeMode((await misskeyApi('lojo/tutor/mode/update', { mode })).mode));
	} catch {
		keep(was);
		os.toast(vt.mode.failed);
	}
}

// The menu under her name: 「阿蓝 怎么回你」, the four ways with a line each, and that saying it works too.
export function modeMenu(name: string): MenuItem[] {
	return [
		{ type: 'label', text: vt.mode.menuTitle(name) },
		...TUTOR_MODES.map((m): MenuItem => ({
			type: 'radioOption',
			text: vt.mode.name[m],
			caption: vt.mode.caption[m](name),
			active: tutorMode.value === m,
			action: () => { void setTutorMode(m); },
		})),
		{ type: 'divider' },
		{ type: 'label', text: vt.mode.hint },
	];
}

export function openModeMenu(ev: Event, name: string): void {
	void loadTutorMode();
	os.popupMenu(modeMenu(name), ev.currentTarget ?? ev.target);
}

// The orange line under her name while a mode is on (null in normal, or when the menu is not offered).
export const modeAccent = computed(() => {
	const m = tutorMode.value;
	return modesAvailable.value && m !== 'normal' ? { icon: MODE_ICONS[m], text: vt.mode.accent[m] } : null;
});

export type ModeCard = { mode: CardMode; phrase: string | null; front: string; back: string };

const CARD = /^【对照卡·(roast|chinglish|subtext)】([^\n]*)\n([^\n]+)\n→ ([^\n]+)$/; // vibes-i18n-keep: message protocol
const NOTICE = /^【说话方式】[^\n]*（(normal|roast|chinglish|subtext)）$/; // vibes-i18n-keep: message protocol

export function parseModeCard(text: string | null | undefined): ModeCard | null {
	const m = text ? CARD.exec(text.trim()) : null;
	if (m == null) return null;
	const phrase = m[2].trim();
	return { mode: m[1] as CardMode, phrase: phrase === '' ? null : phrase, front: m[3].trim(), back: m[4].trim() };
}

export function parseModeNotice(text: string | null | undefined): TutorMode | null {
	const m = text ? NOTICE.exec(text.trim()) : null;
	return m ? m[1] as TutorMode : null;
}

export function isModeMarker(text: string | null | undefined): boolean {
	return text != null && (text.startsWith('【对照卡·') || text.startsWith('【说话方式】')); // vibes-i18n-keep: message protocol
}
