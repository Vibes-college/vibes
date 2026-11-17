<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
The learner's Momo in the corner (2026-11-16; until then 「召唤 Agent」, Paseo in an iframe). Mounted by
ui/_common_/common.vue only when 「在首页显示 …」 is on for this device (settings › AI tutor), so the site loads none of
this by default.
Since 11-17 (founder picked A, the peek): only the head, peeking in from the right edge of the screen, the learner's own
face and name (lojo/tutor/persona.ts). No 「AI」 tag here: the corner is only a way in; the chat list, the chat header's
「学搭子」, the profile and the first message say it is an AI. When today's plan still has tasks, it says so once a day.
The head opens a small panel with the learner's chat with the AI tutor: the same chat page as /chat/user/<id>, run by
its own router inside the panel (like MkPageWindow), so whatever page is underneath stays where it is. Links that
lead anywhere else open in the main page.
-->

<template>
<div :class="$style.root">
	<button
		v-show="!panelOpen && !hiddenHere"
		ref="fabEl"
		class="_button"
		:class="[$style.fab, { [$style.arrive]: arriving, [$style.inCorner]: barHidden }]"
		:title="L.open(myTutorName)"
		:aria-label="L.open(myTutorName)"
		aria-haspopup="dialog"
		data-vibi-fab
		@click="openPanel"
		@animationend="arriving = false"
	>
		<img :class="$style.peekHead" :src="headUrl" alt="" draggable="false">
	</button>
	<div v-if="bubble && !panelOpen && !hiddenHere" :class="[$style.bubble, { [$style.inCorner]: barHidden }]" role="status" @click="openPanel">{{ bubble }}</div>

	<section
		v-show="panelOpen"
		:class="[$style.panel, { [$style.big]: big }]"
		:style="viewportStyle"
		role="dialog"
		:aria-label="myTutorName"
		data-vibi-panel
		@keydown.esc.stop="minimize"
	>
		<header :class="$style.bar">
			<div :class="$style.who">
				<img :class="$style.whoHead" :src="headUrl" alt="" draggable="false">
				<span>{{ myTutorName }}</span>
			</div>
			<button v-if="!isPhone" class="_button" :class="$style.iconButton" :title="big ? L.smaller : L.bigger" :aria-label="big ? L.smaller : L.bigger" @click="big = !big">
				<i :class="big ? 'ti ti-arrows-minimize' : 'ti ti-arrows-maximize'"></i>
			</button>
			<button ref="minimizeEl" class="_button" :class="$style.iconButton" :title="L.minimize" :aria-label="L.minimize" @click="minimize">
				<i class="ti ti-minus"></i>
			</button>
			<button class="_button" :class="$style.iconButton" :title="L.more" :aria-label="L.more" aria-haspopup="menu" @click="showMenu">
				<i class="ti ti-dots"></i>
			</button>
		</header>
		<div :class="$style.body" class="_forceShrinkSpacer">
			<XVibiChat v-if="chatPath && chatStarted" :path="chatPath" @left="onLeft"/>
			<div v-else-if="unavailable" :class="$style.unavailable">{{ L.unavailable(myTutorName) }}</div>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import XVibiChat from './VibiChat.vue';
import { vibiLabels as L } from './labels.js';
import { markSaid, peekLine, saidToday } from './peek.js';
import { cornerHeldBack, forgetPanelOpen, justShown, rememberPanelOpen, setShowVibi, shouldReopenPanel } from './state.js';
import { personaHeadUrl } from '@/lojo/tutor/persona-rules.js';
import { loadTutorIds, myTutorName, myTutorSeed } from '@/lojo/tutor/persona.js';
import * as os from '@/os.js';
import { DI } from '@/di.js';
import { mainRouter } from '@/router.js';
import { misskeyApi } from '@/utility/misskey-api.js';

// On a phone, scrolling the timeline hides the bottom bar; the button then sits in the corner where the floating post
// button used to be (ui/universal.vue does not show that one while the corner button is shown).
const timelineChrome = inject(DI.mobileTimelineChrome, null);
const barHidden = computed(() => timelineChrome?.hidden.value === true);

const vibiId = ref<string | null>(null);
const headUrl = computed(() => personaHeadUrl(myTutorSeed.value));
const chatPath = computed(() => (vibiId.value ? `/chat/user/${vibiId.value}` : null));
// 闯关页自己有学搭子的头像，两个同时在会像两个人（创始人 11-10）：不显示按钮，点闯关里的头像打开同一个面板。
// The chat page with the AI tutor itself needs no second one either, nor does 「认识你的 Momo」 while it is open.
const hiddenHere = computed(() => {
	const path = mainRouter.currentRoute.value.path;
	return path === '/quest' || cornerHeldBack.value > 0 || (chatPath.value != null && mainRouter.getCurrentFullPath().startsWith(chatPath.value));
});

