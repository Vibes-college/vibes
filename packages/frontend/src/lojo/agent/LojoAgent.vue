<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
The learner's Momo in the corner (2026-11-16; until then 「召唤 Agent」, Paseo in an iframe). Mounted by
ui/_common_/common.vue only when 「在首页显示 …」 is on for this device (settings › AI tutor), so the site loads none of
this by default.
Since 11-17 (founder picked A, the peek): only the head, peeking in from the edge of the screen, the learner's own
face and name (lojo/tutor/persona.ts). No 「AI」 tag here: the corner is only a way in; the chat list, the chat header's
「学搭子」, the profile and the first message say it is an AI. When today's plan still has tasks, it says so once a day.
The head opens a small panel with the learner's chat with the AI tutor: the same chat page as /chat/user/<id>, run by
its own router inside the panel (like MkPageWindow), so whatever page is underneath stays where it is. Links that
lead anywhere else open in the main page.
Since 11-17 20:53 PT (founder: 「挡住东西了就能移动开」) the head can be dragged with a finger or a mouse to the other side
or another height; this device remembers where (./dock.ts).
-->

<template>
<div :class="$style.root">
	<!-- The head and its bubble move together. Dragged (founder 11-17 20:53 PT), it goes to the nearer side on release. -->
	<div
		v-show="!panelOpen && !hiddenHere"
		ref="dockEl"
		:class="[$style.dock, {
			[$style.left]: side === 'left',
			[$style.inCorner]: barHidden,
			[$style.placed]: spot != null && dragAt == null,
			[$style.dragging]: dragging,
			[$style.settling]: settling,
		}]"
		:style="dockStyle"
		data-vibi-dock
		:data-side="side"
	>
		<button
			ref="fabEl"
			class="_button"
			:class="[$style.fab, { [$style.arrive]: arriving }]"
			:title="L.open(myTutorName)"
			:aria-label="L.open(myTutorName)"
			aria-haspopup="dialog"
			data-vibi-fab
			@click="onFabClick"
			@pointerdown="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointercancel="onPointerUp"
			@animationend="arriving = false"
		>
			<img :class="$style.peekHead" :src="headUrl" alt="" draggable="false">
		</button>
		<div v-if="bubble" :class="$style.bubble" role="status" @click="openPanel">{{ bubble }}</div>
	</div>

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
			<!-- 聊天模式: her name opens 「<名字> 怎么回你」, like the chat page's header (lojo/tutor/mode.ts). -->
			<button v-if="modesAvailable" class="_button" :class="[$style.who, $style.whoButton]" :aria-label="vt.mode.changeAria(myTutorName)" aria-haspopup="menu" data-mode-trigger @click="openModeMenu($event, myTutorName)">
				<img :class="$style.whoHead" :src="headUrl" alt="" draggable="false">
				<span :class="$style.whoText">
					<span :class="$style.whoName">{{ myTutorName }}<i v-if="modeAccent == null" class="ti ti-chevron-down" :class="$style.whoChevron"></i></span>
					<span v-if="modeAccent" :class="$style.whoAccent"><i :class="modeAccent.icon"></i> {{ modeAccent.text }} <i class="ti ti-chevron-down"></i></span>
				</span>
			</button>
			<div v-else :class="$style.who">
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
import { vibiText as L } from '@/lojo/locales/vibi.js';
import { markSaid, peekLine, saidToday } from './peek.js';
import { clampDrag, isDrag, loadSpot, saveSpot, sideFor, TOP_GAP } from './dock.js';
import type { Side, Spot } from './dock.js';
import { cornerHeldBack, forgetPanelOpen, justShown, rememberPanelOpen, setShowVibi, shouldReopenPanel } from './state.js';
import { personaHeadUrl } from '@/lojo/tutor/persona-rules.js';
import { loadTutorIds, myTutorName, myTutorSeed } from '@/lojo/tutor/persona.js';
import { loadTutorMode, modeAccent, modesAvailable, openModeMenu } from '@/lojo/tutor/mode.js';
import { vt } from '@/lojo/locales/index.js';
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

const dockEl = useTemplateRef('dockEl');
const fabEl = useTemplateRef('fabEl');
const minimizeEl = useTemplateRef('minimizeEl');

