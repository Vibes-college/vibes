<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 聊天模式的对照卡（lojo/tutor/mode.ts）：先亮出「你以为的」，抖一下，再划掉、翻出「其实是」；点一下重播。
     关了动效（设置里，或系统的「减少动态效果」）、或是翻到以前的卡：直接是答案。 -->
<template>
<div
	:class="[$style.card, $style[phase]]"
	role="button"
	tabindex="0"
	:aria-label="vt.mode.cardAria(card.phrase ?? card.front)"
	data-mode-card
	@click="play"
	@keydown.enter.prevent="play"
	@keydown.space.prevent="play"
>
	<div :class="$style.pre">{{ phase === 'start' || phase === 'shake' ? labels[0] : labels[1] }}</div>
	<div v-if="card.phrase" :class="$style.phrase" lang="en">{{ card.phrase }}</div>
	<div :class="$style.pair">
		<span :class="$style.front">{{ card.front }}<span :class="$style.strike"></span></span>
		<span :class="$style.back">→ {{ card.back }}</span>
	</div>
	<div :class="$style.acts">
		<button v-if="speechSupported" class="_button" :class="$style.act" :aria-pressed="speakingKey === speakKey" @click.stop="listen">
			<i :class="speakingKey === speakKey ? 'ti ti-player-stop' : 'ti ti-volume'"></i>
			{{ speakingKey === speakKey ? vt.mode.stop : vt.mode.listen }}
		</button>
		<button class="_button" :class="[$style.act, { [$style.saved]: saved }]" :disabled="saved || saving" data-mode-card-save @click.stop="save">
			{{ saved ? vt.mode.saved : vt.mode.addWord }}
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import type { ModeCard } from './mode.js';
import { vt } from '@/lojo/locales/index.js';
import { prefer } from '@/preferences.js';
import { loadEnglishStatus } from '@/lojo/english/api.js';
import { speakingKey, speechSupported, toggleSpeak } from '@/lojo/english/speech.js';
import { addWord, isSaved, loadWordbook } from '@/lojo/english/wordbook.js';
import * as os from '@/os.js';

const props = defineProps<{
	card: ModeCard;
	// when the message was sent: only a card that just arrived plays by itself
	createdAt: string;
}>();

const labels = computed(() => vt.mode.pre[props.card.mode]);
const motion = prefer.s.animation && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// done: the answer, still (cards from before, or with motion off); reveal: the answer coming in after a shake
const phase = ref<'start' | 'shake' | 'reveal' | 'done'>('done');
const speakKey = `modecard:${useId()}`;

// What goes into the wordbook and is read aloud: the English expression; for Chinglish, the natural English.
const english = computed(() => (props.card.mode === 'chinglish' ? props.card.back : props.card.phrase ?? props.card.back));
const saved = computed(() => isSaved(english.value));
const saving = ref(false);

let timer: number | undefined;

function play() {
	if (!motion) return;
	window.clearTimeout(timer);
	phase.value = 'start';
	// next frame, so the shake starts over when replayed
	window.requestAnimationFrame(() => {
		phase.value = 'shake';
		timer = window.setTimeout(() => { phase.value = 'reveal'; }, 1300);
	});
}

function listen() {
	void toggleSpeak(speakKey, english.value);
}

async function save() {
	if (saving.value) return;
	saving.value = true;
	const c = props.card;
	try {
		const [meaning, usage] = c.mode === 'chinglish' ? [vt.mode.insteadOf(c.front), '']
			: c.phrase != null ? [c.back, vt.mode.literally(c.front)] : [c.front, ''];
		await addWord({ text: english.value, kind: 'phrase', meaning, usage, example: '', exampleZh: '' }, 'manual');
	} catch {
		os.toast(vt.mode.addFailed);
	} finally {
		saving.value = false;
	}
}

onMounted(() => {
	void loadEnglishStatus();
	void loadWordbook();
	if (motion && Date.now() - new Date(props.createdAt).getTime() < 90 * 1000) play();
});

onBeforeUnmount(() => window.clearTimeout(timer));
</script>

<style lang="scss" module>
.card {
	--bad: var(--MI_THEME-error);
	--ok: var(--MI_THEME-success);
	max-width: 320px;
	padding: 9px 12px 10px;
	border-radius: 14px;
	border: 1.5px solid var(--ok);
	background: var(--MI_THEME-panel);
	font-size: 0.9em;
	line-height: 1.5;
	text-align: left;
	cursor: pointer;
	overflow-wrap: anywhere;
	transition: border-color 0.4s, background 0.4s;
}

.pre {
	font-size: 0.78em;
	font-weight: bold;
	letter-spacing: 0.02em;
	color: var(--ok);
}

.phrase {
	font-weight: 800;
	font-size: 1.08em;
	color: var(--MI_THEME-fg);
}

.pair {
	margin-top: 2px;
}

.front {
	position: relative;
	display: inline;
	font-weight: bold;
	color: var(--MI_THEME-fg);
	opacity: 0.55;
	text-decoration: line-through;
	text-decoration-color: var(--bad);
}

.strike {
	display: none;
}

.back {
	margin-left: 6px;
	font-weight: 800;
	color: var(--ok);
}

.acts {
	display: flex;
	gap: 6px;
	margin-top: 6px;
}

.act {
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 0.82em;
	font-weight: bold;
	color: var(--MI_THEME-accent);
	background: color(from var(--MI_THEME-accent) srgb r g b / 0.12);

	&.saved,
	&:disabled {
		color: var(--MI_THEME-fg);
		background: var(--MI_THEME-buttonBg);
		opacity: 0.7;
		cursor: default;
	}
}

// Before and while it shakes: what it seems to say, in red; the answer and the buttons wait.
.start,
.shake {
	border-color: var(--bad);
	background: color(from var(--MI_THEME-error) srgb r g b / 0.08);

	.pre {
		color: var(--bad);
	}

	.front {
		opacity: 1;
		color: var(--bad);
		text-decoration: none;
	}

	.back {
		opacity: 0;
	}

	.acts {
		opacity: 0;
		pointer-events: none;
	}
}

.shake {
	animation: shake 0.5s ease-in-out;
}

// The reveal: strike it through, then the answer, then the buttons.
.reveal {
	.front {
		text-decoration: none;
		transition: color 0.3s, opacity 0.3s;
	}

	.strike {
		display: block;
		position: absolute;
		left: -2px;
		right: -2px;
		top: 52%;
		height: 2px;
		border-radius: 2px;
		background: var(--bad);
		transform-origin: left;
		animation: strike 0.35s ease-out both;
	}

	.back {
		animation: reveal 0.35s 0.15s ease-out both;
	}

	.acts {
		animation: fade 0.4s 0.45s ease-out both;
	}
}

@keyframes shake {
	0%, 100% { transform: none; }
	15% { transform: translateX(-5px) rotate(-1deg); }
	30% { transform: translateX(5px) rotate(1deg); }
	45% { transform: translateX(-4px); }
	60% { transform: translateX(4px); }
	75% { transform: translateX(-2px); }
}

@keyframes strike {
	from { transform: scaleX(0); }
	to { transform: scaleX(1); }
}

@keyframes reveal {
	from { opacity: 0; transform: translateX(-6px); }
	to { opacity: 1; transform: none; }
}

@keyframes fade {
	from { opacity: 0; }
	to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
	.shake,
	.reveal .strike,
	.reveal .back,
	.reveal .acts {
		animation: none !important;
	}
}
</style>
