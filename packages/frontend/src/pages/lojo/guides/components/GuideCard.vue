<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<article ref="card" class="_panel" :class="[$style.card, { [$style.mediaFirst]: mediaFirst }]">
	<div v-if="mediaFirst && media?.type === 'video'" :class="$style.media">
		<video :src="guideSafeUrl(media.url)" :poster="cover" controls playsinline preload="none" :aria-label="media.caption || guide.title" @play="onPlay"></video>
	</div>
	<div v-else-if="mediaFirst && media?.type === 'audio'" :class="[$style.media, $style.audio]">
		<img v-if="cover" :src="cover" alt="" loading="lazy"/>
		<i v-else class="ti ti-headphones" aria-hidden="true"></i>
		<audio :src="guideSafeUrl(media.url)" controls preload="none" :aria-label="media.caption || guide.title" @play="onPlay"></audio>
	</div>
	<MkA v-else-if="mediaFirst && cover" :to="destination" :class="$style.media" :aria-label="guide.title" tabindex="-1">
		<img :src="cover" alt="" loading="lazy"/>
	</MkA>
	<MkA :to="destination" :class="$style.content">
		<div :class="$style.text">
			<div :class="$style.categories">
				<span>{{ guideCategoryLabel(guide.category) }}</span>
				<span v-if="guide.city">{{ guide.city }}</span>
				<span v-if="guide.status === 'draft'" :class="$style.draft">{{ guideLabels.draft }}</span>
				<span v-else-if="guide.isDemo">{{ guideLabels.demo }}</span>
			</div>
			<h2 :class="$style.title">{{ guide.title || guideLabels.untitled }}</h2>
			<p v-if="guide.summary" :class="$style.summary">{{ guide.summary }}</p>
		</div>
		<img v-if="!mediaFirst && cover" :class="$style.cover" :src="cover" alt="" loading="lazy"/>
	</MkA>
	<div :class="$style.footer">
		<MkAvatar :user="guide.author" :class="$style.avatar" link/>
		<MkA :to="`/@${guide.author.username}`" :class="$style.author">{{ guide.author.name || guide.author.username }}</MkA>
		<MkTime v-if="!mediaFirst" :key="guide.updatedAt" :time="guide.updatedAt" :class="$style.time"/>
		<span v-if="guide.commentCount" :class="$style.comments"><i class="ti ti-message-circle"></i> {{ guide.commentCount }}</span>
		<button class="_button" :class="[$style.bookmark, { [$style.bookmarked]: guide.isSaved }]" :aria-label="guide.isSaved ? guideLabels.unbookmark : guideLabels.bookmark" :aria-pressed="guide.isSaved" :disabled="busy" @click="emit('bookmark', guide)">
			<i :class="guide.isSaved ? 'ti ti-bookmark-filled' : 'ti ti-bookmark'"></i>
		</button>
	</div>
</article>
</template>

<script lang="ts" setup>
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, useTemplateRef } from 'vue';
import type { Guide } from '@/lojo/guides/types.js';
import { guideCategoryLabel, guideLabels, guideSafeUrl } from '../labels.js';

const props = defineProps<{
	guide: Guide;
	busy?: boolean;
	mediaFirst?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'bookmark', guide: Guide): void;
}>();

const destination = computed(() => `/guides/${props.guide.id}${props.guide.status === 'draft' ? '/edit' : ''}`);
const cover = computed(() => guideSafeUrl(props.guide.coverUrl) ?? guideSafeUrl(props.guide.blocks.find(block => block.type === 'image')?.url));
const media = computed(() => props.guide.blocks.find(block => ['video', 'audio'].includes(block.type) && guideSafeUrl(block.url)));
const card = useTemplateRef('card');
let observer: IntersectionObserver | undefined;

function pause() { card.value?.querySelectorAll<HTMLMediaElement>('video, audio').forEach(item => item.pause()); }

function onPlay(event: Event) {
	// One preview at a time; native controls stay separate from the article link.
	window.document.querySelectorAll<HTMLMediaElement>('[data-testid="guide-waterfall"] video, [data-testid="guide-waterfall"] audio').forEach(item => {
		if (item !== event.target) item.pause();
	});
}

