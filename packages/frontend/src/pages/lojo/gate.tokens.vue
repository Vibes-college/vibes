<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- A sentence as its words (split the server's way), for 找错改错 and 拆句: buttons to tap while answering, or plain
words in the review. Marks show the subject (主语), the verb (谓语) and clauses in brackets; each mark has its own colour,
line and label, so colour isn't the only sign. -->
<template>
<p v-if="tappable" :class="[$style.root, { [$style.marked]: marks != null }]" lang="en">
	<button
		v-for="(t, i) in tokens"
		:key="i"
		type="button"
		class="_button"
		:class="classes(i).map(k => $style[k])"
		:data-token="i"
		:data-label="label(i)"
		:aria-label="spoken(i)"
		:aria-pressed="pickable ? selected === i : undefined"
		:disabled="disabled"
		@click="emit('tap', i)"
	><span v-if="opens(i)" :class="$style.bracket" aria-hidden="true">[</span>{{ t }}<span v-if="closes(i)" :class="$style.bracket" aria-hidden="true">]</span></button>
</p>
<!-- the words sit side by side without spaces (a clause is one band), so a screen reader gets the sentence and the summary -->
<p v-else :class="[$style.root, $style.still, { [$style.marked]: marks != null }]">
	<span :class="$style.sr" lang="en">{{ tokens.join(' ') }}</span>
	<span v-if="summary" :class="$style.sr">{{ summary }}</span>
	<span aria-hidden="true" lang="en"><span
		v-for="(t, i) in tokens"
		:key="i"
		:class="classes(i).map(k => $style[k])"
		:data-label="label(i)"
	><span v-if="opens(i)" :class="$style.bracket">[</span>{{ t }}<span v-if="closes(i)" :class="$style.bracket">]</span></span></span>
</p>
</template>

<script lang="ts" setup>
import { bare, clauseAt } from '@/lojo/gates/answers.js';
import type { ParseMarks } from '@/lojo/gates/answers.js';
import { gateLabels } from '@/lojo/gates/labels.js';

const props = defineProps<{
	tokens: string[];
	marks?: ParseMarks | null;
	// a clause started, waiting for its last word
	pending?: number | null;
	// 找错改错: the words are picked from (aria-pressed), and the one picked as wrong
	pickable?: boolean;
	selected?: number | null;
	// the review of a fix: the wrong word(s) in the sentence, or the change in the corrected one ([from, to))
	wrong?: [number, number] | null;
	fixed?: [number, number] | null;
	tappable?: boolean;
	disabled?: boolean;
	// what a screen reader gets in the review after the sentence, e.g. "主语：traffic；谓语：has fallen"
	summary?: string;
}>();

const emit = defineEmits<{
	(ev: 'tap', i: number): void;
}>();

const inside = (range: [number, number] | null | undefined, i: number) => range != null && i >= range[0] && i < range[1];
const clause = (i: number) => (props.marks ? clauseAt(props.marks, i) : null);
const opens = (i: number) => clause(i)?.[0] === i || props.pending === i;
const closes = (i: number) => clause(i)?.[1] === i;

// A word's classes, by name: the template looks them up in $style. (The build inlines $style.name in templates and then
// drops the module, so useCssModule() comes back empty in production; a lookup by a name it can't see keeps it.)
type TokClass = 'tok' | 's' | 'v' | 'inClause' | 'clauseStart' | 'clauseEnd' | 'pending' | 'selected' | 'wrong' | 'fixed';

function classes(i: number): TokClass[] {
	const m = props.marks, c = clause(i);
	const on: [TokClass, boolean][] = [
		['tok', true],
		['s', m?.s.includes(i) ?? false],
		['v', m?.v.includes(i) ?? false],
		['inClause', c != null],
		['clauseStart', c?.[0] === i || props.pending === i],
		['clauseEnd', c?.[1] === i],
		['pending', props.pending === i],
		['selected', props.selected === i],
		['wrong', inside(props.wrong, i)],
		['fixed', inside(props.fixed, i)],
	];
	return on.filter(([, yes]) => yes).map(([k]) => k);
}

// the label over a marked word
function label(i: number): string | undefined {
	if (props.marks?.s.includes(i)) return gateLabels.parseModes.s;
	if (props.marks?.v.includes(i)) return gateLabels.parseModes.v;
	return undefined;
}

// what a screen reader says for a word button: the word, then its marks
function spoken(i: number): string {
	const parts = [bare(props.tokens[i]) || props.tokens[i]];
	const m = props.marks, c = clause(i);
	if (m?.s.includes(i)) parts.push(gateLabels.parseModes.s);
	if (m?.v.includes(i)) parts.push(gateLabels.parseModes.v);
	if (c) parts.push(c[0] === i ? gateLabels.clauseStarts : c[1] === i ? gateLabels.clauseEnds : gateLabels.inClause);
	else if (props.pending === i) parts.push(gateLabels.clauseStarts);
	return parts.join(gateLabels.wordSep);
}
</script>

<style lang="scss" module>
.root {
	margin: 0;
	font-size: 1.1em;
	line-height: 2.3;
	overflow-wrap: anywhere;

	// room for the labels over the marked words
	&.marked {
		line-height: 2.9;
	}

	&.still {
		font-size: 1em;
		line-height: 1.9;

		&.marked {
			line-height: 2.6;
		}
	}
}

.tok {
	position: relative;
	display: inline-block;
	padding: 3px 5px;
	border-radius: 8px;
	line-height: 1.45;
	color: var(--MI_THEME-fg);

	.still & {
		padding: 0 3px;
		border-radius: 5px;
		line-height: 1.5;
	}
}

button.tok {
	transition: background 0.12s ease;

	&:hover:not(:disabled) {
		background-color: color-mix(in srgb, var(--MI_THEME-fg) 8%, transparent);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 1px;
	}

	&:disabled {
		cursor: default;
	}
}

// the word picked as wrong
.selected,
button.selected:hover:not(:disabled) {
	color: var(--MI_THEME-error);
	background-color: color-mix(in srgb, var(--MI_THEME-error) 10%, transparent);
	box-shadow: inset 0 0 0 2px var(--MI_THEME-error);
}

.s {
	background-color: color-mix(in srgb, var(--MI_THEME-accent) 10%, transparent);
	box-shadow: inset 0 -3px 0 var(--MI_THEME-accent);
}

// the verb: a thicker line in another colour
.v {
	background-color: color-mix(in srgb, var(--MI_THEME-hashtag) 12%, transparent);
	box-shadow: inset 0 -4px 0 var(--MI_THEME-hashtag);
}

.s::before,
.v::before {
	content: attr(data-label);
	position: absolute;
	left: 50%;
	top: -13px;
	transform: translateX(-50%);
	font-size: 10.5px;
	font-weight: bold;
	line-height: 1;
	letter-spacing: 0.04em;
	white-space: nowrap;

	.still & {
		top: -11px;
		font-size: 10px;
	}
}

.s::before {
	color: var(--MI_THEME-accent);
}

.v::before {
	color: var(--MI_THEME-hashtag);
}

// a clause reads as one band, with brackets at its ends
.inClause {
	border-radius: 0;
	background-color: color-mix(in srgb, var(--MI_THEME-warn) 30%, transparent);

	&.s {
		background-color: color-mix(in srgb, var(--MI_THEME-accent) 12%, color-mix(in srgb, var(--MI_THEME-warn) 30%, transparent));
	}

	&.v {
		background-color: color-mix(in srgb, var(--MI_THEME-hashtag) 14%, color-mix(in srgb, var(--MI_THEME-warn) 30%, transparent));
	}
}

.clauseStart {
	border-top-left-radius: 8px;
	border-bottom-left-radius: 8px;
}

.clauseEnd {
	border-top-right-radius: 8px;
	border-bottom-right-radius: 8px;
}

.pending {
	background-color: color-mix(in srgb, var(--MI_THEME-warn) 20%, transparent);
	box-shadow: inset 0 0 0 2px var(--MI_THEME-warn);
}

.bracket {
	margin: 0 2px;
	font-weight: 800;
	color: color-mix(in srgb, var(--MI_THEME-warn) 70%, var(--MI_THEME-fg));
}

// the review of a fix
.wrong {
	color: var(--MI_THEME-error);
	text-decoration: line-through;
	text-decoration-color: color-mix(in srgb, var(--MI_THEME-error) 60%, transparent);
}

.fixed {
	font-weight: bold;
	color: var(--MI_THEME-success);
	text-decoration: underline;
	text-decoration-thickness: 2px;
	text-underline-offset: 3px;
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
