/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The menu under the vibes logo at the top of the sidebar (and the logo in the top bar and on the logged-out home):
// only 「关于 Vibes」 and 「联系我们」 (founder, 2026-11-17). Misskey's own longer menu is still in ui/_common_/common.ts
// (openMisskeyInstanceMenu), not shown. The pages it led to are all still there: custom emoji, federation and charts
// are tabs of the 关于 page; terms, privacy policy, the source code (AGPL) and 开源与致谢 are links on it; admins reach
// ads, invites and tools from 控制台.
import { host } from '@@/js/config.js';
import type { MenuItem } from '@/types/menu.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';

export function vibesInstanceMenuItems(): MenuItem[] {
	return [{
		type: 'link',
		text: i18n.tsx.aboutX({ x: instance.name ?? host }),
		icon: 'ti ti-info-circle',
		to: '/about',
	}, {
		type: 'link',
		text: i18n.ts.inquiry,
		icon: 'ti ti-help-circle',
		to: '/contact',
	}];
}
