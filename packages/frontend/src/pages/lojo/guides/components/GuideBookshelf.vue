<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.shelfRoot" data-testid="guide-bookshelf">
<div :class="$style.shelfPage">
	<nav :class="$style.index" aria-label="书架">
		<a v-for="shelf in guideShelves" :key="shelf.id" :href="`#shelf-${shelf.id}`" :class="{ [$style.on]: current === shelf.id }" :style="{ '--hue': shelf.hue }" :aria-current="current === shelf.id ? 'true' : undefined" @click.prevent="goToShelf(shelf.id)">
			<b>{{ shelf.no }}</b><span>{{ shelf.title }}</span>
		</a>
	</nav>
	<div v-if="loading" :class="$style.state"><MkLoading/></div>
	<div v-else-if="failed" :class="$style.state" role="alert">
		<p>{{ guideLabels.loadFailed }}</p>
		<MkButton @click="load()">{{ i18n.ts.retry }}</MkButton>
	</div>
	<div v-else :class="$style.shelves">
		<section
			v-for="shelf in guideShelves"
			:id="`shelf-${shelf.id}`"
			:key="shelf.id"
			:ref="el => setRef(sectionEls, shelf.id, el)"
			:data-shelf="shelf.id"
			:class="[$style.shelf, {
				[$style.isCurrent]: current === shelf.id,
				[$style.isShown]: shown.has(shelf.id),
				[$style.canPrev]: edges[shelf.id]?.prev,
				[$style.canNext]: edges[shelf.id]?.next,
			}]"
			:style="{ '--hue': shelf.hue, '--wash': washOf(shelf.id) }"
			:aria-labelledby="`shelf-title-${shelf.id}`"
			@keydown="onKey(shelf.id, $event)"
		>
			<header :class="$style.shelfHead">
				<span :class="$style.shelfNo" aria-hidden="true">{{ shelf.no }}</span>
				<div :class="$style.shelfName">
					<h2 :id="`shelf-title-${shelf.id}`">{{ shelf.title }}</h2>
				</div>
				<span v-if="books[shelf.id]?.length" :class="$style.shelfCount">{{ books[shelf.id].length }} 本</span>
				<span :class="$style.shelfArrows">
					<button type="button" :class="[$style.arrow, $style.prev]" aria-label="向左翻" @click="page(shelf.id, -1)"><i class="ti ti-chevron-left" aria-hidden="true"></i></button>
					<button type="button" :class="[$style.arrow, $style.next]" aria-label="向右翻" @click="page(shelf.id, 1)"><i class="ti ti-chevron-right" aria-hidden="true"></i></button>
				</span>
			</header>
			<div :class="$style.rackWrap">
				<div :ref="el => setRef(rackEls, shelf.id, el)" :class="$style.rack" role="listbox" aria-orientation="horizontal" :aria-label="`${shelf.title}书架`" @scroll.passive="onRackScroll(shelf.id)">
					<div :class="$style.row">
						<svg :class="$style.bookend" viewBox="0 0 40 120" aria-hidden="true"><path d="M8 8 V104 Q8 112 16 112 H34"/></svg>
						<MkA
							v-for="(guide, i) in books[shelf.id]"
							:key="guide.id"
							:to="`/guides/${guide.id}`"
							:data-id="guide.id"
							role="option"
							:aria-selected="active[shelf.id] === guide.id"
							:aria-label="`${guide.title || guideLabels.untitled}，约 ${looks[shelf.id][i].minutes} 分钟`"
							:tabindex="active[shelf.id] === guide.id ? 0 : -1"
							:class="[$style.book, $style[`deco-${looks[shelf.id][i].deco}`], {
								[$style.isOpen]: active[shelf.id] === guide.id,
								[$style.isLeaving]: leaving === guide.id,
							}]"
							:style="{ '--t': `${looks[shelf.id][i].t}px`, '--hr': looks[shelf.id][i].hr, '--c': looks[shelf.id][i].c, '--ink': looks[shelf.id][i].ink, '--ribbon': looks[shelf.id][i].ribbon, '--i': i }"
							@pointerenter="onHover(shelf.id, guide.id, $event)"
							@pointerleave="onLeaveBook"
							@pointermove="onTilt"
							@focus="onFocus(shelf.id, guide.id, $event)"
							@click.capture="onBookClick(shelf.id, guide, $event)"
						>
							<span :class="$style.box">
								<span :class="[$style.face, $style.spine]">
									<span :class="$style.spineText">
										<span :class="$style.spineTitle">{{ guide.title || guideLabels.untitled }}</span>
										<span v-if="looks[shelf.id][i].t >= 40" :class="$style.spineBy">{{ authorName(guide) }}</span>
									</span>
									<span :class="$style.spineArt"></span>
									<span v-if="guide.isSaved" :class="$style.ribbon"></span>
									<span :class="$style.shade"></span>
								</span>
								<span :class="[$style.face, $style.cover]">
									<span v-if="guide.isSaved" :class="[$style.ribbon, $style.coverRibbon]"></span>
									<span :class="$style.coverTitle">{{ guide.title || guideLabels.untitled }}</span>
									<span v-if="coverOf(guide)" :class="$style.coverPlate"><img :src="coverOf(guide)" alt="" loading="lazy" draggable="false" @error="brokenCovers.add(guide.id)"/></span>
									<span v-else :class="$style.coverRule"></span>
									<span :class="$style.coverFoot">
										<img :class="$style.coverAvatar" :src="guide.author.avatarUrl ?? undefined" alt="" loading="lazy"/>
										<span :class="$style.coverAuthor">{{ authorName(guide) }}</span>
									</span>
									<span :class="$style.sheen"></span>
									<span :class="$style.glare"></span>
									<span :class="$style.shade"></span>
								</span>
								<span :class="[$style.face, $style.pages]"></span>
								<span :class="[$style.face, $style.back]"></span>
							</span>
						</MkA>
						<span v-for="(label, i) in ghostsOf(shelf)" :key="label" :class="$style.ghost" aria-hidden="true" :style="{ '--hr': ghostShape[i].hr, '--t': `${ghostShape[i].t}px`, '--i': (books[shelf.id]?.length ?? 0) + i }"><span>{{ label }}</span></span>
						<MkA :to="`/guides/new?category=${shelf.id}`" :class="$style.write" :style="{ '--i': (books[shelf.id]?.length ?? 0) + ghostsOf(shelf).length }" :aria-label="`为「${shelf.title}」写一本攻略`">
							<span :class="$style.writePlus" aria-hidden="true">+</span>
							<span :class="$style.writeText" aria-hidden="true">{{ books[shelf.id]?.length ? '写一本' : '写第一本' }}</span>
						</MkA>
					</div>
				</div>
				<div :class="$style.plank" aria-hidden="true"></div>
			</div>
			<div :class="$style.info" aria-live="polite">
				<div v-if="activeGuide(shelf.id)" :key="activeGuide(shelf.id)!.id" :class="$style.infoCard">
					<div :class="$style.infoText">
						<h3>{{ activeGuide(shelf.id)!.title || guideLabels.untitled }}</h3>
						<p v-if="activeGuide(shelf.id)!.summary">{{ activeGuide(shelf.id)!.summary }}</p>
						<div :class="$style.infoMeta">
							<img :src="activeGuide(shelf.id)!.author.avatarUrl ?? undefined" alt=""/>
							<span>{{ authorName(activeGuide(shelf.id)!) }}</span>
							<i>·</i><span>{{ activeLook(shelf.id)?.minutes }} 分钟</span>
							<em v-if="activeGuide(shelf.id)!.isDemo">{{ guideLabels.demo }}</em>
						</div>
					</div>
					<div :class="$style.infoActions">
						<button type="button" :class="[$style.save, { [$style.on]: activeGuide(shelf.id)!.isSaved }]" :aria-label="activeGuide(shelf.id)!.isSaved ? guideLabels.unbookmark : guideLabels.bookmark" :aria-pressed="activeGuide(shelf.id)!.isSaved" :disabled="bookmarkBusy.has(activeGuide(shelf.id)!.id)" @click="bookmark(activeGuide(shelf.id)!)">
							<i :class="activeGuide(shelf.id)!.isSaved ? 'ti ti-bookmark-filled' : 'ti ti-bookmark'" aria-hidden="true"></i>
						</button>
						<MkA :to="`/guides/${activeGuide(shelf.id)!.id}`" :class="$style.read" @click.capture="onReadClick(shelf.id, activeGuide(shelf.id)!, $event)">翻开 <span aria-hidden="true">→</span></MkA>
					</div>
				</div>
				<div v-else-if="!books[shelf.id]?.length" :class="$style.emptyNote">
					<p>还没有人写这一排。</p>
					<MkA :to="`/guides/new?category=${shelf.id}`" :class="$style.read">写第一本 <span aria-hidden="true">→</span></MkA>
				</div>
			</div>
		</section>
	</div>
