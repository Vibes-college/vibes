<!--
SPDX-FileCopyrightText: Vibes
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 一份置顶的毕业作品：平时只露标题和一句话，点「看作品」在原地展开（作品、复盘、成绩单（填了才有）、做之前和之后、怎么学出来的）。 -->
<template>
<article :class="$style.root" class="_selectable">
	<div :class="$style.kind">{{ learnLabels.workKind(labels.name, halfYear(work.createdAt)) }}</div>
	<h3 :class="$style.title">{{ work.title }}</h3>
	<p :class="$style.line">{{ work.oneLine }}</p>
	<MkButton small rounded :class="$style.toggle" :aria-expanded="open" @click="open = !open">
		<i :class="open ? 'ti ti-chevron-up' : 'ti ti-chevron-down'"></i> {{ open ? learnLabels.close : learnLabels.open }}
	</MkButton>

	<div v-if="open" :class="$style.body">
		<div v-if="work.items.length > 0" :class="$style.items">
			<template v-for="(it, k) in work.items" :key="k">
				<figure v-if="it.kind === 'image'" :class="$style.media">
					<img :src="it.url" :alt="it.label || learnLabels.itemKinds.image" loading="lazy" referrerpolicy="no-referrer">
					<figcaption v-if="it.label">{{ it.label }}</figcaption>
				</figure>
				<figure v-else-if="it.kind === 'video' && isVideoFile(it.url)" :class="$style.media">
					<video :src="it.url" controls playsinline preload="metadata"></video>
					<figcaption v-if="it.label">{{ it.label }}</figcaption>
				</figure>
				<a v-else :href="safeHref(it.url)" target="_blank" rel="noopener nofollow ugc" :class="$style.item">
					<i :class="itemIcon(it.kind)"></i>
					<span :class="$style.itemText">{{ it.label || it.url }}</span>
					<span :class="$style.itemKind">{{ learnLabels.itemKinds[it.kind] ?? learnLabels.itemKinds.link }}</span>
				</a>
			</template>
		</div>

		<template v-if="work.reflection">
			<h4 :class="$style.h">{{ labels.reflection }}</h4>
			<p :class="$style.prose">{{ work.reflection }}</p>
		</template>

		<template v-if="work.score">
			<h4 :class="$style.h">{{ labels.score }}</h4>
			<p v-if="work.score.text" :class="$style.prose">{{ work.score.text }}</p>
			<img v-if="work.score.image" :class="$style.img" :src="work.score.image" :alt="labels.score" loading="lazy" referrerpolicy="no-referrer">
		</template>

		<template v-if="work.before || work.after">
			<h4 :class="$style.h">{{ learnLabels.beforeAfter }}</h4>
			<div :class="$style.ba">
				<div v-for="side in sides" :key="side.label">
					<div :class="$style.baLabel">{{ side.label }}</div>
					<img v-if="side.v?.image" :class="$style.img" :src="side.v.image" :alt="side.label" loading="lazy" referrerpolicy="no-referrer">
					<p v-if="side.v?.text" :class="$style.prose">{{ side.v.text }}</p>
				</div>
			</div>
		</template>

		<template v-if="work.journey.length > 0">
			<h4 :class="$style.h">{{ learnLabels.journey }}</h4>
			<p :class="$style.note">{{ learnLabels.journeyNote }}</p>
			<dl :class="$style.rows">
				<template v-for="[k, v] in work.journey" :key="k">
					<dt>{{ k }}</dt>
					<dd>{{ v }}</dd>
				</template>
			</dl>
		</template>
	</div>
</article>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { LearnWork } from './learn.js';
import { learnText as learnLabels } from '@/lojo/locales/learn.js';
import { halfYear, majorText, safeHref } from './learn.js';
import MkButton from '@/components/MkButton.vue';

const props = defineProps<{
	work: LearnWork;
}>();

const open = defineModel<boolean>('open', { default: false });

const labels = computed(() => majorText(props.work.major));

const sides = computed(() => [
	{ label: learnLabels.before, v: props.work.before },
	{ label: learnLabels.after, v: props.work.after },
]);

const isVideoFile = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(url);
const itemIcon = (kind: string) => (kind === 'video' ? 'ti ti-video' : kind === 'file' ? 'ti ti-file' : 'ti ti-link');
</script>

<style lang="scss" module>
.root {
	padding: 16px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-bg);
}

.kind {
	font-size: 0.85em;
	color: var(--MI_THEME-accent);
	font-weight: bold;
}

.title {
	margin: 6px 0 0;
	font-size: 1.2em;
	line-height: 1.4;
}

.line {
	margin: 6px 0 0;
	color: color-mix(in srgb, var(--MI_THEME-fg) 75%, transparent);
}

.toggle {
	margin-top: 12px;
}

.body {
	margin-top: 16px;
	padding-top: 16px;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.items {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.media {
	margin: 0;

	> img, > video {
		display: block;
		max-width: 100%;
		border-radius: var(--MI-radius);
	}

	> figcaption {
		margin-top: 4px;
		font-size: 0.85em;
		color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
	}
}

.item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	text-decoration: none;

	&:hover {
		background: var(--MI_THEME-panelHighlight);
	}
}

.itemText {
	flex: 1;
	min-width: 0;
	overflow-wrap: anywhere;
}

.itemKind {
	flex-shrink: 0;
	font-size: 0.8em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);
}

.h {
	margin: 18px 0 6px;
	font-size: 1em;
}

.prose {
	margin: 0;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	line-height: 1.7;
}

.img {
	display: block;
	max-width: 100%;
	margin-top: 8px;
	border-radius: var(--MI-radius);
}

.ba {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 12px;
}

.baLabel {
	font-size: 0.85em;
	font-weight: bold;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
}

.note {
	margin: 0 0 8px;
	font-size: 0.85em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 60%, transparent);
}

.rows {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 6px 14px;
	margin: 0;

	> dt {
		font-weight: bold;
		color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	}

	> dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
}
</style>