const fabEl = useTemplateRef('fabEl');
const minimizeEl = useTemplateRef('minimizeEl');

const panelOpen = ref(false);
const big = ref(false);
const arriving = ref(false);
const bubble = ref('');
const unavailable = ref(false);
let bubbleTimer: number | null = null;

const phoneQuery = window.matchMedia('(max-width: 640px)');
const isPhone = ref(phoneQuery.matches);
const onPhoneChange = () => { isPhone.value = phoneQuery.matches; };

// On a phone the panel fills the visible area. When the keyboard opens, the visible area shrinks and the panel
// shrinks with it, so the chat's input box stays right above the keyboard.
const viewport = ref<{ top: number; height: number } | null>(null);

function fitViewport() {
	const vv = window.visualViewport;
	viewport.value = vv && panelOpen.value ? { top: vv.offsetTop, height: vv.height } : null;
}

const viewportStyle = computed(() => (isPhone.value && viewport.value
	? { top: `${viewport.value.top}px`, height: `${viewport.value.height}px` }
	: {}));

// ---------- The chat inside the panel ----------
// Started on first open, then kept, so the conversation stays as it was between opens.
const chatStarted = ref(false);

// A link in the chat opened something in the main page: on a phone the panel covers it, so step aside.
function onLeft() {
	if (isPhone.value) minimize();
}

async function findVibi(): Promise<string | null> {
	if (vibiId.value) return vibiId.value;
	vibiId.value = (await loadTutorIds())[0] ?? null;
	return vibiId.value;
}

function say(text: string, ms = 4000) {
	bubble.value = text;
	if (bubbleTimer != null) window.clearTimeout(bubbleTimer);
	bubbleTimer = window.setTimeout(() => { bubble.value = ''; }, ms);
}

// 有新任务的时候从旁边冒一句话（创始人 11-17）: once a day on this device, when today's plan still has tasks to do.
// Not on the pages where the button is hidden: then the line waits until the learner is somewhere else.
const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })();
const waitingLine = ref<string | null>(null);

async function nudge() {
	if (saidToday()) return;
	try {
		waitingLine.value = peekLine(await misskeyApi('lojo/plan/show', { tz }) as unknown as Parameters<typeof peekLine>[0]);
	} catch { /* no plan, or offline: nothing to say */ }
}

watch([waitingLine, hiddenHere, panelOpen], ([line, hidden, open]) => {
	if (line == null || hidden || open || saidToday()) return;
	waitingLine.value = null;
	markSaid();
	say(line, 6000);
});

async function openPanel() {
	bubble.value = '';
	panelOpen.value = true;
	fitViewport();
	void nextTick(() => minimizeEl.value?.focus({ preventScroll: true }));
	if (!chatStarted.value) {
		const id = await findVibi();
		unavailable.value = id == null;
		chatStarted.value = id != null;
	}
}

// Minimizing only hides the panel; the chat stays as it was.
function minimize() {
	forgetPanelOpen();
	panelOpen.value = false;
	viewport.value = null;
	void nextTick(() => fabEl.value?.focus({ preventScroll: true }));
}

function showMenu(ev: MouseEvent) {
	os.popupMenu([{
		text: L.openFull,
		icon: 'ti ti-arrows-diagonal',
		action: () => {
			if (chatPath.value) mainRouter.pushByPath(chatPath.value);
			minimize();
		},
	}, {
		text: L.settings,
		icon: 'ti ti-settings',
		action: () => {
			mainRouter.pushByPath('/settings/agent');
			if (isPhone.value) minimize();
		},
	}, { type: 'divider' }, {
		text: L.hide,
		icon: 'ti ti-eye-off',
		action: () => {
			os.toast(L.hidden(myTutorName.value));
			// Unmounts this component (common.vue renders it only while shown).
			setShowVibi(false);
		},
	}], (ev.currentTarget ?? ev.target) as HTMLElement);
}

// The quest page's tutor avatar asks for this panel (pages/lojo/quest.vue).
function onOpenRequest(ev: Event) {
	ev.preventDefault();
	void openPanel();
}

function onVisibilityChange() {
	if (window.document.visibilityState === 'hidden') {
		if (panelOpen.value) rememberPanelOpen();
	} else {
		forgetPanelOpen();
	}
}

