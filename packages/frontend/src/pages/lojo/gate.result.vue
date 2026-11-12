<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- After handing in: the score (or, for a placement test, the station to start at), what to do next, where to practise
what went wrong, the answers and the transcript. A vocabulary paper also lists the words missed, for the 生词本. -->
<template>
<div :class="$style.root">
	<section v-if="placedAt" :class="[$style.score, $style.pass]" aria-live="polite">
		<i :class="['ti ti-map-pin-filled', $style.scoreIcon]" aria-hidden="true"></i>
		<p :class="$style.verdict">{{ gateLabels.placedTitle }}</p>
		<b :class="$style.big">{{ stationTitle(placedAt) }}</b>
		<p :class="$style.sub">{{ gateLabels.placedAt }}{{ result.unlocked.length > 0 ? `${gateLang === 'zh' ? '' : ' '}${gateLabels.placedLit(result.unlocked.length)}` : '' }}</p>
		<p :class="$style.meta">
			{{ gateLabels.placedTotal(result.placement!.score, result.placement!.total) }} · {{ gateLabels.timeUsed(gateLabels.duration(durationMs)) }}
		</p>
		<p :class="$style.level">{{ gateLabels.placedNote }}</p>
	</section>
	<section v-else :class="[$style.score, result.passed ? $style.pass : $style.fail]" aria-live="polite">
		<i :class="[result.passed ? 'ti ti-circle-check-filled' : 'ti ti-target-arrow', $style.scoreIcon]" aria-hidden="true"></i>
		<b :class="$style.big" :aria-label="gateLabels.scoreLabel(result.score, result.total)">{{ gateLabels.score(result.score, result.total) }}</b>
		<p :class="$style.verdict">{{ result.passed ? gateLabels.passed : gateLabels.missing(result.missing) }}</p>
		<p v-if="result.passed && result.unlocked.length > 0" :class="$style.sub">{{ gateLabels.unlocked(result.unlocked.length) }}</p>
		<p :class="$style.meta">
			{{ title }} · {{ gateLabels.setName(result.set) }} · {{ gateLabels.passLine(result.pass) }} · {{ gateLabels.timeUsed(gateLabels.duration(result.durationMs)) }}
		</p>
		<p :class="$style.level">{{ gateLabels.practiceLevel }}</p>
	</section>

	<div :class="$style.actions">
		<template v-if="placedAt">
			<MkButton primary rounded large @click="emit('go', placedAt)">
				<i class="ti ti-arrow-right" aria-hidden="true"></i> {{ gateLabels.goPlaced(stationTitle(placedAt)) }}
			</MkButton>
		</template>
		<template v-else>
			<MkButton v-if="result.passed && result.next" primary rounded large @click="emit('go', result.next)">
				<i class="ti ti-arrow-right" aria-hidden="true"></i> {{ gateLabels.next(stationTitle(result.next)) }}
			</MkButton>
			<MkButton :primary="!result.passed" rounded large @click="emit('again')">
				<i class="ti ti-refresh" aria-hidden="true"></i> {{ plain != null && sets === 1 ? gateLabels.againSame : gateLabels.again }}
			</MkButton>
			<!-- a vocabulary or grammar stop: back to its words, or its lesson -->
			<MkButton v-if="stopPath" type="routerLink" :to="stopPath" rounded large>
				<i :class="plain === 'vocab' ? 'ti ti-vocabulary' : 'ti ti-book-2'" aria-hidden="true"></i> {{ plain === 'vocab' ? gateLabels.backToWords : gateLabels.seeLesson }}
			</MkButton>
		</template>
		<MkButton rounded large @click="emit('back')">
			<i class="ti ti-map-2" aria-hidden="true"></i> {{ gateLabels.backToMap }}
		</MkButton>
	</div>

	<section v-if="!placedAt && !result.passed && result.failStreak >= 3" :class="$style.streak">
		<p>{{ gateLabels.streak(result.failStreak, previous != null) }}</p>
		<MkButton v-if="previous" rounded small @click="emit('go', previous.id)">
			<i class="ti ti-arrow-left" aria-hidden="true"></i> {{ gateLabels.previous(stationTitle(previous.id)) }}
		</MkButton>
	</section>

	<section v-if="anyWrong && (cards.length > 0 || result.tutor)" :class="$style.practice">
		<h2 :class="$style.h2">{{ gateLabels.practiceTitle }}</h2>
		<div v-for="card in cards" :key="`${card.tag}|${card.skill}`" :class="$style.card">
			<b :class="$style.cardHead">{{ cardName(card) }} <small>{{ gateLabels.wrongCount(card.count) }}</small></b>
			<div :class="$style.links">
				<MkA v-if="card.guide && guides[card.guide]" :to="`/guides/${card.guide}`" :class="$style.link">
					<i class="ti ti-book"></i> {{ gateLabels.guide }} · {{ guides[card.guide] }}
				</MkA>
				<!-- a mini app moved out to /apps/<id>/ (2026-11-12) is a whole page, not a route here -->
				<a v-if="card.app && appPath(card).startsWith('/apps/')" :href="appPath(card)" :class="$style.link">
					<i class="ti ti-apps"></i> {{ gateLabels.app }} · {{ card.app[gateLang] }}
				</a>
				<MkA v-else-if="card.app" :to="appPath(card)" :class="$style.link">
					<i class="ti ti-apps"></i> {{ gateLabels.app }} · {{ card.app[gateLang] }}
				</MkA>
				<MkA v-for="topic in card.topics" :key="topic" :to="`/tags/${encodeURIComponent(topic)}`" :class="$style.link">
					<i class="ti ti-hash"></i> {{ topic }}
				</MkA>
			</div>
		</div>
		<MkA v-if="result.tutor" :to="`/chat/user/${result.tutor.id}`" :class="[$style.card, $style.tutor]">
			<i class="ti ti-message-circle-2" aria-hidden="true"></i>
			<span>
				<b>{{ gateLabels.askTutor(result.tutor.name ?? result.tutor.username) }}</b>
				<small>{{ gateLabels.tutorHint }}</small>
			</span>
		</MkA>
	</section>

	<!-- vocabulary: the words missed, one by one or all at once into the 生词本 -->
	<section v-if="missed.length > 0" :class="$style.words" :aria-labelledby="wordsId">
		<h2 :id="wordsId" :class="$style.h2">{{ gateLabels.missedWords }}</h2>
		<ul :class="$style.wordList">
			<li v-for="w in missedItems" :key="w.missed.text" :class="$style.word">
				<div :class="$style.wordText">
					<span>
						<b lang="en">{{ w.item.text }}</b>
						<span v-if="w.word?.ipa" :class="$style.ipa" lang="en">{{ w.word.ipa }}</span>
					</span>
					<span :class="$style.meaning">{{ [w.word?.pos, w.item.meaning].filter(x => x).join(' ') }}</span>
				</div>
				<MkButton
					rounded
					small
					:disabled="isSaved(w.item.text) || adding.includes(w.missed.text)"
					:wait="adding.includes(w.missed.text)"
					:aria-label="isSaved(w.item.text) ? `${w.item.text} · ${gateLabels.saved}` : `${w.item.text} · ${gateLabels.addWord}`"
					@click="addOne(w.missed)"
				>
					<i :class="isSaved(w.item.text) ? 'ti ti-check' : 'ti ti-bookmark-plus'"></i> {{ isSaved(w.item.text) ? gateLabels.saved : gateLabels.addWord }}
				</MkButton>
			</li>
		</ul>
		<div :class="$style.wordsFoot">
			<MkButton rounded :disabled="allSaved || addingAll" :wait="addingAll" @click="addAll">
				<i :class="allSaved ? 'ti ti-check' : 'ti ti-bookmarks'"></i> {{ allSaved ? gateLabels.allSaved : gateLabels.addAll }}
			</MkButton>
			<a href="/apps/wordbook/" :class="$style.link"><i class="ti ti-notebook"></i> {{ gateLabels.openWordbook }}</a>
		</div>
	</section>

	<template v-if="earlier">
		<XReview :result="earlier.result" :attempt="earlier.attempt" :title="gateLabels.partFirst"/>
		<XReview :result="result" :attempt="attempt" :title="gateLabels.partSecond"/>
	</template>
	<XReview v-else :result="result" :attempt="attempt"/>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, useId, watch } from 'vue';
