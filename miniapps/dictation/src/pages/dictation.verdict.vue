<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 听写: what a checked answer gets. Right: ✓, and the other forms that count (a typo put right on the way is right,
with a soft note). Wrong: ✗ and why, the right answer next to what was written (letters missed and written extra
marked), the forms that count, a one-line rule and the guide. -->
<template>
<div :class="$style.root">
	<template v-if="verdict.correct">
		<p :class="[$style.verdict, $style.ok]"><span :class="$style.vmark" aria-hidden="true">✓</span>{{ dictLabels.right }}</p>
		<p v-if="verdict.fixed" :class="$style.fixed">
			<i class="ti ti-pencil" aria-hidden="true"></i>
			<span>
				<b>{{ dictLabels.fixed }}</b>
				<template v-if="verdict.fixed.got">
					· {{ dictLabels.fixedWhere(verdict.fixed.pos + 1)[0] }}<b lang="en" :class="$style.letter">{{ verdict.fixed.got }}</b>
					<template v-if="verdict.fixed.want.length > 0">{{ dictLabels.fixedWhere(verdict.fixed.pos + 1)[1] }}<b lang="en" :class="$style.letter">{{ verdict.fixed.want.join(dictLabels.or) }}</b></template>
				</template>
			</span>
		</p>
		<p v-if="alsoRight.length > 0" :class="$style.also">
			<span>{{ item.mode === 'enter' ? dictLabels.alsoRight : dictLabels.alsoShort }}</span>
			<b v-for="a in alsoRight" :key="a" lang="en">{{ a }}</b>
		</p>
	</template>

	<template v-else>
		<p :class="[$style.verdict, $style.bad]"><span :class="$style.vmark" aria-hidden="true">✗</span>{{ title }}</p>
		<p v-if="verdict.reason === 'word-limit' && item.limit" :class="$style.rule">{{ dictLabels.limitRule(item.limit) }}</p>
		<p v-if="near" :class="$style.rule">{{ dictLabels.nearRule(item.number, item.answer[0]) }}</p>
		<dl :class="$style.rows">
			<dt>{{ dictLabels.answer }}</dt>
			<dd lang="en" class="_selectable">
				<template v-for="(seg, i) in diff.right" :key="i"><mark v-if="seg.t === 'mark'">{{ seg.s }}</mark><template v-else>{{ seg.s }}</template></template>
			</dd>
			<template v-if="typed !== ''">
				<dt>{{ dictLabels.yours }}</dt>
				<dd lang="en">
					<template v-for="(seg, i) in diff.mine" :key="i"><del v-if="seg.t === 'del'">{{ seg.s }}</del><span v-else-if="seg.t === 'caret'" :class="$style.caret" aria-hidden="true">‸</span><span v-else-if="seg.t === 'far'" :class="$style.far">{{ seg.s }}</span><template v-else>{{ seg.s }}</template></template>
				</dd>
			</template>
		</dl>
		<p v-if="alsoWrong.length > 0" :class="$style.also">
			<span>{{ dictLabels.alsoShort }}</span>
			<b v-for="a in alsoWrong" :key="a" lang="en">{{ a }}</b>
		</p>
		<p v-if="!near && rule" :class="$style.rule">{{ rule }}</p>
		<MkA :to="`/guides/${guideSlug}`" behavior="window" :class="$style.guide">
			<i class="ti ti-book" aria-hidden="true"></i> {{ guideName ? dictLabels.guide(guideName) : dictLabels.guideGeneric }} <i class="ti ti-arrow-right" aria-hidden="true"></i>
		</MkA>
		<p v-if="wordSaved" :class="$style.saved">
			<i class="ti ti-notebook" aria-hidden="true"></i> {{ dictLabels.wordSaved }} · <a href="/apps/wordbook/" target="_blank" rel="noopener" class="_link">{{ dictLabels.openWordbook }}</a>
		</p>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { Verdict } from '@/lojo/dictation/mark.js';
import type { DictItem } from '@/lojo/dictation/content.js';
import { alsoAccepted, closest, diffChars, nearMiss } from '@/lojo/dictation/mark.js';
import { dictLabels } from '@/lojo/dictation/labels.js';

const props = defineProps<{
	item: DictItem;
	verdict: Verdict;
	guideSlug: string;
	guideName: string | null;
	wordSaved: boolean;
}>();

type Seg = { t: 'plain' | 'mark' | 'del' | 'caret' | 'far'; s: string };

const typed = computed(() => props.verdict.given);
const near = computed(() => props.verdict.reason !== 'revealed' && nearMiss(props.item.near, typed.value));
const rule = computed(() => props.item.rule ?? dictLabels.tagRules[props.item.setId] ?? null);
const title = computed(() => {
	if (props.verdict.reason === 'word-limit') return dictLabels.wordLimit;
	if (props.verdict.reason === 'revealed') return dictLabels.revealedTitle;
	return near.value ? dictLabels.nearTitle : dictLabels.wrong;
});

// What was written is compared with the accepted form most like it.
const expected = computed(() => (typed.value !== '' ? closest(props.item.answer, typed.value, props.item.ignoreSpaces) : props.item.answer[0]));

