<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 创作讲解 for one post (the button under posts while 生产者视角 is on): marketing plans by the formats Vibes took
apart from viral posts → the creator picks one and says how they want to tell it → the copy is written and checked, and
opens as a draft (create.draft.vue). Tried first in the Vibes workspace prototype (prototypes/creator-workbench). -->
<template>
<div :class="$style.root">
	<MkPageHeader :actions="headerActions" :canOmitTitle="false"/>
	<div :class="$style.body">
		<XFlow :step="plan == null ? 1 : 2"/>

		<section :class="$style.source">
			<p :class="$style.kicker">{{ createLabels.source }}</p>
			<div :class="$style.sourceCard">
				<MkNoteSimple v-if="note" :note="note"/>
				<p v-else-if="noteError" :class="$style.error" role="alert">{{ noteError }}</p>
				<MkLoading v-else mini/>
			</div>
			<p :class="$style.hint">{{ createLabels.sourceNote }}</p>
		</section>

		<template v-if="plan == null">
			<div v-if="plansLoading" :class="$style.wait" role="status">
				<MkLoading inline mini/>
				<span><b>{{ createLabels.plansWaiting }}</b><small>{{ createLabels.plansWaitingHint }}</small></span>
			</div>
			<div v-else-if="plansError" :class="$style.failed" role="alert">
				<p>{{ plansError }}</p>
				<MkButton rounded inline @click="loadPlans(false)"><i class="ti ti-refresh"></i> {{ createLabels.retry }}</MkButton>
			</div>
			<template v-else-if="plans">
				<header :class="$style.head">
					<h2>{{ createLabels.plansTitle }}</h2>
					<span>{{ createLabels.plansCount(plans.plans.length, oursCount) }}</span>
				</header>
				<article v-for="(p, i) in plans.plans" :key="`${plans.at}-${i}`" :class="$style.plan">
					<XPlanTop :plan="p"/>
					<ol :class="$style.beats">
						<li v-for="(b, j) in p.beats" :key="j">{{ b }}</li>
					</ol>
					<dl :class="$style.meta">
						<div><dt>{{ createLabels.why }}</dt><dd>{{ p.why }}</dd></div>
						<div><dt>{{ createLabels.fit }}</dt><dd>{{ p.fit }}</dd></div>
						<div><dt>{{ createLabels.effort }}</dt><dd>{{ p.effort }}</dd></div>
						<div v-if="hasRisk(p.risk)" :class="$style.warn"><dt>{{ createLabels.risk }}</dt><dd>{{ p.risk }}</dd></div>
					</dl>
					<footer :class="$style.planFoot">
						<span><small>{{ createLabels.titleHint }}</small>{{ p.title }}</span>
						<MkButton primary rounded inline @click="choose(i)">{{ createLabels.usePlan }} <i class="ti ti-chevron-right"></i></MkButton>
					</footer>
				</article>
				<div :class="$style.foot">
					<MkButton rounded inline small @click="loadPlans(true)"><i class="ti ti-refresh"></i> {{ createLabels.refresh }}</MkButton>
					<small>{{ createLabels.madeAt(plans.model, ago(plans.at)) }}</small>
				</div>
			</template>
		</template>

		<template v-else>
			<header ref="chosenHead" :class="$style.head">
				<h2>{{ createLabels.chosen }}</h2>
				<button class="_textButton" @click="chosen = null">{{ createLabels.change }}</button>
			</header>
			<article :class="[$style.plan, $style.chosen]">
				<XPlanTop :plan="plan"/>
				<details :class="$style.more">
					<summary>{{ createLabels.showSteps(plan.beats.length) }}</summary>
					<ol :class="$style.beats">
						<li v-for="(b, j) in plan.beats" :key="j">{{ b }}</li>
					</ol>
				</details>
			</article>

			<section :class="$style.card">
				<header :class="$style.cardHead">
					<h2>{{ createLabels.ideaTitle }}</h2>
					<span>{{ createLabels.ideaSub }}</span>
				</header>
				<div class="_gaps_m">
					<MkTextarea v-model="idea" :placeholder="createLabels.ideaPlaceholder">
						<template #label>{{ createLabels.idea }} <span :class="$style.required">{{ createLabels.required }}</span></template>
					</MkTextarea>
					<MkTextarea v-model="story" :placeholder="createLabels.storyPlaceholder">
						<template #label>{{ createLabels.story }}</template>
					</MkTextarea>
					<MkTextarea v-model="standard" :placeholder="createLabels.standardPlaceholder">
						<template #label>{{ createLabels.standard }}</template>
					</MkTextarea>
					<div>
						<p :class="$style.label">{{ createLabels.tone }}</p>
						<div :class="$style.tones" role="radiogroup" :aria-label="createLabels.tone">
							<button v-for="t in createLabels.tones" :key="t" class="_button" role="radio" :aria-checked="tone === t" :class="[$style.tone, { [$style.toneOn]: tone === t }]" @click="tone = t">{{ t }}</button>
						</div>
					</div>
					<MkButton primary rounded large full :wait="writing" :disabled="writing" @click="write">
						{{ writing ? createLabels.writing : createLabels.write }}
					</MkButton>
					<p :class="[$style.hint, $style.center]">{{ writing ? createLabels.writingHint : createLabels.writeHint }}</p>
				</div>
			</section>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import type * as Misskey from 'misskey-js';
