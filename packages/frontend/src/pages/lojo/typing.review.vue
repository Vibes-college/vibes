<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: a try looked at again, item by item. Copied items with the wrong places in red; covered words with what was
typed against the right spelling; each gap with the sentence of the recording it was in; the mock's misspelt words,
signs and capitals, words left out and added. -->
<template>
<section :class="$style.card" :aria-labelledby="`${uid}-h`">
	<template v-if="result.kind === 'copy' && stop.kind === 'copy'">
		<h2 :id="`${uid}-h`" :class="$style.h">{{ stop.need != null ? L.reviewCopy : L.reviewSentences }}</h2>
		<ol :class="$style.list">
			<li v-for="(it, j) in stop.items" :key="j" :class="ok(result.typed[j] === it.target)">
				<span :class="$style.m" aria-hidden="true">{{ result.typed[j] === it.target ? '✓' : '✗' }}</span>
				<div :class="$style.b">
					<span :class="$style.sr">{{ result.typed[j] === it.target ? L.srRight : L.srWrong }}</span>
					<span :class="$style.mono" lang="en"><template v-if="it.prefix">{{ it.prefix }} </template><XChars :target="it.target" :typed="result.typed[j] ?? ''"/></span>
					<small v-if="stop.need != null">{{ it.kind?.[typingLang] ?? '' }}<template v-if="result.typed[j] !== it.target"> · {{ L.wrongPlace }}</template></small>
					<small v-else-if="result.typed[j] !== it.target">{{ L.wrongChars(it.target.length - okChars(it.target, result.typed[j] ?? '')) }}</small>
				</div>
			</li>
		</ol>
	</template>

	<template v-else-if="result.kind === 'spell' && stop.kind === 'spell'">
		<h2 :id="`${uid}-h`" :class="$style.h">{{ L.reviewSpell }}</h2>
		<ol :class="$style.list">
			<li v-for="(w, j) in stop.items" :key="j" :class="ok(result.right[j])">
				<span :class="$style.m" aria-hidden="true">{{ result.right[j] ? '✓' : '✗' }}</span>
				<div :class="$style.b">
					<span :class="$style.sr">{{ result.right[j] ? L.srRight : L.srWrong }}</span>
					<span :class="$style.mono" lang="en"><XChars plain :target="w.word" typed="" :hard="w.hard"/></span> <small :class="$style.inline">{{ w.zh }}<template v-if="!result.right[j]"> · {{ w.tip }}</template></small>
					<small v-if="!result.right[j]">{{ L.youTypedLine }}<XDiff :class="$style.mono" :typed="result.typed[j] ?? ''" :right="w.word" anyCase/></small>
				</div>
			</li>
		</ol>
	</template>

	<template v-else-if="result.kind === 'listen' && stop.kind === 'listen'">
		<h2 :id="`${uid}-h`" :class="$style.h">{{ L.reviewListen }}</h2>
		<p v-if="result.captions" :class="$style.note">{{ L.captionsUsed }}</p>
		<ol :class="$style.list">
			<li v-for="(r, j) in stop.rows" :key="j" :class="ok(result.right[j])">
				<span :class="$style.m" aria-hidden="true">{{ result.right[j] ? '✓' : '✗' }}</span>
				<div :class="$style.b">
					<span :class="$style.sr">{{ result.right[j] ? L.srRight : L.srWrong }}</span>
					<span :class="$style.mono" lang="en">{{ j + 1 }}. {{ r.note }} <b>{{ r.answer[0] }}</b><template v-if="r.after"> {{ r.after }}</template></span>
					<small v-if="!result.right[j]">
						{{ L.youFilled }}<span v-if="result.given[j]" :class="$style.mono" lang="en">{{ result.given[j] }}</span><template v-else>{{ L.blankGap }}</template>
						<template v-if="result.reasons[j] === 'word-limit'"> · {{ L.overLimit }}</template>
					</small>
					<span :class="$style.say">{{ L.recording }}<span lang="en">{{ said(j)[0] }}<mark>{{ said(j)[1] }}</mark>{{ said(j)[2] }}</span></span>
				</div>
			</li>
		</ol>
	</template>

	<template v-else-if="result.kind === 'mock'">
		<div :class="$style.groups">
			<div>
				<h2 :id="`${uid}-h`" :class="$style.h">{{ L.spellTitle }}</h2>
				<ol v-if="result.mock.spell.length > 0" :class="$style.list" data-misspelt>
					<li v-for="(w, j) in result.mock.spell" :key="j" :class="$style.bad">
						<span :class="$style.m" aria-hidden="true">✗</span>
						<div :class="$style.b">
							<span :class="$style.sr">{{ L.srWrong }}</span>
							<XDiff :class="$style.mono" :typed="w.typed" :right="w.right"/> → <span :class="$style.mono" lang="en">{{ w.right }}</span>
						</div>
					</li>
				</ol>
				<p v-else :class="$style.note">{{ L.noneMisspelt }}</p>
			</div>
			<div v-if="result.mock.punct.length > 0">
				<h3 :class="$style.h3">{{ L.punctTitle }}</h3>
				<div :class="$style.chips"><span v-for="(w, j) in result.mock.punct" :key="j" :class="$style.chip" lang="en">{{ w.typed }} → {{ w.right }}</span></div>
			</div>
			<div v-if="result.mock.missed.length > 0">
				<h3 :class="$style.h3">{{ L.missedTitle }}</h3>
				<div :class="$style.chips"><span v-for="(w, j) in result.mock.missed" :key="j" :class="$style.chip" lang="en">{{ w }}</span></div>
			</div>
			<div v-if="result.mock.extra.length > 0">
				<h3 :class="$style.h3">{{ L.extraTitle }}</h3>
				<div :class="$style.chips"><span v-for="(w, j) in result.mock.extra" :key="j" :class="$style.chip" lang="en">{{ w }}</span></div>
			</div>
		</div>
	</template>