// ---------- Moving the head (./dock.ts) ----------
// Where the learner left it on this device; null: never moved, the default corner.
const spot = ref<Spot | null>(loadSpot());
const side = ref<Side>(spot.value?.side ?? 'right');
// While dragged, and while it glides to the side after release: where the head is, in px from the top left.
const dragAt = ref<{ left: number; top: number } | null>(null);
const dragging = ref(false);
const settling = ref(false);
let settleTimer: number | null = null;
// A drag ends with a click on the head; that one does not open the chat.
let noClickUntil = 0;

type Limits = { width: number; height: number; minTop: number; minBottom: number; insetLeft: number; insetRight: number };
let press: { id: number; x: number; y: number; left: number; top: number; size: { width: number; height: number }; limits: Limits | null } | null = null;

const dockStyle = computed(() => {
	if (dragAt.value) return { left: `${dragAt.value.left}px`, top: `${dragAt.value.top}px`, right: 'auto', bottom: 'auto' };
	if (spot.value) return { '--vibi-y': `${spot.value.y}px` };
	return {};
});

// A CSS length (safe areas, the bottom bar's height) in px, measured as it is right now.
function cssPx(expr: string): number {
	const probe = window.document.createElement('div');
	probe.style.cssText = `position:fixed;left:0;top:0;width:0;visibility:hidden;pointer-events:none;height:${expr}`;
	window.document.body.appendChild(probe);
	const px = probe.getBoundingClientRect().height;
	probe.remove();
	return px;
}

function limits(): Limits {
	return {
		width: window.document.documentElement.clientWidth,
		height: window.document.documentElement.clientHeight,
		minTop: TOP_GAP + cssPx('env(safe-area-inset-top, 0px)'),
		// Never over the phone's bottom bar: the same margins as the default corner (see .dock below).
		minBottom: cssPx(barHidden.value ? 'calc(16px + env(safe-area-inset-bottom, 0px))' : 'calc(var(--MI-minBottomSpacing, 0px) + 16px)'),
		insetLeft: cssPx('env(safe-area-inset-left, 0px)'),
		insetRight: cssPx('env(safe-area-inset-right, 0px)'),
	};
}

function onPointerDown(ev: PointerEvent) {
	if (!ev.isPrimary || ev.button !== 0 || settling.value) return;
	const r = dockEl.value?.getBoundingClientRect();
	if (!r) return;
	press = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, left: r.left, top: r.top, size: { width: r.width, height: r.height }, limits: null };
	(ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
	// A mouse would start selecting the text underneath.
	if (ev.pointerType === 'mouse') ev.preventDefault();
}

function onPointerMove(ev: PointerEvent) {
	if (press == null || ev.pointerId !== press.id) return;
	const dx = ev.clientX - press.x;
	const dy = ev.clientY - press.y;
	if (press.limits == null) {
		// Moved less than a few px: still a tap.
		if (!isDrag(dx, dy)) return;
		press.limits = limits();
		dragging.value = true;
	}
	ev.preventDefault();
	const at = clampDrag({ left: press.left + dx, top: press.top + dy }, press.size, press.limits);
	dragAt.value = at;
	side.value = sideFor(at.left + press.size.width / 2, press.limits.width);
}

function onPointerUp(ev: PointerEvent) {
	if (press == null || ev.pointerId !== press.id) return;
	const { size, limits: lim } = press;
	press = null;
	// A tap: the click that follows opens the chat.
	if (lim == null || dragAt.value == null) return;
	noClickUntil = performance.now() + 400;
	dragging.value = false;
	// Glide to the side, then hand over to the stylesheet, which keeps it on the screen when the window changes size.
	const top = dragAt.value.top;
	spot.value = { side: side.value, y: lim.height - top - size.height };
	saveSpot(spot.value);
	settling.value = true;
	dragAt.value = { left: side.value === 'left' ? lim.insetLeft : lim.width - lim.insetRight - size.width, top };
	if (settleTimer != null) window.clearTimeout(settleTimer);
	settleTimer = window.setTimeout(() => {
		settleTimer = null;
		settling.value = false;
		dragAt.value = null;
	}, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260);
}

