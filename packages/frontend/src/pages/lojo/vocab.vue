<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 5 号线 · 词汇 (/vocab/5.2): one stop's words. 词表: the words by group, each with its sound, IPA, part of speech,
Chinese and an example, with the English or the Chinese covered to test yourself. 练习: pick the words (all, the missed
ones, a group; shuffled or not), then 看义拼写, 听音拼写 or 打字, one word at a time, and a summary at the end. 错词: the
words got wrong, to practise again or put in the wordbook. The stop's gate is /gate/ielts/5.2. Ported from the demo
(prototypes/vocab-line), without its own route map and gate. Content: courses/english/ielts/vocab.js in the Vibes
workspace; what was learned and missed: the account registry (lojo/vocab/progress.ts). -->
<template>
<div ref="rootEl" :class="$style.root" :style="{ '--vl-c': content.color }" data-vocab>
	<MkPageHeader :canOmitTitle="false"/>
	<div ref="bodyEl" :class="$style.body">
		<div v-if="stop == null" :class="$style.notice" role="alert">
			<p>{{ L.notFound(props.stop) }}</p>
			<MkA to="/map/ielts" class="_link">{{ L.toMap }}</MkA>
		</div>

		<template v-else-if="round">
			<XType
				v-if="round.mode === 'typing'"
				:key="round.id"
				:stop="stop"
				:round="round"
				:sfx="vocabPrefs.sfx"
				:speech="speech"
				@finish="onFinish"
				@exit="onExit"
				@toggleSfx="toggleSfx"
			/>
			<XSpell
				v-else
				:key="round.id"
				:stop="stop"
				:round="round"
				:sfx="vocabPrefs.sfx"
				:speech="speech"
				@record="onRecord"
				@finish="onFinish"
				@exit="onExit"
				@toggleSfx="toggleSfx"
			/>
		</template>

		<XDone
			v-else-if="summary"
			ref="doneEl"
			:stop="stop"
			:round="summary.round"
			:end="summary.end"
			:speech="speech"
			@again="startAgain"
			@words="backToStop('words')"
		/>

		<template v-else>
			<XHead
				ref="headEl"
				:stop="stop"
				:line="content.line"
				:learned="learnedCount"
				:missed="missedWords.length"
				:loadFailed="progressLoad === 'failed'"
				:saveFailed="saveFailed"
			/>
			<section :class="$style.gate" :aria-labelledby="`${uid}-gate`">
				<div :class="$style.gateText">
					<b :id="`${uid}-gate`">{{ L.gateHead }}</b>
					<span>{{ L.gateRule(content.gate) }}</span>
				</div>
				<MkA :to="gatePath(stop.id)" :class="$style.gateGo" data-gate>{{ L.toGate }} <i class="ti ti-arrow-right" aria-hidden="true"></i></MkA>
			</section>

			<div ref="tabsEl" role="tablist" :aria-label="L.tabsLabel" :class="$style.tabs">
				<button
					v-for="t in tabs"
					:id="`${uid}-tab-${t.key}`"
					:key="t.key"
					type="button"
					role="tab"
					class="_button"
					:class="$style.tab"
					:aria-selected="tab === t.key"
					:aria-controls="`${uid}-panel`"
					:tabindex="tab === t.key ? 0 : -1"
					:data-tab="t.key"
					@click="tab = t.key"
					@keydown="onTabKey"
				>
					<i :class="t.icon" aria-hidden="true"></i>{{ t.label }}<small v-if="t.count != null">{{ t.count }}</small>
				</button>
			</div>
			<div :id="`${uid}-panel`" role="tabpanel" :aria-labelledby="`${uid}-tab-${tab}`" :class="$style.panel">
				<XWords v-if="tab === 'words'" :stop="stop" :learned="learned" :missed="missed" :speech="speech" @practiseGroup="practiseGroup"/>
				<XPick v-else-if="tab === 'practice'" v-model:scope="scope" :stop="stop" :missed="missed" :speech="speech" @start="startPicked"/>
				<XMissed v-else :words="missedWords" :speech="speech" @practise="practiseMissed"/>
			</div>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, ref, shallowRef, useId, useTemplateRef, watch } from 'vue';
