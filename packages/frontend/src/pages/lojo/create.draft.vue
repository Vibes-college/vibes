<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- One draft written by 创作讲解: the checks (and what the second pass already fixed), the titles to pick from, the
words to edit (saved to the account registry a moment after typing stops), and the brief to paste into one's own agent. -->
<template>
<div :class="$style.root">
	<MkPageHeader :actions="headerActions" :canOmitTitle="false"/>
	<div :class="$style.body">
		<MkLoading v-if="loading"/>
		<div v-else-if="draft == null" :class="$style.failed" role="alert">
			<p>{{ failed ? createLabels.loadFailed : createLabels.notFound }}</p>
			<MkButton rounded inline to="/create">{{ createLabels.studioTitle }}</MkButton>
		</div>
		<template v-else>
			<XFlow :step="3"/>

			<p :class="$style.kicker">{{ draft.plan.platform }} · {{ draft.plan.medium }} · {{ ago(draft.updatedAt) }}</p>
			<h1 :class="$style.title">{{ title }}</h1>
			<div :class="$style.tags">
				<span :class="$style.tag"><i class="ti ti-sparkles"></i>{{ draft.plan.name }}</span>
				<MkA :to="`/notes/${draft.noteId}`" :class="[$style.tag, $style.plain]"><i class="ti ti-external-link"></i>{{ createLabels.adaptedFrom(draft.noteBy) }}</MkA>
			</div>

			<section :class="$style.preview" aria-hidden="true">
				<div :class="$style.cover"><b>{{ draft.cover || title }}</b><small>{{ coverHint }}</small></div>
				<div :class="$style.previewText"><b>{{ title }}</b><p>{{ draft.body }}</p></div>
			</section>

			<section :class="[$style.card, $style[checksState]]">
				<header :class="$style.cardHead">
					<h2>{{ createLabels.checksTitle }}</h2>
					<span :class="$style.checksSummary">{{ checksSummary }}</span>
				</header>
				<!-- Closed at first: on a phone the list of what was already fixed pushed the copy a screen down. -->
				<details v-if="draft.fixed.length > 0" :class="$style.fixed">
					<summary><i class="ti ti-check"></i><span>{{ createLabels.fixedTitle(draft.fixed.length) }}</span><i class="ti ti-chevron-down" :class="$style.fixedChevron"></i></summary>
					<ul><li v-for="(f, i) in draft.fixed" :key="i">{{ f }}</li></ul>
				</details>
				<p v-if="!draft.reviewed" :class="$style.notice"><i class="ti ti-alert-triangle"></i>{{ createLabels.notReviewed }}</p>
				<ul v-if="draft.checks.length > 0" :class="$style.checkList">
					<li v-for="(c, i) in draft.checks" :key="i">
						<span :class="[$style.level, c.level === 'must' ? $style.must : $style.should]">{{ c.level === 'must' ? createLabels.levelMust : createLabels.levelWarn }}</span>
						<span>{{ c.text }}</span>
					</li>
				</ul>
				<p :class="$style.hint">{{ createLabels.checksNote }}</p>
			</section>

			<section :class="$style.card">
				<header :class="$style.cardHead">
					<h2>{{ createLabels.titles }}</h2>
					<span>{{ createLabels.pickOne }}</span>
				</header>
				<div role="radiogroup" :aria-label="createLabels.titles">
					<div v-for="t in draft.titles" :key="t" :class="[$style.titleRow, { [$style.titleOn]: t === title }]">
						<button class="_button" :class="$style.titlePick" role="radio" :aria-checked="t === title" @click="pickTitle(t)">
							<i class="ti ti-check"></i><span>{{ t }}</span>
						</button>
						<button class="_button" :class="$style.iconButton" :aria-label="createLabels.copy" @click="copy(t)"><i class="ti ti-copy"></i></button>
					</div>
				</div>
			</section>

			<section :class="$style.card">
				<div class="_gaps_m">
					<div v-for="f in fields" :key="f.key" :class="$style.field">
						<MkInput v-if="f.key === 'cover'" v-model="draft.cover">
							<template #label>{{ f.label }}</template>
						</MkInput>
						<MkTextarea v-else v-model="draft[f.key]" :tall="f.key === 'body' || f.key === 'script'">
							<template #label>{{ f.label }}</template>
						</MkTextarea>
						<button class="_button" :class="$style.copyField" @click="copy(draft[f.key])"><i class="ti ti-copy"></i> {{ createLabels.copy }}</button>
					</div>
				</div>
				<p v-if="draft.ai" :class="$style.aiNote"><i class="ti ti-sparkles"></i><span><b>{{ createLabels.aiNote }}</b>{{ draft.ai }}</span></p>
				<p :class="$style.hint">{{ saveState }}</p>
			</section>

			<section :class="[$style.card, $style.agent]">
				<header :class="$style.cardHead">
					<h2>{{ createLabels.agentTitle }}</h2>
					<span><i class="ti ti-robot"></i> {{ createLabels.agentSub }}</span>
				</header>
				<p :class="$style.lead">{{ createLabels.agentLead(video) }}</p>
				<details :class="$style.brief">
					<summary>{{ createLabels.briefPreview }}</summary>
					<pre>{{ brief }}</pre>
				</details>
			</section>

			<div :class="$style.danger">
				<button class="_textButton" @click="remove">{{ createLabels.deleteDraft }}</button>
			</div>

			<div :class="$style.dock">
				<MkButton primary rounded large full @click="copyBrief"><i class="ti ti-copy"></i> {{ createLabels.copyBrief }}</MkButton>
			</div>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { url } from '@@/js/config.js';
