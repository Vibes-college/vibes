<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :class="$style.root">
	<div ref="content" class="_selectable" :class="$style.content"><slot></slot></div>
	<div :class="$style.overlay" aria-hidden="true">
		<template v-for="region in regions" :key="region.id">
			<span
				v-for="(rect, index) in region.rects"
				:key="index"
				:class="[$style.mark, { [$style.active]: region.id === activeThreadId }]"
				:style="{ left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` }"
			></span>
		</template>
	</div>
	<button
		v-for="thread in accessibleThreads"
		:key="thread.id"
		type="button"
		class="_button"
		:class="$style.keyboardLink"
		:aria-label="`${i18n.ts.reply}: ${thread.anchor?.exact}`"
		@focus="scrollToAnchor(thread.anchor!)"
		@click="emit('open', [thread.id])"
	>
		{{ i18n.ts.reply }} · {{ thread.anchor?.exact }}
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { GuideAnchor, GuideBlock, GuideThread } from '@/lojo/guides/types.js';
import type { AnnotationHitRegion } from '@/lojo/guides/anchors.js';
import { hitTestAnnotations, restoreRange, restoreTextRanges, serializeSelection } from '@/lojo/guides/anchors.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	blocks: GuideBlock[];
	revision: number;
	threads: GuideThread[];
	activeThreadId?: string;
}>();

const emit = defineEmits<{
	(ev: 'selection', anchor: GuideAnchor | null, rect: DOMRect | null): void;
	(ev: 'open', threadIds: string[]): void;
}>();

const root = ref<HTMLElement>();
const content = ref<HTMLElement>();
const regions = ref<AnnotationHitRegion[]>([]);
const accessibleThreads = computed(() => props.threads.filter(thread => thread.anchor && regions.value.some(region => region.id === thread.id)));
let redrawFrame = 0;
let selectionTimer: number | undefined;
let observer: ResizeObserver | undefined;
let mutationObserver: MutationObserver | undefined;
let pointerDown = false;
let pointerMoved = false;
let pointerStart = { x: 0, y: 0 };
let disposed = false;

function refresh(): void {
	if (disposed || redrawFrame) return;
	redrawFrame = requestAnimationFrame(() => {
		redrawFrame = 0;
		if (!root.value || !content.value) return;
		const origin = root.value.getBoundingClientRect();
		regions.value = props.threads.flatMap(thread => {
			if (!thread.anchor || (thread.likeCount === 0 && thread.commentCount === 0 && thread.id !== props.activeThreadId)) return [];
			const ranges = restoreTextRanges(content.value!, props.blocks, thread.anchor, props.revision);
			if (ranges.length === 0) return [];
			const rects = ranges.flatMap(range => Array.from(range.getClientRects()))
				.filter(rect => rect.width > 0 && rect.height > 0)
				.map(rect => ({ left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height }));
			return [{ id: thread.id, textLength: thread.anchor.exact.length, rects }];
		});
	});
}

function readSelection(): void {
	if (!content.value || pointerDown) return;
	const selection = content.value.ownerDocument.getSelection();
	const anchor = serializeSelection(content.value, props.blocks, props.revision, selection);
	emit('selection', anchor, anchor && selection ? selection.getRangeAt(0).getBoundingClientRect() : null);
}

function scheduleSelection(): void {
	window.clearTimeout(selectionTimer);
	// A quiet interval also catches Safari handle drags that don't provide pointerdown/up.
	selectionTimer = window.setTimeout(readSelection, 140);
}

function onPointerDown(event: PointerEvent): void {
	pointerDown = true;
	pointerMoved = false;
	pointerStart = { x: event.clientX, y: event.clientY };
	window.clearTimeout(selectionTimer);
	emit('selection', null, null);
}

function onPointerMove(event: PointerEvent): void {
	if (pointerDown && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) pointerMoved = true;
}

function onPointerEnd(): void {
	pointerDown = false;
	scheduleSelection();
}

function onClick(event: MouseEvent): void {
	if (!root.value || !content.value || pointerMoved) return;
	const target = event.target;
	if (!(target instanceof Element) || target.closest('a, button, input, textarea, select, video, audio')) return;
	if (!content.value.ownerDocument.getSelection()?.isCollapsed) return;
	const origin = root.value.getBoundingClientRect();
	const ids = hitTestAnnotations(regions.value, event.clientX - origin.left, event.clientY - origin.top);
	if (ids.length > 0) emit('open', ids);
}