import XHead from './vocab.head.vue';
import XWords from './vocab.words.vue';
import XPick from './vocab.pick.vue';
import XMissed from './vocab.missed.vue';
import XSpell from './vocab.spell.vue';
import XType from './vocab.type.vue';
import XDone from './vocab.done.vue';
import type { VocabWord } from '@/lojo/vocab/content.js';
import type { PracticeMode } from '@/lojo/vocab/prefs.js';
import type { Round, RoundEnd, SpellResult } from '@/lojo/vocab/round.js';
import { findStop, gatePath, vocabContent } from '@/lojo/vocab/content.js';
import { learnedOf, missedOf } from '@/lojo/vocab/record.js';
import { flushVocabProgress, progressLoad, recordWord, saveFailed, syncVocabProgress, vocabProgress } from '@/lojo/vocab/progress.js';
import { saveLastRun, setPref, vocabPrefs } from '@/lojo/vocab/prefs.js';
import { doneCount, groupOf, scopeWords, shuffled } from '@/lojo/vocab/round.js';
import { stopWordAudio, unlockWordAudio } from '@/lojo/vocab/audio.js';
import { vocabLabels as L } from '@/lojo/vocab/labels.js';
import { typingAccuracy, wordsPerMinute } from '@/lojo/vocab/spell.js';
import { blip, unlockSfx } from '@/lojo/dictation/sfx.js';
import { englishStatus, loadEnglishStatus } from '@/lojo/english/api.js';
import { useOnScreen } from '@/lojo/typing/screen.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import { queryParam, questFrom, reportQuestSet } from '@/lojo/quest-refill.js';
import { useRouter } from '@/router.js';

const props = defineProps<{
	stop: string;
}>();

type Tab = 'words' | 'practice' | 'missed';

const router = useRouter();
const content = vocabContent;
const uid = `vocab-${useId()}`;
const bodyEl = useTemplateRef('bodyEl');
const tabsEl = useTemplateRef('tabsEl');
const headEl = useTemplateRef('headEl');
const doneEl = useTemplateRef('doneEl');

const stop = computed(() => findStop(props.stop));
const tab = ref<Tab>('words');
// what the practice tab has picked: 'all', 'missed' or a group ('g2')
const scope = ref('all');
const round = shallowRef<Round | null>(null);
const summary = shallowRef<{ round: Round; end: RoundEnd } | null>(null);
let roundSeq = 0;

const speech = computed(() => englishStatus.value.speech);
const learned = computed(() => (stop.value ? learnedOf(vocabProgress.value, stop.value.id) : new Set<string>()));
const missed = computed(() => (stop.value ? missedOf(vocabProgress.value, stop.value.id) : new Set<string>()));
// counted against the words the stop has now (the record keeps words the course file may have dropped)
const learnedCount = computed(() => stop.value?.words.filter(w => learned.value.has(w.w)).length ?? 0);
const missedWords = computed(() => stop.value?.words.filter(w => missed.value.has(w.w)) ?? []);

// 错词 shows once there are missed words (and stays while it is open)
const tabs = computed(() => {
	const list: { key: Tab; label: string; icon: string; count: number | null }[] = [
		{ key: 'words', label: L.tabWords, icon: 'ti ti-list', count: stop.value?.words.length ?? 0 },
		{ key: 'practice', label: L.tabPractice, icon: 'ti ti-keyboard', count: null },
	];
	if (missedWords.value.length > 0 || tab.value === 'missed') list.push({ key: 'missed', label: L.tabMissed, icon: 'ti ti-alert-circle', count: missedWords.value.length });
	return list;
});

function toTop() {
	bodyEl.value?.scrollIntoView({ block: 'start' });
}

// Arrow keys, Home and End move between the tabs.
function onTabKey(ev: KeyboardEvent) {
	const keys = tabs.value.map(t => t.key);
	const at = keys.indexOf(tab.value);
	let next: number | null = null;
	if (ev.key === 'ArrowRight') next = (at + 1) % keys.length;
	else if (ev.key === 'ArrowLeft') next = (at - 1 + keys.length) % keys.length;
	else if (ev.key === 'Home') next = 0;
	else if (ev.key === 'End') next = keys.length - 1;
	if (next == null) return;
	ev.preventDefault();
	tab.value = keys[next];
	void nextTick(() => tabsEl.value?.querySelector<HTMLElement>(`[data-tab="${keys[next]}"]`)?.focus());
}

// Started by a tap or a key: that also lets the words and the blips play later (iOS).
function start(mode: PracticeMode, words: VocabWord[], label: string, shuffle: boolean) {
	if (words.length === 0) {
		os.toast(L.noWords);
		return;
	}
	unlockWordAudio();
	unlockSfx();
	summary.value = null;
	round.value = { id: ++roundSeq, mode, words: shuffle ? shuffled(words) : words.slice(), label };
	toTop();
}

function startPicked(mode: PracticeMode) {
	const s = stop.value;
	if (s == null) return;
	const picked = scopeWords(s, scope.value, missed.value);
	const g = groupOf(picked.scope);
	const label = picked.scope === 'missed' ? L.roundMissed(picked.words.length)
		: g != null ? L.roundGroup(s.groups[g].label, picked.words.length)
		: L.roundAll(picked.words.length);
	start(mode, picked.words, label, vocabPrefs.value.shuffle);
}

