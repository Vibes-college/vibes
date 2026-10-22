<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkPageHeader :actions="$i ? headerActions : []" :canOmitTitle="true" :class="$style.header"/>
	<div :class="$style.workspace">
		<div v-if="!$i" :class="$style.gate">
			<i class="ti ti-road" :class="$style.gateIcon"></i>
			<p>{{ lojoLabels.routeLogin }}</p>
			<MkButton primary rounded @click="pleaseLogin()">{{ i18n.ts.login }}</MkButton>
		</div>
		<template v-else>
			<div v-if="loadError" :class="$style.loading" role="alert">
				<p>{{ lojoLabels.routeLoadFailed }}</p>
				<MkButton primary @click="start">{{ i18n.ts.retry }}</MkButton>
			</div>
			<div v-else-if="loading" :class="$style.loading"><MkLoading/></div>
			<div ref="mapHost" :class="$style.map" :aria-label="lojoLabels.routeTitle"></div>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useTemplateRef } from 'vue';
import { lang } from '@@/js/config.js';
import { lojoLabels } from '@/lojo/labels.js';
import { mount } from '@/lojo/route/runtime.js';
import MkButton from '@/components/MkButton.vue';
import type { PageHeaderItem } from '@/types/page-header.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import { pleaseLogin } from '@/utility/please-login.js';

const router = useRouter();
const mapHost = useTemplateRef('mapHost');
const loading = ref(true);
const loadError = ref(false);
let runtime: Awaited<ReturnType<typeof mount>> | null = null;
let observer: ResizeObserver | null = null;
let generation = 0;
let active = true;

// Progress lives in the account's registry, next to Misskey's own synced preferences.
const REGISTRY = { scope: ['client', 'lojo', 'route'], key: 'apMicro' };
// Hashes that belong to the old 落脚地图 keep working: they move to /lojo/map.
const LEGACY_HASH = /^#(map|building|rental|housing|place|animal|capture|card|event|invite|trip|travel|planner|me)\b/;

const headerActions: PageHeaderItem[] = [{
	icon: 'ti ti-dots',
	text: i18n.ts.more,
	handler: (event) => os.popupMenu([{
		icon: 'ti ti-train',
		text: lojoLabels.routeTour,
		action: () => runtime?.tour(),
	}, {
		icon: 'ti ti-arrows-maximize',
		text: lojoLabels.routeFit,
		action: () => runtime?.fit(),
	}, {
		icon: 'ti ti-info-circle',
		text: lojoLabels.routeLegend,
		action: () => runtime?.legend(),
	}], event.currentTarget ?? event.target),
}];

async function start() {
	if (!$i) return;
	const current = ++generation;
	loading.value = true;
	loadError.value = false;
	runtime?.destroy();
	runtime = null;
	try {
		if (!mapHost.value) return;
		const shadow = mapHost.value.shadowRoot ?? mapHost.value.attachShadow({ mode: 'open' });
		const mounted = await mount(shadow, {
			lang: lang.startsWith('zh') ? 'zh' : 'en',
			assets: '/lojo-assets/',
			initialHash: decodeURIComponent(window.location.hash.slice(1)),
			// get-all returns {} for a new user instead of a NO_SUCH_KEY error
			load: () => misskeyApi('i/registry/get-all', { scope: REGISTRY.scope }).then(all => (all as Record<string, unknown>)[REGISTRY.key] ?? null).catch(() => null),
			save: (value: unknown) => misskeyApi('i/registry/set', { ...REGISTRY, value }),
			notes: (tag: string, limit: number) => misskeyApi('notes/search-by-tag', { tag, limit }),
			channel: async (line: number) => {
				const name = `${line} 号线同行小组`;
				const found = await misskeyApi('channels/search', { query: name, type: 'nameOnly', limit: 5 });
				return found.find((channel: { name: string }) => channel.name.includes(name)) ?? null;
			},
			follow: (channelId: string, on: boolean) => misskeyApi(on ? 'channels/follow' : 'channels/unfollow', { channelId }),
			compose: (text: string) => os.post({ initialText: text }),
			openTag: (tag: string) => router.pushByPath(`/tags/${encodeURIComponent(tag)}`),
			openNote: (noteId: string) => router.pushByPath(`/notes/${noteId}`),
			openChannel: (channelId: string) => router.pushByPath(`/channels/${channelId}`),
			toast: (message: string) => os.toast(message),
			setHash: (id: string | null) => {
				if (!active || router.currentRoute.value.path !== '/map') return;
				window.history.replaceState(window.history.state, '', id ? `/map#${encodeURIComponent(id)}` : '/map');
			},
		});
		if (current !== generation) { mounted.destroy(); return; }
		runtime = mounted;
		if (!active) runtime.pause();
		observer?.disconnect();
		observer = new ResizeObserver(() => runtime?.resize());
		observer.observe(mapHost.value);
	} catch (error) {
		console.error(error);
		loadError.value = true;
	} finally {
		if (current === generation) loading.value = false;
	}
}

onMounted(() => {
	if (LEGACY_HASH.test(window.location.hash)) {
		router.replaceByPath(`/lojo/map${window.location.hash}`);
		return;
	}
	void start();
});
onActivated(() => { active = true; runtime?.resume(); });
onDeactivated(() => { active = false; runtime?.pause(); });
onBeforeUnmount(() => {
	generation++;
	observer?.disconnect();
	runtime?.destroy();
	runtime = null;
});

definePage({ title: lojoLabels.routeTitle, icon: 'ti ti-road', needWideArea: true });
</script>

<style lang="scss" module>
.root {
	position: relative;
	height: 100%;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}
.header { flex: none; }
.workspace { position: relative; display: flex; flex: 1; min-height: 0; flex-direction: column; overflow: hidden; }
.map { position: relative; display: block; flex: 1; width: 100%; min-height: 0; overflow: hidden; }
.loading {
	position: absolute;
	z-index: 1;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	background: var(--MI_THEME-bg);
}
.gate {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 14px;
	padding: 24px;
	text-align: center;
	color: var(--MI_THEME-fg);
}
.gateIcon { font-size: 40px; color: var(--MI_THEME-accent); }
</style>
