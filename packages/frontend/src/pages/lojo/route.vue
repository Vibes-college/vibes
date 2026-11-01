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
			<div ref="mapHost" :class="$style.map" :aria-label="pageTitle"></div>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useTemplateRef, watch } from 'vue';
import { lang } from '@@/js/config.js';
import { lojoLabels } from '@/lojo/labels.js';
import { CATALOG, DEFAULT_COURSE } from '@/lojo/route/courses/index.js';
import { coursePath, isReady, myMaps, ROUTE_SCOPE, saveMyMaps, withCourse } from '@/lojo/route/my-maps.js';
import type { RouteRegistry } from '@/lojo/route/my-maps.js';
import { keep, markShown, readKept } from '@/lojo/kept.js';
import { loadTypingProgress } from '@/lojo/typing/progress.js';
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

// Two runtimes share this page: runtime.js for topic maps (AP), gate-map.js for gate maps (META.kind 'gates', IELTS).
type RouteRuntime = {
	fit(): void; legend(): void; pause(): void; resume(): void; resize(): void; destroy(): void;
	tour?: () => void; // maps with a tour: the AP maps, and the IELTS map (TOUR in its text.js)
	refresh?: () => Promise<void>; // gate maps: progress lives on the server, re-read it when the page comes back
};
const loadRuntime = (kind: string | undefined) => kind === 'gates' ? import('@/lojo/route/gate-map.js') : import('@/lojo/route/runtime.js');

const router = useRouter();
const mapHost = useTemplateRef('mapHost');
const loading = ref(true);
const loadError = ref(false);
let runtime: RouteRuntime | null = null;
let observer: ResizeObserver | null = null;
let generation = 0;
let active = true;

