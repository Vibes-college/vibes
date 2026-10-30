<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听写 (/dictation): listen to a line and type what goes in its gap, the way IELTS listening gap-fills are marked.
Three sets (spelling, numbers and dates, singular and plural), 10 at a time from each set's pool; 常错 words come back
until they are right twice in a row. From a gate's result (/dictation?gate=<attempt>&tag=spelling), the gaps that gate
missed. Questions: courses/english/ielts/dictation.js in the Vibes workspace; progress: the account registry. -->
<template>
<div :class="$style.root" data-dictation>
	<MkPageHeader :canOmitTitle="false"/>
	<div ref="bodyEl" :class="$style.body">
		<MkLoading v-if="phase === 'loading'" role="status"/>

		<div v-else-if="phase === 'failed'" :class="$style.notice" role="alert">
			<p>{{ dictLabels.loadFailed }}</p>
			<MkButton rounded @click="load"><i class="ti ti-refresh" aria-hidden="true"></i> {{ dictLabels.retry }}</MkButton>
		</div>

		<template v-else-if="content">
			<XEntry
				v-if="phase === 'entry'"
				ref="entryEl"
				:content="content"
				:progress="progress"
				:gate="gateCard"
				:speech="speech"
				:voice="voice"
				:progressFailed="!progressLoaded"
				@startSet="startSet"
				@startGate="startGate"
				@startOften="startOften"
				@voice="openVoiceMenu"
			/>
			<XPractice
				v-else-if="phase === 'practice' && round"
				:round="round"
				:index="index"
				:sfxOn="progress.sfx"
				:speech="speech"
				:guideSlug="content.guide"
				:guideName="guideName"
				:savedIds="savedIds"
				@answer="onAnswer"
				@next="onNext"
				@exit="exit"
				@toggleSfx="toggleSfx"
			/>
			<XEnd
				v-else-if="phase === 'end' && round"
				ref="endEl"
				:round="round"
				:fromGate="carry ? { where: carry.where, station: carry.station } : null"
				:speech="speech"
				:guideSlug="content.guide"
				:guideName="guideName"
				:wordsAdded="savedIds.length"
				@retry="retry"
				@more="more"
				@map="toMap"
				@home="exit"
			/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, shallowRef, useTemplateRef, watch } from 'vue';
import XEntry from './dictation.entry.vue';
import XPractice from './dictation.practice.vue';
import XEnd from './dictation.end.vue';
import type { DictContent, DictItem, Round, RoundKind } from '@/lojo/dictation/content.js';
import type { Carry } from '@/lojo/dictation/carry.js';
import type { Verdict } from '@/lojo/dictation/mark.js';
import MkButton from '@/components/MkButton.vue';
import { gateItems, toContent } from '@/lojo/dictation/content.js';
import { DICTATION_TAGS, countRun, loadCarry } from '@/lojo/dictation/carry.js';
import { drawRound, oftenIds, recordAnswer, seenCount, shuffle } from '@/lojo/dictation/logic.js';
import { progress, progressLoaded, reloadProgress, saveProgress } from '@/lojo/dictation/store.js';
import { dictationVoice, prefetchAudio, stopAudio, unlockAudio } from '@/lojo/dictation/audio.js';
import { blip, unlockSfx } from '@/lojo/dictation/sfx.js';
import { dictLabels, dictLang } from '@/lojo/dictation/labels.js';
import { englishStatus, loadEnglishStatus } from '@/lojo/english/api.js';
import { openVoiceMenu } from '@/lojo/english/speech.js';
import { addWord } from '@/lojo/english/wordbook.js';
import { guideTitle } from '@/lojo/gates/api.js';
import { coursePath } from '@/lojo/route/my-maps.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';

const props = defineProps<{
	// from a gate's result: its attempt, and the tag of the card that was opened
	gate?: string;
	tag?: string;
}>();

type Phase = 'loading' | 'failed' | 'entry' | 'practice' | 'end';

const router = useRouter();
const bodyEl = useTemplateRef('bodyEl');
const entryEl = useTemplateRef('entryEl');
const endEl = useTemplateRef('endEl');
const phase = ref<Phase>('loading');
const content = shallowRef<DictContent | null>(null);
const carry = shallowRef<Carry | null>(null);
const round = ref<Round | null>(null);
const index = ref(0);
// items of this round whose word went into the wordbook
const savedIds = ref<string[]>([]);
const guideName = ref<string | null>(null);
let roundSeq = 0;

const speech = computed(() => englishStatus.value.speech);
const voice = computed(() => (dictationVoice.value ? { name: dictationVoice.value.name, accent: dictationVoice.value.accent } : null));

// The gate's missed gaps of the card that was opened (all of them for an unknown tag).
const gateCard = computed(() => {
	if (carry.value == null || content.value == null) return null;
	const tag = props.tag != null && DICTATION_TAGS.includes(props.tag) ? props.tag : null;
	const items = gateItems(carry.value, tag, content.value.sets);
	if (items.length === 0) return null;
	return { where: carry.value.where, tag, items, runs: carry.value.runs };
});

function toTop() {
	bodyEl.value?.scrollIntoView({ block: 'start' });
}

// A new screen from the round: to its top, with the focus on its heading rather than lost on the page.
async function show(next: 'entry' | 'end') {
	phase.value = next;
	toTop();
	await nextTick();
	(next === 'end' ? endEl.value : entryEl.value)?.focusHeading();
}

