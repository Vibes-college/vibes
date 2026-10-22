<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" data-testid="guide-stack">
	<div v-if="guides.length" :class="$style.desk">
		<div v-for="(pile, p) in piles" :key="p" :class="$style.spot">
		<TransitionGroup
			tag="ol"
			:class="$style.pile"
			:enterFromClass="$style.slabEnterFrom"
			:enterActiveClass="$style.slabEnterActive"
			:leaveActiveClass="$style.slabLeaveActive"
			:leaveToClass="$style.slabLeaveTo"
			:moveClass="$style.slabMove"
			:aria-label="`收藏的攻略，第 ${p + 1} 摞`"
		>
			<li
				v-for="item in pile"
				:key="item.guide.id"
				:class="[$style.slab, $style[`deco-${item.look.deco}`], {
					[$style.leaving]: leaving === item.guide.id,
					[$style.revealed]: revealed === item.guide.id,
					[$style.hint]: hintId === item.guide.id,
				}]"
				:style="item.style"
				:data-slab="item.guide.id"
			>
				<button
					type="button"
					class="_button"
					:class="$style.swipeAction"
					:aria-label="guideLabels.unbookmark"
					:tabindex="revealed === item.guide.id ? 0 : -1"
					:disabled="bookmarkBusy.has(item.guide.id)"
					@click="emit('bookmark', item.guide)"
				>
					<i class="ti ti-bookmark-off" aria-hidden="true"></i>
				</button>
				<MkA
					:to="`/lojo/guides/${item.guide.id}`"
					:class="$style.body"
					:data-id="item.guide.id"
					:aria-label="`${item.guide.title || guideLabels.untitled}，${item.look.minutes} 分钟`"
					@click.capture="onOpen(item.guide, item.look, $event)"
					@pointerdown="onSwipeStart(item.guide.id, $event)"
					@pointermove="onSwipeMove"
					@pointerup="onSwipeEnd"
					@pointercancel="onSwipeCancel"
				>
					<span :class="$style.art" aria-hidden="true"></span>
					<span :class="$style.title">{{ item.guide.title || guideLabels.untitled }}</span>
				</MkA>
				<button type="button" class="_button" :class="$style.unsave" :aria-label="guideLabels.unbookmark" :disabled="bookmarkBusy.has(item.guide.id)" @click="emit('bookmark', item.guide)">
					<i class="ti ti-bookmark-off" aria-hidden="true"></i>
				</button>
			</li>
		</TransitionGroup>
		<div :class="$style.board" aria-hidden="true"></div>
		</div>
	</div>
	<div v-else :class="$style.empty">
		<ol :class="[$style.pile, $style.ghostPile]" aria-hidden="true">
			<li v-for="n in 3" :key="n" :class="$style.ghost" :style="{ '--len': `${[240, 210, 256][n - 1]}px`, '--t': `${[34, 28, 40][n - 1]}px`, '--dx': `${[6, -8, 0][n - 1]}px` }"></li>
		</ol>
		<p>收藏的攻略会摞在这里</p>
		<MkButton primary rounded @click="emit('browse')">去精选看看</MkButton>
	</div>
	<p v-if="guides.length" :class="$style.count">{{ guides.length }} 本</p>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, useCssModule } from 'vue';
import type { BookLook } from '../shelves.js';
import { bookLooks } from '../shelves.js';
import { guideLabels } from '../labels.js';
import { canAnimateCoverVeil, coverVeil } from '../cover-veil.js';
import type { Guide } from '@/lojo/guides/types.js';
import MkButton from '@/components/MkButton.vue';
import { useRouter } from '@/router.js';

const props = defineProps<{ guides: Guide[]; bookmarkBusy: Set<string> }>();
const emit = defineEmits<{ (ev: 'bookmark', guide: Guide): void; (ev: 'browse'): void }>();
const router = useRouter();
const style = useCssModule();
const leaving = ref<string | null>(null);
const revealed = ref<string | null>(null);
const hintId = ref<string | null>(null);
const PILE = 7;
const REVEAL = 64;
const HINT_KEY = 'lojo:stackSwipeHinted';

function jitter(id: string, salt: number) {
	let h = 2166136261 ^ salt;
	for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
	return ((h >>> 0) % 1000) / 1000;
}