import XReview from './gate.review.vue';
import MkButton from '@/components/MkButton.vue';
import { guideTitle } from '@/lojo/gates/api.js';
import { gateLabels, gateLang } from '@/lojo/gates/labels.js';
import { bandText, plainKind, practicePath, recommendCards, stationBand, stopPage, weakBySkill } from '@/lojo/gates/player.js';
import type { GateAttempt, GatePack, GateResult, PackStation, RecommendCard } from '@/lojo/gates/player.js';
import { findVocabWord, loadVocab, missedVocab, vocabWordbookItem } from '@/lojo/gates/vocab.js';
import type { MissedWord, VocabPack } from '@/lojo/gates/vocab.js';
import { DICTATION_PATH, carryFromResult, carryPath, saveCarry } from '@/lojo/dictation/carry.js';
import { addWord, isSaved, loadWordbook } from '@/lojo/english/wordbook.js';
import * as os from '@/os.js';

const props = defineProps<{
	result: GateResult;
	attempt: GateAttempt;
	pack: GatePack;
	// e.g. "听力 · 5.0"
	title: string;
	lineName: string;
	previous: PackStation | null;
	// a placement test's first part, reviewed above its second
	earlier?: { result: GateResult; attempt: GateAttempt } | null;
	// how many sets the station has (from the map's progress), when known
	sets?: number | null;
}>();

