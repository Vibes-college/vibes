<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
「认识你的 Momo」（创始人 2026-11-16 23:54、11-17 00:13 PT 定，照小样 冲刺1111/Vibi/纯头像-1116/page.html 做）。
- welcome：注册弹窗（components/MkUserSetupDialog.vue）的第一页。挑脸 → 起名 → 打招呼。「先跳过」也给一张随机脸、
  名字叫 Momo。存的时候服务器让 TA 在还没说过话的私信里说第一句（就是第三步气泡里这句），「开始聊」直接进私信。
- edit：私信 ⋯ 菜单里的「换个样子 / 改名字」（MomoSetupWindow.vue）。只有挑脸、起名两步，最后「保存」。
第一句话和第三步的气泡带 AI 字样，学员一开始就知道 TA 是 AI（拟人化互动办法）；私信顶上不带（创始人 11-11）。
-->

<template>
<div :class="$style.root" data-momo-setup>
	<div :class="$style.top">
		<div :class="$style.dots" aria-hidden="true">
			<i v-for="n in stepCount" :key="n" :class="[$style.dot, { [$style.dotOn]: n <= step }]"></i>
		</div>
		<button v-if="mode === 'welcome' && step < 3" class="_button" :class="$style.skip" :disabled="saving" data-momo-skip @click="skip">{{ L.skip }}</button>
	</div>

	<section v-if="step === 1" :class="$style.step" data-momo-step="1">
		<h2 ref="titleEl" tabindex="-1" :class="$style.title">{{ L.pickTitle }}</h2>
		<p :class="$style.lead">{{ L.pickLead }}</p>
		<div :class="$style.stage">
			<img :key="seed" :class="[$style.big, $style.pop]" :src="personaHeadUrl(seed)" :alt="L.face" draggable="false">
		</div>
		<div :class="$style.recent">
			<template v-if="recent.length > 0">
				<small>{{ L.recent }}</small>
				<button v-for="s in recent" :key="s" class="_button" :class="$style.recentItem" :title="L.recentPick" :aria-label="L.recentPick" @click="backTo(s)">
					<img :src="personaHeadUrl(s)" alt="" draggable="false">
				</button>
			</template>
		</div>
		<div :class="$style.buttons">
			<button class="_button" :class="[$style.btn, $style.secondary]" data-momo-shuffle @click="shuffle"><span aria-hidden="true">🎲</span> {{ L.shuffle }}</button>
			<button class="_button" :class="[$style.btn, $style.primary]" data-momo-pick @click="go(2)">{{ L.pick }}</button>
		</div>
	</section>

	<section v-else-if="step === 2" :class="$style.step" data-momo-step="2">
		<h2 ref="titleEl" tabindex="-1" :class="$style.title">{{ L.nameTitle }}</h2>
		<p :class="$style.lead">{{ L.nameLead }}</p>
		<img :class="$style.mini" :src="personaHeadUrl(seed)" alt="" draggable="false">
		<input
			v-model="name"
			:class="$style.name"
			:maxlength="PERSONA_NAME_MAX"
			:aria-label="L.nameLabel"
			:aria-invalid="warning != null"
			aria-describedby="momo-name-warning"
			autocomplete="off"
			enterkeyhint="done"
			data-momo-name
			@keydown.enter.prevent="named"
		>
		<div :class="$style.ideas" role="group" :aria-label="L.nameIdeas">
			<button v-for="idea in PERSONA_NAME_IDEAS" :key="idea" class="_button" :class="$style.idea" @click="name = idea">{{ idea }}</button>
		</div>
		<div id="momo-name-warning" :class="$style.warning" aria-live="polite">{{ warning ?? '' }}</div>
		<div :class="$style.preview">
			<img :src="personaHeadUrl(seed)" alt="" draggable="false">
			<div :class="$style.previewText">
				<div><b>{{ cleanPersonaName(name) }}</b><template v-if="L.previewSuffix !== ''"> · {{ L.previewSuffix }}</template></div>
				<small>{{ L.previewCaption }}</small>
			</div>
		</div>
		<div :class="$style.buttons">
			<button class="_button" :class="[$style.btn, $style.secondary]" @click="go(1)">{{ L.back }}</button>
			<button class="_button" :class="[$style.btn, $style.primary]" :disabled="warning != null || saving" data-momo-named @click="named">{{ mode === 'edit' ? L.save : L.named }}</button>
		</div>
	</section>

	<section v-else :class="$style.step" data-momo-step="3">
		<h2 ref="titleEl" tabindex="-1" :class="$style.title">{{ L.arrived(savedName) }}</h2>
		<img :class="[$style.hello, $style.pop]" :src="personaHeadUrl(seed)" alt="" draggable="false">
		<div :class="$style.bubble">
			<div :class="$style.who"><span>{{ savedName }}</span><span :class="$style.ai">{{ L.ai }}</span></div>
			<div>{{ personaHello(savedName) }}</div>
		</div>
		<div :class="[$style.buttons, $style.column]">
			<button class="_button" :class="[$style.btn, $style.primary]" data-momo-chat @click="startChat">{{ L.startChat }}</button>
			<button class="_button" :class="$style.later" data-momo-profile @click="emit('profile')">{{ L.profileFirst }}</button>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { momoText as L } from '@/lojo/locales/momo.js';