</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, reactive, ref, useCssModule } from 'vue';
import type { Guide } from '@/lojo/guides/types.js';
import type { BookLook, GuideShelf } from '../shelves.js';
import { bookLooks, guideShelves } from '../shelves.js';
import { guideLabels, guideSafeUrl } from '../labels.js';
import { canAnimateCoverVeil, coverVeil } from '../cover-veil.js';
import { guideApi } from '@/lojo/guides/api.js';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import { pleaseLogin } from '@/utility/please-login.js';
import * as os from '@/os.js';

const router = useRouter();
const style = useCssModule();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

const books = reactive<Record<string, Guide[]>>({});
const looks = computed<Record<string, BookLook[]>>(() => Object.fromEntries(guideShelves.map(shelf => [shelf.id, bookLooks(books[shelf.id] ?? [])])));
const active = reactive<Record<string, string | undefined>>({});
const edges = reactive<Record<string, { prev: boolean; next: boolean }>>({});
const shown = reactive(new Set<string>());
const brokenCovers = reactive(new Set<string>());
const bookmarkBusy = reactive(new Set<string>());
const current = ref(guideShelves[0].id);
const leaving = ref<string | null>(null);
const loading = ref(true);
const failed = ref(false);
const ghostShape = [{ hr: '0.86', t: 38 }, { hr: '0.78', t: 30 }, { hr: '0.92', t: 44 }, { hr: '0.82', t: 34 }];

const sectionEls = new Map<string, HTMLElement>();
const rackEls = new Map<string, HTMLElement>();
let seenObserver: IntersectionObserver | undefined;
let currentObserver: IntersectionObserver | undefined;
let resizeObserver: ResizeObserver | undefined;
let hoverTimer: number | undefined;
const timers = new Set<number>();
const settleTimers = new Map<string, number>();

function setRef(map: Map<string, HTMLElement>, id: string, el: unknown) {
	if (el instanceof HTMLElement) map.set(id, el);
	else map.delete(id);
}

function later(fn: () => void, ms: number) {
	const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
	timers.add(id);
}

function authorName(guide: Guide) {
	return guide.author.name || guide.author.username;
}