function onVisibility() { if (window.document.hidden) pause(); }

function activate() {
	if (!props.mediaFirst || !media.value || !card.value) return;
	observer ??= new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) pause(); });
	observer.observe(card.value);
	window.document.addEventListener('visibilitychange', onVisibility);
}

function deactivate() { pause(); observer?.disconnect(); window.document.removeEventListener('visibilitychange', onVisibility); }

onMounted(activate);
onActivated(activate);
onDeactivated(deactivate);
onBeforeUnmount(deactivate);
</script>

<style lang="scss" module>
.card { padding: 22px 24px 12px; }
.content { display: flex; align-items: flex-start; gap: 24px; text-decoration: none !important; }
.text { flex: 1; min-width: 0; }
.categories { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 12px; color: var(--MI_THEME-fgTransparentWeak); }
.categories > span:first-child { color: var(--MI_THEME-accent); font-weight: 600; }
.draft { color: var(--MI_THEME-warn); }
.title { margin: 10px 0 8px; font-size: 20px; line-height: 1.5; letter-spacing: 0.01em; }
.summary { margin: 0; color: var(--MI_THEME-fgTransparentWeak); font-size: 14px; line-height: 1.75; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.cover { width: 144px; height: 114px; flex-shrink: 0; object-fit: cover; border-radius: calc(var(--MI-radius) - 2px); }
.footer { margin-top: 18px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--MI_THEME-fgTransparentWeak); }
.avatar { width: 24px; height: 24px; flex-shrink: 0; }
.author { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.time { margin-right: auto; white-space: nowrap; }
.comments { white-space: nowrap; }
.bookmark { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; font-size: 18px; flex-shrink: 0; }
.bookmark:hover { background: var(--MI_THEME-buttonHoverBg); }
.bookmarked { color: var(--MI_THEME-accent); }
.mediaFirst {
	padding: 0;
	.content { display: block; padding: 14px 14px 0; }
	.categories { gap: 6px; font-size: 11px; }
	.categories > span:nth-child(2) { display: none; }
	.title { font-size: 17px; line-height: 1.55; margin: 8px 0; overflow-wrap: anywhere; }
	.summary { font-size: 12px; line-height: 1.7; -webkit-line-clamp: 3; }
	.footer { margin: 8px 8px 6px 14px; gap: 5px; }
	.author { flex: 1; max-width: none; font-size: 11px; }
	.avatar { width: 20px; height: 20px; }
	.bookmark { width: 30px; height: 36px; font-size: 16px; }
	.comments { font-size: 11px; }
}
.media { display: block; overflow: hidden; background: var(--MI_THEME-bg); }
.media img { display: block; width: 100%; height: auto; max-height: 420px; object-fit: cover; }
.media video { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: contain; }
.audio { position: relative; padding-bottom: 12px; }
.audio > i { display: grid; place-items: center; height: 130px; font-size: 44px; color: var(--MI_THEME-accent); }
.audio audio { display: block; width: calc(100% - 16px); height: 36px; margin: 12px 8px 0; }
@container (max-width: 550px) {
	.mediaFirst {
		.content { padding: 11px 11px 0; }
		.title { font-size: 14px; margin: 7px 0; }
		.summary { font-size: 11px; -webkit-line-clamp: 3; }
		.footer { margin-left: 10px; gap: 4px; }
		.avatar { width: 18px; height: 18px; }
		.comments { display: none; }
	}
}
@media (max-width: 550px) {
	.card:not(.mediaFirst) { padding: 18px 16px 8px; }
	.content { gap: 14px; }
	.title { font-size: 17px; margin-top: 8px; }
	.summary { font-size: 13px; }
	.cover { width: 96px; height: 96px; }
	.footer { margin-top: 10px; gap: 6px; }
	.card:not(.mediaFirst) .author { max-width: 86px; }
}
@media (max-width: 360px) {
	.cover { width: 80px; height: 90px; }
	.time { font-size: 11px; }
}
</style>
