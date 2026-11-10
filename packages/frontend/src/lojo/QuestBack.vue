<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 闯关 · 装备补心, on a mini app's result page when 闯关 opened it (?from=quest&level=<id>): what the set just done
gave (心 +1, or why not) and a 回闯关 button back to that level. A heart won flies from the line to the button.
Nothing at all without ?from=quest. -->
<template>
<div v-if="from" :class="$style.root" data-quest-back>
	<p :class="[$style.line, { [$style.won]: won }]" role="status">
		<span ref="heartEl" :class="$style.heart" aria-hidden="true">
			<svg viewBox="0 0 16 16"><path :d="HEART" :fill="won ? '#E8603F' : 'none'" stroke="currentColor" stroke-width="1.2"/></svg>
		</span>
		<span>{{ text }}</span>
	</p>
	<button ref="btnEl" type="button" class="_button" :class="$style.go" :disabled="leaving" data-quest-go @click="goBack">
		<i class="ti ti-flag-3" aria-hidden="true"></i>{{ leaving ? '正在回闯关…' : '回闯关' }}
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onActivated, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import type { QuestFrom, QuestSetApp } from '@/lojo/quest-refill.js';
import { questBackPath, questFrom, questOutcome, retryQuestSet } from '@/lojo/quest-refill.js';
import { useRouter } from '@/router.js';

const props = defineProps<{
	app: QuestSetApp;
	// 语法线 gives no heart (v1): nothing is reported, the line just says so
	noHeart?: boolean;
}>();

const HEART = 'M8 4 c-1.5 -3 -7 -2.5 -6 1.5 c.6 2.4 3.6 4.4 6 6.5 c2.4 -2.1 5.4 -4.1 6 -6.5 c1 -4 -4.5 -4.5 -6 -1.5z';
// an outcome older than this is from another visit
const FRESH_MS = 30 * 60 * 1000;

const router = useRouter();
const heartEl = useTemplateRef('heartEl');
const btnEl = useTemplateRef('btnEl');
const from = ref<QuestFrom | null>(questFrom(router.getCurrentFullPath()));
const leaving = ref(false);

// pages are kept alive: the address may have changed meanwhile
onActivated(() => {
	from.value = questFrom(router.getCurrentFullPath());
});

const outcome = computed(() => {
	const o = questOutcome.value;
	return o != null && o.app === props.app && Date.now() - o.at < FRESH_MS ? o : null;
});
const won = computed(() => outcome.value?.state === 'done' && outcome.value.refilled);

const text = computed(() => {
	if (props.noHeart) return '语法这条路不补心';
	const o = outcome.value;
	if (o == null) return '练完一组（至少 10 题、2 分钟）能补 1 颗心';
	if (o.state === 'pending') return '正在记这一组…';
	if (o.state === 'failed') return '没连上，这组已经记下，回闯关会再试';
	return o.text;
});

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The sound follows 闯关's own switch.
function soundOn(): boolean {
	try {
		return window.localStorage.getItem('vibesQuestSound') !== '0';
	} catch {
		return true;
	}
}

function chime() {
	if (!soundOn()) return;
	const a = new Audio('/lojo-assets/quest/sounds/heartup.mp3');
	a.play().catch(() => { /* not allowed now: quiet */ });
	try {
		const ctx = new window.AudioContext();
		const t0 = ctx.currentTime + 0.02;
		[660, 880].forEach((f, i) => {
			const o = ctx.createOscillator();
			const g = ctx.createGain();
			o.type = 'sine';
			o.frequency.value = f;
			g.gain.setValueAtTime(0, t0 + i * 0.08);
			g.gain.linearRampToValueAtTime(0.1, t0 + i * 0.08 + 0.012);
			g.gain.exponentialRampToValueAtTime(0.0008, t0 + i * 0.08 + 0.25);
			o.connect(g).connect(ctx.destination);
			o.start(t0 + i * 0.08);
			o.stop(t0 + i * 0.08 + 0.3);
		});
		window.setTimeout(() => void ctx.close(), 800);
	} catch { /* no Web Audio */ }
}

let flyer: HTMLElement | null = null;