function coverOf(guide: Guide) {
	if (brokenCovers.has(guide.id)) return undefined;
	return guideSafeUrl(guide.coverUrl) ?? guideSafeUrl(guide.blocks.find(block => block.type === 'image')?.url);
}

// Sparse shelves show what is still missing, so they read as "in progress" rather than abandoned.
function ghostsOf(shelf: GuideShelf) {
	return shelf.ghosts.slice(0, Math.max(0, 6 - (books[shelf.id]?.length ?? 0)));
}

function activeGuide(shelfId: string) {
	return books[shelfId]?.find(guide => guide.id === active[shelfId]);
}

function activeLook(shelfId: string) {
	const index = books[shelfId]?.findIndex(guide => guide.id === active[shelfId]) ?? -1;
	return index < 0 ? undefined : looks.value[shelfId][index];
}

function washOf(shelfId: string) {
	return activeLook(shelfId)?.c ?? guideShelves.find(shelf => shelf.id === shelfId)?.hue;
}

function bookEl(shelfId: string, guideId: string) {
	return rackEls.get(shelfId)?.querySelector<HTMLElement>(`[data-id="${guideId}"]`) ?? null;
}

function openBook(shelfId: string, guideId: string | undefined, options: { reveal?: boolean; focus?: boolean } = {}) {
	if (!guideId) return;
	if (active[shelfId] !== guideId) active[shelfId] = guideId;
	if (options.focus) nextTick(() => bookEl(shelfId, guideId)?.focus({ preventScroll: true }));
	if (options.reveal ?? true) later(() => keepInView(shelfId, guideId), reduceMotion ? 0 : 380);
}

// After the width transition, nudge the rack so the open book is fully visible.
function keepInView(shelfId: string, guideId: string) {
	const rack = rackEls.get(shelfId);
	const book = bookEl(shelfId, guideId);
	if (!rack || !book) return;
	const r = rack.getBoundingClientRect();
	const b = book.getBoundingClientRect();
	const pad = 28;
	const behavior = reduceMotion ? 'auto' : 'smooth';
	if (b.left < r.left + pad) rack.scrollBy({ left: b.left - r.left - pad, behavior });
	else if (b.right > r.right - pad) rack.scrollBy({ left: b.right - r.right + pad, behavior });
}

function onHover(shelfId: string, guideId: string, event: PointerEvent) {
	if (event.pointerType !== 'mouse') return;
	window.clearTimeout(hoverTimer);
	// A short intent delay keeps a cursor sweeping across the shelf from flipping every book.
	hoverTimer = window.setTimeout(() => openBook(shelfId, guideId), 70);
}

function cancelHover() {
	window.clearTimeout(hoverTimer);
}

function onFocus(shelfId: string, guideId: string, event: FocusEvent) {
	// Pointer focus is handled by the click, so the first click opens instead of navigating.
	if ((event.target as HTMLElement).matches(':focus-visible')) openBook(shelfId, guideId);
}

function onBookClick(shelfId: string, guide: Guide, event: MouseEvent) {
	// Modified clicks fall through to MkA (new tab, window).
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	if (active[shelfId] !== guide.id) {
		openBook(shelfId, guide.id, { focus: true });
		return;
	}
	enterBook(shelfId, guide);
}

function onReadClick(shelfId: string, guide: Guide, event: MouseEvent) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	enterBook(shelfId, guide);
}

// The open cover lifts toward the reader, then its cloth grows to fill the screen and fades
// away over the article, so opening a book feels like stepping into it.
function enterBook(shelfId: string, guide: Guide) {
	if (leaving.value) return;
	const destination = `/guides/${guide.id}`;
	const cover = bookEl(shelfId, guide.id)?.querySelector<HTMLElement>(`.${CSS.escape(style.cover)}`);
	const look = looks.value[shelfId][books[shelfId].indexOf(guide)];
	if (reduceMotion || !cover || !look || !canAnimateCoverVeil()) {
		router.pushByPath(destination);
		return;
	}
	leaving.value = guide.id;
	coverVeil({
		rect: cover.getBoundingClientRect(),
		cloth: look.c,
		ink: look.ink,
		title: guide.title || guideLabels.untitled,
		navigate: () => {
			leaving.value = null;
			router.pushByPath(destination);
		},
	});
}