function practiseGroup(g: number) {
	scope.value = `g${g}`;
	tab.value = 'practice';
	void nextTick(() => {
		tabsEl.value?.scrollIntoView({ block: 'start' });
		tabsEl.value?.querySelector<HTMLElement>('[data-tab="practice"]')?.focus({ preventScroll: true });
	});
}

function practiseMissed(mode: PracticeMode) {
	start(mode, missedWords.value, L.roundMissed(missedWords.value.length), false);
}

// From a summary: the words it got wrong, or the same words in another mode.
function startAgain(mode: PracticeMode, onlyWrong: VocabWord[] | null) {
	const last = summary.value?.round;
	if (last == null) return;
	if (onlyWrong != null) start(mode, onlyWrong, L.roundAgain(onlyWrong.length), false);
	else start(mode, last.words, last.label, vocabPrefs.value.shuffle);
}

// A word answered in 看义拼写 or 听音拼写: right the first time is learned, anything else is missed.
function onRecord(r: SpellResult) {
	const s = stop.value;
	if (s != null) recordWord(s.id, r.word.w, r.first);
}

async function onFinish(end: RoundEnd) {
	const r = round.value;
	const s = stop.value;
	if (r == null || s == null) return;
	stopWordAudio();
	if (end.kind === 'spell') {
		const right = end.results.filter(x => x.first).length;
		saveLastRun(s.id, r.mode, { right, total: end.results.length, at: Date.now() });
		if (vocabPrefs.value.sfx && !end.early && right === end.results.length) blip('ok');
	} else {
		saveLastRun(s.id, r.mode, { acc: typingAccuracy(end.keys, end.errs), wpm: wordsPerMinute(end.done, end.typedMs), at: Date.now() });
	}
	void flushVocabProgress().catch(() => { /* said on the stop; the next write takes them along */ });
	// 闯关 · 装备补心: a left-early round counts too; the server wants 10 words and 2 minutes.
	const now = Date.now();
	reportQuestSet('vocab', `${s.id}:${scope.value}:${r.mode}`, doneCount(end), now - end.ms, now, questFrom(router.getCurrentFullPath()) != null);
	round.value = null;
	summary.value = { round: r, end };
	toTop();
	await nextTick();
	doneEl.value?.focusHeading();
}

// Left before a word was done: back to the practice tab.
async function onExit() {
	stopWordAudio();
	round.value = null;
	await backToStop('practice');
}

async function backToStop(next: Tab) {
	summary.value = null;
	round.value = null;
	tab.value = next;
	toTop();
	await nextTick();
	headEl.value?.focusHeading();
}

function toggleSfx() {
	setPref('sfx', !vocabPrefs.value.sfx);
	if (vocabPrefs.value.sfx) {
		unlockSfx();
		blip('ok');
	}
}

// Another stop in the same page (the router may keep the page and change its prop): from its word list.
watch(() => props.stop, () => {
	stopWordAudio();
	round.value = null;
	summary.value = null;
	tab.value = 'words';
	scope.value = 'all';
	askedPath = null;
	openAsked();
});

// ?tab=practice&scope=all (闯关 sends learners here): open on that tab with that pick. Once per address; not in the
// middle of a round.
let askedPath: string | null = null;

function openAsked() {
	const path = router.getCurrentFullPath();
	if (path === askedPath || round.value != null) return;
	askedPath = path;
	const t = queryParam(path, 'tab');
	const sc = queryParam(path, 'scope');
	if (t !== 'words' && t !== 'practice' && t !== 'missed' && sc == null) return;
	summary.value = null;
	if (t === 'words' || t === 'practice' || (t === 'missed' && missedWords.value.length > 0)) tab.value = t;
	if (sc != null && (sc === 'all' || sc === 'missed' || /^g\d+$/.test(sc))) scope.value = sc;
}

openAsked();

// The tab of missed words goes once they are all put right and another tab is opened.
watch(missedWords, words => {
	if (words.length === 0 && scope.value === 'missed') scope.value = 'all';
});

void syncVocabProgress();
void loadEnglishStatus();

// Back on the page: what another device did meanwhile. Out of sight (another page, or the app hidden): nothing plays
// on, and answers not written yet are written now.
let opened = false;
onActivated(() => {
	if (opened) {
		void syncVocabProgress();
		openAsked();
	}
	opened = true;
});

useOnScreen({
	hide() {
		stopWordAudio();
		void flushVocabProgress().catch(() => { /* the next write takes them along */ });
	},
});