onMounted(() => {
	window.addEventListener('vibes:agent-open', onOpenRequest);
	window.document.addEventListener('visibilitychange', onVisibilityChange);
	window.visualViewport?.addEventListener('resize', fitViewport);
	window.visualViewport?.addEventListener('scroll', fitViewport);
	phoneQuery.addEventListener('change', onPhoneChange);
	void findVibi();
	if (justShown.value) {
		justShown.value = false;
		arriving.value = true;
		say(L.arrived(myTutorName.value));
	} else if (shouldReopenPanel()) {
		forgetPanelOpen();
		void openPanel();
	} else {
		void nudge();
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('vibes:agent-open', onOpenRequest);
	window.document.removeEventListener('visibilitychange', onVisibilityChange);
	window.visualViewport?.removeEventListener('resize', fitViewport);
	window.visualViewport?.removeEventListener('scroll', fitViewport);
	phoneQuery.removeEventListener('change', onPhoneChange);
	if (bubbleTimer != null) window.clearTimeout(bubbleTimer);
});
</script>

<style lang="scss" module>
.root {
	display: contents;
}

// Above the page and the phone's bottom bar, below the drawer menu (1001) and Misskey's popups (claimZIndex).
// The peek (founder 11-17, mockup A): the head, tilted, partly past the right edge of the screen, where the floating
// post button used to be.
.fab {
	position: fixed;
	right: env(safe-area-inset-right, 0px);
	bottom: calc(var(--MI-minBottomSpacing, 0px) + 16px);
	z-index: 1000;
	width: 52px;
	height: 78px;
	// The keyboard focus ring: around the part that shows.
	border-radius: 16px 0 0 16px;
	transition: bottom 200ms ease;

	&.inCorner {
		bottom: calc(16px + env(safe-area-inset-bottom, 0px));
	}

	&:hover > .peekHead,
	&:focus-visible > .peekHead {
		transform: translateX(-6px) rotate(-10deg);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
}

.peekHead {
	position: absolute;
	left: 0;
	bottom: 0;
	width: 80px;
	aspect-ratio: 202 / 196;
	transform: rotate(-16deg);
	transform-origin: 50% 100%;
	filter: drop-shadow(0 6px 10px var(--MI_THEME-shadow));
	transition: transform 0.25s cubic-bezier(0.3, 1.4, 0.5, 1);
	pointer-events: none;
	user-select: none;

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
}

// Switched on in settings: it slides in from the edge.
.arrive > .peekHead {
	animation: arrive 0.7s cubic-bezier(0.2, 1.4, 0.4, 1);

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
}

@keyframes arrive {
	from { transform: translateX(80px) rotate(10deg); }
	to { transform: rotate(-16deg); }
}

// Next to the head, at the height of its face. A tap opens the chat.
.bubble {
	position: fixed;
	right: calc(env(safe-area-inset-right, 0px) + 62px);
	bottom: calc(var(--MI-minBottomSpacing, 0px) + 46px);
	z-index: 1000;
	max-width: 230px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 14px 14px 4px 14px;
	padding: 8px 12px;
	font-size: 0.9em;
	box-shadow: 0 12px 28px -10px var(--MI_THEME-shadow);
	cursor: pointer;
	animation: bubbleIn 0.3s cubic-bezier(0.3, 1.4, 0.5, 1);
	transform-origin: 100% 100%;
	transition: bottom 200ms ease;

	&.inCorner {
		bottom: calc(46px + env(safe-area-inset-bottom, 0px));
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transition: none;
	}
}

@keyframes bubbleIn {
	from { transform: scale(0.6); opacity: 0; }
	to { transform: none; opacity: 1; }
}

.panel {
	box-sizing: border-box;
	position: fixed;
	right: 16px;
	bottom: 16px;
	z-index: 1002;
	width: 420px;
	height: min(700px, calc(100dvh - 32px));
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 18px;
	box-shadow: 0 1px 2px var(--MI_THEME-shadow), 0 18px 40px -12px var(--MI_THEME-shadow);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	overscroll-behavior: contain;

	&.big {
		width: min(1000px, calc(100vw - 32px));
		height: calc(100dvh - 32px);
	}
}

.bar {
	flex: none;
	height: 46px;
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 0 6px 0 12px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.who {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	margin-right: auto;
	font-weight: bold;

	> span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.whoHead {
	flex: none;
	width: 28px;
	aspect-ratio: 202 / 196;
}

.iconButton {
	width: 38px;
	height: 38px;
	border-radius: 10px;
	display: grid;
	place-items: center;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.body {
	position: relative;
	flex: 1;
	min-height: 0;
	overflow: hidden;
	background: var(--MI_THEME-bg);

	--MI-margin: var(--MI-marginHalf);
}

.body > :first-child {
	height: 100%;
}

.unavailable {
	display: grid;
	place-content: center;
	height: 100%;
	padding: 24px;
	text-align: center;
	opacity: 0.75;
}

// Phones: fill the visible area. top and height come from visualViewport (see fitViewport).
@media (max-width: 640px) {
	.panel, .panel.big {
		top: 0;
		left: 0;
		right: 0;
		bottom: auto;
		width: auto;
		height: 100dvh;
		border: 0;
		border-radius: 0;
		box-shadow: none;
	}

	.bar {
		height: calc(46px + env(safe-area-inset-top));
		padding-top: env(safe-area-inset-top);
	}
}
</style>