// 体验规范 5.2 补一颗心: up to 1.6 (0.25s, back.out), to the button (0.6s, power2.in), the button bounces (0.6s, elastic).
function fly() {
	const h = heartEl.value;
	const b = btnEl.value;
	if (h == null || b == null) return;
	chime();
	if (reduced()) return;
	const f = h.getBoundingClientRect();
	const t = b.getBoundingClientRect();
	const el = window.document.createElement('div');
	el.setAttribute('aria-hidden', 'true');
	el.innerHTML = `<svg viewBox="0 0 16 16" width="30" height="30"><path d="${HEART}" fill="#E8603F" stroke="#141E52" stroke-width="1.2"/></svg>`;
	Object.assign(el.style, { position: 'fixed', left: `${f.left + f.width / 2 - 15}px`, top: `${f.top + f.height / 2 - 15}px`, width: '30px', height: '30px', zIndex: '10000', pointerEvents: 'none' });
	window.document.body.appendChild(el);
	flyer = el;
	const dx = t.left + t.width / 2 - (f.left + f.width / 2);
	const dy = t.top + t.height / 2 - (f.top + f.height / 2);
	const grow = el.animate([{ transform: 'scale(0.4)' }, { transform: 'scale(1.6)' }], { duration: 250, easing: 'cubic-bezier(0.3, 2.2, 0.6, 1)', fill: 'forwards' });
	grow.onfinish = () => {
		const go = el.animate([{ transform: 'translate(0, 0) scale(1.6)' }, { transform: `translate(${dx}px, ${dy}px) scale(0.6)` }], { duration: 600, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' });
		go.onfinish = () => {
			el.remove();
			if (flyer === el) flyer = null;
			b.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(0.92)', offset: 0.3 }, { transform: 'scale(1.04)', offset: 0.55 }, { transform: 'scale(0.99)', offset: 0.8 }, { transform: 'scale(1)' }], { duration: 600, easing: 'ease-out' });
		};
	};
}

watch(won, (now, before) => {
	if (now && !before && from.value != null) void nextTick(fly);
}, { immediate: true });

async function goBack() {
	const f = from.value;
	if (f == null || leaving.value) return;
	leaving.value = true;
	// a set that did not get through goes once more first (a short wait at most)
	if (outcome.value?.state === 'failed') await Promise.race([retryQuestSet(), new Promise(resolve => window.setTimeout(resolve, 2500))]);
	if (questOutcome.value?.app === props.app) questOutcome.value = null;
	leaving.value = false;
	router.pushByPath(questBackPath(props.app, f));
}

onBeforeUnmount(() => {
	flyer?.remove();
});
</script>

<style lang="scss" module>
.root {
	--qb-coral: #E8603F;
	--qb-navy: #141E52;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 8px;
	margin: 14px 0 4px;
	text-align: center;
}

.line {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	line-height: 1.5;
	color: color-mix(in srgb, var(--MI_THEME-fg) 78%, transparent);

	&.won {
		color: color-mix(in srgb, var(--qb-coral) 80%, var(--MI_THEME-fg));
		font-weight: 800;
		animation: qbIn 0.35s cubic-bezier(0.3, 1.8, 0.6, 1) both;
	}
}

.heart {
	flex: none;
	display: inline-grid;
	width: 20px;
	height: 20px;

	> svg {
		width: 100%;
		height: 100%;
	}
}

.go {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 50px;
	padding: 6px 16px;
	border-radius: 14px;
	background: var(--qb-coral);
	color: #fff;
	font-size: 16px;
	font-weight: 800;
	letter-spacing: 0.08em;
	box-shadow: 0 4px 0 #B9472C;

	&:hover {
		background: #F27A55;
	}

	&:active {
		transform: translateY(3px);
		box-shadow: 0 1px 0 #B9472C;
	}

	&:disabled {
		opacity: 0.75;
	}

	&:focus-visible {
		outline: 3px solid var(--MI_THEME-focus, var(--qb-navy));
		outline-offset: 3px;
	}
}

@keyframes qbIn {
	from { transform: scale(0.6); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
	.line.won {
		animation: qbFade 0.2s ease both;
	}

	.go:active {
		transform: none;
	}
}

@keyframes qbFade {
	from { opacity: 0; }
}
</style>