</section>
</template>

<script lang="ts" setup>
import { useCssModule, useId } from 'vue';
import XChars from './typing.chars.vue';
import XDiff from './typing.diff.vue';
import type { Stop } from '@/lojo/typing/content.js';
import type { StopTry } from '@/lojo/typing/score.js';
import { okChars } from '@/lojo/typing/score.js';
import { typingLabels as L, typingLang } from '@/lojo/typing/labels.js';

const props = defineProps<{
	stop: Stop;
	result: StopTry;
}>();

const uid = `typing-review-${useId()}`;
const css = useCssModule();

const ok = (right: boolean | undefined) => (right ? css.ok : css.bad);

// A row's recording, with what to listen for highlighted: its `hl`, or the answer as it was said.
function said(j: number): [string, string, string] {
	if (props.stop.kind !== 'listen') return ['', '', ''];
	const r = props.stop.rows[j];
	for (const c of [r.hl, ...r.answer]) {
		if (c == null || c === '') continue;
		const at = r.say.toLowerCase().indexOf(c.toLowerCase());
		if (at >= 0) return [r.say.slice(0, at), r.say.slice(at, at + c.length), r.say.slice(at + c.length)];
	}
	return [r.say, '', ''];
}
</script>

<style lang="scss" module>
.card {
	background: var(--MI_THEME-panel);
	border-radius: 22px;
	box-shadow: var(--tl-shadow);
	padding: 18px 20px;
}

.h {
	font-family: var(--tl-serif);
	font-size: 17px;
	color: var(--tl-ink);
	margin: 0 0 6px;
}

.h3 {
	font-family: var(--tl-serif);
	font-size: 15.5px;
	color: var(--tl-ink);
	margin: 0 0 6px;
}

.note {
	font-size: 13px;
	color: var(--tl-weak);
	margin: 0 0 6px;
}

.list {
	list-style: none;
	margin: 0;
	padding: 0;

	> li {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 10px 2px;
		border-top: 1px solid var(--tl-line);
		font-size: 14px;
		line-height: 1.6;
	}

	small {
		display: block;
		color: var(--tl-weak);
		font-size: 12.5px;

		&.inline {
			display: inline;
		}
	}
}

.m {
	flex: none;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	color: var(--tl-onC);
	font-weight: 800;
	font-size: 12.5px;
	margin-top: 1px;

	.ok > & {
		background: var(--tl-ok);
	}

	.bad > & {
		background: var(--tl-bad);
	}
}

.b {
	flex: 1;
	min-width: 0;
}

.mono {
	font-family: var(--tl-mono);
	font-size: 15px;
	color: var(--tl-ink);
	overflow-wrap: anywhere;
}

.say {
	display: block;
	font-size: 13px;

	mark {
		background: var(--tl-goldBg);
		color: var(--tl-ink);
		font-weight: 700;
		border-radius: 3px;
		padding: 0 2px;
	}
}

.groups {
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.chip {
	font-family: var(--tl-mono);
	font-size: 14px;
	background: var(--tl-hi);
	border-radius: 8px;
	padding: 2px 8px;
	color: var(--tl-ink);
}

.sr {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
</style>