const emit = defineEmits<{
	(ev: 'again'): void;
	(ev: 'back'): void;
	(ev: 'go', station: string): void;
}>();

// A placement test's second part says where the learner starts.
const placedAt = computed(() => props.result.placement?.placedAt ?? null);
const durationMs = computed(() => props.result.durationMs + (props.earlier?.result.durationMs ?? 0));

// What went wrong in both parts of a placement test, or in this gate, by the skill of each question.
const weak = computed(() => weakBySkill([...(props.earlier ? [props.earlier] : []), { result: props.result, attempt: props.attempt }]));
const cards = computed(() => recommendCards(weak.value, props.pack.PRACTICE));
// All right: nothing to practise, and nothing to take to the tutor.
const anyWrong = computed(() => [...(props.earlier?.result.items ?? []), ...props.result.items].some(i => !i.correct));
const tagName = (tag: string) => props.pack.TAGS[tag]?.[gateLang] ?? tag;
// a tag with a card for each skill says which is which
const cardName = (card: RecommendCard) => cards.value.filter(c => c.tag === card.tag).length > 1
	? `${tagName(card.tag)} · ${card.skill === 'reading' ? gateLabels.readingPart : gateLabels.listeningPart}`
	: tagName(card.tag);

// "听力 · 4.5": stations on the same line are named by their band.
function stationTitle(id: string): string {
	const band = stationBand(props.pack, id);
	return band == null ? id : gateLabels.stationTitle(props.lineName, bandText(band));
}

// 听写 practises exactly the gaps missed here: they go along in this tab's sessionStorage, under this attempt.
const dictation = computed(() => carryFromResult(
	[...(props.earlier ? [props.earlier] : []), { result: props.result, attempt: props.attempt }],
	props.result.placement ? props.title : `${props.lineName} ${bandText(props.result.band)}`,
	// after a placement test there is no one gate to try again
	props.result.placement ? null : props.result.station,
));
watch(dictation, carry => {
	if (carry) saveCarry(carry);
}, { immediate: true });
// "/vocab/{station}" is this stop's words
const appPath = (card: RecommendCard) => {
	const path = practicePath(card.app?.path ?? '', props.result.station);
	const carry = dictation.value;
	return path === DICTATION_PATH && carry?.gaps.some(g => g.tags.includes(card.tag)) ? carryPath(carry.attemptId, card.tag) : path;
};

// A vocabulary or grammar paper, and its stop's own page (the words, or the lesson).
const plain = computed(() => plainKind(props.attempt.groups));
const stopPath = computed(() => stopPage(plain.value, props.result.station));

// Vocabulary: the words missed, with what the word lists (vocab.js) say about each, for the 生词本.
const wordsId = useId();
const missed = computed(() => (plain.value === 'vocab' ? missedVocab(props.result, props.attempt) : []));
const vocab = shallowRef<VocabPack | null>(null);
let vocabLoaded: Promise<VocabPack | null> | null = null;
const itemOf = (m: MissedWord, lists: VocabPack | null) => {
	const word = findVocabWord(lists, props.result.station, m.text);
	return { missed: m, word, item: vocabWordbookItem(m, word, gateLabels.altSpelling) };
};
const missedItems = computed(() => missed.value.map(m => itemOf(m, vocab.value)));
const adding = ref<string[]>([]);
const addingAll = ref(false);
const allSaved = computed(() => missedItems.value.every(w => isSaved(w.item.text)));