onBeforeUnmount(() => {
	stopWordAudio();
});

definePage(() => ({
	title: stop.value ? L.pageTitle(stop.value.id, stop.value.topic) : L.lineName(content.line),
	icon: 'ti ti-vocabulary',
}));
</script>

<style lang="scss" module>
.root {
	// the line's colour (#6E4F8F), set from the course file; text in it is mixed with the theme's so it reads on dark too
	--vl-c: #6E4F8F;
	--vl-cFg: color-mix(in srgb, var(--vl-c) 72%, var(--MI_THEME-fg));
	--vl-cBg: color-mix(in srgb, var(--vl-c) 10%, var(--MI_THEME-panel));
	--vl-cSoft: color-mix(in srgb, var(--vl-c) 30%, var(--MI_THEME-divider));
	--vl-onC: var(--MI_THEME-fgOnAccent);
	--vl-ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--vl-okBg: color-mix(in srgb, #2F7D5B 15%, var(--MI_THEME-panel));
	--vl-bad: var(--MI_THEME-error);
	--vl-badBg: color-mix(in srgb, var(--MI_THEME-error) 12%, var(--MI_THEME-panel));
	--vl-mustard: #F2C14E;
	--vl-gold: color-mix(in srgb, #B8871B 72%, var(--MI_THEME-fg));
	--vl-goldBg: color-mix(in srgb, #F2C14E 22%, var(--MI_THEME-panel));
	--vl-ink: var(--MI_THEME-fgHighlighted);
	--vl-hi: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
	--vl-weak: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	--vl-faint: color-mix(in srgb, var(--MI_THEME-fg) 24%, transparent);
	--vl-line: var(--MI_THEME-divider);
	--vl-shadow: 0 1px 2px color-mix(in srgb, var(--MI_THEME-fgHighlighted) 6%, transparent), 0 10px 28px -10px color-mix(in srgb, var(--MI_THEME-fgHighlighted) 25%, transparent);
	--vl-serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	--vl-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Roboto Mono", monospace;
	--vl-ipa: "Charis SIL", "Doulos SIL", "Gentium Plus", "Lucida Grande", "Segoe UI", "Noto Sans", sans-serif;
	--vl-pos: Georgia, "Times New Roman", serif;
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	container: vocab / inline-size;
	box-sizing: border-box;
	max-width: 760px;
	margin: 0 auto;
	padding: 12px 16px 48px;
}

.notice {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	margin: 40px 0;
	text-align: center;

	> p {
		margin: 0;
	}
}

.gate {
	display: flex;
	align-items: center;
	gap: 12px;
	margin: 14px 0 0;
	padding: 12px 12px 12px 14px;
	border-radius: 16px;
	background: var(--vl-cBg);
	box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--vl-c) 32%, transparent);
}

.gateText {
	flex: 1;
	min-width: 0;
	font-size: 13px;
	line-height: 1.6;

	> b {
		display: block;
		font-family: var(--vl-serif);
		font-size: 15.5px;
		color: var(--vl-ink);
	}
}

.gateGo {
	flex: none;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 44px;
	padding: 0 18px;
	border-radius: 14px;
	background: var(--MI_THEME-cta);
	color: var(--MI_THEME-fgOnAccent);
	font-weight: 700;
	font-size: 15px;
	letter-spacing: 0.04em;
	text-decoration: none;
	white-space: nowrap;
	transition: background 0.15s;

	&:hover {
		background: hsl(from var(--MI_THEME-cta) h s calc(l + 5));
		text-decoration: none;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.tabs {
	display: flex;
	gap: 2px;
	margin: 16px 0 14px;
	border-bottom: 1px solid var(--vl-line);
	overflow-x: auto;
	scrollbar-width: none;
}

.tab {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 12px 12px 10px;
	font-size: 15px;
	color: var(--vl-weak);
	border-bottom: 2.5px solid transparent;
	margin-bottom: -1px;
	white-space: nowrap;

	> small {
		font-size: 12px;
		font-weight: 600;
		color: var(--vl-weak);
		background: var(--vl-hi);
		border-radius: 6px;
		padding: 0 6px;
	}

	&[aria-selected="true"] {
		color: var(--vl-cFg);
		border-color: var(--vl-c);
		font-weight: 700;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: -3px;
	}
}

.panel {
	outline: none;
}

@container vocab (max-width: 420px) {
	.gate {
		flex-direction: column;
		align-items: stretch;
	}

	.gateGo {
		justify-content: center;
	}
}

@media (min-width: 720px) {
	.body {
		padding: 18px 24px 56px;
	}
}
</style>
