<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<article :class="[$style.card, { [$style.opening]: opening }]" :style="cardStyle" data-testid="guide-book">
	<div :class="$style.stand">
		<MkA
			:to="destination"
			:class="$style.book"
			:aria-label="title"
			data-testid="guide-book-cover"
			@click.capture="onOpen"
			@pointermove="onTilt"
			@pointerleave="onUntilt"
		>
			<span :class="$style.pages" aria-hidden="true"></span>
			<span ref="front" :class="[$style.front, $style[`deco-${look.deco}`]]" data-testid="guide-book-front">
				<h2 :class="$style.coverTitle">{{ title }}</h2>
				<span v-if="cover" :class="$style.plate"><img :src="cover" alt="" loading="lazy" draggable="false" @error="coverFailed = true"/></span>
				<span v-else :class="$style.rule" aria-hidden="true"></span>
				<span :class="$style.foot">
					<img :class="$style.avatar" :src="guide.author.avatarUrl ?? undefined" alt="" loading="lazy"/>
					<span :class="$style.author">{{ guide.author.name || guide.author.username }}</span>
				</span>
				<span v-if="media" :class="$style.play" aria-hidden="true"><i :class="media.type === 'video' ? 'ti ti-player-play-filled' : 'ti ti-headphones'"></i></span>
				<span v-if="guide.isSaved" :class="$style.ribbon" aria-hidden="true"></span>
				<span :class="$style.glare" aria-hidden="true"></span>
			</span>
		</MkA>
	</div>
	<div :class="$style.meta">
		<span :class="$style.details">
			{{ look.minutes }} 分钟<template v-if="guide.commentCount"> · {{ guide.commentCount }} 条讨论</template><template v-if="guide.isDemo"> · {{ guideLabels.demo }}</template>
		</span>
		<button type="button" class="_button" :class="[$style.bookmark, { [$style.bookmarked]: guide.isSaved }]" :aria-label="guide.isSaved ? guideLabels.unbookmark : guideLabels.bookmark" :aria-pressed="guide.isSaved" :disabled="busy" @click="emit('bookmark', guide)">
			<i :class="guide.isSaved ? 'ti ti-bookmark-filled' : 'ti ti-bookmark'" aria-hidden="true"></i>
		</button>
	</div>
</article>
</template>

<script lang="ts" setup>
import { computed, onActivated, ref, useCssModule, useTemplateRef, watch } from 'vue';
import { guideLabels, guideSafeUrl } from '../labels.js';
import { canAnimateBookOpen, openBook } from '../book-open.js';
import type { BookLook } from '../shelves.js';
import type { Guide } from '@/lojo/guides/types.js';
import { useRouter } from '@/router.js';

const props = defineProps<{ guide: Guide; look: BookLook; index: number; busy?: boolean }>();
const emit = defineEmits<{ (ev: 'bookmark', guide: Guide): void }>();
const router = useRouter();
const style = useCssModule();
const front = useTemplateRef('front');
const opening = ref(false);
const coverFailed = ref(false);
const title = computed(() => props.guide.title || guideLabels.untitled);
const destination = computed(() => `/guides/${props.guide.id}${props.guide.status === 'draft' ? '/edit' : ''}`);
const cover = computed(() => coverFailed.value ? undefined : guideSafeUrl(props.guide.coverUrl) ?? guideSafeUrl(props.guide.blocks.find(block => block.type === 'image')?.url));
const media = computed(() => props.guide.blocks.find(block => ['video', 'audio'].includes(block.type) && guideSafeUrl(block.url)));
const cardStyle = computed(() => ({ '--c': props.look.c, '--ink': props.look.ink, '--ribbon': props.look.ribbon, '--i': Math.min(props.index, 12) }));

function onOpen(event: MouseEvent) {
	// Modified clicks keep MkA's native behaviour (new tab, window).
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	if (opening.value) return;
	if (!front.value || !canAnimateBookOpen()) {
		router.pushByPath(destination.value);
		return;
	}
	opening.value = true;
	openBook({
		front: front.value,
		cloth: props.look.c,
		ink: props.look.ink,
		title: title.value,
		summary: props.guide.summary,
		image: cover.value,
		navigate: () => {
			opening.value = false;
			router.pushByPath(destination.value);
		},
	});
}

