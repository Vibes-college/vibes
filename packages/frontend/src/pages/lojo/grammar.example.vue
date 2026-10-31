<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 6 号线 · 语法: one example sentence of a lesson, and what it means. Its marked parts are underlined, each kind its
own way (solid, double, dashed, dotted), with the name written under the words; a clause is in brackets and shaded.
A marked word and the punctuation right after it never wrap apart. The speaker reads the sentence without the marks. -->
<template>
<div :class="$style.ex" data-example>
	<p :class="$style.sentence" lang="en" data-sentence>
		<template v-for="(seg, i) in example.segments" :key="i">
			<template v-if="seg.kind === 'text'">{{ seg.text }}</template>
			<span v-else-if="seg.kind === 'mark'" :class="$style.nw"><span :class="[$style.mk, $style[`mk_${seg.mark}`]]" :data-mark="seg.mark"><span :class="$style.mw">{{ seg.text }}</span><span :class="$style.ml" :lang="labelLang" data-mark-label>{{ L.marks[seg.mark] }}</span></span>{{ seg.tail }}</span>
			<span v-else :class="$style.clause" data-mark="c">
				<template v-for="(part, j) in seg.parts" :key="j">
					<template v-if="part.kind === 'text'">{{ part.text }}</template>
					<span v-else :class="$style.nw"><span :class="[$style.mk, $style[`mk_${part.mark}`]]" :data-mark="part.mark"><span :class="$style.mw">{{ part.text }}</span><span :class="$style.ml" :lang="labelLang" data-mark-label>{{ L.marks[part.mark] }}</span></span>{{ part.tail }}</span>
				</template>
				<span :class="$style.sr" :lang="labelLang">{{ L.clauseSr }}</span>
			</span>
		</template>
	</p>
	<p v-if="example.zh" :class="$style.zh">{{ example.zh }}</p>
	<button
		v-if="speech"
		type="button"
		class="_button"
		:class="[$style.say, { [$style.on]: saying }]"
		:aria-label="saying ? L.stopSay : L.say(example.say)"
		data-say
		@click="toggleSay(sayKey, example.say)"
	>
		<i :class="[saying && sayLoading ? 'ti ti-loader-2' : saying ? 'ti ti-player-stop' : 'ti ti-volume', { [$style.spin]: saying && sayLoading }]" aria-hidden="true"></i>
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { ExampleBlock } from '@/lojo/grammar/content.js';
import { grammarLabels as L, grammarLang } from '@/lojo/grammar/labels.js';
import { sayLoading, sayingKey, toggleSay } from '@/lojo/grammar/audio.js';

const props = defineProps<{
	example: ExampleBlock;
	// which example this is, for the speaker (stop/section/block)
	sayKey: string;
	// whether sentences can be read aloud here
	speech: boolean;
}>();

const labelLang = grammarLang === 'zh' ? 'zh-CN' : 'en';
const saying = computed(() => sayingKey.value === props.sayKey);
</script>

<style lang="scss" module>
// The speaker's room is kept even before we know whether sentences can be read: the status comes after the page has
// opened at a section, and the text mustn't reflow under the reader then.
.ex {
	position: relative;
	background: var(--gl-hi);
	border-radius: 14px;
	padding: 8px 58px 10px 14px;
	margin: 0 0 10px;
}

// room above and below each line for the names under the marked words
.sentence {
	font-size: 17px;
	line-height: 2.45;
	color: var(--gl-ink);
	margin: 0;
	padding: 2px 0 16px;
}

.zh {
	font-size: 13px;
	line-height: 1.6;
	color: var(--gl-weak);
	margin: 0;
}

// a marked word and the punctuation after it stay on one line
.nw {
	white-space: nowrap;
}

// a marked part is one block with its name under it; a long one may still wrap inside
.mk {
	position: relative;
	display: inline-block;
	line-height: 1.35;
	white-space: normal;
	// a short word (is, it, I) is narrower than its two-character name: room for it, so the next name doesn't run in
	min-width: 24px;
}

.mw {
	border-bottom: 3px solid;
	padding-bottom: 1px;
}

.ml {
	position: absolute;
	left: 0;
	top: 100%;
	margin-top: 4px;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.04em;
	line-height: 1;
	white-space: nowrap;
}

.mk_s {
	.mw {
		border-color: var(--gl-s);
	}

	.ml {
		color: var(--gl-sInk);
	}
}

.mk_v {
	.mw {
		border-color: var(--gl-v);
		border-bottom-style: double;
		border-bottom-width: 5px;
	}

	.ml {
		color: var(--gl-vInk);
	}
}

.mk_o {
	.mw {
		border-color: var(--gl-o);
		border-bottom-style: dashed;
	}

	.ml {
		color: var(--gl-oInk);
	}
}

.mk_p {
	.mw {
		border-color: var(--gl-p);
		border-bottom-style: dotted;
		border-bottom-width: 4px;
	}

	.ml {
		color: var(--gl-pInk);
	}
}

// a clause wraps like ordinary text: brackets and a shade show it
.clause {
	background: var(--gl-clauseBg);
	border-radius: 6px;
	padding: 3px;
	-webkit-box-decoration-break: clone;
	box-decoration-break: clone;

	&::before,
	&::after {
		color: var(--gl-gold);
		font-weight: 700;
	}

	&::before {
		content: "[";
		margin-right: 1px;
	}

	&::after {
		content: "]";
		margin-left: 1px;
	}
}

.say {
	position: absolute;
	top: 9px;
	right: 10px;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	font-size: 19px;
	background: var(--MI_THEME-panel);
	color: var(--gl-cInk);
	box-shadow: 0 0 0 1px var(--gl-line);

	&:hover {
		background: var(--MI_THEME-buttonBg);
	}

	&.on {
		background: var(--gl-c);
		color: var(--gl-onC);
		box-shadow: none;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.spin {
	animation: spin 0.9s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
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

@media (hover: none) {
	.say:hover {
		background: var(--MI_THEME-panel);
	}

	.say.on:hover {
		background: var(--gl-c);
	}
}

@media (prefers-reduced-motion: reduce) {
	.spin {
		animation: none;
	}
}
</style>
