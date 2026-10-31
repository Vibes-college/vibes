<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
The sheet that slides up inside the agent panel when a pill above Paseo's input is pressed:
speak (the browser's own speech recognition), polish into English, or restructure into a clearer prompt.
Nothing is sent to the agent: "用这个" only replaces the text in Paseo's input box.
-->

<template>
<div :class="$style.veil" @click="emit('close')"></div>
<div :class="$style.sheet" role="dialog" :aria-label="title">
	<div :class="$style.head">
		<span>{{ title }}</span>
		<button class="_button" :class="$style.close" :aria-label="agentLabels.close" @click="emit('close')"><i class="ti ti-x"></i></button>
	</div>
	<div :class="$style.scroll" aria-live="polite">
		<template v-if="phase === 'empty'">
			<div :class="$style.note">{{ agentLabels.emptyNote }}</div>
			<div :class="$style.actions">
				<MkButton primary rounded @click="startVoice">{{ agentLabels.speak }}</MkButton>
			</div>
		</template>

		<template v-else-if="phase === 'voice'">
			<div v-if="!speechSupported" :class="$style.note">{{ agentLabels.noSpeech }}</div>
			<template v-else>
				<div :class="$style.mic">
					<button class="_button" :class="[$style.micButton, { [$style.on]: listening }]" :aria-label="listening ? agentLabels.stopSpeaking : agentLabels.startSpeaking" @click="toggleListening">
						<i :class="listening ? 'ti ti-player-stop-filled' : 'ti ti-microphone'"></i>
					</button>
					<small>{{ micHint }}</small>
				</div>
				<div :class="$style.label">{{ agentLabels.heard }}</div>
				<div :class="[$style.quote, { [$style.empty]: !said }]">{{ said || agentLabels.heardEmpty }}</div>
				<div v-if="said.trim() && !listening" :class="$style.actions">
					<MkButton primary rounded @click="polish('english', joined)">{{ agentLabels.english }}</MkButton>
					<MkButton rounded @click="polish('prompt', joined)">{{ agentLabels.prompt }}</MkButton>
					<MkButton rounded @click="emit('use', joined)">{{ agentLabels.useAsIs }}</MkButton>
				</div>
			</template>
		</template>

		<template v-else>
			<div :class="$style.label">{{ agentLabels.yourText }}</div>
			<div :class="$style.source">{{ source }}</div>

			<div v-if="phase === 'loading'" :class="$style.note">{{ mode === 'prompt' ? agentLabels.structuring : agentLabels.polishing }}</div>

			<template v-else-if="phase === 'error'">
				<div :class="$style.error">{{ error }}</div>
				<div v-if="retryable" :class="$style.actions">
					<MkButton primary rounded @click="polish(mode, source)">{{ agentLabels.retry }}</MkButton>
				</div>
			</template>

			<template v-else-if="phase === 'english' && englishResult">
				<div :class="$style.out" data-testid="agent-result">{{ englishResult.text }}</div>
				<template v-if="englishResult.feedback">
					<div :class="$style.label">{{ agentLabels.fix }}</div>
					<div>{{ englishResult.feedback }}</div>
				</template>
				<template v-if="englishResult.notes.length > 0">
					<div :class="$style.label">{{ agentLabels.learn }}</div>
					<ul :class="$style.list">
						<li v-for="note in englishResult.notes" :key="note.phrase"><b>{{ note.phrase }}</b> {{ note.explanation }}</li>
					</ul>
				</template>
				<div :class="$style.actions">
					<MkButton primary rounded @click="emit('use', englishResult.text)">{{ agentLabels.use }}</MkButton>
					<MkButton rounded @click="polish('english', source)">{{ agentLabels.again }}</MkButton>
				</div>
			</template>

			<template v-else-if="phase === 'prompt' && promptResult">
				<div :class="$style.out" data-testid="agent-result">{{ promptResult.prompt }}</div>
				<template v-if="promptResult.changes.length > 0">
					<div :class="$style.label">{{ agentLabels.changed }}</div>
					<ul :class="$style.list">
						<li v-for="change in promptResult.changes" :key="change.what"><b>{{ change.what }}</b><template v-if="change.why">：{{ change.why }}</template></li>
					</ul>
				</template>
				<template v-if="promptResult.questions.length > 0">
					<div :class="$style.label">{{ agentLabels.missing }}</div>
					<ul :class="$style.list">
						<li v-for="question in promptResult.questions" :key="question">{{ question }}</li>
					</ul>
				</template>
				<div :class="$style.actions">
					<MkButton primary rounded @click="emit('use', promptResult.prompt)">{{ agentLabels.use }}</MkButton>
					<MkButton rounded @click="polish('prompt', source)">{{ agentLabels.again }}</MkButton>
				</div>
			</template>
		</template>
	</div>
</div>
</template>

<script lang="ts">
export type AgentTool = 'voice' | 'english' | 'prompt';
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { agentLabels } from './labels.js';
import MkButton from '@/components/MkButton.vue';
import { englishErrorText } from '@/lojo/english/api.js';
import { misskeyApi } from '@/utility/misskey-api.js';

type AgentEnglish = Misskey.Endpoints['lojo/agent/english']['res'];
type AgentPrompt = Misskey.Endpoints['lojo/agent/prompt']['res'];
type Phase = 'empty' | 'voice' | 'loading' | 'error' | 'english' | 'prompt';

const props = defineProps<{
	tool: AgentTool;
	text: string;
}>();

const emit = defineEmits<{
	(ev: 'close'): void;
	(ev: 'use', text: string): void;
}>();

const phase = ref<Phase>('empty');
const mode = ref<'english' | 'prompt'>('english');
const source = ref(props.text);
const englishResult = ref<AgentEnglish | null>(null);
const promptResult = ref<AgentPrompt | null>(null);
const error = ref('');
const retryable = ref(true);

const title = computed(() => {
	if (phase.value === 'empty') return agentLabels.emptyTitle;
	if (phase.value === 'voice') return agentLabels.speak;
	if (phase.value === 'english') return agentLabels.englishDone;
	if (phase.value === 'prompt') return agentLabels.promptDone;
	return mode.value === 'prompt' ? agentLabels.prompt : agentLabels.english;
});

// Each request carries a number, so an answer that arrives after a newer request is dropped.
let requestSeq = 0;
async function polish(next: 'english' | 'prompt', text: string) {
	stopListening();
	const seq = ++requestSeq;
	mode.value = next;
	source.value = text;
	phase.value = 'loading';
	try {
		if (next === 'english') {
			const res = await misskeyApi('lojo/agent/english', { text });
			if (seq !== requestSeq) return;
			englishResult.value = res;
		} else {
			const res = await misskeyApi('lojo/agent/prompt', { text });
			if (seq !== requestSeq) return;
			promptResult.value = res;
		}
		phase.value = next;
	} catch (err) {
		if (seq !== requestSeq) return;
		const code = (err as { code?: string } | null)?.code;
		retryable.value = code !== 'ROLE_PERMISSION_DENIED';
		error.value = code === 'ROLE_PERMISSION_DENIED' ? agentLabels.membersOnly : englishErrorText(err);
		phase.value = 'error';
	}
}

// ---------- Speak ----------
// The browser's own recognizer (Chrome uses Google, Safari uses Apple), set to Chinese: it also catches the
// English words mixed into Chinese. What is said is appended to whatever was already in the input box.
type Recognizer = {
	lang: string;
	interimResults: boolean;
	continuous: boolean;
	onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
	onerror: ((ev: { error: string }) => void) | null;
	onend: (() => void) | null;
	start(): void;
	stop(): void;
};
type RecognizerClass = new () => Recognizer;
const SpeechRecognitionClass = ((window as unknown as { SpeechRecognition?: RecognizerClass }).SpeechRecognition
	?? (window as unknown as { webkitSpeechRecognition?: RecognizerClass }).webkitSpeechRecognition) ?? null;
const speechSupported = SpeechRecognitionClass != null;

const said = ref('');
const listening = ref(false);
const micHint = ref(agentLabels.micHint);
let recognizer: Recognizer | null = null;

const joined = computed(() => {
	const before = source.value.trim();
	return before ? `${before} ${said.value.trim()}` : said.value.trim();
});

function startVoice() {
	phase.value = 'voice';
}

function toggleListening() {
	if (recognizer != null) {
		stopListening();
		return;
	}
	if (SpeechRecognitionClass == null) return;
	const r = new SpeechRecognitionClass();
	r.lang = 'zh-CN';
	r.interimResults = true;
	r.continuous = true;
	r.onresult = ev => {
		let text = '';
		for (const result of Array.from(ev.results)) text += result[0].transcript;
		said.value = text;
	};
	r.onerror = ev => {
		micHint.value = ev.error === 'not-allowed' ? agentLabels.micDenied : agentLabels.notHeard;
	};
	r.onend = () => {
		recognizer = null;
		listening.value = false;
		if (said.value) micHint.value = agentLabels.doneSpeaking;
	};
	recognizer = r;
	r.start();
	listening.value = true;
	micHint.value = agentLabels.listening;
}

function stopListening() {
	try {
		recognizer?.stop();
	} catch {
		// Already stopped.
	}
}

onMounted(() => {
	if (props.tool === 'voice') phase.value = 'voice';
	else if (!props.text.trim()) phase.value = 'empty';
	else void polish(props.tool, props.text);
});

onBeforeUnmount(() => {
	requestSeq++;
	stopListening();
});
</script>

<style lang="scss" module>
.veil {
	position: absolute;
	inset: 0;
	z-index: 3;
	background: rgba(20, 32, 79, 0.18);
}

.sheet {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 4;
	max-height: 78%;
	display: flex;
	flex-direction: column;
	background: var(--MI_THEME-panel);
	border-top: 1px solid var(--MI_THEME-divider);
	border-radius: 18px 18px 0 0;
	box-shadow: 0 -12px 32px -16px rgba(20, 32, 79, 0.35);
}

.head {
	flex: none;
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 8px 6px 16px;
	font-weight: bold;

	> span {
		margin-right: auto;
	}
}

.close {
	width: 38px;
	height: 38px;
	border-radius: 10px;
	display: grid;
	place-items: center;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.scroll {
	overflow: auto;
	overscroll-behavior: contain;
	padding: 0 16px calc(14px + env(safe-area-inset-bottom));
}

.label {
	margin: 10px 0 4px;
	font-size: 0.8em;
	font-weight: bold;
	opacity: 0.7;
}

.quote, .out {
	white-space: pre-wrap;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	padding: 10px 12px;
	background: var(--MI_THEME-bg);
}

.quote {
	max-height: 9em;
	overflow: auto;

	&.empty {
		opacity: 0.5;
	}
}

.out {
	user-select: text;
	line-height: 1.55;
	margin-top: 10px;
	border-color: var(--MI_THEME-accent);
}

// The text it started from: quieter than the result, so the two are not confused.
.source {
	max-height: 6em;
	overflow: auto;
	white-space: pre-wrap;
	font-size: 0.9em;
	opacity: 0.7;
}

.list {
	margin: 0 0 4px;
	padding-left: 18px;
	font-size: 0.95em;

	> li {
		margin: 2px 0;
	}
}

.note {
	margin: 8px 0;
	font-size: 0.9em;
	opacity: 0.75;
}

.error {
	margin: 8px 0;
	color: var(--MI_THEME-error);
}

.actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 12px;
}

.mic {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 8px 0 4px;

	> small {
		text-align: center;
		opacity: 0.75;
	}
}

.micButton {
	width: 72px;
	height: 72px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	font-size: 30px;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);

	&.on {
		animation: pulse 1.2s ease-in-out infinite;
	}
}

@keyframes pulse {
	50% { box-shadow: 0 0 0 12px color-mix(in srgb, var(--MI_THEME-accent) 22%, transparent); }
}
</style>
