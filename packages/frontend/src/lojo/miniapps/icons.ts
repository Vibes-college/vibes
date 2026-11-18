/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Icons the 小程序 launcher may show. The roster on the server names the icon of each mini app, but the icon font is
// cut down at build time to the icons written somewhere in the frontend code (packages/icons-subsetter). An icon the
// roster uses that is not written here still shows, from the full icon font: about 800 KB more on a phone the first
// time. So a new mini app with a new icon adds the icon here (and rebuilds once); apps-import.mjs warns when it is
// missing. The first eight are the ones in use (2026-11-17); the rest are spares for mini apps on the way.
export const MINI_APP_ICONS = [
	'ti ti-camera',
	'ti ti-arrows-exchange',
	'ti ti-book-2',
	'ti ti-headphones',
	'ti ti-keyboard',
	'ti ti-vocabulary',
	'ti ti-text-grammar',
	'ti ti-notebook',
	'ti ti-microphone',
	'ti ti-pencil',
	'ti ti-puzzle',
	'ti ti-cards',
	'ti ti-language',
	'ti ti-apps',
] as const;