import {
	DEFAULT_TUTOR_NAME,
	PERSONA_NAME_IDEAS,
	PERSONA_NAME_MAX,
	cleanPersonaName,
	isSavableSeed,
	personaHeadUrl,
	personaHello,
	personaNameWarning,
	randomPersonaSeed,
} from './persona-rules.js';
import { loadTutorIds, myTutorName, myTutorSeed, savePersona } from './persona.js';
import * as os from '@/os.js';
import { cornerHeldBack } from '@/lojo/agent/state.js';
import { mainRouter } from '@/router.js';

const props = defineProps<{
	mode: 'welcome' | 'edit';
}>();

const emit = defineEmits<{
	// 「开始聊」: the chat with the learner's Momo is opening; close what is around this.
	(ev: 'chat'): void;
	// 「先设置资料」: on to the rest of the sign-up dialog.
	(ev: 'profile'): void;
	// edit: saved.
	(ev: 'saved'): void;
}>();

// The corner Momo (lojo/agent/LojoAgent.vue) stays out of sight while this is open.
onMounted(() => { cornerHeldBack.value++; });
onBeforeUnmount(() => { cornerHeldBack.value--; });

// 「刚才的」: the last few faces, newest first, so one passed by can be picked again.
const RECENT_KEPT = 12;
const RECENT_SHOWN = 5;

const stepCount = props.mode === 'welcome' ? 3 : 2;
const step = ref(1);
// A new learner starts on a random face; editing starts on the one they have.
const seed = ref(props.mode === 'welcome' ? randomPersonaSeed() : myTutorSeed.value);
const name = ref(props.mode === 'welcome' ? DEFAULT_TUTOR_NAME : myTutorName.value);
const history = ref<string[]>([]);
const recent = computed(() => history.value.slice(-RECENT_SHOWN).reverse());
const serverWarning = ref<string | null>(null);
const warning = computed(() => serverWarning.value ?? personaNameWarning(name.value));
const savedName = ref(DEFAULT_TUTOR_NAME);
const saving = ref(false);
const titleEl = useTemplateRef('titleEl');

watch(name, () => { serverWarning.value = null; });

// The next face is fetched while the learner looks at this one, so 「换一个」 shows it at once.
let nextSeed = randomPersonaSeed();

function preload(s: string) {
	const img = new Image();
	img.src = personaHeadUrl(s);
}

preload(nextSeed);

function shuffle() {
	history.value = [...history.value, seed.value].slice(-RECENT_KEPT);
	seed.value = nextSeed;
	nextSeed = randomPersonaSeed();
	preload(nextSeed);
}

function backTo(s: string) {
	history.value = [...history.value.filter(x => x !== s), seed.value].slice(-RECENT_KEPT);
	seed.value = s;
}

function go(n: number) {
	step.value = n;
	// For screen readers: the new step's title is read out.
	void nextTick(() => titleEl.value?.focus({ preventScroll: true }));
}

async function save(change: { name: string; greet: boolean }): Promise<boolean> {
	saving.value = true;
	try {
		// The default face (momo:<id>) is not saved as such; leaving it out keeps it.
		const saved = await savePersona({ ...(isSavableSeed(seed.value) ? { seed: seed.value } : {}), ...change });
		savedName.value = saved.name;
		return true;
	} catch (err) {
		if ((err as { code?: string } | null)?.code === 'NAME_NOT_ALLOWED') {
			serverWarning.value = L.nameNotAllowed;
		} else {
			os.alert({ type: 'error', text: L.failed });
		}
		return false;
	} finally {
		saving.value = false;
	}
}

async function named() {
	if (warning.value != null || saving.value) return;
	if (!await save({ name: cleanPersonaName(name.value), greet: props.mode === 'welcome' })) return;
	if (props.mode === 'edit') {
		os.toast(L.saved);
		emit('saved');
		return;
	}
	go(3);
}

// 「先跳过」: still a face (the one showing) and the name Momo (founder 11-16 23:54), and still the hello.
async function skip() {
	if (saving.value) return;
	if (await save({ name: DEFAULT_TUTOR_NAME, greet: true })) go(3);
}

async function startChat() {
	const [tutorId] = await loadTutorIds();
	emit('chat');
	if (tutorId != null) mainRouter.pushByPath(`/chat/user/${tutorId}`);
}
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	min-height: 100%;
	max-width: 420px;
	margin: 0 auto;
	padding: 14px 22px 20px;
	text-align: center;
}

.top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 30px;
}