// Topic-map progress (and the gate map's welcome flag) lives in the account's registry, one key per course; gate progress lives on the server.
// The last copies of both are kept on the device (lojo/kept.ts) so the IELTS map draws without waiting.
const REGISTRY_NAME = 'route:registry';
const WARM_NAME = 'route:typing';
const fetchRegistry = () => misskeyApi('i/registry/get-all', { scope: ROUTE_SCOPE }).then(found => {
	// get-all returns {} for a new user instead of a NO_SUCH_KEY error
	const value = (found ?? {}) as RouteRegistry;
	keep(REGISTRY_NAME, value);
	return value;
});
const isZh = lang.startsWith('zh');
// An English course's map speaks Chinese whatever the app's language: its learners are Chinese speakers, and an all-English
// map loses them (founder, 2026-11-01). Other courses follow the app.
const courseLang = (c: { subject?: string } | null | undefined): 'zh' | 'en' => (isZh || c?.subject === 'english' ? 'zh' : 'en');
const pageTitle = ref<string>(lojoLabels.map);
// The course tabs in the page header. Icons are listed here (not in the generated catalog) so the icon font subset picks them up.
const COURSE_ICON: Record<string, string> = { ielts: 'ti ti-headphones', 'ap-micro': 'ti ti-chart-line', 'ap-calc-ab': 'ti ti-math-function' };
const courseId = computed(() => props.course ?? DEFAULT_COURSE);
// Only the student's own courses ("my maps") become tabs; every other course is one tap away in /maps.
const myList = ref<string[]>([]);
const courseTabs = computed(() => (myList.value.includes(courseId.value) ? myList.value : [...myList.value, courseId.value])
	.map(id => CATALOG.find(c => c.id === id)).filter(c => c != null)
	.map(c => ({ key: c.id, title: c.short[courseLang(c)], icon: COURSE_ICON[c.id] ?? 'ti ti-road' })));

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
	// a map without a tour has no 带我走一遍
	handler: (event) => os.popupMenu([...(runtime?.tour ? [{
		icon: 'ti ti-train',
		text: lojoLabels.routeTour,
		action: () => runtime?.tour?.(),
	}] : []), {
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
		const progressName = `route:progress:${entry.id}`;
		const [pack, keptRegistry, keptProgress, keptWarm] = await Promise.all([
			loader(), readKept<RouteRegistry>(REGISTRY_NAME), readKept<unknown>(progressName), readKept<unknown>(WARM_NAME),
		]);
		// Vibes: a gate map (IELTS) draws at once from the copies kept last time and refreshes in the background; it saves
		// only two flags of its own. A topic map saves its whole state back, so it waits for the server's copy as before.
		const fromKept = pack.META.kind === 'gates' && keptRegistry != null && keptProgress != null;
		const all = fromKept ? keptRegistry : await fetchRegistry().catch(() => ({}) as RouteRegistry);
		const { mount } = await loadRuntime(pack.META.kind);
		if (current !== generation) return;
		const registry = { scope: ROUTE_SCOPE, key: pack.META.storeKey };
		// The map saves its own flags (welcome card seen, tour watched). They go into the kept copy too, or the next visit,
		// drawn from that copy, would open with the welcome card again; a server copy that arrives after a save keeps them.
		let copy = all;
		let saved: { value: unknown } | null = null;
		const keepCopy = () => keep(REGISTRY_NAME, saved ? { ...copy, [registry.key]: saved.value } : copy);
		const mine = myMaps(all), next = withCourse(mine, entry.id);
		myList.value = next;
		// "My maps" is saved from the server's copy only (with a kept copy, after it arrives below).
		if (!fromKept && next.length !== mine.length) void saveMyMaps(next).catch(() => { /* retried next time */ });
		// The first reads come from the kept copies; later ones (refresh, coming back from a gate) from the server.
		let firstProgress = fromKept ? keptProgress : null;
		let firstWarm = fromKept ? keptWarm : null;
		const basePath = props.course ? `/map/${props.course}` : '/map';
		const mapLang = courseLang(entry);
		pageTitle.value = `${pack.TEXT[mapLang].title} · ${mapLang === 'zh' ? '线路图' : 'Route map'}`;
		try { window.localStorage.setItem(LAST_COURSE_KEY, entry.id); } catch { /* private mode */ }
		const shadow = mapHost.value.shadowRoot ?? mapHost.value.attachShadow({ mode: 'open' });
		const mounted = await mount(shadow, {
			lang: mapLang,
			assets: '/lojo-assets/',
			initialHash: decodeURIComponent(window.location.hash.slice(1)),
			// get-all returns {} for a new user instead of a NO_SUCH_KEY error
			load: () => Promise.resolve(all[registry.key] ?? null),
			save: (value: unknown) => {
				saved = { value };
				keepCopy();
				return misskeyApi('i/registry/set', { ...registry, value });
			},
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
			// gate maps: progress from the server, and each gate on its own page (/gate/ielts/1.4)
			progress: () => {
				if (firstProgress != null) {
					const kept = firstProgress;
					firstProgress = null;
					return Promise.resolve(kept);
				}
				return misskeyApi('lojo/gates/progress', { course: entry.id }).then(p => { keep(progressName, p); return p; });
			},
			openGate: (station: string) => router.pushByPath(`/gate/${entry.id}/${station}`),
			// 同路人: who else tried a gate lately; the server leaves out anyone who shouldn't be shown
			peers: (station: string, limit: number) => misskeyApi('lojo/gates/peers', { course: entry.id, station, limit }),
			openUser: (username: string) => router.pushByPath(`/@${username}`),
			// a pack's warm-up line (IELTS: 0 号线 · 机考打字, WARMUP in content.js): its progress, kept in the account registry, and its page
			warmup: (id: string) => {
				if (id !== 'typing') return Promise.resolve(null);
				if (fromKept && firstWarm !== undefined) {
					// null while unknown: the line shows without its count until the refresh below
					const kept = firstWarm;
					firstWarm = undefined;
					return Promise.resolve(kept);
				}
				return loadTypingProgress().then(w => { keep(WARM_NAME, w); return w; });
			},
			openPath: (path: string) => router.pushByPath(path),
			setHash: (id: string | null) => {
				if (!active || window.location.pathname !== basePath) return;
				window.history.replaceState(window.history.state, '', id ? `${basePath}#${encodeURIComponent(id)}` : basePath);
			},
		}, pack, next.map(id => CATALOG.find(c => c.id === id)).filter(c => c != null).map(({ id, short }) => ({ id, short, ready: true })));
		if (current !== generation) { mounted.destroy(); return; }
		runtime = mounted;
		markShown(fromKept);
		if (!active) runtime.pause();
		if (fromKept) {
			// Now the server's copies: progress and the warm-up line redraw the map; "my maps" refreshes the tabs.
			void runtime.refresh?.();
			void fetchRegistry().then(fresh => {
				if (current !== generation) return;
				copy = fresh;
				if (saved) keepCopy();
				const freshMine = myMaps(fresh), freshNext = withCourse(freshMine, entry.id);
				myList.value = freshNext;
				if (freshNext.length !== freshMine.length) void saveMyMaps(freshNext).catch(() => { /* retried next time */ });
			}).catch(() => { /* keep what is on screen */ });
		}
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
// coming back from a gate: show what just changed
onActivated(() => { active = true; runtime?.resume(); void runtime?.refresh?.(); });
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
