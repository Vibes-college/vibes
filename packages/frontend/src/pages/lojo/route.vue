<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkPageHeader :actions="$i ? headerActions : []" :tabs="$i ? courseTabs : []" :tab="courseId" :canOmitTitle="true" :class="$style.header" @update:tab="switchCourse"/>
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
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useTemplateRef, watch } from 'vue';
import { lang } from '@@/js/config.js';
import { lojoLabels } from '@/lojo/labels.js';
import { mount } from '@/lojo/route/runtime.js';
import { CATALOG, DEFAULT_COURSE } from '@/lojo/route/courses/index.js';
import { coursePath, isReady, loadRouteRegistry, myMaps, ROUTE_SCOPE, saveMyMaps, withCourse } from '@/lojo/route/my-maps.js';
import MkButton from '@/components/MkButton.vue';
import type { PageHeaderItem } from '@/types/page-header.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import { pleaseLogin } from '@/utility/please-login.js';

// /map shows the default course; /map/<id> any other course in courses/index.js.
const props = defineProps<{ course?: string }>();

const router = useRouter();
const mapHost = useTemplateRef('mapHost');
const loading = ref(true);
const loadError = ref(false);
let runtime: Awaited<ReturnType<typeof mount>> | null = null;
let observer: ResizeObserver | null = null;
let generation = 0;
let active = true;

// Progress lives in the account's registry, next to Misskey's own synced preferences; one key per course.
const isZh = lang.startsWith('zh');
const pageTitle = ref<string>(lojoLabels.routeTitle);
// The course tabs in the page header. Icons are listed here (not in the generated catalog) so the icon font subset picks them up.
const COURSE_ICON: Record<string, string> = { 'ap-micro': 'ti ti-chart-line', 'ap-calc-ab': 'ti ti-math-function' };
const courseId = computed(() => props.course ?? DEFAULT_COURSE);
// Only the student's own courses ("my maps") become tabs; every other course is one tap away in /maps.
const myList = ref<string[]>([]);
const courseTabs = computed(() => (myList.value.includes(courseId.value) ? myList.value : [...myList.value, courseId.value])
	.map(id => CATALOG.find(c => c.id === id)).filter(c => c != null)
	.map(c => ({ key: c.id, title: c.short[isZh ? 'zh' : 'en'], icon: COURSE_ICON[c.id] ?? 'ti ti-road' })));

function switchCourse(id: string) {
	if (id !== courseId.value) router.pushByPath(coursePath(id));
}

// /map on its own reopens the course you looked at last; links with a station (#1.6) keep meaning the default course.
const LAST_COURSE_KEY = 'vibes:route:lastCourse';
// Hashes that belong to the old 落脚地图 keep working: they move to /lojo/map.
const LEGACY_HASH = /^#(map|building|rental|housing|place|animal|capture|card|event|invite|trip|travel|planner|me)\b/;

const headerActions: PageHeaderItem[] = [{
	icon: 'ti ti-layout-grid',
	text: lojoLabels.mapsTitle,
	handler: () => router.pushByPath('/maps'),
}, {
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
		const entry = CATALOG.find(c => c.id === (props.course ?? DEFAULT_COURSE));
		const loader = entry && entry.ready && 'load' in entry ? entry.load : null;
		if (!entry || !loader) { router.replaceByPath('/map'); return; }
		const [pack, all] = await Promise.all([loader(), loadRouteRegistry()]);
		if (current !== generation) return;
		const registry = { scope: ROUTE_SCOPE, key: pack.META.storeKey };
		const mine = myMaps(all), next = withCourse(mine, entry.id);
		myList.value = next;
		if (next.length !== mine.length) void saveMyMaps(next).catch(() => { /* retried next time */ });
		const basePath = props.course ? `/map/${props.course}` : '/map';
		pageTitle.value = `${pack.TEXT[isZh ? 'zh' : 'en'].title} · ${isZh ? '线路图' : 'Route map'}`;
		try { window.localStorage.setItem(LAST_COURSE_KEY, entry.id); } catch { /* private mode */ }
		const shadow = mapHost.value.shadowRoot ?? mapHost.value.attachShadow({ mode: 'open' });
		const mounted = await mount(shadow, {
			lang: isZh ? 'zh' : 'en',
			assets: '/lojo-assets/',
			initialHash: decodeURIComponent(window.location.hash.slice(1)),
			// get-all returns {} for a new user instead of a NO_SUCH_KEY error
			load: () => Promise.resolve(all[registry.key] ?? null),
			save: (value: unknown) => misskeyApi('i/registry/set', { ...registry, value }),
			notes: (tag: string, limit: number) => misskeyApi('notes/search-by-tag', { tag, limit }),
			channel: async (line: number) => {
				const name = `${pack.META.group.zh} ${line} 号线同行小组`;
				const found = await misskeyApi('channels/search', { query: name, type: 'nameOnly', limit: 5 });
				return found.find((channel: { name: string }) => channel.name.includes(name)) ?? null;
			},
			follow: (channelId: string, on: boolean) => misskeyApi(on ? 'channels/follow' : 'channels/unfollow', { channelId }),
			compose: (text: string) => os.post({ initialText: text }),
			openTag: (tag: string) => router.pushByPath(`/tags/${encodeURIComponent(tag)}`),
			openNote: (noteId: string) => router.pushByPath(`/notes/${noteId}`),
			openChannel: (channelId: string) => router.pushByPath(`/channels/${channelId}`),
			toast: (message: string) => os.toast(message),
			openCourse: (id: string, station?: string) => router.pushByPath(`${coursePath(id)}${station ? `#${encodeURIComponent(station)}` : ''}`),
			openCatalog: () => router.pushByPath('/maps'),
			setHash: (id: string | null) => {
				if (!active || window.location.pathname !== basePath) return;
				window.history.replaceState(window.history.state, '', id ? `${basePath}#${encodeURIComponent(id)}` : basePath);
			},
		}, pack, next.map(id => CATALOG.find(c => c.id === id)).filter(c => c != null).map(({ id, short }) => ({ id, short, ready: true })));
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
	if (!props.course && LEGACY_HASH.test(window.location.hash)) {
		router.replaceByPath(`/lojo/map${window.location.hash}`);
		return;
	}
	if (!props.course && !window.location.hash) {
		let last: string | null = null;
		try { last = window.localStorage.getItem(LAST_COURSE_KEY); } catch { /* private mode */ }
		if (last && last !== DEFAULT_COURSE && isReady(last)) {
			router.replaceByPath(coursePath(last));
			return;
		}
	}
	void start();
});
// switching between courses reuses this page, so remount the map for the new course
watch(() => props.course, () => { void start(); });
onActivated(() => { active = true; runtime?.resume(); });
onDeactivated(() => { active = false; runtime?.pause(); });
onBeforeUnmount(() => {
	generation++;
	observer?.disconnect();
	runtime?.destroy();
	runtime = null;
});

definePage(() => ({ title: pageTitle.value, icon: 'ti ti-road', needWideArea: true }));
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