.dots {
	display: flex;
	gap: 6px;
}

.dot {
	width: 22px;
	height: 5px;
	border-radius: 3px;
	background: var(--MI_THEME-divider);
	transition: background 0.3s;
}

.dotOn {
	background: var(--MI_THEME-accent);
}

.skip {
	padding: 4px 8px;
	border-radius: 8px;
	font-size: 0.85em;
	opacity: 0.7;

	&:hover {
		opacity: 1;
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.step {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.title {
	margin: 10px 0 2px;
	font-size: 1.3em;
	font-weight: bold;
	outline: none;
}

.lead {
	margin: 0;
	font-size: 0.9em;
	opacity: 0.7;
}

.stage {
	position: relative;
	display: grid;
	place-items: center;
	width: 210px;
	height: 210px;
	margin: 14px 0 6px;

	&::before {
		content: '';
		position: absolute;
		inset: 18px;
		border-radius: 50%;
		background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--MI_THEME-accent) 10%, var(--MI_THEME-panel)), color-mix(in srgb, var(--MI_THEME-accent) 26%, var(--MI_THEME-panel)) 70%);
	}
}

.big {
	position: relative;
	width: 190px;
	aspect-ratio: 202 / 196;
	filter: drop-shadow(0 12px 14px var(--MI_THEME-shadow));
	user-select: none;
}

.pop {
	animation: pop 0.42s cubic-bezier(0.3, 1.6, 0.5, 1);

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
}

@keyframes pop {
	0% { transform: scale(0.6) rotate(-12deg); opacity: 0.2; }
	100% { transform: none; opacity: 1; }
}

.recent {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-height: 44px;

	> small {
		margin-right: 4px;
		opacity: 0.7;
	}
}

.recentItem {
	width: 40px;
	height: 40px;
	padding: 3px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	background: var(--MI_THEME-panel);

	> img {
		display: block;
		width: 100%;
	}

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}

.buttons {
	display: flex;
	gap: 10px;
	width: 100%;
	margin-top: auto;
	padding-top: 14px;

	&.column {
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}
}

.btn {
	flex: 1;
	width: 100%;
	height: 48px;
	border-radius: 24px;
	font-weight: bold;
	font-size: 1em;

	&:disabled {
		opacity: 0.4;
		cursor: default;
	}
}

.primary {
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);

	&:not(:disabled):hover {
		background: color-mix(in srgb, var(--MI_THEME-accent) 88%, var(--MI_THEME-bg));
	}
}

.secondary {
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);

	&:not(:disabled):hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.later {
	padding: 6px 12px;
	border-radius: 8px;
	font-size: 0.85em;
	opacity: 0.7;

	&:hover {
		opacity: 1;
	}
}

.mini {
	width: 96px;
	aspect-ratio: 202 / 196;
	margin: 12px 0 4px;
	filter: drop-shadow(0 8px 10px var(--MI_THEME-shadow));
	user-select: none;
}

.name {
	box-sizing: border-box;
	width: 100%;
	height: 50px;
	margin-top: 10px;
	border: 2px solid var(--MI_THEME-inputBorder);
	border-radius: 14px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	font: inherit;
	font-weight: bold;
	font-size: 1.15em;
	text-align: center;

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover);
	}

	&:focus {
		outline: none;
		border-color: var(--MI_THEME-accent);
	}
}

.ideas {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 6px;
	margin-top: 10px;
}

.idea {
	padding: 5px 11px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 99px;
	background: var(--MI_THEME-panel);
	font-size: 0.85em;

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}

.warning {
	min-height: 20px;
	margin-top: 6px;
	font-size: 0.85em;
	color: var(--MI_THEME-error);
}

.preview {
	box-sizing: border-box;
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	margin-top: 6px;
	padding: 9px 12px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 14px;
	background: var(--MI_THEME-panel);
	text-align: left;

	> img {
		flex: none;
		width: 36px;
		aspect-ratio: 202 / 196;
	}
}

.previewText {
	min-width: 0;

	> div {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	> small {
		display: block;
		opacity: 0.7;
	}
}

.hello {
	width: 120px;
	aspect-ratio: 202 / 196;
	margin-top: 8px;
	filter: drop-shadow(0 10px 12px var(--MI_THEME-shadow));
	user-select: none;
}

.bubble {
	box-sizing: border-box;
	width: 100%;
	margin-top: 10px;
	padding: 11px 13px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 16px 16px 16px 4px;
	background: var(--MI_THEME-panel);
	box-shadow: 0 10px 22px -14px var(--MI_THEME-shadow);
	font-size: 0.95em;
	line-height: 1.5;
	text-align: left;
}

.who {
	display: flex;
	align-items: center;
	gap: 5px;
	margin-bottom: 2px;
	font-weight: bold;
	font-size: 0.9em;
}

.ai {
	padding: 0 6px;
	border-radius: 99px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 0.75em;
	line-height: 1.6;
}
</style>
