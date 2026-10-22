/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Use the existing Tabler assets as masks so controls inherit the active theme.
export const icon = (name, cls = '') => `<span class="icon lojo-icon ${cls}" style="--lojo-icon:url(/lojo-assets/icons/${name}.svg)" aria-hidden="true"></span>`;
