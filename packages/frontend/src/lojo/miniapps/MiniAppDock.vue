<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
常用小程序 (2026-11-17, founder): six mini apps as bare icons in the sidebar, 3 across and 2 down, under 攻略 on a
computer and at the top of the phone's ☰ menu. No names, frames or tiles: the name shows on hover (computer). A tap
opens the app the same way as the 小程序 panel (launch.ts: the intro the first time). The entries come from the same
roster on the server (roster.ts): one turned off there is gone from here too. The narrow, icon-only sidebar does not
show this (navbar.vue); its 小程序 entry still opens the whole panel.
-->

<template>
<div v-if="apps.length > 0 || waiting" :class="[$style.root, { [$style.waiting]: waiting && apps.length === 0 }]">
	<button
		v-for="app in apps"
		:key="app.id"
		v-tooltip.noDelay="app.name"
		class="_button"
		:class="$style.item"
		:aria-label="app.name"
		@click="onClick(app, $event)"
	>
		<i :class="[$style.icon, app.icon]"></i>
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { miniApps, miniAppsState, pickMiniApps, refreshMiniApps } from '@/lojo/miniapps/roster.js';
import type { MiniAppDef } from '@/lojo/miniapps/roster.js';
import { launchMiniApp } from '@/lojo/miniapps/launch.js';
import { getHTMLElementOrNull } from '@/utility/get-dom-node-or-null.js';

// Roster ids, in the order they show (left to right, then the second row).
const DOCK_IDS = ['photo', 'dictation', 'typing', 'vocab', 'grammar', 'wordbook'] as const;

const apps = computed(() => pickMiniApps(miniApps.value, DOCK_IDS));

// First visit on this device: nothing kept yet. Hold the two rows' space so 通知 and the rest do not jump down when the
// list arrives; if it cannot be read, the space goes away.
const waiting = computed(() => miniAppsState.value === 'loading');

onMounted(() => {
	if (miniAppsState.value === 'loading') {
		void refreshMiniApps();
		return;
	}
	// The kept list shows at once; whether it is still current is asked once the page has loaded (a few bytes when it is).
	if (typeof globalThis.requestIdleCallback === 'function') {
		globalThis.requestIdleCallback(() => void refreshMiniApps(), { timeout: 4000 });
	} else {
		window.setTimeout(() => void refreshMiniApps(), 2000); // Safari has no requestIdleCallback
	}
});

function onClick(app: MiniAppDef, ev: MouseEvent): void {
	void launchMiniApp(app, getHTMLElementOrNull(ev.currentTarget ?? ev.target));
}
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(3, 68px);
	grid-auto-rows: 44px;
	row-gap: 4px;
	// first column lines up with the icons of the rows above and below (they sit 30px in, 32px wide)
	padding: 6px 0 6px 12px;

	&.waiting {
		height: calc(44px * 2 + 4px + 12px);
		box-sizing: border-box;
	}
}

.item {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 12px;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: -2px;
	}
}

.icon {
	font-size: 25px;
	line-height: 1;
}
</style>
