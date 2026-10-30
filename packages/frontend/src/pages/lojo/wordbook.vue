<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生词本: 今日 (what is up today, and the review itself) and 单词表 (every saved word). Words come in from the
"翻译讲解" under posts and from dictation, or are added here. Each word has two cards, 认得 and 拼写, scheduled with
FSRS on the server (lojo/words/*): 10 new words a day, and a word's 拼写 card the same day as its 认得 card. -->
<template>
<div :class="$style.root">
	<MkPageHeader v-model:tab="tab" :tabs="reviewing ? [] : headerTabs" :canOmitTitle="false"/>
	<div :class="[$style.body, { [$style.reviewing]: reviewing }]">
		<XSession v-if="reviewing && today" :today="today" :fetchedAt="todayAt" @finish="onFinish"/>
		<XWords v-else-if="tab === 'words'" ref="wordsEl" v-model:adding="adding" :now="now" :loading="wordsLoading" :newPerDay="today?.newPerDay ?? 10" @changed="refreshToday"/>
		<template v-else>
			<XToday v-if="today" ref="todayEl" :today="today" :now="now" @start="start" @add="openAdd"/>
			<div v-else-if="failed" :class="$style.failed" role="alert">
				<p>{{ wordbookLabels.loadFailed }}</p>
				<MkButton rounded inline @click="refreshToday"><i class="ti ti-refresh"></i> {{ wordbookLabels.retry }}</MkButton>
			</div>
			<MkLoading v-else role="status"/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XToday from './wordbook.today.vue';
import XWords from './wordbook.words.vue';
import XSession from './wordbook.session.vue';
import type { WordToday } from '@/lojo/english/wordbook.js';
import MkButton from '@/components/MkButton.vue';
import { loadToday, reloadWordbook, wordbook } from '@/lojo/english/wordbook.js';
import { loadEnglishStatus } from '@/lojo/english/api.js';
import { wordbookLabels } from '@/lojo/english/labels.js';
import { definePage } from '@/page.js';

// today's counts are asked for again after this long, or when the day turns
const STALE_MS = 15 * 60 * 1000;

const tab = ref('today');
const today = shallowRef<WordToday | null>(null);
const todayAt = ref(0);
const failed = ref(false);
const reviewing = ref(false);
const adding = ref(false);
const wordsLoading = ref(true);
const now = ref(Date.now());

const headerTabs = computed(() => [{
	key: 'today',
	title: wordbookLabels.tabToday,
	icon: 'ti ti-calendar-check',
}, {
	key: 'words',
	title: wordbook.value.length > 0 ? wordbookLabels.tabWordsCount(wordbook.value.length) : wordbookLabels.tabWords,
	icon: 'ti ti-list-details',
}]);

let todayRun = 0;

async function refreshToday(): Promise<void> {
	const run = ++todayRun;
	try {
		const res = await loadToday();
		if (run !== todayRun) return;
		today.value = res;
		todayAt.value = Date.now();
		failed.value = false;
	} catch {
		// keep what is on screen; with nothing yet, say so
		if (run === todayRun) failed.value = today.value == null;
	}
}

// Straight into the review: the first card comes up inside this tap, so its word can be read out.
function start(): void {
	if (today.value == null || today.value.queue.length === 0) return;
	adding.value = false;
	reviewing.value = true;
}

const todayEl = useTemplateRef('todayEl');
const wordsEl = useTemplateRef('wordsEl');

async function onFinish(latest: WordToday | null, then: 'today' | 'words'): Promise<void> {
	reviewing.value = false;
	tab.value = then;
	if (latest != null) {
		today.value = latest;
		todayAt.value = Date.now();
	} else {
		refreshToday();
	}
	// the round's card had the focus: hand it to the heading of what comes up instead
	await nextTick();
	if (then === 'words') wordsEl.value?.focusHeading();
	else todayEl.value?.focusHeading();
}

function openAdd(): void {
	adding.value = true;
	tab.value = 'words';
}

watch(tab, t => {
	if (t === 'today' && !reviewing.value) refreshToday();
});

function dayOf(t: number): string {
	return new Date(t).toDateString();
}

// The clock for "10 分钟后" and the date; today's counts are fetched again when they may be out of date: the day
// turned, a card just learned is up again, or a while has passed.
function tick(): void {
	now.value = Date.now();
	const t = today.value;
	if (reviewing.value || tab.value !== 'today' || t == null) return;
	const laterUp = t.queue.length === 0 && t.later != null && now.value >= Date.parse(t.later);
	if (laterUp || dayOf(now.value) !== dayOf(todayAt.value) || now.value - todayAt.value > STALE_MS) refreshToday();
}

function onVisible(): void {
	if (window.document.visibilityState !== 'visible' || reviewing.value) return;
	now.value = Date.now();
	refreshToday();
}

// Running only while the page is on screen: pages are kept (KeepAlive) when another one is opened.
let timer: number | null = null;

function startClock(): void {
	if (timer != null) return;
	timer = window.setInterval(tick, 30 * 1000);
	window.document.addEventListener('visibilitychange', onVisible);
}

function stopClock(): void {
	if (timer == null) return;
	window.clearInterval(timer);
	timer = null;
	window.document.removeEventListener('visibilitychange', onVisible);
}

onMounted(async () => {
	startClock();
	loadEnglishStatus();
	refreshToday();
	await reloadWordbook();
	wordsLoading.value = false;
});

// back on the page: the counts may have moved meanwhile
onActivated(() => {
	if (timer != null) return;
	startClock();
	now.value = Date.now();
	if (!reviewing.value) refreshToday();
});

onDeactivated(stopClock);
onBeforeUnmount(stopClock);

definePage(() => ({ title: wordbookLabels.title, icon: 'ti ti-notebook' }));
</script>

<style lang="scss" module>
.root {
	// Right is the route map's green (lojo/route/route.css); wrong, gold and the rest follow the theme.
	--wbOk: #2F7D5B;
	--wbOkFg: color-mix(in srgb, var(--wbOk) 80%, var(--MI_THEME-fg));
	--wbOkBg: color-mix(in srgb, var(--wbOk) 14%, var(--MI_THEME-panel));
	--wbBad: var(--MI_THEME-error);
	--wbBadFg: color-mix(in srgb, var(--MI_THEME-error) 78%, var(--MI_THEME-fg));
	--wbBadBg: color-mix(in srgb, var(--MI_THEME-error) 12%, var(--MI_THEME-panel));
	--wbGoldFg: color-mix(in srgb, var(--MI_THEME-warn) 55%, var(--MI_THEME-fg));
	--wbGoldBg: color-mix(in srgb, var(--MI_THEME-warn) 22%, var(--MI_THEME-panel));
	--wbSerif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	--wbEn: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	box-sizing: border-box;
	max-width: 640px;
	margin: 0 auto;
	padding: 20px 16px 48px;
}

.reviewing {
	max-width: 560px;
	padding-top: 14px;
}

.failed {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 40px 0;
	text-align: center;

	> p {
		margin: 0;
	}
}
</style>