// Newest on top. Each book lies a little off-square, the way a real pile settles.
const piles = computed(() => {
	const looks = bookLooks(props.guides);
	const items = props.guides.map((guide, i) => {
		const look = looks[i];
		return {
			guide,
			look,
			style: {
				'--c': look.c,
				'--ink': look.ink,
				'--t': `${Math.round(look.t * 0.82)}px`,
				'--len': `${Math.round(250 + (Number(look.hr) - 0.78) * 400)}px`,
				'--dx': `${Math.round((jitter(guide.id, 1) - 0.5) * 22)}px`,
				'--rot': `${((jitter(guide.id, 2) - 0.5) * 2.4).toFixed(2)}deg`,
				'--z': PILE - (i % PILE),
			},
		};
	});
	const out: typeof items[] = [];
	for (let i = 0; i < items.length; i += PILE) out.push(items.slice(i, i + PILE));
	return out;
});

function onOpen(guide: Guide, look: BookLook, event: MouseEvent) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	// A swipe is not a tap, and tapping a book that shows its remove tab just closes the tab.
	if (swipeJustEnded || revealed.value === guide.id) {
		revealed.value = null;
		return;
	}
	revealed.value = null;
	if (leaving.value) return;
	const destination = `/lojo/guides/${guide.id}`;
	const body = event.currentTarget as HTMLElement;
	if (!canAnimateCoverVeil()) {
		router.pushByPath(destination);
		return;
	}
	leaving.value = guide.id;
	coverVeil({
		rect: body.getBoundingClientRect(),
		cloth: look.c,
		ink: look.ink,
		title: guide.title || guideLabels.untitled,
		radius: '2px',
		navigate: () => {
			leaving.value = null;
			router.pushByPath(destination);
		},
	});
}

// Touch: drag a book left to uncover its remove tab. The book follows the finger with a little
// resistance, then snaps open or closed when released.
let swipe: { id: string; slab: HTMLElement; x0: number; y0: number; base: number; dx: number; horizontal: boolean | null } | null = null;
let swipeJustEnded = false;

function onSwipeStart(id: string, event: PointerEvent) {
	if (event.pointerType !== 'touch' || leaving.value) return;
	const slab = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-slab]');
	if (!slab) return;
	swipe = { id, slab, x0: event.clientX, y0: event.clientY, base: revealed.value === id ? -REVEAL : 0, dx: 0, horizontal: null };
}

function onSwipeMove(event: PointerEvent) {
	if (!swipe) return;
	const dx = event.clientX - swipe.x0;
	const dy = event.clientY - swipe.y0;
	if (swipe.horizontal == null) {
		if (Math.abs(dx) + Math.abs(dy) < 8) return;
		swipe.horizontal = Math.abs(dx) > Math.abs(dy);
		if (!swipe.horizontal) {
			swipe = null;
			return;
		}
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		if (revealed.value && revealed.value !== swipe.id) revealed.value = null;
		swipe.slab.classList.add(style.dragging);
	}
	swipe.dx = dx;
	let x = swipe.base + dx;
	if (x > 0) x *= 0.2;
	else if (x < -REVEAL) x = -REVEAL + (x + REVEAL) * 0.3;
	swipe.slab.style.setProperty('--drag', `${Math.max(-REVEAL - 46, x).toFixed(1)}px`);
}

function onSwipeEnd() {
	if (!swipe) return;
	const { id, slab, base, dx, horizontal } = swipe;
	swipe = null;
	slab.classList.remove(style.dragging);
	slab.style.removeProperty('--drag');
	if (!horizontal) return;
	revealed.value = base + dx < -REVEAL / 2 ? id : null;
	swipeJustEnded = true;
	window.setTimeout(() => { swipeJustEnded = false; }, 0);
}

function onSwipeCancel() {
	if (!swipe) return;
	swipe.slab.classList.remove(style.dragging);
	swipe.slab.style.removeProperty('--drag');
	swipe = null;
}

// Any touch outside the open book closes its tab.
function onDocumentPointerDown(event: PointerEvent) {
	if (!revealed.value) return;
	const slab = (event.target as Element | null)?.closest('[data-slab]');
	if (slab?.getAttribute('data-slab') !== revealed.value) revealed.value = null;
}