watch(missed, list => {
	if (list.length === 0) return;
	// what is in the wordbook already shows as saved
	void loadWordbook();
	vocabLoaded ??= loadVocab(props.result.course).then(lists => {
		vocab.value = lists;
		return lists;
	});
}, { immediate: true });

// true when the word went in (false when it was there already); throws when it couldn't be saved
async function add(m: MissedWord): Promise<boolean> {
	if (adding.value.includes(m.text)) return false;
	adding.value = [...adding.value, m.text];
	try {
		// a tap before the word lists have loaded still saves the meaning, phonetics and example
		const lists = await (vocabLoaded ?? Promise.resolve(vocab.value));
		return await addWord(itemOf(m, lists).item, 'vocab');
	} finally {
		adding.value = adding.value.filter(t => t !== m.text);
	}
}

function addOne(m: MissedWord) {
	add(m).catch(() => os.toast(gateLabels.addFailed));
}

async function addAll() {
	if (addingAll.value) return;
	addingAll.value = true;
	let added = 0;
	let failed = false;
	try {
		for (const w of missedItems.value) {
			if (isSaved(w.item.text)) continue;
			try {
				if (await add(w.missed)) added++;
			} catch {
				failed = true;
			}
		}
	} finally {
		addingAll.value = false;
	}
	if (failed) os.toast(gateLabels.addFailed);
	else if (added > 0) os.toast(gateLabels.addedAll(added));
}

// Guide cards show only once the guide's title has loaded; a guide that is gone is left out.
const guides = ref<Record<string, string>>({});
watch(cards, list => {
	for (const card of list) {
		if (card.guide == null || card.guide in guides.value) continue;
		const id = card.guide;
		guideTitle(id).then(t => { guides.value = { ...guides.value, [id]: t }; }, () => { /* left out */ });
	}
}, { immediate: true });
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.score {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	padding: 24px 16px 18px;
	border-radius: var(--MI-radius);
	text-align: center;
	background: var(--MI_THEME-panel);

	&.pass {
		background: color-mix(in srgb, var(--MI_THEME-success) 14%, var(--MI_THEME-panel));
	}
}

.scoreIcon {
	font-size: 34px;

	.pass & {
		color: var(--MI_THEME-success);
	}

	.fail & {
		color: var(--MI_THEME-accent);
	}
}

.big {
	font-size: 2.6em;
	font-variant-numeric: tabular-nums;
	line-height: 1.1;
}

.verdict {
	margin: 0;
	font-size: 1.2em;
	font-weight: bold;
}

.sub {
	margin: 0;
}

.meta {
	margin: 6px 0 0;
	font-size: 0.85em;
	opacity: 0.8;
}

.level {
	margin: 0;
	font-size: 0.75em;
	opacity: 0.6;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;
}

.streak {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 8px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	border: 1px solid var(--MI_THEME-warn);

	p {
		margin: 0;
	}
}

.h2 {
	margin: 0 0 4px;
	font-size: 1em;
}

.practice {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.card {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}

.cardHead small {
	margin-left: 6px;
	font-weight: normal;
	opacity: 0.7;
}

.links {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.link {
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.9em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);

	&:hover {
		text-decoration: none;
	}
}

.tutor {
	flex-direction: row;
	align-items: center;
	gap: 12px;
	color: inherit;

	&:hover {
		text-decoration: none;
	}

	> i {
		font-size: 24px;
		color: var(--MI_THEME-accent);
	}

	span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	small {
		opacity: 0.75;
	}
}

.words {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.wordList {
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.word {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px 12px;
	padding: 10px 12px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
}

.wordText {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
	overflow-wrap: anywhere;

	b {
		font-size: 1.05em;
	}
}

.ipa {
	margin-left: 8px;
	font-size: 0.85em;
	opacity: 0.7;
}

.meaning {
	font-size: 0.9em;
	opacity: 0.85;
}

.wordsFoot {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 14px;
}
</style>
