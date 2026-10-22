<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="false" autoHideNavigation hideTitle thin tabsAlign="start">
	<div class="_spacer" style="--MI_SPACER-w: 1060px;" :class="$style.root">
		<div v-if="mine" :class="$style.mine">
			<h2>{{ guideLabels.mine }}</h2>
			<MkButton small @click="mine = false">{{ guideLabels.backToGuides }}</MkButton>
		</div>
		<GuideBookshelf v-if="showShelf" ref="shelf"/>
		<div v-else-if="loading" :class="$style.empty"><MkLoading/></div>
		<div v-else-if="loadError" :class="$style.empty" role="alert">
			<i class="ti ti-cloud-off"></i>
			<p>{{ guideLabels.loadFailed }}</p>
			<MkButton @click="load(true)">{{ i18n.ts.retry }}</MkButton>
		</div>
		<div v-else-if="showStack" class="_gaps">
			<GuideStack :guides="guides" :bookmarkBusy="bookmarkBusy" @bookmark="bookmark" @browse="tab = 'featured'"/>
			<MkButton v-if="hasMore" full :wait="loadingMore" @click="load(false)">{{ i18n.ts.loadMore }}</MkButton>
		</div>
		<div v-else-if="guides.length === 0" :class="$style.empty">
			<i :class="tab === 'saved' ? 'ti ti-bookmark' : 'ti ti-book-2'"></i>
			<p>{{ search ? guideLabels.emptySearch : tab === 'saved' ? guideLabels.emptySaved : guideLabels.empty }}</p>
			<MkButton v-if="tab === 'saved' && !$i" primary @click="pleaseLogin()">{{ i18n.ts.login }}</MkButton>
		</div>
		<div v-else class="_gaps">
			<GuideWaterfall v-if="tab === 'featured' && !mine" :guides="guides" :bookmarkBusy="bookmarkBusy" @bookmark="bookmark"/>
			<template v-else><GuideCard v-for="guide in guides" :key="guide.id" :guide="guide" :busy="bookmarkBusy.has(guide.id)" @bookmark="bookmark"/></template>
			<MkButton v-if="hasMore" full :wait="loadingMore" @click="load(false)">{{ i18n.ts.loadMore }}</MkButton>
		</div>
	</div>
	<template #floating>
		<div :class="$style.floatingAction">
			<button type="button" class="_button _buttonGradate" :class="$style.writeButton" :aria-label="guideLabels.write" data-testid="guide-floating-write" @click="write">
				<i class="ti ti-pencil-plus" aria-hidden="true"></i>
			</button>
		</div>
	</template>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import type { Guide } from '@/lojo/guides/types.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import GuideCard from './components/GuideCard.vue';
import GuideWaterfall from './components/GuideWaterfall.vue';
import GuideBookshelf from './components/GuideBookshelf.vue';
import GuideStack from './components/GuideStack.vue';
import { guideLabels } from './labels.js';
import { guideApi } from '@/lojo/guides/api.js';
import MkButton from '@/components/MkButton.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import { pleaseLogin } from '@/utility/please-login.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';

