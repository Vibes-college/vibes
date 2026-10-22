<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkPageHeader
		:tab="mapLayer"
		:tabs="prefer.s.showPageTabBarBottom ? [] : layerTabs"
		:actions="headerActions"
		:canOmitTitle="true"
		:class="$style.header"
		@update:tab="selectLayer"
	/>
	<div :class="$style.workspace">
		<div v-if="stateError" :class="$style.banner" role="alert">
			<span>{{ stateConflict ? lojoLabels.stateConflict : lojoLabels.stateFailed }}</span>
			<button class="_textButton" :disabled="retrying" @click="stateConflict ? reloadState() : retrySave()">{{ stateConflict ? lojoLabels.reloadState : i18n.ts.retry }}</button>
		</div>
		<div v-for="link in failedPendingLinks" :key="`${link.entityId}:${link.noteId}`" :class="$style.banner" role="alert">
			<span>{{ lojoLabels.linkFailed }}</span>
			<button class="_textButton" @click="retryLink(link)">{{ lojoLabels.retryLink }}</button>
			<MkA :to="`/notes/${link.noteId}`">{{ i18n.ts.note }}</MkA>
		</div>
		<div v-if="loadError" :class="$style.loading" role="alert">
			<p>{{ lojoLabels.loadFailed }}</p>
			<MkButton primary @click="start">{{ i18n.ts.retry }}</MkButton>
		</div>
		<div v-else-if="loading" :class="$style.loading"><MkLoading/></div>
		<div ref="mapHost" :class="$style.map" :aria-label="lojoLabels.title"></div>
	</div>
	<MkTabs v-if="prefer.s.showPageTabBarBottom" :tab="mapLayer" :tabs="layerTabs" :centered="true" :tabHighlightUpper="true" :class="$style.footerTabs" @update:tab="selectLayer"/>
</div>
</template>

<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useTemplateRef } from 'vue';
import type { LojoState } from '@/lojo/state-sync.js';
import { LojoStateSync } from '@/lojo/state-sync.js';
import { lojoApi } from '@/lojo/api.js';
import { lojoLabels } from '@/lojo/labels.js';
import { loadLojoMapLibre } from '@/lojo/maplibre.js';
import { composeLojoNote, pendingLojoLinks, retryLojoLink } from '@/lojo/community.js';
import { mount } from '@/lojo/runtime/app.js';
import { openLojoDialog } from '@/lojo/native-dialog.js';
import { enhanceLojoDialogControls } from '@/lojo/native-dialog-controls.js';
import LojoDiscussion from '@/pages/lojo/discussion.vue';
import MkButton from '@/components/MkButton.vue';
import MkTabs from '@/components/MkTabs.vue';
import type { PageHeaderItem } from '@/types/page-header.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import { pleaseLogin } from '@/utility/please-login.js';