import XFlow from './create.flow.vue';
import XPlanTop from './create.plan.vue';
import MkButton from '@/components/MkButton.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import { createLabels } from '@/lojo/create/labels.js';
import { ago, createErrorText, getPlans, loadCreateState } from '@/lojo/create/state.js';
import type { CreatePlans } from '@/lojo/create/state.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';
import type { PageHeaderItem } from '@/types/page-header.js';
import { useRouter } from '@/router.js';
import * as os from '@/os.js';

const props = defineProps<{
	noteId: string;
}>();

const router = useRouter();
const headerActions: PageHeaderItem[] = [{ icon: 'ti ti-layout-dashboard', text: createLabels.studioTitle, handler: () => router.pushByPath('/create') }];
const chosenHead = useTemplateRef('chosenHead');

const note = ref<Misskey.entities.Note | null>(null);
const noteError = ref<string | null>(null);
const plans = ref<CreatePlans | null>(null);
const plansLoading = ref(false);
const plansError = ref<string | null>(null);
const chosen = ref<number | null>(null);
const idea = ref('');
const story = ref('');
const standard = ref('');
const tone = ref<string>(createLabels.tones[0]);
const writing = ref(false);

const plan = computed(() => (chosen.value != null ? plans.value?.plans[chosen.value] ?? null : null));
const oursCount = computed(() => plans.value?.plans.filter(p => p.source === 'ours').length ?? 0);

const hasRisk = (risk: string) => risk.trim() !== '' && !/^无/.test(risk.trim());

async function loadNote() {
	note.value = null;
	noteError.value = null;
	try {
		note.value = await misskeyApi('notes/show', { noteId: props.noteId });
	} catch (err) {
		noteError.value = createErrorText(err);
	}
}

async function loadPlans(refresh: boolean) {
	plansLoading.value = true;
	plansError.value = null;
	if (refresh) chosen.value = null;
	try {
		plans.value = await getPlans(props.noteId, refresh);
	} catch (err) {
		plansError.value = createErrorText(err);
	} finally {
		plansLoading.value = false;
	}
}

async function choose(i: number) {
	chosen.value = i;
	await nextTick();
	chosenHead.value?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

async function write() {
	if (chosen.value == null || writing.value) return;
	if (idea.value.trim().length < 4) {
		os.toast(createLabels.ideaTooShort);
		return;
	}
	writing.value = true;
	try {
		const draft = await misskeyApi('lojo/create/copy', {
			noteId: props.noteId,
			planIndex: chosen.value,
			idea: idea.value,
			story: story.value,
			standard: standard.value,
			tone: tone.value,
		});
		router.pushByPath(`/create/drafts/${draft.id}`);
	} catch (err) {
		os.alert({ type: 'error', text: createErrorText(err) });
	} finally {
		writing.value = false;
	}
}

function start() {
	plans.value = null;
	chosen.value = null;
	loadNote();
	loadPlans(false);
}

onMounted(() => {
	loadCreateState();
	start();
});

watch(() => props.noteId, start);

definePage(() => ({
	title: createLabels.pageTitle,
	icon: 'ti ti-bulb',
}));
</script>

<style lang="scss" module>
.root {
	--crSerif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	--crShadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-brandInk) 6%, transparent), 0 10px 28px -12px color-mix(in srgb, var(--MI_THEME-brandInk) 28%, transparent);
	--crFaint: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);
	--crWeak: color-mix(in srgb, var(--MI_THEME-fg) 72%, transparent);
	--crHi: color-mix(in srgb, var(--MI_THEME-fg) 5%, var(--MI_THEME-panel));
	--crGoldFg: color-mix(in srgb, var(--MI_THEME-warn) 55%, var(--MI_THEME-fg));
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	box-sizing: border-box;
	max-width: 640px;
	margin: 0 auto;
	padding: 18px 16px 56px;
}