async function load() {
	phase.value = 'loading';
	try {
		const [mod] = await Promise.all([import('@/lojo/route/courses/ielts/dictation.js'), loadEnglishStatus(), reloadProgress()]);
		content.value = toContent(mod.DICTATION);
	} catch {
		phase.value = 'failed';
		return;
	}
	carry.value = props.gate ? loadCarry(props.gate) : null;
	phase.value = 'entry';
	if (guideName.value == null) {
		guideTitle(content.value.guide).then(title => {
			guideName.value = title;
		}, () => { /* the link says 看攻略 without the title */ });
	}
}

watch(() => props.gate, gate => {
	carry.value = gate ? loadCarry(gate) : null;
});

// The next item's recording is asked for while this one is practised.
function prefetch(i: number) {
	const item = round.value?.items[i];
	if (item != null && speech.value) prefetchAudio(item.say);
}

// Started by a tap: that tap also lets the recordings and blips play later.
function begin(kind: RoundKind, items: DictItem[], setId: string | null, title: string) {
	if (items.length === 0) return;
	unlockAudio();
	unlockSfx();
	round.value = { id: ++roundSeq, kind, setId, title, items, results: [], startedAt: Date.now(), endedAt: 0, replays: 0 };
	index.value = 0;
	savedIds.value = [];
	phase.value = 'practice';
	prefetch(1);
	toTop();
}

function startSet(setId: string) {
	const c = content.value;
	const set = c?.sets.find(s => s.id === setId);
	if (c == null || set == null) return;
	const items = drawRound(set.items, id => seenCount(progress.value, id), progress.value.last[set.id] ?? [], c.perRound);
	progress.value.last[set.id] = items.map(it => it.id);
	void saveProgress();
	begin('set', items, set.id, set.name[dictLang]);
}

function startGate() {
	const card = gateCard.value;
	if (card == null) return;
	begin('gate', card.items, card.items[0].setId, dictLabels.gateRound(card.where, card.tag ?? card.items[0].setId));
}

function startOften() {
	const c = content.value;
	if (c == null) return;
	const all = c.sets.flatMap(s => s.items);
	const byId = new Map(all.map(it => [it.id, it]));
	const items = oftenIds(progress.value, all.map(it => it.id)).slice(0, c.perRound).flatMap(id => byId.get(id) ?? []);
	begin('often', shuffle(items), null, dictLabels.oftenRound);
}

// The ones missed in the round just finished, once each.
function retry() {
	const r = round.value;
	if (r == null) return;
	const items = [...new Map(r.results.filter(x => !x.verdict.correct).map(x => [x.item.id, x.item])).values()];
	begin('retry', shuffle(items), r.setId ?? items[0]?.setId ?? null, dictLabels.retryRound);
}

function more() {
	const r = round.value;
	const setId = r?.setId ?? r?.items[0]?.setId ?? content.value?.sets[0]?.id;
	if (setId != null) startSet(setId);
}

function onAnswer(answered: { verdict: Verdict; replays: number }) {
	const r = round.value;
	if (r == null || r.results.length > index.value) return;
	const item = r.items[index.value];
	r.results.push({ item, verdict: answered.verdict, replays: answered.replays });
	r.replays += answered.replays;
	// A gate's gaps are practised, not tracked: the 常错 list is the sets' own words.
	if (item.gate == null) {
		recordAnswer(progress.value, item.id, answered.verdict.correct);
		void saveProgress();
	}
	// A missed spelling word goes into the wordbook, with the sentence it was heard in.
	if (!answered.verdict.correct && item.word != null) {
		addWord(item.word, 'dictation').then(added => {
			if (added && round.value === r) savedIds.value = [...savedIds.value, item.id];
		}, () => { /* not saved; practice goes on */ });
	}
}

function onNext() {
	const r = round.value;
	if (r == null || r.results.length <= index.value) return;
	if (index.value < r.items.length - 1) {
		index.value++;
		prefetch(index.value + 1);
	} else {
		r.endedAt = Date.now();
		if (r.kind === 'gate' && carry.value != null) carry.value = { ...carry.value, runs: countRun(carry.value.attemptId) };
		void show('end');
	}
}

function exit() {
	stopAudio();
	void show('entry');
}

function toggleSfx() {
	progress.value.sfx = !progress.value.sfx;
	void saveProgress();
	if (progress.value.sfx) {
		unlockSfx();
		blip('ok');
	}
}

// Back to the map at the gate's station, to try it again.
function toMap() {
	const c = carry.value;
	if (c == null) return;
	router.pushByPath(c.station ? `${coursePath(c.course)}#${encodeURIComponent(c.station)}` : coursePath(c.course));
}

void load();

// Pages are kept alive after they are left; the end screen's recordings stop with it.
onDeactivated(() => {
	stopAudio();
});

onBeforeUnmount(() => {
	stopAudio();
});

definePage(() => ({ title: dictLabels.pageTitle, icon: 'ti ti-headphones' }));
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	max-width: 640px;
	margin: 0 auto;
	padding: 16px 16px 48px;
	box-sizing: border-box;
}

.notice {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	margin: 40px 0;
	text-align: center;
}

@media (min-width: 720px) {
	.body {
		padding: 24px 24px 56px;
	}
}
</style>
