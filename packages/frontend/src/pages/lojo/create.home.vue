<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 创作台: everything 创作讲解 wrote for this account (drafts in the account registry), and how it works. -->
<template>
<div :class="$style.root">
	<MkPageHeader :canOmitTitle="false"/>
	<div :class="$style.body">
		<p :class="$style.lead">{{ createLabels.studioLead }}</p>

		<div v-if="!creatorView" :class="$style.off">
			<i class="ti ti-language"></i>
			<span>{{ createLabels.studioOff }}</span>
			<MkButton primary rounded inline small to="/settings/create">{{ createLabels.turnOn }}</MkButton>
		</div>

		<section :class="$style.card">
			<header :class="$style.cardHead"><h2>{{ createLabels.howTitle }}</h2></header>
			<ol :class="$style.how">
				<li v-for="(s, i) in createLabels.steps" :key="s">
					<span :class="$style.num">{{ i + 1 }}</span>
					<span><b>{{ s }}</b><small>{{ createLabels.stepHints[i] }}</small></span>
				</li>
			</ol>
		</section>

		<MkLoading v-if="drafts == null && !failed"/>
		<div v-else-if="failed" :class="$style.empty" role="alert">
			<p>{{ createLabels.loadFailed }}</p>
			<MkButton rounded inline @click="load"><i class="ti ti-refresh"></i> {{ createLabels.retry }}</MkButton>
		</div>
		<div v-else-if="drafts != null && drafts.length === 0" :class="$style.empty">
			<b>{{ createLabels.studioEmpty }}</b>
			<small>{{ createLabels.studioEmptyHint }}</small>
		</div>
		<div v-else-if="drafts != null" :class="$style.list">
			<MkA v-for="d in drafts" :key="d.id" :to="`/create/drafts/${d.id}`" :class="$style.draft">
				<span :class="$style.draftTop">
					<span :class="$style.plan">{{ d.plan.name }}</span>
					<small>{{ d.plan.platform }} · {{ ago(d.updatedAt) }}</small>
				</span>
				<b :class="$style.draftTitle">{{ d.chosenTitle || d.titles[0] }}</b>
				<span :class="$style.draftBody">{{ oneLine(d.body) }}</span>
				<small :class="$style.draftSource">{{ createLabels.adaptedFrom(d.noteBy) }}</small>
			</MkA>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { createLabels } from '@/lojo/create/labels.js';
import { ago, creatorView, listDrafts, loadCreateState } from '@/lojo/create/state.js';
import type { CreateDraft } from '@/lojo/create/state.js';
import { definePage } from '@/page.js';

const drafts = ref<CreateDraft[] | null>(null);
const failed = ref(false);

const oneLine = (s: string) => s.replace(/\s+/g, ' ').slice(0, 90);

async function load() {
	failed.value = false;
	try {
		drafts.value = await listDrafts();
	} catch {
		failed.value = true;
	}
}

onMounted(() => {
	loadCreateState();
	load();
});

definePage(() => ({
	title: createLabels.studioTitle,
	icon: 'ti ti-layout-dashboard',
}));
</script>

<style lang="scss" module>
.root {
	--crSerif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	--crShadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-brandInk) 6%, transparent), 0 10px 28px -12px color-mix(in srgb, var(--MI_THEME-brandInk) 28%, transparent);
	--crFaint: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);
	--crWeak: color-mix(in srgb, var(--MI_THEME-fg) 72%, transparent);
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	box-sizing: border-box;
	max-width: 640px;
	margin: 0 auto;
	padding: 18px 16px 48px;
}

.lead {
	margin: 0 2px 16px;
	font-size: 0.92em;
	line-height: 1.7;
	color: var(--crWeak);
}

.off {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 16px;
	padding: 12px 14px;
	border-radius: 16px;
	font-size: 0.88em;
	background: var(--MI_THEME-accentedBg);

	> span {
		flex: 1;
	}
}

.card {
	margin-bottom: 18px;
	padding: 16px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--crShadow);
}

.cardHead {
	margin-bottom: 8px;

	> h2 {
		margin: 0;
		font: 700 1.1em/1.3 var(--crSerif);
		color: var(--MI_THEME-brandInk);
		letter-spacing: 0.03em;
	}
}

.how {
	margin: 0;
	padding: 0;
	list-style: none;

	> li {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 7px 0;

		> span:last-child {
			display: flex;
			flex-direction: column;
			padding-top: 3px;
			line-height: 1.45;
		}
	}

	small {
		font-size: 0.85em;
		color: var(--crWeak);
	}
}

.num {
	flex: none;
	display: grid;
	place-items: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	font-size: 0.8em;
	font-weight: 700;
	color: var(--MI_THEME-brandInk);
	box-shadow: inset 0 0 0 2px var(--MI_THEME-divider);
}

.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 30px 12px;
	text-align: center;

	> b {
		font: 700 1.05em var(--crSerif);
		color: var(--MI_THEME-brandInk);
	}

	> small, > p {
		margin: 0;
		color: var(--crWeak);
	}
}

.list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.draft {
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 14px;
	border-radius: 18px;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panel);
	box-shadow: var(--crShadow);

	&:hover {
		text-decoration: none;
	}
}

.draftTop {
	display: flex;
	align-items: center;
	gap: 8px;

	> small {
		flex: none;
		font-size: 0.75em;
		color: var(--crFaint);
	}
}

.plan {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	font-size: 0.78em;
	font-weight: 600;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--MI_THEME-accent);
}

.draftTitle {
	font: 700 1.02em/1.45 var(--crSerif);
	color: var(--MI_THEME-brandInk);
}

.draftBody {
	font-size: 0.85em;
	line-height: 1.55;
	color: var(--crWeak);
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.draftSource {
	font-size: 0.75em;
	color: var(--crFaint);
}
</style>