import XFlow from './create.flow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import { agentBrief, createLabels } from '@/lojo/create/labels.js';
import { ago, copyText, getDraft, removeDraft, saveDraft } from '@/lojo/create/state.js';
import type { CreateDraft } from '@/lojo/create/state.js';
import { definePage } from '@/page.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import { useRouter } from '@/router.js';
import * as os from '@/os.js';

const props = defineProps<{
	draftId: string;
}>();

type Field = 'cover' | 'body' | 'script' | 'pin';

const router = useRouter();
const headerActions: PageHeaderItem[] = [{ icon: 'ti ti-layout-dashboard', text: createLabels.studioTitle, handler: () => router.pushByPath('/create') }];
const draft = ref<CreateDraft | null>(null);
const loading = ref(true);
const failed = ref(false);
const saveState = ref<string>(createLabels.editHint);

const video = computed(() => /视频/.test(draft.value?.plan.medium ?? ''));
const title = computed(() => draft.value?.chosenTitle || draft.value?.titles[0] || '');
const fields = computed<{ key: Field; label: string }[]>(() => [
	{ key: 'cover', label: createLabels.cover },
	{ key: 'body', label: createLabels.body },
	{ key: 'script', label: video.value ? createLabels.scriptVideo : createLabels.scriptPages },
	{ key: 'pin', label: createLabels.pin },
]);
const coverHint = computed(() => {
	if (video.value) return createLabels.coverVideo;
	return createLabels.coverPages((draft.value?.script ?? '').split('\n').filter(l => /^\s*\[/.test(l)).length);
});
const mustCount = computed(() => draft.value?.checks.filter(c => c.level === 'must').length ?? 0);
const checksSummary = computed(() => {
	const all = draft.value?.checks.length ?? 0;
	if (mustCount.value > 0) return createLabels.checksMust(mustCount.value);
	if (all > 0) return createLabels.checksWarn(all);
	return createLabels.checksOk;
});
// A class name looked up through $style in the template (useCssModule() is empty in production builds).
const checksState = computed(() => (mustCount.value > 0 ? 'checksBad' : (draft.value?.checks.length ?? 0) > 0 ? 'checksWarn' : 'checksOk'));
const brief = computed(() => {
	const d = draft.value;
	if (d == null) return '';
	return agentBrief({ ...d, noteUrl: `${url}/notes/${d.noteId}` });
});

async function load() {
	loading.value = true;
	failed.value = false;
	try {
		draft.value = await getDraft(props.draftId);
	} catch {
		failed.value = true;
	} finally {
		loading.value = false;
	}
}

// Save a moment after typing stops.
let timer: number | null = null;
let ready = false;

async function saveNow() {
	timer = null;
	if (draft.value == null) return;
	saveState.value = createLabels.saving;
	try {
		await saveDraft(draft.value);
		saveState.value = createLabels.savedNow;
	} catch {
		saveState.value = createLabels.saveFailed;
	}
}

watch(() => draft.value && [draft.value.cover, draft.value.body, draft.value.script, draft.value.pin, draft.value.chosenTitle].join('\u0000'), (now, before) => {
	if (!ready || before == null || now == null) return;
	if (timer != null) window.clearTimeout(timer);
	timer = window.setTimeout(saveNow, 900);
});

function pickTitle(t: string) {
	if (draft.value != null) draft.value.chosenTitle = t;
}

async function copy(text: string) {
	os.toast(await copyText(text) ? createLabels.copied : createLabels.saveFailed);
}

async function copyBrief() {
	os.toast(await copyText(brief.value) ? createLabels.briefCopied : createLabels.saveFailed);
}

async function remove() {
	if (draft.value == null) return;
	const { canceled } = await os.confirm({ type: 'warning', text: createLabels.deleteConfirm });
	if (canceled) return;
	await removeDraft(draft.value.id);
	os.toast(createLabels.deleted);
	router.pushByPath('/create');
}

onMounted(async () => {
	await load();
	ready = true;
});

onBeforeUnmount(() => {
	if (timer != null) {
		window.clearTimeout(timer);
		saveNow();
	}
});

watch(() => props.draftId, async () => {
	ready = false;
	await load();
	ready = true;
});

definePage(() => ({
	title: createLabels.draftTitle,
	icon: 'ti ti-file-text',
}));
</script>

<style lang="scss" module>
.root {
	--crSerif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	--crShadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-brandInk) 6%, transparent), 0 10px 28px -12px color-mix(in srgb, var(--MI_THEME-brandInk) 28%, transparent);
	--crFaint: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);
	--crWeak: color-mix(in srgb, var(--MI_THEME-fg) 72%, transparent);
	--crHi: color-mix(in srgb, var(--MI_THEME-fg) 5%, var(--MI_THEME-panel));
	--crOk: #2F7D5B;
	--crOkBg: color-mix(in srgb, #2F7D5B 13%, var(--MI_THEME-panel));
	--crGoldFg: color-mix(in srgb, var(--MI_THEME-warn) 55%, var(--MI_THEME-fg));
	--crGoldBg: color-mix(in srgb, var(--MI_THEME-warn) 20%, var(--MI_THEME-panel));
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	box-sizing: border-box;
	max-width: 640px;
	margin: 0 auto;
	padding: 18px 16px 0;
}