const router = useRouter();
const tab = ref('featured');
const mine = ref(false);
const search = ref('');
const guides = ref<Guide[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const loadError = ref(false);
const hasMore = ref(false);
const bookmarkBusy = ref(new Set<string>());
const pageSize = 20;
const shelf = useTemplateRef('shelf');
// The shelves replace the category list; searching from that tab still shows plain results.
const showShelf = computed(() => tab.value === 'categories' && !mine.value && !search.value.trim());
// Saved guides lie in a pile on the desk; a search from this tab still shows plain results.
const showStack = computed(() => tab.value === 'saved' && $i != null && !search.value.trim());
let generation = 0;
let debounceTimer: number | undefined;

const headerTabs = [
	{ key: 'featured', title: guideLabels.featured, icon: 'ti ti-star' },
	{ key: 'categories', title: guideLabels.categories, icon: 'ti ti-books' },
	{ key: 'saved', title: guideLabels.saved, icon: 'ti ti-bookmark' },
];

const headerActions = computed<PageHeaderItem[]>(() => [{
	icon: 'ti ti-search', text: guideLabels.search,
	highlighted: Boolean(search.value),
	handler: async () => {
		const result = await os.inputText({ title: guideLabels.search, default: search.value });
		if (!result.canceled) search.value = (result.result ?? '').trim();
	},
}, {
	icon: 'ti ti-dots', text: i18n.ts.more,
	handler: (event) => os.popupMenu([{
		icon: 'ti ti-pencil', text: guideLabels.mine,
		action: async () => {
			if (!await pleaseLogin()) return;
			tab.value = 'featured';
			await nextTick();
			mine.value = true;
		},
	}], event.currentTarget ?? event.target),
}]);

async function write() {
	if (!await pleaseLogin()) return;
	router.pushByPath('/lojo/guides/new');
}

async function load(reset: boolean, background = false) {
	const current = ++generation;
	if (!background) {
		if (reset) loading.value = true;
		else loadingMore.value = true;
	}
	loadError.value = false;
	if (showShelf.value) {
		loading.value = false;
		loadingMore.value = false;
		return;
	}
	if (tab.value === 'saved' && !$i) {
		guides.value = [];
		loading.value = false;
		loadingMore.value = false;
		hasMore.value = false;
		return;
	}
	try {
		const filters = {
			featuredOnly: tab.value === 'featured' && !mine.value,
			search: search.value.trim() || undefined,
			savedOnly: tab.value === 'saved',
			mine: mine.value,
		};
		const result: Guide[] = [];
		const targetCount = background ? Math.max(pageSize, guides.value.length) : pageSize;
		let received = 0;
		for (let offset = 0; offset < targetCount; offset += pageSize) {
			const batch = await guideApi.list({ ...filters, limit: pageSize, offset: (reset ? 0 : guides.value.length) + offset });
			result.push(...batch);
			received = batch.length;
			if (batch.length < pageSize || current !== generation) break;
		}
		if (current !== generation) return;
		guides.value = reset ? result : [...guides.value, ...result.filter(item => !guides.value.some(existing => existing.id === item.id))];
		hasMore.value = received === pageSize;
	} catch {
		if (current !== generation) return;
		if (reset && !background) loadError.value = true;
		else if (background) return;
		else os.alert({ type: 'error', text: guideLabels.loadFailed });
	} finally {
		if (current === generation) {
			loading.value = false;
			loadingMore.value = false;
		}
	}
}

async function bookmark(guide: Guide) {
	if (!await pleaseLogin() || bookmarkBusy.value.has(guide.id)) return;
	bookmarkBusy.value.add(guide.id);
	try {
		const result = await guideApi.bookmark(guide.id, !guide.isSaved);
		guide.isSaved = result.saved;
		if (tab.value === 'saved' && !result.saved) guides.value = guides.value.filter(item => item.id !== guide.id);
	} catch {
		os.alert({ type: 'error', text: guideLabels.bookmarkFailed });
	} finally {
		bookmarkBusy.value.delete(guide.id);
	}
}

watch(tab, () => { mine.value = false; });
watch([tab, mine], () => load(true));
watch(search, () => {
	window.clearTimeout(debounceTimer);
	debounceTimer = window.setTimeout(() => load(true), 300);
});
onActivated(() => {
	if (showShelf.value) shelf.value?.reload();
	else if (!loading.value) load(true, true);
});
onBeforeUnmount(() => { generation++; window.clearTimeout(debounceTimer); });
load(true);

definePage(() => ({ title: guideLabels.title, icon: 'ti ti-book-2' }));
</script>

<style lang="scss" module>
.floatingAction { position: relative; height: 0; pointer-events: none; }
.writeButton {
	pointer-events: auto;
	position: absolute;
	right: max(16px, env(safe-area-inset-right, 0px));
	bottom: 16px;
	z-index: 5;
	display: grid;
	place-items: center;
	width: 52px;
	height: 52px;
	border-radius: 50%;
	font-size: 22px;
	box-shadow: 0 4px 20px var(--MI_THEME-shadow);
}
.root { padding-top: 20px; padding-bottom: 84px; }
.mine { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; gap: 16px; }
.mine h2 { font-size: 16px; margin: 0; }
.empty { min-height: 250px; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--MI_THEME-fgTransparentWeak); }
.empty > i { font-size: 32px; }
.empty p { margin: 8px 0; font-size: 14px; }
@media (max-width: 550px) {
	.root { padding: 10px 10px 84px; }
}
</style>