function push(list: Seg[], t: Seg['t'], s: string) {
	const last = list.at(-1);
	if (last != null && last.t === t && t !== 'caret') last.s += s;
	else list.push({ t, s });
}

// Letters missed are marked in the answer (and a ‸ where they go in what was written); letters written extra are
// struck out. Something quite different (a sentence in a date's gap) is just shown as it is.
const diff = computed<{ right: Seg[]; mine: Seg[] }>(() => {
	const given = typed.value;
	const exp = expected.value;
	if (given === '') return { right: [{ t: 'plain', s: exp }], mine: [] };
	const { ops, common } = diffChars(given, exp, props.item.ignoreSpaces);
	const len = (s: string) => Array.from(props.item.ignoreSpaces ? s.replace(/\s/g, '') : s).length;
	if (common / Math.max(len(given), len(exp), 1) < 0.6) return { right: [{ t: 'plain', s: exp }], mine: [{ t: 'far', s: given }] };
	const right: Seg[] = [];
	const mine: Seg[] = [];
	for (const op of ops) {
		if (op.t === 'same') {
			push(mine, 'plain', op.a);
			push(right, 'plain', op.b);
		} else if (op.t === 'extra') {
			push(mine, 'del', op.a);
		} else if (op.t === 'miss') {
			push(mine, 'caret', '‸');
			push(right, 'mark', op.b);
		} else {
			push(right, 'plain', op.b);
		}
	}
	return { right, mine };
});

const alsoRight = computed(() => alsoAccepted(props.item.answer, typed.value, props.item.mode === 'enter' ? 5 : 2));
const alsoWrong = computed(() => alsoAccepted(props.item.answer, expected.value, props.item.mode === 'enter' ? 4 : 2));
</script>

<style lang="scss" module>
.root {
	--ok: color-mix(in srgb, #2F7D5B 82%, var(--MI_THEME-fg));
	--bad: var(--MI_THEME-error);
	--gold: color-mix(in srgb, #B8871B 72%, var(--MI_THEME-fg));
	--goldBg: color-mix(in srgb, #F2C14E 22%, var(--MI_THEME-panel));
	--hi: color-mix(in srgb, var(--MI_THEME-fg) 6%, var(--MI_THEME-panel));
	margin-top: 14px;
	padding-top: 12px;
	border-top: 1px dashed var(--MI_THEME-divider);
	display: flex;
	flex-direction: column;
	gap: 9px;
	animation: rise 0.25s ease-out;
}

@keyframes rise {
	from {
		opacity: 0;
		transform: translateY(4px);
	}
}

.verdict {
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 800;
	font-size: 16px;
	letter-spacing: 0.02em;

	&.ok {
		color: var(--ok);
	}

	&.bad {
		color: var(--bad);
	}
}

.vmark {
	flex: none;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	color: var(--MI_THEME-fgOnAccent);
	font-size: 13px;
	font-weight: 800;

	.ok & {
		background: var(--ok);
	}

	.bad & {
		background: var(--bad);
	}
}

.fixed {
	margin: 0;
	display: flex;
	align-items: baseline;
	gap: 6px;
	padding: 7px 10px;
	border-radius: 10px;
	background: var(--goldBg);
	color: var(--MI_THEME-fg);
	font-size: 13px;
	line-height: 1.6;

	> i {
		color: var(--gold);
	}

	b:first-child {
		color: var(--gold);
	}
}

.letter {
	font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
	color: var(--MI_THEME-fgHighlighted);
}

.rows {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 6px 12px;
	align-items: baseline;
	margin: 0;

	dt {
		color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
		font-size: 12.5px;
		white-space: nowrap;
	}

	dd {
		margin: 0;
		font: 600 17px/1.45 ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		color: var(--MI_THEME-fgHighlighted);
		overflow-wrap: anywhere;
	}

	mark {
		background: var(--goldBg);
		color: var(--MI_THEME-fgHighlighted);
		border-bottom: 2.5px solid #F2C14E;
		padding: 0 1px;
		border-radius: 2px;
	}

	del {
		color: var(--bad);
		text-decoration: line-through;
		text-decoration-thickness: 2px;
	}
}

.caret {
	display: inline-block;
	width: 0.35em;
	color: var(--bad);
	font-weight: 800;
	text-align: center;
}

.far {
	color: var(--bad);
}

.rule {
	margin: 0;
	font-size: 13.5px;
	line-height: 1.65;
	background: var(--hi);
	border-radius: 12px;
	padding: 9px 12px;
}

.also {
	margin: 0;
	font-size: 12.5px;
	color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	display: flex;
	flex-wrap: wrap;
	gap: 4px 10px;
	align-items: baseline;

	b {
		font: 600 13.5px ui-monospace, "SF Mono", Menlo, Consolas, monospace;
		color: var(--MI_THEME-fgHighlighted);
		background: var(--hi);
		border-radius: 6px;
		padding: 1px 7px;
		white-space: nowrap;
	}
}

.guide {
	align-self: flex-start;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: var(--MI_THEME-accent);
	font-size: 13.5px;
	font-weight: 600;
}

.saved {
	margin: 0;
	font-size: 12.5px;
	color: color-mix(in srgb, var(--MI_THEME-fg) 75%, transparent);
}

@media (prefers-reduced-motion: reduce) {
	.root {
		animation: none;
	}
}
</style>