.failed {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 40px 0;
	text-align: center;

	> p {
		margin: 0;
	}
}

.kicker {
	margin: 0 2px 6px;
	font-size: 0.8em;
	letter-spacing: 0.12em;
	color: var(--crFaint);
}

.title {
	margin: 0 0 10px;
	font: 700 1.5em/1.3 var(--crSerif);
	color: var(--MI_THEME-brandInk);
	letter-spacing: 0.03em;
}

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 16px;
}

.tag {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 3px 10px;
	border-radius: 9px;
	font-size: 0.8em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.plain {
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-buttonBg);

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.preview {
	display: flex;
	gap: 14px;
	margin-bottom: 16px;
	padding: 12px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--crShadow);
}

.cover {
	flex: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 120px;
	aspect-ratio: 3 / 4;
	padding: 10px;
	box-sizing: border-box;
	border-radius: 12px;
	text-align: center;
	background-color: #FBF6EC;
	background-image: radial-gradient(circle, rgba(74, 78, 99, 0.13) 1.2px, transparent 1.5px);
	background-size: 14px 14px;

	> b {
		font: 800 1em/1.4 var(--crSerif);
		color: #14204F;
		text-wrap: balance;
	}

	> small {
		font-size: 0.6em;
		color: #A19E95;
	}
}

.previewText {
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6px;

	> b {
		font-size: 0.95em;
		line-height: 1.45;
		color: var(--MI_THEME-brandInk);
	}

	> p {
		margin: 0;
		font-size: 0.8em;
		line-height: 1.65;
		white-space: pre-wrap;
		color: var(--crWeak);
		display: -webkit-box;
		-webkit-line-clamp: 6;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
}

.card {
	margin-bottom: 14px;
	padding: 16px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--crShadow);
}

.cardHead {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 12px;

	> h2 {
		margin: 0;
		font: 700 1.1em/1.3 var(--crSerif);
		color: var(--MI_THEME-brandInk);
		letter-spacing: 0.03em;
	}

	> span {
		font-size: 0.8em;
		color: var(--crWeak);
	}
}

.checksOk .checksSummary {
	color: var(--crOk);
	font-weight: 600;
}

.checksWarn .checksSummary {
	color: var(--crGoldFg);
	font-weight: 600;
}

.checksBad {
	box-shadow: var(--crShadow), inset 0 0 0 1.5px color-mix(in srgb, var(--MI_THEME-error) 35%, transparent);

	.checksSummary {
		color: var(--MI_THEME-error);
		font-weight: 700;
	}
}