// Cursor tilt on the open book, with a glare that follows the pointer.
function onTilt(event: PointerEvent) {
	if (event.pointerType !== 'mouse' || reduceMotion) return;
	const el = event.currentTarget as HTMLElement;
	if (!el.classList.contains(style.isOpen)) return;
	const rect = el.getBoundingClientRect();
	const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
	const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
	el.classList.add(style.isTilting);
	el.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`);
	el.style.setProperty('--rx', `${((0.5 - y) * 11).toFixed(2)}deg`);
	el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
	el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
}

function onLeaveBook(event: PointerEvent) {
	cancelHover();
	const el = event.currentTarget as HTMLElement;
	el.classList.remove(style.isTilting);
	for (const name of ['--rx', '--ry', '--gx', '--gy']) el.style.removeProperty(name);
}

function onKey(shelfId: string, event: KeyboardEvent) {
	const list = books[shelfId] ?? [];
	const index = list.findIndex(guide => guide.id === active[shelfId]);
	if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && index >= 0) {
		event.preventDefault();
		const next = list[Math.min(list.length - 1, Math.max(0, index + (event.key === 'ArrowRight' ? 1 : -1)))];
		openBook(shelfId, next.id, { focus: true });
	} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
		const order = guideShelves.map(shelf => shelf.id);
		const target = order[order.indexOf(shelfId) + (event.key === 'ArrowDown' ? 1 : -1)];
		if (!target) return;
		event.preventDefault();
		goToShelf(target);
		const focusable = active[target] ? bookEl(target, active[target]!) : sectionEls.get(target)?.querySelector<HTMLElement>(`.${CSS.escape(style.write)}`);
		focusable?.focus({ preventScroll: true });
	}
}

function goToShelf(shelfId: string) {
	sectionEls.get(shelfId)?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
}

function page(shelfId: string, direction: 1 | -1) {
	const rack = rackEls.get(shelfId);
	rack?.scrollBy({ left: rack.clientWidth * 0.7 * direction, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function syncEdges(shelfId: string) {
	const rack = rackEls.get(shelfId);
	if (!rack) return;
	const prev = rack.scrollLeft > 4;
	const next = rack.scrollLeft + rack.clientWidth < rack.scrollWidth - 4;
	if (edges[shelfId]?.prev !== prev || edges[shelfId]?.next !== next) edges[shelfId] = { prev, next };
}

function onRackScroll(shelfId: string) {
	syncEdges(shelfId);
	if (!coarsePointer) return;
	// Touch: whichever book settles nearest the middle of the rack opens.
	window.clearTimeout(settleTimers.get(shelfId));
	settleTimers.set(shelfId, window.setTimeout(() => {
		const rack = rackEls.get(shelfId);
		if (!rack) return;
		const middle = rack.getBoundingClientRect().left + rack.clientWidth / 2;
		let best: string | undefined;
		let bestDistance = Infinity;
		for (const guide of books[shelfId] ?? []) {
			const rect = bookEl(shelfId, guide.id)?.getBoundingClientRect();
			if (!rect) continue;
			const distance = Math.abs(rect.left + rect.width / 2 - middle);
			if (distance < bestDistance) { bestDistance = distance; best = guide.id; }
		}
		openBook(shelfId, best, { reveal: false });
	}, 140));
}

async function bookmark(guide: Guide) {
	if (!await pleaseLogin() || bookmarkBusy.has(guide.id)) return;
	bookmarkBusy.add(guide.id);
	try {
		const result = await guideApi.bookmark(guide.id, !guide.isSaved);
		guide.isSaved = result.saved;
	} catch {
		os.alert({ type: 'error', text: guideLabels.bookmarkFailed });
	} finally {
		bookmarkBusy.delete(guide.id);
	}
}

function observe() {
	disconnect();
	// Shelves rise into place the first time they scroll into view; the first book then opens.
	seenObserver = new IntersectionObserver(entries => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			const shelfId = (entry.target as HTMLElement).dataset.shelf!;
			seenObserver?.unobserve(entry.target);
			shown.add(shelfId);
			const count = (books[shelfId]?.length ?? 0) + ghostsOf(guideShelves.find(shelf => shelf.id === shelfId)!).length;
			if (!active[shelfId]) later(() => openBook(shelfId, books[shelfId]?.[0]?.id, { reveal: false }), reduceMotion ? 0 : 260 + count * 28);
		}
	}, { threshold: 0.2 });
	// The shelf crossing the middle of the screen is the current one.
	currentObserver = new IntersectionObserver(entries => {
		for (const entry of entries) if (entry.isIntersecting) current.value = (entry.target as HTMLElement).dataset.shelf!;
	}, { rootMargin: '-45% 0px -45% 0px' });
	resizeObserver = new ResizeObserver(() => guideShelves.forEach(shelf => syncEdges(shelf.id)));
	for (const [shelfId, el] of sectionEls) {
		if (!shown.has(shelfId)) seenObserver.observe(el);
		currentObserver.observe(el);
	}
	for (const el of rackEls.values()) resizeObserver.observe(el);
}

function disconnect() {
	seenObserver?.disconnect();
	currentObserver?.disconnect();
	resizeObserver?.disconnect();
}

async function load(background = false) {
	if (!background) loading.value = true;
	failed.value = false;
	try {
		const lists = await Promise.all(guideShelves.map(shelf => guideApi.list({ category: shelf.id, limit: 60 })));
		guideShelves.forEach((shelf, i) => { books[shelf.id] = lists[i]; });
		for (const shelf of guideShelves) if (active[shelf.id] && !books[shelf.id].some(guide => guide.id === active[shelf.id])) active[shelf.id] = undefined;
	} catch {
		if (!background) failed.value = true;
	} finally {
		loading.value = false;
	}
	await nextTick();
	if (!failed.value) observe();
}

onActivated(() => {
	if (!loading.value) observe();
});
onDeactivated(() => {
	disconnect();
	leaving.value = null;
});
onBeforeUnmount(() => {
	disconnect();
	window.clearTimeout(hoverTimer);
	timers.forEach(id => window.clearTimeout(id));
	settleTimers.forEach(id => window.clearTimeout(id));
});

defineExpose({ reload: () => load(true) });
load();
</script>

<style lang="scss" module>

.shelfRoot { container: shelf / inline-size; }

@supports (transition-timing-function: linear(0, 1)) {
	.shelfPage {
		--flip: linear(0, 0.026, 0.093, 0.188, 0.299, 0.416, 0.531, 0.641, 0.739, 0.826, 0.898, 0.957, 1.003, 1.037, 1.061, 1.075, 1.082, 1.083, 1.08, 1.074, 1.065, 1.056, 1.046, 1.036, 1.028, 1.02, 1.013, 1.007, 1.002, 0.999, 0.996, 0.994, 0.993, 0.993, 0.993, 0.993, 0.994, 0.995, 0.996, 0.996, 0.997, 0.998, 0.999, 0.999, 1);
		--part: linear(0, 0.019, 0.069, 0.139, 0.221, 0.309, 0.396, 0.482, 0.562, 0.635, 0.701, 0.76, 0.81, 0.854, 0.89, 0.92, 0.945, 0.964, 0.98, 0.991, 1, 1.006, 1.011, 1.013, 1.015, 1.015, 1.015, 1.014, 1.013, 1.012, 1.011, 1.009, 1.008, 1.007, 1.006, 1.005, 1.004, 1.003, 1.002, 1.002, 1.001, 1.001, 1);
	}
}

.shelfPage {
	--rack: 272px;
	--ease: cubic-bezier(.22, .9, .24, 1);
	--dur: .74s;
	/* Damped springs: the cover swings ~7° past square and settles; neighbours ease aside. */
	--flip: cubic-bezier(.2, 1.25, .3, 1);
	--part: var(--ease);
	--serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", "STSong", serif;
	--ink-strong: var(--MI_THEME-brandInk, var(--MI_THEME-fgHighlighted));
	--plankTop: color-mix(in srgb, #C9A97A 34%, var(--MI_THEME-bg));
	--plankFront: color-mix(in srgb, #A9875A 52%, var(--MI_THEME-bg));
	display: grid;
	grid-template-columns: minmax(0, 1fr) 64px;
	column-gap: 8px;
}

/* ── index rail ───────────────────────── */
.index { grid-column: 2; grid-row: 1 / span 2; align-self: start; position: sticky; top: calc(var(--MI-stickyTop, 0px) + 24vh); display: flex; flex-direction: column; align-items: center; gap: 18px; padding-top: 48px; }
.index a { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--MI_THEME-fgTransparentWeak); text-decoration: none; transition: color .3s; }
.index b { font: 600 13px/1 var(--serif); font-variant-numeric: tabular-nums; }
.index span { writing-mode: vertical-rl; text-orientation: upright; font-size: 11px; letter-spacing: .1em; }
.index a::after { content: ""; width: 2px; height: 0; border-radius: 2px; background: var(--hue); transition: height .4s var(--ease); }
.index a.on { color: var(--hue); }
.index a.on b { font-weight: 800; }
.index a.on::after { height: 18px; }
.index a:hover { color: var(--ink-strong); }

.shelves { grid-column: 1; display: flex; flex-direction: column; gap: 10px; padding-top: 14px; }

/* ── shelf ────────────────────────────── */
.shelf {
	--wash: var(--hue);
	position: relative;
	padding: 26px 28px 22px;
	border-radius: 28px;
	background: color-mix(in srgb, var(--wash) 0%, var(--MI_THEME-bg));
	transition: background-color .9s ease;
	scroll-margin: 80px;
}
.shelf.isCurrent { background: color-mix(in srgb, var(--wash) 9%, var(--MI_THEME-bg)); }

.shelfHead { display: flex; align-items: flex-end; gap: 14px; }
.shelfNo { font: 600 44px/.82 var(--serif); color: var(--hue); font-variant-numeric: tabular-nums; letter-spacing: -.02em; transition: opacity .5s; }
.shelf:not(.isCurrent) .shelfNo { opacity: .5; }
.shelfName h2 { margin: 0; font: 700 21px/1.1 var(--serif); letter-spacing: .06em; color: var(--ink-strong); }
.shelfCount { margin-left: auto; font-size: 12px; color: var(--MI_THEME-fgTransparentWeak); letter-spacing: .08em; }
.shelfArrows { display: none; gap: 6px; }
.arrow { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 1px solid var(--MI_THEME-divider); border-radius: 50%; background: var(--MI_THEME-panel); color: var(--ink-strong); font-size: 15px; line-height: 1; cursor: pointer; opacity: .35; transition: opacity .2s, transform .2s; }
.canPrev .prev, .canNext .next { opacity: 1; }
.arrow:hover { transform: scale(1.06); }
@media (hover: hover) and (pointer: fine) { .canPrev .shelfArrows, .canNext .shelfArrows { display: flex; } }

/* ── rack & plank ─────────────────────── */
.rackWrap { position: relative; margin-top: 8px; }
.rack {
	overflow-x: auto;
	overflow-y: hidden;
	margin: 0 -28px;
	padding: 14px 28px 0;
	scrollbar-width: none;
	overscroll-behavior-x: contain;
	-webkit-overflow-scrolling: touch;
}
.rack::-webkit-scrollbar { display: none; }
.canNext .rack { mask-image: linear-gradient(90deg, #000 calc(100% - 56px), transparent); }
.canPrev .rack { mask-image: linear-gradient(90deg, transparent, #000 56px); }
.canPrev.canNext .rack { mask-image: linear-gradient(90deg, transparent, #000 56px, #000 calc(100% - 56px), transparent); }
.row { display: flex; align-items: flex-end; gap: 3px; height: var(--rack); width: max-content; padding-right: 12px; }

.plank {
	position: relative;
	z-index: 3;
	height: 13px;
	margin: 0 -12px;
	border-radius: 2px 2px 4px 4px;
	background: linear-gradient(180deg, var(--plankTop) 0 5px, var(--plankFront) 5px 100%);
	box-shadow: 0 14px 22px -14px rgba(20, 32, 79, .45), inset 0 -1px 0 rgba(0, 0, 0, .06);
}

/* ── book ─────────────────────────────── */
.book {
	--h: calc(var(--rack) * var(--hr));
	--w: calc(var(--h) * .7);
	position: relative;
	flex: none;
	display: block;
	width: var(--t);
	height: var(--h);
	color: var(--ink);
	text-decoration: none;
	perspective: 2000px;
	perspective-origin: 50% 60%;
	cursor: pointer;
	outline: none;
	-webkit-tap-highlight-color: transparent;
	transition: width .95s var(--part);
}
.book.isOpen { width: var(--w); z-index: 2; }

/* contact shadow on the plank */
.book::after {
	content: "";
	position: absolute;
	left: 6%; right: 6%; bottom: -3px;
	height: 8px;
	border-radius: 50%;
	background: radial-gradient(closest-side, rgba(20, 24, 40, .34), transparent);
	transition: left var(--dur) var(--ease), right var(--dur) var(--ease), opacity .4s;
}
.book.isOpen::after { left: -2%; right: -14%; opacity: .9; }

.box {
	position: absolute;
	left: 50%;
	bottom: 0;
	width: var(--w);
	height: var(--h);
	margin-left: calc(var(--w) / -2);
	transform-style: preserve-3d;
	transform: translateZ(calc(var(--w) / -2)) rotateX(0deg) rotateY(90deg);
	transition: transform 1s var(--flip), bottom .35s var(--ease);
}
@media (hover: hover) { .book:not(.isOpen):hover .box { bottom: 7px; } }
.isOpen .box {
	transform: translateZ(calc(var(--t) / -2)) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
	/* pulled half out of the shelf toward the reader while it turns, then pushed back */
	animation: pull 1s var(--ease) both;
}
.isTilting .box { transition: transform .22s cubic-bezier(.2, .7, .3, 1), bottom .35s var(--ease); }
.isLeaving .box { animation: lift .7s cubic-bezier(.3, 0, .2, 1) both; }
@keyframes pull {
	0% { translate: 0 0 0; }
	32% { translate: 0 -16px 70px; }
	100% { translate: 0 0 0; }
}
@keyframes lift {
	to { translate: 0 -18px 90px; }
}

/* Light falls from the front: a face turned away darkens, the one turning in brightens. */
.shade { position: absolute; inset: 0; background: #0B1020; pointer-events: none; transition: opacity .55s cubic-bezier(.2, .6, .3, 1); }
.spine .shade { opacity: 0; }
.isOpen .spine .shade { opacity: .6; }
.cover .shade { opacity: .4; }
.isOpen .cover .shade { opacity: 0; transition-duration: .5s; }
.sheen { position: absolute; inset: -10% -80%; pointer-events: none; opacity: 0; background: linear-gradient(104deg, transparent 38%, rgba(255, 255, 255, .55) 48%, rgba(255, 255, 255, .12) 53%, transparent 62%); }
.isOpen .sheen { animation: sheen 1.1s .26s cubic-bezier(.3, .6, .2, 1) both; }
@keyframes sheen {
	0% { transform: translateX(-46%); opacity: 0; }
	18% { opacity: 1; }
	100% { transform: translateX(46%); opacity: 0; }
}
.glare { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(circle at var(--gx, 30%) var(--gy, 20%), rgba(255, 255, 255, .34), rgba(255, 255, 255, 0) 58%); transition: opacity .4s; }
.isTilting .glare { opacity: 1; }

.face {
	position: absolute;
	left: 50%;
	top: 0;
	height: 100%;
	box-sizing: border-box;
	overflow: hidden;
	background: var(--c);
	box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, .2);
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
}
.spine { width: var(--t); margin-left: calc(var(--t) / -2); transform: rotateY(-90deg) translateZ(calc(var(--w) / 2)); border-radius: 2px 2px 1px 1px; }
.cover { width: var(--w); margin-left: calc(var(--w) / -2); transform: translateZ(calc(var(--t) / 2)); border-radius: 1px 3px 3px 1px; }
.back { width: var(--w); margin-left: calc(var(--w) / -2); transform: rotateY(180deg) translateZ(calc(var(--t) / 2)); filter: brightness(.82); }
.pages {
	width: calc(var(--t) - 4px);
	margin-left: calc((var(--t) - 4px) / -2);
	top: 3px; height: calc(100% - 6px);
	transform: rotateY(90deg) translateZ(calc(var(--w) / 2 - 2px));
	background: repeating-linear-gradient(90deg, #F4EDDD 0 1px, #E3D8C1 1px 2px);
}

/* spine — rounded cloth: dark edges, a soft highlight just left of centre */
.spine::after, .cover::after { content: ""; position: absolute; inset: 0; pointer-events: none; }
.spine::after { background: linear-gradient(90deg, rgba(0, 0, 0, .22), rgba(255, 255, 255, .13) 24%, rgba(255, 255, 255, 0) 48%, rgba(0, 0, 0, .08) 78%, rgba(0, 0, 0, .26)); }
.cover::after { background: linear-gradient(90deg, rgba(0, 0, 0, .26) 0, rgba(255, 255, 255, .14) 5px, rgba(0, 0, 0, .1) 8px, transparent 16px), linear-gradient(165deg, rgba(255, 255, 255, .1), transparent 45%); }
.isOpen .cover { box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, .2), 18px 14px 30px -14px rgba(14, 20, 44, .5); }

.spine { display: flex; flex-direction: column; align-items: center; padding: 6px 0 12px; }
.spineText { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; margin: 12px 0 8px; writing-mode: vertical-rl; overflow: hidden; }
.spineBy { max-inline-size: 100%; font: 600 8px/1 -apple-system, "PingFang SC", sans-serif; letter-spacing: .12em; opacity: .66; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spineTitle {
	max-inline-size: 100%;
	min-height: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	font: 700 clamp(11.5px, calc(var(--t) * .36), 16px)/1.1 var(--serif);
	letter-spacing: .14em;
}
.spineArt { flex: none; display: none; }

.ribbon.coverRibbon { right: 42px; width: 9px; height: 44px; }
.ribbon { position: absolute; top: 0; right: 18%; width: 5px; height: 30px; background: var(--ribbon, #E8603F); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%); z-index: 1; }
.deco-plain .spine .ribbon, .ribbon { box-shadow: 0 1px 0 rgba(0, 0, 0, .2); }

/* bindings */
.deco-bands .spine::before { content: ""; position: absolute; left: 16%; right: 16%; top: 24px; bottom: 22px; border-top: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; opacity: .5; }
.deco-bands .spineText { margin-top: 20px; }
.deco-checker .spineArt { display: block; align-self: stretch; height: 24%; margin-bottom: 8px; background: repeating-conic-gradient(var(--ink) 0 25%, transparent 0 50%) 0 0 / calc(var(--t) / 3) calc(var(--t) / 3); opacity: .88; }
.deco-stripes .spineArt { display: block; align-self: stretch; height: 18%; margin-bottom: 8px; background: repeating-linear-gradient(-45deg, var(--ink) 0 2px, transparent 2px 7px); opacity: .45; }
.deco-emblem .spineArt { display: block; width: 11px; height: 11px; margin-bottom: 8px; border: 1.5px solid currentColor; border-radius: 50%; opacity: .75; }
.deco-bigtype .spineTitle { font: 800 calc(var(--t) * .5)/1 -apple-system, "PingFang SC", "Noto Sans SC", sans-serif; letter-spacing: .04em; }

/* cover */
.cover { display: flex; flex-direction: column; padding: 16px 14px 12px 20px; }
.coverTitle {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	overflow: hidden;
	font: 700 clamp(13.5px, calc(var(--w) * .095), 18px)/1.34 var(--serif);
	letter-spacing: .03em;
}
.deco-bigtype .coverTitle { font: 800 clamp(15px, calc(var(--w) * .115), 21px)/1.22 -apple-system, "PingFang SC", "Noto Sans SC", sans-serif; letter-spacing: 0; }
.coverPlate { flex: 1 1 auto; min-height: 36px; margin-top: 11px; overflow: hidden; border-radius: 2px; box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 22%, transparent); }
.coverPlate img { display: block; width: 100%; height: 100%; object-fit: cover; scale: 1.16; transition: scale .3s; }

/* The cover sets itself after the turn: title, then plate, then author. */
.coverTitle, .coverPlate, .coverRule, .coverFoot { opacity: 0; translate: 0 10px; transition: opacity .2s, translate .2s; }
.isOpen .coverTitle, .isOpen .coverPlate, .isOpen .coverRule, .isOpen .coverFoot { opacity: 1; translate: 0 0; transition: opacity .4s ease var(--d), translate .8s var(--part) var(--d); }
.isOpen .coverTitle { --d: .12s; }
.isOpen .coverPlate, .isOpen .coverRule { --d: .2s; }
.isOpen .coverFoot { --d: .28s; }
.isOpen .coverPlate img { scale: 1; transition: scale 1.5s cubic-bezier(.2, .7, .2, 1) .2s; }
.coverRule { flex: 1 1 auto; position: relative; }
.coverRule::before { content: ""; position: absolute; left: 0; bottom: 14px; width: 34%; height: 1.5px; background: currentColor; opacity: .45; }
.deco-checker .coverRule::before, .deco-checker .coverPlate { box-shadow: none; }
.deco-checker .coverRule::before { width: 100%; height: 22px; bottom: 6px; opacity: .85; background: repeating-conic-gradient(var(--ink) 0 25%, transparent 0 50%) 0 0 / 11px 11px; }
.deco-stripes .coverRule::before { width: 100%; height: 16px; bottom: 8px; opacity: .4; background: repeating-linear-gradient(-45deg, var(--ink) 0 2px, transparent 2px 7px); }
.deco-emblem .coverRule::before { width: 16px; height: 16px; left: auto; right: 0; border-radius: 50%; background: none; border: 1.5px solid currentColor; }
.coverFoot { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 9.5px; white-space: nowrap; }
.coverAvatar { width: 18px; height: 18px; border-radius: 50%; flex: none; box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--ink) 40%, transparent); }
.coverAuthor { overflow: hidden; text-overflow: ellipsis; }

.book:focus-visible .cover, .book:focus-visible .spine { outline: 2px solid var(--MI_THEME-accent); outline-offset: 3px; }

/* ── placeholders ─────────────────────── */
.ghost {
	flex: none;
	display: grid;
	place-items: center;
	width: var(--t);
	height: calc(var(--rack) * var(--hr));
	box-sizing: border-box;
	border: 1.5px dashed color-mix(in srgb, var(--MI_THEME-fg) 26%, transparent);
	border-bottom: none;
	border-radius: 3px 3px 0 0;
	color: var(--MI_THEME-fgTransparentWeak);
}
.ghost span { writing-mode: vertical-rl; font: 500 12.5px/1 var(--serif); letter-spacing: .2em; opacity: .75; }
.write {
	flex: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	width: 44px;
	height: calc(var(--rack) * .7);
	margin-left: 26px;
	box-sizing: border-box;
	border: 1.5px dashed var(--hue);
	border-bottom: none;
	border-radius: 3px 3px 0 0;
	color: var(--hue);
	text-decoration: none;
	transform: rotate(-7deg);
	transform-origin: 0 100%;
	transition: background-color .25s, transform .45s var(--ease), border-style .25s;
}
.write:hover, .write:focus-visible { background: color-mix(in srgb, var(--hue) 10%, transparent); border-style: solid; transform: rotate(-2deg); outline: none; }
.writePlus { font: 300 22px/1 -apple-system, sans-serif; }
.writeText { writing-mode: vertical-rl; font: 600 12px/1 var(--serif); letter-spacing: .2em; }

/* ── info line under the plank ────────── */
.info { min-height: 92px; margin-top: 18px; }
.infoCard { display: flex; align-items: center; gap: 24px; animation: infoIn .5s var(--ease) both; }
@keyframes infoIn { from { opacity: 0; transform: translateY(6px); } }
.infoText { flex: 1 1 auto; min-width: 0; }
.infoText h3 { margin: 0; font: 700 18px/1.35 var(--serif); color: var(--ink-strong); letter-spacing: .02em; }
.infoText p { margin: 6px 0 0; font-size: 13px; line-height: 1.65; color: var(--MI_THEME-fgTransparentWeak); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; overflow: hidden; }
.infoMeta { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: var(--MI_THEME-fgTransparentWeak); white-space: nowrap; }
.infoMeta img { width: 20px; height: 20px; border-radius: 50%; }
.infoMeta i { font-style: normal; opacity: .5; }
.infoMeta em { margin-left: 4px; padding: 1px 7px; border: 1px solid var(--MI_THEME-divider); border-radius: 999px; font-style: normal; font-size: 11px; }
.infoActions { flex: none; display: flex; align-items: center; gap: 10px; }
.save { display: inline-grid; place-items: center; width: 40px; height: 40px; padding: 0;  border: 1px solid var(--MI_THEME-divider); border-radius: 999px; background: var(--MI_THEME-panel); color: var(--ink-strong); font-size: 16px; cursor: pointer; }
.save.on { border-color: var(--MI_THEME-cta); color: var(--MI_THEME-cta); }
.save:disabled { opacity: .6; cursor: default; }
.read { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 20px; border-radius: 999px; background: var(--MI_THEME-cta); color: var(--MI_THEME-fgOnAccent, #fff); font-size: 13.5px; font-weight: 700; letter-spacing: .06em; text-decoration: none; }
.read span { transition: transform .25s var(--ease); }
.read:hover span { transform: translateX(3px); }
.emptyNote { display: flex; align-items: center; gap: 24px; animation: infoIn .5s var(--ease) both; }
.emptyNote p { flex: 1; margin: 0; font-size: 13px; line-height: 1.7; color: var(--MI_THEME-fgTransparentWeak); }

/* ── entrance ─────────────────────────── */
.book, .ghost, .write { opacity: 0; translate: 0 22px; }
.book { transition: width .95s var(--part), opacity .5s ease calc(var(--i) * 30ms), translate .8s var(--ease) calc(var(--i) * 30ms); }
.ghost, .write { transition: opacity .5s ease calc(var(--i) * 30ms + 60ms), translate .8s var(--ease) calc(var(--i) * 30ms + 60ms), background-color .25s, transform .45s var(--ease); }
.isShown .book, .isShown .ghost, .isShown .write { opacity: 1; translate: 0 0; }

/* ── small screens ────────────────────── */
@container shelf (max-width: 720px) {
	.shelfPage { --rack: 214px; grid-template-columns: minmax(0, 1fr); }
	.index {
		grid-column: 1; grid-row: auto; position: sticky; top: var(--MI-stickyTop, 0px); z-index: 10;
		flex-direction: row; justify-content: flex-start; gap: 6px;
		padding: 10px 14px; margin: 0 4px;
		background: color-mix(in srgb, var(--MI_THEME-bg) 86%, transparent);
		backdrop-filter: blur(12px);
		overflow-x: auto; scrollbar-width: none;
	}
	.index a { flex: none; flex-direction: row; gap: 6px; padding: 7px 12px; border-radius: 999px; white-space: nowrap; }
	.index span { writing-mode: horizontal-tb; font-size: 12.5px; letter-spacing: .04em; }
	.index a::after { display: none; }
	.index a.on { background: color-mix(in srgb, var(--hue) 12%, transparent); }
	.shelves { padding-top: 4px; gap: 4px; }
	.shelf { padding: 20px 16px 16px; border-radius: 22px; }
	.shelfNo { font-size: 34px; }
	.shelfName h2 { font-size: 18px; }
	.rack { margin: 0 -16px; padding: 30px 16px 0; }
	.plank { margin: 0 -6px; }
	.info { min-height: 0; margin-top: 14px; }
	.infoCard, .emptyNote { flex-direction: column; align-items: stretch; gap: 12px; }
	.infoText h3 { font-size: 16px; }
	.infoActions .read { flex: 1; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
	.book, .box, .ghost, .write, .shelf, .book::after { transition: none !important; }
	.infoCard, .emptyNote { animation: none; }
	.book, .ghost, .write { translate: 0 0; opacity: 1; }
	.isOpen .box, .isLeaving .box, .isOpen .sheen { animation: none; }
	.coverTitle, .coverPlate, .coverRule, .coverFoot { opacity: 1; translate: 0 0; }
	.coverPlate img { scale: 1; }
}

/* the L of the wordmark doubles as the bookend */
.bookend { flex: none; width: 26px; height: calc(var(--rack) * .42); margin-right: -2px; overflow: visible; }
.bookend path { fill: none; stroke: var(--hue); stroke-width: 13; stroke-linecap: round; stroke-linejoin: round; vector-effect: none; }
.bookend { opacity: 0; translate: 0 22px; transition: opacity .5s ease, translate .8s var(--ease); }
.isShown .bookend { opacity: 1; translate: 0 0; }

.state { grid-column: 1; min-height: 320px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--MI_THEME-fgTransparentWeak); }
</style>