// Desktop: the book leans toward the cursor and a soft glare follows it.
function onTilt(event: PointerEvent) {
	if (event.pointerType !== 'mouse' || opening.value) return;
	const el = event.currentTarget as HTMLElement;
	const rect = el.getBoundingClientRect();
	const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
	const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
	el.classList.add(style.tilting);
	el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
	el.style.setProperty('--rx', `${((0.5 - y) * 10).toFixed(2)}deg`);
	el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
	el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
}

function onUntilt(event: PointerEvent) {
	const el = event.currentTarget as HTMLElement;
	el.classList.remove(style.tilting);
	for (const name of ['--rx', '--ry', '--gx', '--gy']) el.style.removeProperty(name);
}

watch(() => props.guide.coverUrl, () => { coverFailed.value = false; });
onActivated(() => { opening.value = false; });
</script>

<style lang="scss" module>
.card {
	--serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", Georgia, serif;
	--ease: cubic-bezier(.22, .9, .24, 1);
	min-width: 0;
	animation: rise .8s var(--ease) both;
	animation-delay: calc(var(--i) * 45ms);
}
@keyframes rise { from { opacity: 0; transform: translateY(26px); } }

/* Face-out on a display table: each card brings its own length of plank. */
.stand { position: relative; perspective: 1400px; padding-bottom: 12px; }
.stand::after {
	content: "";
	position: absolute;
	left: -22px;
	right: -22px;
	bottom: 0;
	height: 12px;
	background: linear-gradient(180deg, color-mix(in srgb, #C9A97A 34%, var(--MI_THEME-bg)) 0 5px, color-mix(in srgb, #A9875A 52%, var(--MI_THEME-bg)) 5px 100%);
	box-shadow: 0 14px 20px -14px rgba(20, 32, 79, .4);
}

.book {
	position: relative;
	display: block;
	aspect-ratio: 2 / 3;
	text-decoration: none !important;
	color: var(--ink);
	transform-style: preserve-3d;
	transform: translateY(0) rotateX(0deg) rotateY(0deg);
	transform-origin: 50% 100%;
	transition: transform .7s var(--ease);
	outline: none;
}
.book::before {
	/* contact shadow on the plank */
	content: "";
	position: absolute;
	left: 4%;
	right: -3%;
	bottom: -5px;
	height: 12px;
	border-radius: 50%;
	background: radial-gradient(closest-side, rgba(14, 20, 40, .38), transparent);
	transition: opacity .5s, transform .7s var(--ease);
}
.pages {
	position: absolute;
	inset: 3px -4px 2px 6px;
	border-radius: 1px 4px 4px 1px;
	background: repeating-linear-gradient(90deg, #F4EDDD 0 1px, #E3D8C1 1px 2px);
	box-shadow: 2px 3px 8px rgba(14, 20, 40, .2);
}
.front {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	padding: 9% 9% 7% 12%;
	box-sizing: border-box;
	overflow: hidden;
	border-radius: 2px 5px 5px 2px;
	background: var(--c);
	color: var(--ink);
	container-type: inline-size;
	transform-origin: 0 50%;
	transform: rotateY(0deg);
	transition: transform .8s var(--ease), box-shadow .6s;
	box-shadow: 0 2px 4px rgba(14, 20, 40, .18), 8px 14px 26px -12px rgba(14, 20, 40, .45);
	&::after {
		/* spine crease and a little cloth sheen */
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			linear-gradient(90deg, rgba(0, 0, 0, .28) 0, rgba(255, 255, 255, .16) 3%, rgba(0, 0, 0, .1) 5%, transparent 9%),
			linear-gradient(160deg, rgba(255, 255, 255, .12), transparent 42%);
	}
}
.coverTitle {
	margin: 0;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 4;
	overflow: hidden;
	overflow-wrap: anywhere;
	font: 700 clamp(14px, 10.5cqi, 25px)/1.32 var(--serif);
	letter-spacing: .02em;
	padding-right: 8%;
	margin-bottom: 8%;
}
.plate { flex: 0 1 auto; min-height: 24px; margin-top: auto; overflow: hidden; border-radius: 2px; }
.plate img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 2px; box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 20%, transparent); transition: scale 1.2s var(--ease); }
.rule { flex: 1 1 auto; position: relative; }
.rule::before { content: ""; position: absolute; left: 0; bottom: 18%; width: 30%; height: 2px; background: currentColor; opacity: .45; }
.deco-checker .rule::before { width: 100%; height: 26%; bottom: 8%; opacity: .85; background: repeating-conic-gradient(var(--ink) 0 25%, transparent 0 50%) 0 0 / 14px 14px; }
.deco-stripes .rule::before { width: 100%; height: 18%; bottom: 10%; opacity: .4; background: repeating-linear-gradient(-45deg, var(--ink) 0 2px, transparent 2px 8px); }
.deco-emblem .rule::before { width: 20px; height: 20px; left: auto; right: 0; border-radius: 50%; background: none; border: 2px solid currentColor; }
.deco-bigtype .coverTitle { font: 800 clamp(16px, 12.5cqi, 30px)/1.2 -apple-system, "PingFang SC", "Noto Sans SC", sans-serif; letter-spacing: 0; }
.foot { display: flex; align-items: center; gap: 7px; margin-top: 8%; font-size: clamp(10px, 6cqi, 12.5px); white-space: nowrap; }
.avatar { flex: none; width: clamp(18px, 12cqi, 26px); height: clamp(18px, 12cqi, 26px); border-radius: 50%; box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--ink) 40%, transparent); }
.author { overflow: hidden; text-overflow: ellipsis; opacity: .9; }
.play {
	position: absolute;
	right: 8%;
	bottom: 6%;
	display: grid;
	place-items: center;
	width: 30px;
	height: 30px;
	border-radius: 50%;
	background: color-mix(in srgb, var(--ink) 92%, transparent);
	color: var(--c);
	font-size: 13px;
}
.ribbon { position: absolute; top: 0; right: 5%; width: 9px; height: 14%; background: var(--ribbon); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%); box-shadow: 0 1px 0 rgba(0, 0, 0, .2); }
.glare { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(circle at var(--gx, 30%) var(--gy, 20%), rgba(255, 255, 255, .32), rgba(255, 255, 255, 0) 60%); transition: opacity .4s; }