// The first time the pile appears on a touch screen, the top book nudges left once.
function maybeHint() {
	if (!window.matchMedia('(hover: none)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	if (window.localStorage.getItem(HINT_KEY) || !props.guides.length) return;
	window.localStorage.setItem(HINT_KEY, '1');
	window.setTimeout(() => {
		hintId.value = props.guides[0]?.id ?? null;
		window.setTimeout(() => { hintId.value = null; }, 1300);
	}, 700);
}

onMounted(() => {
	window.document.addEventListener('pointerdown', onDocumentPointerDown, true);
	maybeHint();
});
onActivated(() => {
	leaving.value = null;
	revealed.value = null;
	window.document.addEventListener('pointerdown', onDocumentPointerDown, true);
});
onDeactivated(() => window.document.removeEventListener('pointerdown', onDocumentPointerDown, true));
onBeforeUnmount(() => window.document.removeEventListener('pointerdown', onDocumentPointerDown, true));
</script>

<style lang="scss" module>
.root {
	--serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", Georgia, serif;
	--ease: cubic-bezier(.22, .9, .24, 1);
	position: relative;
	padding: 36px 8px 8px;
}

.desk { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: center; gap: 44px 0; }
.spot { display: flex; flex-direction: column; align-items: stretch; padding: 0 24px; }
.pile { display: flex; flex-direction: column; align-items: center; margin: 0; padding: 0 46px 0 0; list-style: none; }
/* Each pile brings its own length of desk; side by side they read as one long top. */
.board {
	height: 14px;
	margin: 0 -24px;
	border-radius: 2px 2px 6px 6px;
	background: linear-gradient(180deg, color-mix(in srgb, #C9A97A 34%, var(--MI_THEME-bg)) 0 6px, color-mix(in srgb, #A9875A 52%, var(--MI_THEME-bg)) 6px 100%);
	box-shadow: 0 16px 24px -16px rgba(20, 32, 79, .45);
}
.count { margin: 14px 4px 0; text-align: right; font-size: 12px; letter-spacing: .08em; color: var(--MI_THEME-fgTransparentWeak); }

/* One book lying flat, spine toward you. The strip above it is a glimpse of its top board. */
.slab {
	position: relative;
	z-index: var(--z);
	width: var(--len);
	height: var(--t);
	margin-top: -5px;
	translate: var(--dx) 0;
	rotate: var(--rot);
	transition: rotate .5s var(--ease);
}
.slab:first-child { margin-top: 0; }
.slab::before {
	content: "";
	position: absolute;
	left: 5px;
	right: -5px;
	top: -5px;
	height: 6px;
	background: color-mix(in srgb, var(--c) 78%, #fff);
	clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
	transition: translate .55s var(--ease);
}
.body {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 0 12px 0 14px;
	box-sizing: border-box;
	border-radius: 2px;
	background: var(--c);
	color: var(--ink);
	text-decoration: none !important;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18), 0 2px 3px rgba(14, 20, 40, .16);
	transition: translate .55s var(--ease), box-shadow .5s;
	outline: none;
	overflow: hidden;
	&::after {
		/* rounded spine: lit along the middle, darker toward the boards */
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(180deg, rgba(0, 0, 0, .2), rgba(255, 255, 255, .12) 26%, rgba(255, 255, 255, 0) 52%, rgba(0, 0, 0, .08) 80%, rgba(0, 0, 0, .24));
	}
}
.title { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 700 clamp(12.5px, calc(var(--t) * .44), 17px)/1 var(--serif); letter-spacing: .06em; }
.art { flex: none; display: none; }
.deco-bands .body::before { content: ""; position: absolute; top: 18%; bottom: 18%; left: 22px; right: 22px; border-left: 1.5px solid currentColor; border-right: 1.5px solid currentColor; opacity: .45; pointer-events: none; }
.deco-bands .body { padding-left: 32px; padding-right: 32px; }
.deco-checker .art { display: block; align-self: stretch; width: 26px; margin-left: -14px; background: repeating-conic-gradient(var(--ink) 0 25%, transparent 0 50%) 0 0 / calc(var(--t) / 3) calc(var(--t) / 3); opacity: .85; }
.deco-stripes .art { display: block; align-self: stretch; width: 22px; margin-left: -14px; background: repeating-linear-gradient(45deg, var(--ink) 0 2px, transparent 2px 7px); opacity: .45; }
.deco-emblem .art { display: block; width: 10px; height: 10px; border: 1.5px solid currentColor; border-radius: 50%; opacity: .75; }
.deco-bigtype .title { font: 800 clamp(13px, calc(var(--t) * .5), 18px)/1 -apple-system, "PingFang SC", "Noto Sans SC", sans-serif; letter-spacing: .02em; }

.unsave {
	position: absolute;
	top: 50%;
	right: -46px;
	display: grid;
	place-items: center;
	width: 32px;
	height: 32px;
	margin-top: -16px;
	border-radius: 50%;
	font-size: 15px;
	color: var(--MI_THEME-fgTransparentWeak);
	opacity: 0;
	translate: -8px 0;
	transition: opacity .25s, translate .45s var(--ease), color .2s, background .2s;
	&:hover { color: var(--MI_THEME-cta); background: var(--MI_THEME-buttonHoverBg); }
	&:focus-visible { opacity: 1; translate: 0 0; outline: 2px solid var(--MI_THEME-accent); outline-offset: 2px; }
}

/* Pulled out of the pile toward the reader's hand. */
.slab:has(.body:focus-visible) { rotate: 0deg; }
.body:focus-visible, .slab:has(.body:focus-visible)::before { translate: 26px 0; }
.body:focus-visible { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18), 10px 10px 22px -8px rgba(14, 20, 40, .45); }
.slab:has(.body:focus-visible) .unsave { opacity: 1; translate: 0 0; }
.body:focus-visible { outline: 2px solid var(--MI_THEME-accent); outline-offset: 3px; }
@media (hover: hover) and (pointer: fine) {
	.slab:hover { rotate: 0deg; }
	.slab:hover .body, .slab:hover::before { translate: 26px 0; }
	.slab:hover .body { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18), 10px 10px 22px -8px rgba(14, 20, 40, .45); }
	.slab:hover .unsave { opacity: 1; translate: 0 0; }
}
/* The remove tab waits underneath the book; on touch screens it is uncovered by a swipe. */
.swipeAction { display: none; }
@media (hover: none) {
	.unsave { display: none; }
	.pile { padding-right: 0; }
	.body { touch-action: pan-y; }
	.swipeAction {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		display: grid;
		place-items: center;
		width: 64px;
		border-radius: 0 3px 3px 0;
		background: var(--MI_THEME-cta);
		color: var(--MI_THEME-fgOnAccent, #fff);
		font-size: 16px;
		opacity: 0;
		transition: opacity .2s;
	}
	.slab .body, .slab::before { transition: translate .45s var(--ease), box-shadow .5s; }
	.revealed .body, .revealed::before { translate: -64px 0; }
	.revealed .swipeAction, .dragging .swipeAction { opacity: 1; }
	.revealed .body { box-shadow: inset 0 1px 0 rgba(255, 255, 255, .18), 8px 2px 14px -6px rgba(14, 20, 40, .4); }
	.dragging .body, .dragging::before { translate: var(--drag, 0px) 0; transition: none; }
	.revealed.slabLeaveTo { translate: -220px 0; rotate: -7deg; }
	.hint .body, .hint::before { animation: nudge 1.1s var(--ease); }
	.hint .swipeAction { animation: peek 1.1s var(--ease); }
}
@keyframes nudge { 0%, 100% { translate: 0 0; } 35%, 55% { translate: -40px 0; } }
@keyframes peek { 0%, 100% { opacity: 0; } 30%, 60% { opacity: 1; } }
.leaving .body, .leaving::before { translate: 60px 0; transition-duration: .4s; }

/* Arriving books drop onto the pile; a book taken off slides away and the pile settles. */
.slabEnterActive { transition: opacity .5s, translate .7s var(--ease) !important; }
.slabEnterFrom { opacity: 0; translate: var(--dx) -26px; }
.slabLeaveActive { transition: opacity .45s, translate .55s var(--ease), rotate .55s var(--ease), height .5s var(--ease) .15s, margin .5s var(--ease) .15s !important; overflow: visible; }
.slabLeaveTo { opacity: 0; translate: 180px 0; rotate: 7deg; height: 0; margin-top: 0; }
.slabMove { transition: translate .6s var(--ease); }

.empty { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 30px 0 20px; color: var(--MI_THEME-fgTransparentWeak); }
.empty p { margin: 6px 0 4px; font: 500 15px/1.6 var(--serif); letter-spacing: .06em; }
.ghostPile { padding: 0; }
.ghost { width: var(--len); height: var(--t); margin-top: 6px; translate: var(--dx) 0; border: 1.5px dashed color-mix(in srgb, var(--MI_THEME-fg) 26%, transparent); border-radius: 2px; }

@container (max-width: 550px) {
	.root { padding-top: 24px; }
	.spot { padding: 0 18px; }
	.board { margin: 0 -18px; }
	.pile { padding-right: 44px; }
	.slab { width: min(calc(var(--len) * .9), calc(100cqi - 120px)); }
	.desk { gap: 34px 0; }
}
@media (prefers-reduced-motion: reduce) {
	.slab, .body, .slab::before, .unsave { transition: none !important; }
	.slabEnterActive, .slabLeaveActive, .slabMove { transition: none !important; }
}
</style>
