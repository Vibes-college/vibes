<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :preferType="preferedModalType" :anchor="anchor" :transparentBg="true" :anchorElement="anchorElement" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<div class="_popup _shadow" :class="[$style.root, { [$style.asDrawer]: type === 'drawer' }]" :style="{ maxHeight: maxHeight ? maxHeight + 'px' : '' }">
		<div :class="$style.title">{{ miniAppsLabels.panelTitle }}</div>
		<div :class="$style.main">
			<button
				v-for="app in miniApps"
				:key="app.id"
				v-click-anime
				class="_button"
				:class="$style.item"
				@click="onTap(app, $event)"
				@pointerdown="onPointerDown(app, $event)"
				@pointerup="clearPressTimer"
				@pointerleave="clearPressTimer"
				@pointercancel="clearPressTimer"
			>
				<i :class="[$style.icon, app.icon]"></i>
				<div :class="$style.text">{{ app.name }}</div>
			</button>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import { miniApps, openMiniAppLink } from '@/lojo/miniapps/manifest.js';
import type { MiniAppDef } from '@/lojo/miniapps/manifest.js';
import { miniAppsLabels } from '@/lojo/miniapps/labels.js';
import { hasSeenMiniApp, loadMiniAppsSeen } from '@/lojo/miniapps/state.js';
import { deviceKind } from '@/utility/device-kind.js';
import { getHTMLElementOrNull } from '@/utility/get-dom-node-or-null.js';
import { useRouter } from '@/router.js';
import * as os from '@/os.js';

const props = withDefaults(defineProps<{
	anchorElement?: HTMLElement | null;
	anchor?: { x: string; y: string; };
}>(), {
	anchorElement: null,
	anchor: () => ({ x: 'right', y: 'center' }),
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const preferedModalType = (deviceKind === 'desktop' && props.anchorElement != null) ? 'popup' :
	deviceKind === 'smartphone' ? 'drawer' :
	'dialog';

const modal = useTemplateRef('modal');
const router = useRouter();

// Read once as the panel opens; a stale read just means the intro shows once more than it needs to.
const seenLoaded = loadMiniAppsSeen();

const LONG_PRESS_MS = 550;
let pressTimer: number | null = null;
let suppressClick = false;

function clearPressTimer(): void {
	if (pressTimer != null) {
		window.clearTimeout(pressTimer);
		pressTimer = null;
	}
}

function onPointerDown(app: MiniAppDef, ev: PointerEvent): void {
	if (ev.pointerType === 'mouse' && ev.button !== 0) return;
	clearPressTimer();
	pressTimer = window.setTimeout(() => {
		pressTimer = null;
		suppressClick = true;
		showIntro(app, ev);
	}, LONG_PRESS_MS);
}

async function onTap(app: MiniAppDef, ev: PointerEvent): Promise<void> {
	if (suppressClick) {
		suppressClick = false;
		return;
	}
	await seenLoaded;
	if (hasSeenMiniApp(app.id)) {
		openMiniAppLink(app.link, router);
		close();
		return;
	}
	showIntro(app, ev);
}

function showIntro(app: MiniAppDef, ev: Event): void {
	const target = getHTMLElementOrNull(ev.currentTarget ?? ev.target);
	close();
	os.popupAsyncWithDialog(import('@/components/MkMiniAppIntro.vue').then(x => x.default), {
		app,
		anchorElement: target,
	}, {});
}

function close(): void {
	modal.value?.close();
}
</script>

<style lang="scss" module>
.root {
	max-height: 100%;
	width: min(460px, 100vw);
	margin: auto;
	padding: 24px;
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
	text-align: left;
	border-radius: 16px;

	&.asDrawer {
		width: 100%;
		padding: 16px 16px max(env(safe-area-inset-bottom, 0px), 16px) 16px;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
		text-align: center;
	}
}

.title {
	font-weight: bold;
	margin-bottom: 12px;
}

.main {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

// On a phone the panel comes up from the bottom as 4 equal columns, like the founder's More panel reference
// (auto-fill only fits 3 at 390px wide).
.asDrawer .main {
	grid-template-columns: repeat(4, minmax(0, 1fr));
}

.asDrawer .item {
	padding: 10px 4px;
}

.item {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	vertical-align: bottom;
	height: 100px;
	border-radius: 10px;
	padding: 10px;
	box-sizing: border-box;
	touch-action: manipulation;

	&:hover {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}
}

.icon {
	font-size: 24px;
	height: 24px;
}

.text {
	margin-top: 12px;
	font-size: 0.8em;
	line-height: 1.5em;
	text-align: center;
}
</style>