function onScroll(): void {
	scheduleSelection();
	refresh();
}

function clearSelection(): void {
	window.clearTimeout(selectionTimer);
	const selection = content.value?.ownerDocument.getSelection();
	if (selection?.anchorNode && content.value?.contains(selection.anchorNode)) selection.removeAllRanges();
	emit('selection', null, null);
}

function scrollToAnchor(anchor: GuideAnchor): void {
	if (!content.value) return;
	const range = restoreRange(content.value, props.blocks, anchor, props.revision);
	if (!range) return;
	// The exact line matters: centering a long paragraph can leave the quoted words off-screen.
	const rect = Array.from(range.getClientRects()).find(item => item.width > 0 && item.height > 0);
	if (!rect) return;
	const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
	let ancestor = content.value.parentElement;
	while (ancestor && ancestor !== content.value.ownerDocument.body) {
		if (/(auto|scroll|overlay)/.test(window.getComputedStyle(ancestor).overflowY) && ancestor.scrollHeight > ancestor.clientHeight) {
			ancestor.scrollBy({ top: rect.top - ancestor.getBoundingClientRect().top - ancestor.clientHeight * 0.32, behavior });
			return;
		}
		ancestor = ancestor.parentElement;
	}
	window.scrollBy({ top: rect.top - window.innerHeight * 0.32, behavior });
}

watch(() => [props.blocks, props.revision, props.threads, props.activeThreadId], () => nextTick(refresh), { deep: true });

onMounted(() => {
	const element = content.value!;
	const document = element.ownerDocument;
	observer = new ResizeObserver(refresh);
	observer.observe(element);
	mutationObserver = new MutationObserver(refresh);
	mutationObserver.observe(element, { childList: true, characterData: true, subtree: true });
	element.addEventListener('pointerdown', onPointerDown);
	element.addEventListener('click', onClick);
	element.addEventListener('load', refresh, true);
	document.addEventListener('pointermove', onPointerMove, { passive: true });
	document.addEventListener('pointerup', onPointerEnd);
	document.addEventListener('pointercancel', onPointerEnd);
	document.addEventListener('selectionchange', scheduleSelection);
	document.addEventListener('scroll', onScroll, true);
	window.visualViewport?.addEventListener('resize', onScroll);
	window.visualViewport?.addEventListener('scroll', onScroll);
	document.fonts?.addEventListener('loadingdone', refresh);
	void document.fonts?.ready.then(refresh);
	refresh();
});

onBeforeUnmount(() => {
	disposed = true;
	window.clearTimeout(selectionTimer);
	cancelAnimationFrame(redrawFrame);
	observer?.disconnect();
	mutationObserver?.disconnect();
	const element = content.value;
	const document = element?.ownerDocument;
	element?.removeEventListener('pointerdown', onPointerDown);
	element?.removeEventListener('click', onClick);
	element?.removeEventListener('load', refresh, true);
	document?.removeEventListener('pointermove', onPointerMove);
	document?.removeEventListener('pointerup', onPointerEnd);
	document?.removeEventListener('pointercancel', onPointerEnd);
	document?.removeEventListener('selectionchange', scheduleSelection);
	document?.removeEventListener('scroll', onScroll, true);
	window.visualViewport?.removeEventListener('resize', onScroll);
	window.visualViewport?.removeEventListener('scroll', onScroll);
	document?.fonts?.removeEventListener('loadingdone', refresh);
});

defineExpose({ clearSelection, refresh, scrollToAnchor });
</script>

<style lang="scss" module>
.root {
	position: relative;
	isolation: isolate;
}

.content {
	position: relative;
	user-select: text;
	-webkit-user-select: text;
}

.overlay {
	position: absolute;
	inset: 0;
	pointer-events: none;
	user-select: none;
	-webkit-user-select: none;
}

.mark {
	position: absolute;
	box-sizing: border-box;
	border-bottom: 1px dashed color-mix(in srgb, var(--MI_THEME-fg) 42%, transparent);
	border-radius: 2px;
}

.active {
	background: color-mix(in srgb, var(--MI_THEME-accent) 16%, transparent);
	border-bottom-color: var(--MI_THEME-accent);
}

.keyboardLink {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip-path: inset(50%);
	white-space: nowrap;

	&:focus-visible {
		position: relative;
		width: auto;
		height: auto;
		clip-path: none;
		white-space: normal;
		padding: var(--MI-marginHalf);
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-panel);
	}
}
</style>