.kicker {
	margin: 0 2px 8px;
	font-size: 0.8em;
	letter-spacing: 0.12em;
	color: var(--crFaint);
}

.hint {
	margin: 8px 2px 0;
	font-size: 0.8em;
	line-height: 1.6;
	color: var(--crFaint);
}

.center {
	text-align: center;
}

.error {
	margin: 0;
	color: var(--MI_THEME-error);
}

.source {
	margin-bottom: 22px;
}

.sourceCard {
	padding: 14px 16px;
	border-radius: 18px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--crShadow);
}

.wait {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 16px;
	border-radius: 18px;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);

	> span {
		display: flex;
		flex-direction: column;
		line-height: 1.5;
	}

	small {
		font-size: 0.85em;
		color: var(--crWeak);
	}
}

.failed {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 32px 0;
	text-align: center;

	> p {
		margin: 0;
	}
}

.head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 10px;
	margin: 0 2px 12px;
	scroll-margin-top: 70px;

	> h2 {
		margin: 0;
		font: 700 1.2em/1.3 var(--crSerif);
		color: var(--MI_THEME-brandInk);
		letter-spacing: 0.03em;
	}

	> span {
		font-size: 0.8em;
		color: var(--crWeak);
	}
}

.plan {
	margin-bottom: 14px;
	padding: 16px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--crShadow);
}

.chosen {
	box-shadow: var(--crShadow), inset 0 0 0 2px var(--MI_THEME-cta);
}

.beats {
	margin: 12px 0 0;
	padding: 0;
	list-style: none;
	counter-reset: beat;

	> li {
		position: relative;
		padding: 5px 0 5px 30px;
		font-size: 0.92em;
		line-height: 1.6;
		counter-increment: beat;

		&::before {
			content: counter(beat);
			position: absolute;
			left: 0;
			top: 6px;
			width: 21px;
			height: 21px;
			border-radius: 50%;
			font-size: 0.75em;
			font-weight: 700;
			line-height: 21px;
			text-align: center;
			color: var(--MI_THEME-brandInk);
			background: var(--crHi);
		}
	}
}

.meta {
	display: grid;
	gap: 7px;
	margin: 12px 0 0;
	padding: 12px 0 0;
	border-top: 1px dashed var(--MI_THEME-divider);

	> div {
		display: grid;
		grid-template-columns: 66px 1fr;
		gap: 10px;
		font-size: 0.85em;
		line-height: 1.6;
	}

	dt {
		color: var(--crFaint);
	}

	dd {
		margin: 0;
	}
}

.warn {
	dt, dd {
		color: var(--crGoldFg);
	}
}

.planFoot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-top: 14px;
	padding-top: 12px;
	border-top: 1px solid var(--MI_THEME-divider);

	> span {
		display: flex;
		flex-direction: column;
		min-width: 0;
		font-weight: 600;
		line-height: 1.45;
		color: var(--MI_THEME-brandInk);
	}

	small {
		font-size: 0.75em;
		font-weight: 400;
		color: var(--crFaint);
	}
}

.foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	margin: 2px 2px 0;

	> small {
		font-size: 0.75em;
		color: var(--crFaint);
	}
}

.more {
	margin-top: 10px;

	> summary {
		cursor: pointer;
		font-size: 0.85em;
		font-weight: 600;
		color: var(--MI_THEME-accent);
	}
}

.card {
	margin-top: 4px;
	padding: 18px 16px;
	border-radius: 20px;
	background: var(--MI_THEME-panel);
	box-shadow: var(--crShadow);
}

.cardHead {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 10px;
	margin-bottom: 14px;

	> h2 {
		margin: 0;
		font: 700 1.15em/1.3 var(--crSerif);
		color: var(--MI_THEME-brandInk);
		letter-spacing: 0.03em;
	}

	> span {
		font-size: 0.8em;
		color: var(--crWeak);
	}
}

.required {
	margin-left: 4px;
	font-size: 0.8em;
	font-weight: 700;
	color: var(--MI_THEME-cta);
}

.label {
	margin: 0 0 8px;
	font-size: 0.85em;
	font-weight: 600;
}

.tones {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.tone {
	padding: 8px 14px;
	border-radius: 12px;
	font-size: 0.9em;
	font-weight: 600;
	background: var(--crHi);

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.toneOn {
	color: var(--MI_THEME-brandInk);
	background: var(--MI_THEME-panel);
	box-shadow: inset 0 0 0 2px var(--MI_THEME-brandInk);
}
</style>