/* Hover: the book is picked up a little, leans toward the cursor, and the cover eases open. */
@media (hover: hover) and (pointer: fine) {
	.book:hover { transform: translateY(-8px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); }
	.book:hover::before { opacity: .55; transform: scaleX(.92); }
	.book:hover .front { transform: rotateY(-13deg); box-shadow: 0 2px 4px rgba(14, 20, 40, .14), 16px 22px 34px -14px rgba(14, 20, 40, .5); }
	.book:hover .plate img { scale: 1.05; }
	.tilting { transition: transform .2s cubic-bezier(.2, .7, .3, 1); }
	.tilting .glare { opacity: 1; }
}
.book:focus-visible { transform: translateY(-8px); }
.book:focus-visible .front { transform: rotateY(-13deg); outline: 2px solid var(--MI_THEME-accent); outline-offset: 4px; }
.opening .book { visibility: hidden; }

.meta { display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 10px 2px 0; }
.details { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--MI_THEME-fgTransparentWeak); letter-spacing: .02em; }
.bookmark {
	flex: none;
	display: grid;
	place-items: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	font-size: 16px;
	color: var(--MI_THEME-fgTransparentWeak);
	transition: color .2s, background .2s, transform .3s var(--ease);
	&:hover { color: var(--MI_THEME-fg); background: var(--MI_THEME-buttonHoverBg); }
	&:active { transform: scale(.9); }
	&:focus-visible { outline: 2px solid var(--MI_THEME-accent); outline-offset: 2px; }
}
.bookmarked { color: var(--MI_THEME-cta); }

@container (max-width: 550px) {
	.stand::after { left: -12px; right: -12px; }
	.front { padding: 10% 9% 8% 12%; }
	.play { width: 26px; height: 26px; font-size: 11px; }
}
@media (prefers-reduced-motion: reduce) {
	.card { animation: none; }
	.book, .front, .book::before, .plate img { transition: none !important; }
	.book:hover, .book:focus-visible { transform: none; }
	.book:hover .front, .book:focus-visible .front { transform: none; }
}
</style>
