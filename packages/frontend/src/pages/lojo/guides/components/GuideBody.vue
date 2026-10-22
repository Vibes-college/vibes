<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.body" class="_selectable" data-testid="guide-body">
	<template v-for="block in blocks" :key="block.id">
		<component :is="block.level === 3 ? 'h3' : 'h2'" v-if="block.type === 'heading'" :id="`guide-block-${block.id}`" :data-guide-block="block.id" :data-scroll-anchor="block.id">{{ block.text }}</component>
		<p v-else-if="block.type === 'paragraph'" :id="`guide-block-${block.id}`" :data-guide-block="block.id" :data-scroll-anchor="block.id">{{ block.text }}</p>
		<figure v-else-if="block.type === 'image' && safe(block.url)" :data-scroll-anchor="block.id">
			<button class="_button" :class="$style.imageButton" :aria-label="block.caption || '查看图片'" @click="openImage(block, $event)"><img :src="safe(block.url)" :alt="block.caption || ''" loading="lazy"/></button>
			<figcaption v-if="block.caption">{{ block.caption }}</figcaption>
		</figure>
		<figure v-else-if="block.type === 'video' && safe(block.url)" :data-scroll-anchor="block.id">
			<video :src="safe(block.url)" controls playsinline preload="metadata" :aria-label="block.caption || '视频'"></video>
			<figcaption v-if="block.caption">{{ block.caption }}</figcaption>
		</figure>
		<figure v-else-if="block.type === 'audio' && safe(block.url)" :data-scroll-anchor="block.id">
			<audio :src="safe(block.url)" controls preload="metadata" :aria-label="block.caption || '音频'"></audio>
			<figcaption v-if="block.caption">{{ block.caption }}</figcaption>
		</figure>
		<ul v-else-if="block.type === 'checklist'" :class="$style.checklist" :data-scroll-anchor="block.id">
			<li v-for="(item, index) in block.items" :key="index"><i class="ti ti-square-check" aria-hidden="true"></i><span>{{ item }}</span></li>
		</ul>
		<div v-else-if="block.type === 'resource' && block.resource && safe(block.resource.url)" :class="$style.resource" class="_panel" :data-scroll-anchor="block.id">
			<i :class="resourceIcon(block.resource.kind)" aria-hidden="true"></i>
			<div>
				<MkLink :url="safe(block.resource.url)!" :class="$style.resourceTitle">{{ block.resource.title }}</MkLink>
				<p v-if="block.resource.description">{{ block.resource.description }}</p>
				<span v-if="block.resource.meta" :class="$style.meta">{{ block.resource.meta }}</span>
			</div>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue';
import type { GuideBlock } from '@/lojo/guides/types.js';
import { guideSafeUrl } from '../labels.js';
import MkLink from '@/components/MkLink.vue';
import * as os from '@/os.js';

defineProps<{ blocks: GuideBlock[] }>();
const safe = guideSafeUrl;

function resourceIcon(kind: string) {
	return { tool: 'ti ti-tool', service: 'ti ti-building-store', map: 'ti ti-map', guide: 'ti ti-book' }[kind] ?? 'ti ti-link';
}

async function openImage(block: GuideBlock, event: MouseEvent) {
	const url = safe(block.url);
	if (!url) return;
	const source = (event.currentTarget as HTMLElement).querySelector('img');
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkLightbox.vue').then(x => x.default), {
		contents: [{ id: block.id, type: 'image', url, filename: block.caption, sourceElement: source ? markRaw(source) : null }],
		initiallyRevealedContentIds: [block.id],
	}, { closed: () => dispose() });
}
</script>

<style lang="scss" module>
.body {
	font-size: 16px;
	line-height: 1.95;
	overflow-wrap: anywhere;
	user-select: text;
	-webkit-user-select: text;
	:global([data-guide-block]) { scroll-margin-top: 90px; }
	h2, h3 { line-height: 1.5; margin: 2.2em 0 .8em; font-weight: 700; }
	h2 { font-size: 1.3em; }
	h3 { font-size: 1.1em; }
	p { margin: 0 0 1.3em; white-space: pre-wrap; }
	figure { margin: 28px 0; }
	figcaption { margin-top: 8px; font-size: .8em; color: var(--MI_THEME-fgTransparentWeak); text-align: center; }
	img, video, audio { max-width: 100%; width: 100%; border-radius: var(--MI-radius); display: block; }
	img { max-height: 600px; object-fit: contain; }
	video { max-height: 480px; background: var(--MI_THEME-bg); }
	> :first-child { margin-top: 0; }
}
.imageButton { width: 100%; display: block; cursor: zoom-in; }
.checklist {
	list-style: none;
	padding: 18px 20px;
	margin: 26px 0;
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	li { display: flex; align-items: baseline; gap: 12px; padding: 4px 0; }
	i { color: var(--MI_THEME-accent); flex: 0 0 auto; }
}
.resource {
	display: flex;
	gap: 16px;
	padding: 20px;
	margin: 24px 0;
	border: 1px solid var(--MI_THEME-divider);
	line-height: 1.65;
	> i { font-size: 22px; color: var(--MI_THEME-accent); margin-top: 2px; }
	> div { min-width: 0; }
	p { margin: 7px 0; font-size: .9em; }
}
.resourceTitle { font-weight: 700; }
.meta { color: var(--MI_THEME-fgTransparentWeak); font-size: .8em; }
@media (max-width: 500px) {
	.body { font-size: 16px; line-height: 1.9; }
	.resource { padding: 16px; }
}
</style>