const router = useRouter();
const appContext = getCurrentInstance()!.appContext;
const mapHost = useTemplateRef('mapHost');
const loading = ref(true);
const loadError = ref(false);
const stateError = ref(false);
const stateConflict = ref(false);
const retrying = ref(false);
const ownPendingLinks = computed(() => pendingLojoLinks.value.filter(link => link.userId === $i?.id));
const failedPendingLinks = computed(() => ownPendingLinks.value.filter(link => link.status === 'failed'));
let runtime: { destroy: () => void; pause: () => void; resume: () => void; resize: () => void } | null = null;
let sync: LojoStateSync | null = null;
let observer: ResizeObserver | null = null;
let generation = 0;
let starting = false;
let mountAbort: AbortController | null = null;
let active = true;
const isLegacyGuideHash = (hash: string) => /^#guides?(?:\/|$)/.test(hash);
let returnHash = !isLegacyGuideHash(window.location.hash) && window.location.hash ? window.location.hash : '#map/housing';
let redirectingGuide = false;
const currentHash = ref(returnHash);
const layerTabs = [
	{ key: 'housing', title: lojoLabels.housing, icon: 'ti ti-building' },
	{ key: 'food', title: lojoLabels.food, icon: 'ti ti-tools-kitchen-2' },
	{ key: 'pets', title: lojoLabels.pets, icon: 'ti ti-paw' },
	{ key: 'events', title: lojoLabels.events, icon: 'ti ti-calendar-event' },
	{ key: 'travel', title: lojoLabels.travel, icon: 'ti ti-route' },
];
const lastLayer = ref('housing');
const mapLayer = computed(() => {
	const [view, id] = currentHash.value.replace(/^#/, '').split('/');
	if (view === 'map' && layerTabs.some(layer => layer.key === id)) return id;
	if (['building', 'rental', 'housing-reference', 'housing-compare', 'housing-note'].includes(view)) return 'housing';
	if (view === 'place') return 'food';
	if (['animal', 'capture', 'card'].includes(view)) return 'pets';
	if (['event', 'event-create', 'invite-create'].includes(view)) return 'events';
	if (['trip', 'trip-invite', 'travel-guide', 'planner'].includes(view)) return 'travel';
	return lastLayer.value;
});

function selectLayer(layer: string | undefined) {
	if (!layer || !layerTabs.some(tab => tab.key === layer)) return;
	lastLayer.value = layer;
	const hash = `#map/${layer}`;
	if (window.location.hash !== hash) window.location.hash = hash;
	rememberHash();
}

const headerActions: PageHeaderItem[] = [{
	icon: 'ti ti-dots',
	text: i18n.ts.more,
	handler: (event) => os.popupMenu([{
		icon: 'ti ti-bookmarks',
		text: lojoLabels.savedAndTrips,
		action: () => { window.location.hash = '#me'; },
	}, {
		icon: 'ti ti-book',
		text: lojoLabels.relatedGuides,
		action: () => { router.pushByPath('/lojo/guides'); },
	}], event.currentTarget ?? event.target),
}];

function reportSaveError(error: unknown) {
	stateError.value = true;
	stateConflict.value = typeof error === 'object' && error !== null && 'code' in error && error.code === 'STATE_CONFLICT';
}

async function retrySave() {
	retrying.value = true;
	try {
		await sync?.retry();
	} catch (error) {
		reportSaveError(error);
	} finally {
		retrying.value = false;
	}
}

async function reloadState() {
	const result = await os.confirm({ type: 'warning', text: lojoLabels.reloadConfirm });
	if (!result.canceled) await start();
}

async function retryLink(link: typeof pendingLojoLinks.value[number]) {
	try {
		await retryLojoLink(link);
	} catch (error) {
		await os.alert({ type: 'error', text: lojoLabels.linkFailed });
	}
}

function openDiscussion(entityId: string) {
	const { dispose } = os.popup(LojoDiscussion, { entityId }, { closed: () => dispose() });
}

async function start() {
	if (starting) return;
	starting = true;
	const currentGeneration = ++generation;
	loading.value = true;
	loadError.value = false;
	stateError.value = false;
	stateConflict.value = false;
	runtime?.destroy();
	runtime = null;
	mountAbort?.abort();
	mountAbort = new AbortController();
	sync?.dispose();
	sync = null;
	const account = $i ? { id: $i.id, token: $i.token } : null;
	try {
		const [snapshot, entities] = await Promise.all([
			account ? lojoApi.state(account.token) : Promise.resolve({ revision: 0, state: null }),
			lojoApi.entities(),
			loadLojoMapLibre(),
		]);
		if (currentGeneration !== generation || !mapHost.value || (account?.id ?? null) !== ($i?.id ?? null)) return;
		const shadow = mapHost.value.shadowRoot ?? mapHost.value.attachShadow({ mode: 'open' });
		shadow.replaceChildren();
		if (account) {
			sync = new LojoStateSync(snapshot,
				(state, expectedRevision) => lojoApi.saveState(state, expectedRevision, account.token),
				() => $i?.id === account.id,
				reportSaveError,
				() => { stateError.value = false; stateConflict.value = false; },
			);
		}
		const mountedRuntime = await mount(shadow, {
			nativeShell: true,
			signal: mountAbort.signal,
			initialState: snapshot.state,
			entities,
			canWrite: account != null,
			currentUser: $i ? { id: $i.id, name: $i.name, username: $i.username, avatarUrl: $i.avatarUrl } : null,
			saveState: (state: LojoState) => {
				if (!sync || !account || $i?.id !== account.id) return Promise.reject(new Error('ACCOUNT_CHANGED'));
				return sync.save(state);
			},
			onRequireLogin: () => pleaseLogin(),
			compose: composeLojoNote,
			openDiscussion,
			openDialog: openLojoDialog,
			enhanceControls: (element: HTMLElement) => enhanceLojoDialogControls(element, appContext, { formsOnly: true }),
			navigateCommunity: () => { returnHash = window.location.hash; router.push('/'); },
			notify: (message: string) => os.toast(message),
		});
		if (currentGeneration !== generation) { mountedRuntime.destroy(); return; }
		runtime = mountedRuntime;
		if (!active) runtime.pause();
		observer?.disconnect();
		observer = new ResizeObserver(() => runtime?.resize());
		observer.observe(mapHost.value);
	} catch (error) {
		loadError.value = true;
	} finally {
		starting = false;
		if (currentGeneration === generation) loading.value = false;
	}
}

function beforeUnload(event: BeforeUnloadEvent) {
	if (!sync?.hasPendingChanges && ownPendingLinks.value.length === 0) return;
	event.preventDefault();
	event.returnValue = '';
}

function rememberHash() {
	if (active && !redirectingGuide && router.currentRoute.value.path === '/lojo' && window.location.pathname === '/lojo' && window.location.hash) {
		if (isLegacyGuideHash(window.location.hash)) {
			returnHash = '#map/housing';
			currentHash.value = returnHash;
			redirectingGuide = true;
			void nextTick(() => {
				if (active && router.currentRoute.value.path === '/lojo' && isLegacyGuideHash(window.location.hash)) router.replaceByPath('/lojo/guides');
				redirectingGuide = false;
			});
			return;
		}
		lastLayer.value = mapLayer.value;
		returnHash = window.location.hash;
		currentHash.value = returnHash;
	}
}

onMounted(() => {
	void start();
	window.addEventListener('beforeunload', beforeUnload);
	window.addEventListener('hashchange', rememberHash);
	window.addEventListener('popstate', rememberHash);
});
onActivated(() => {
	active = true;
	if (runtime && !window.location.hash) window.history.replaceState(window.history.state, '', `/lojo${returnHash}`);
	rememberHash();
	runtime?.resume();
});
onDeactivated(() => {
	active = false;
	runtime?.pause();
});
onBeforeUnmount(() => {
	generation++;
	mountAbort?.abort();
	observer?.disconnect();
	runtime?.destroy();
	sync?.dispose();
	window.removeEventListener('beforeunload', beforeUnload);
	window.removeEventListener('hashchange', rememberHash);
	window.removeEventListener('popstate', rememberHash);
});

router.useListener('change', () => {
	rememberHash();
	void nextTick(() => {
		if (active && window.location.pathname === '/lojo') {
			runtime?.resume();
			rememberHash();
		}
	});
});

definePage({ title: lojoLabels.title, icon: 'ti ti-map', needWideArea: true });
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
.map { display: block; flex: 1; width: 100%; min-height: 0; overflow: hidden; }
.footerTabs { flex: none; background: var(--MI_THEME-pageHeaderBg); border-top: solid 0.5px var(--MI_THEME-divider); }
.banner {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px 16px;
	padding: 10px 16px;
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-infoWarnFg);
	font-size: 13px;
}
.loading {
	position: absolute;
	z-index: 1;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-bg);
}
</style>