.fixed {
	margin: 0 0 10px;
	padding: 10px 12px;
	border-radius: 14px;
	font-size: 0.85em;
	line-height: 1.6;
	color: var(--crOk);
	background: var(--crOkBg);

	> summary {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 700;
		cursor: pointer;
		list-style: none;

		&::-webkit-details-marker {
			display: none;
		}

		> span {
			flex: 1;
		}
	}

	> ul {
		margin: 6px 0 0;
		padding-left: 22px;
	}

	&[open] .fixedChevron {
		transform: rotate(180deg);
	}
}

.fixedChevron {
	transition: transform 0.2s ease;
}

.notice {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	margin: 0 0 10px;
	padding: 10px 12px;
	border-radius: 14px;
	font-size: 0.85em;
	line-height: 1.55;
	color: var(--crGoldFg);
	background: var(--crGoldBg);
}

.checkList {
	margin: 0;
	padding: 0;
	list-style: none;

	> li {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 8px 0;
		font-size: 0.88em;
		line-height: 1.6;
		border-top: 1px solid var(--MI_THEME-divider);

		&:first-child {
			padding-top: 2px;
			border-top: none;
		}
	}
}

.level {
	flex: none;
	margin-top: 2px;
	padding: 1px 8px;
	border-radius: 7px;
	font-size: 0.8em;
	font-weight: 700;
}

.must {
	color: var(--MI_THEME-error);
	background: color-mix(in srgb, var(--MI_THEME-error) 12%, var(--MI_THEME-panel));
}

.should {
	color: var(--crGoldFg);
	background: var(--crGoldBg);
}

.hint {
	margin: 10px 2px 0;
	font-size: 0.8em;
	line-height: 1.6;
	color: var(--crFaint);
}

.titleRow {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 4px 0;
}

.titlePick {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	border-radius: 14px;
	text-align: left;
	font-weight: 600;
	line-height: 1.45;
	background: var(--crHi);

	> i {
		flex: none;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		font-size: 0.8em;
		color: transparent;
		box-shadow: inset 0 0 0 2px var(--MI_THEME-divider);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.titleOn .titlePick {
	color: var(--MI_THEME-brandInk);
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 2px var(--MI_THEME-brandInk);

	> i {
		color: #fff;
		background: var(--MI_THEME-brandInk);
		box-shadow: none;
	}
}

.iconButton {
	flex: none;
	display: grid;
	place-items: center;
	width: 38px;
	height: 38px;
	border-radius: 12px;
	background: var(--crHi);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.field {
	position: relative;
}

.copyField {
	position: absolute;
	top: 0;
	right: 0;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 8px;
	border-radius: 8px;
	font-size: 0.8em;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.aiNote {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	margin: 14px 0 0;
	padding: 10px 12px;
	border-radius: 14px;
	font-size: 0.85em;
	line-height: 1.55;
	color: var(--crGoldFg);
	background: var(--crGoldBg);

	b {
		display: block;
	}
}

.agent {
	background: linear-gradient(140deg, color-mix(in srgb, var(--MI_THEME-accent) 8%, var(--MI_THEME-panel)), var(--MI_THEME-panel) 58%);
	box-shadow: var(--crShadow), inset 0 0 0 1.5px color-mix(in srgb, var(--MI_THEME-accent) 16%, transparent);
}

.lead {
	margin: 0 0 12px;
	font-size: 0.88em;
	line-height: 1.65;
}

.brief {
	> summary {
		cursor: pointer;
		font-size: 0.85em;
		font-weight: 600;
		color: var(--MI_THEME-accent);
	}

	> pre {
		margin: 8px 0 0;
		max-height: 340px;
		overflow: auto;
		padding: 12px 14px;
		border-radius: 14px;
		font: 0.8em/1.65 var(--MI-font, inherit);
		white-space: pre-wrap;
		word-break: break-word;
		background: var(--crHi);
	}
}

.danger {
	margin: 4px 0 0;
	text-align: center;
	font-size: 0.85em;
}

// The way out of this page stays in reach at the bottom.
.dock {
	position: sticky;
	bottom: 0;
	z-index: 2;
	margin: 8px -16px 0;
	padding: 22px 16px calc(env(safe-area-inset-bottom) + 14px);
	background: linear-gradient(color-mix(in srgb, var(--MI_THEME-bg) 0%, transparent), var(--MI_THEME-bg) 40%);
}
</style>
