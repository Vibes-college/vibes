<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 0 号线: a text to copy, letter by letter: faint until typed, then green where right and red (with a wavy line) where
wrong; the letters people get wrong underlined in yellow; a caret where the next letter goes. `plain`: just the text
with the caret at its end (typing from memory). Words don't break across lines. -->
<template>
<span :class="$style.root">
	<template v-for="(run, r) in runs" :key="r">
		<span v-if="run.space" :class="cls(run.at, true)">{{ ' ' }}</span>
		<span v-else :class="$style.w">
			<span v-for="k in run.len" :key="k" :class="cls(run.at + k - 1, false)">{{ chars[run.at + k - 1] }}</span>
		</span>
	</template>
	<span v-if="caret && typedLen >= chars.length" :class="[$style.c, $style.end, $style.cur, { [$style.steady]: steady }]"></span>
</span>
</template>

<script lang="ts" setup>
import { computed, useCssModule } from 'vue';
import { charMarks } from '@/lojo/typing/score.js';

const props = defineProps<{
	target: string;
	typed: string;
	// places of the letters to underline
	hard?: number[];
	caret?: boolean;
	// no blinking while typing
	steady?: boolean;
	plain?: boolean;
}>();

const css = useCssModule();
const chars = computed(() => Array.from(props.target));
const typedLen = computed(() => Array.from(props.typed).length);
const marks = computed(() => (props.plain ? null : charMarks(props.target, props.typed)));

// words and the spaces between them
const runs = computed(() => {
	const out: { space: boolean; at: number; len: number }[] = [];
	const c = chars.value;
	let i = 0;
	while (i < c.length) {
		if (c[i] === ' ') {
			out.push({ space: true, at: i, len: 1 });
			i++;
			continue;
		}
		let j = i;
		while (j < c.length && c[j] !== ' ') j++;
		out.push({ space: false, at: i, len: j - i });
		i = j;
	}
	return out;
});

function cls(i: number, space: boolean): (string | undefined)[] {
	const m = marks.value?.[i];
	return [
		css.c,
		m != null ? css[m] : undefined,
		space ? css.sp : undefined,
		props.hard?.includes(i) && m !== 'bad' ? css.hard : undefined,
		props.caret && i === typedLen.value ? css.cur : undefined,
		props.steady ? css.steady : undefined,
	];
}
</script>

<style lang="scss" module>
.root {
	white-space: normal;
}

.w {
	white-space: nowrap;
}

.c {
	position: relative;
	border-radius: 3px;
	white-space: pre;
}

.ok {
	color: var(--tl-ok);
	font-weight: 600;
}

.bad {
	color: var(--tl-bad);
	background: var(--tl-badBg);
	font-weight: 600;
	text-decoration: underline wavy var(--tl-bad) 1.5px;
	text-underline-offset: 0.2em;
}

.todo {
	color: var(--tl-todo);
}

.sp {
	white-space: pre-wrap;

	&.bad {
		text-decoration: none;
		box-shadow: inset 0 -3px 0 var(--tl-bad);
	}
}

.hard {
	text-decoration: underline 3px var(--tl-mustard);
	text-underline-offset: 0.22em;
}

.cur::before {
	content: "";
	position: absolute;
	left: -1px;
	top: 0.12em;
	bottom: 0.12em;
	width: 2.5px;
	border-radius: 2px;
	background: var(--tl-c);
	animation: blink 1.05s steps(1) infinite;
}

.steady::before {
	animation: none;
}

.end {
	display: inline-block;
	width: 0.1em;
}

@keyframes blink {
	50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
	.cur::before {
		animation: none;
	}
}
</style>