function onFabClick() {
	if (performance.now() < noClickUntil) return;
	void openPanel();
}

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
	void loadTutorMode(true);
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
	if (settleTimer != null) window.clearTimeout(settleTimer);
});
</script>

<style lang="scss" module>
.root {
	display: contents;
}

// Above the page and the phone's bottom bar, below the drawer menu (1001) and Misskey's popups (claimZIndex).
// The peek (founder 11-17, mockup A): the head, tilted, partly past the edge of the screen. By default on the right,
// where the floating post button used to be. The head can be dragged (founder 11-17 20:53 PT; script above and
// ./dock.ts): on release it goes to the nearer side, at the height where it was let go (--vibi-y, from the bottom).
.dock {
	// The lowest it may sit: above the phone's bottom bar, or in the corner while scrolling hides the bar.
	--vibi-min: calc(var(--MI-minBottomSpacing, 0px) + 16px);
	position: fixed;
	right: env(safe-area-inset-right, 0px);
	bottom: var(--vibi-min);
	z-index: 1000;
	width: 52px;
	height: 78px;
	user-select: none;
	-webkit-user-select: none;
	-webkit-touch-callout: none;
	transition: bottom 200ms ease;

	&.inCorner {
		--vibi-min: calc(16px + env(safe-area-inset-bottom, 0px));
	}

	&.left {
		right: auto;
		left: env(safe-area-inset-left, 0px);
	}

	// Moved by the learner. Still on the screen when the window gets smaller or the phone turns, never over the bottom
	// bar, and room above for the bubble (TOP_GAP in ./dock.ts).
	&.placed {
		bottom: clamp(var(--vibi-min), var(--vibi-y), calc(100dvh - 78px - 40px - env(safe-area-inset-top, 0px)));
	}

	&.dragging {
		transition: none;
		cursor: grabbing;
	}

	&.settling {
		transition: left 0.25s ease, top 0.25s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		&, &.settling {
			transition: none;
		}
	}
}

.fab {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	// The keyboard focus ring: around the part that shows.
	border-radius: 16px 0 0 16px;
	// The finger moves the head, not the page.
	touch-action: none;

	.left > & {
		border-radius: 0 16px 16px 0;
	}

	&:hover > .peekHead,
	&:focus-visible > .peekHead {
		transform: translateX(-6px) rotate(-10deg);
	}

	.left > &:hover > .peekHead,
	.left > &:focus-visible > .peekHead {
		transform: scaleX(-1) translateX(-6px) rotate(-10deg);
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

	// On the left side: the mirror image, peeking in from the left edge.
	.left & {
		left: auto;
		right: 0;
		transform: scaleX(-1) rotate(-16deg);
	}

	// Picked up: stands a little straighter and bigger.
	.dragging > .fab > & {
		transform: rotate(-6deg) scale(1.06);
	}

	.left.dragging > .fab > & {
		transform: scaleX(-1) rotate(-6deg) scale(1.06);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
}

// Switched on in settings: it slides in from the edge.
.arrive > .peekHead {
	animation: arrive 0.7s cubic-bezier(0.2, 1.4, 0.4, 1);

	.left > & {
		animation-name: arriveLeft;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
}

@keyframes arrive {
	from { transform: translateX(80px) rotate(10deg); }
	to { transform: rotate(-16deg); }
}

@keyframes arriveLeft {
	from { transform: scaleX(-1) translateX(80px) rotate(10deg); }
	to { transform: scaleX(-1) rotate(-16deg); }
}

// Next to the head, at the height of its face, toward the middle of the screen. A tap opens the chat.
.bubble {
	position: absolute;
	right: 62px;
	bottom: 30px;
	width: max-content;
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

	.left > & {
		right: auto;
		left: 62px;
		border-radius: 14px 14px 14px 4px;
		transform-origin: 0 100%;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
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

.whoButton {
	text-align: left;
	border-radius: 10px;
	padding: 2px 6px 2px 0;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.whoText {
	display: flex;
	flex-direction: column;
	min-width: 0;
	line-height: 1.2;
}

.whoName,
.whoAccent {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.whoChevron {
	margin-left: 4px;
	font-size: 0.8em;
	opacity: 0.45;
}

.whoAccent {
	color: var(--MI_THEME-cta);
	font-size: 0.75em;
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
