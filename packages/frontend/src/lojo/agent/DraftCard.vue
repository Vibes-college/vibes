<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 发到我的电脑 (2026-11-15, redone 11-16): Vibi's draft for the learner's own coding agent. Nothing is sent until the
learner taps. Once sent, the card follows the agent live, like T3 Code's work log: a ticking timer, one line per step,
what it is thinking, an allow / deny right in the card when it asks, and the answer when it is done. -->
<template>
<div :class="[$style.card, sent && $style['is_' + sent.status]]" data-agent-draft>
	<header :class="$style.head">
		<span :class="$style.badge"><i class="ti ti-terminal-2"></i></span>
		<span :class="$style.title">{{ L.title }}</span>
		<button v-if="!sent && !sending && !editing" class="_button" :class="$style.ghost" data-agent-draft-edit @click="startEdit"><i class="ti ti-pencil"></i> {{ L.edit }}</button>
	</header>

	<!-- The instruction -->
	<div :class="$style.body">
		<textarea v-if="editing" ref="editEl" v-model="text" :class="$style.textarea" rows="4" data-agent-draft-text @input="fit"></textarea>
		<div v-else :class="[$style.text, { [$style.clamp]: !textOpen && (sent != null || long) }]" data-agent-draft-shown>{{ text }}</div>
		<button v-if="!editing && (sent != null || long)" class="_button" :class="$style.more" @click="textOpen = !textOpen">{{ textOpen ? L.showLess : L.showAll }}</button>
		<div v-if="editing" :class="$style.editBar">
			<MkButton small rounded primary @click="editing = false">{{ L.editDone }}</MkButton>
		</div>
	</div>

	<!-- Before it is sent -->
	<footer v-if="!sent" :class="$style.foot">
		<template v-if="!paired">
			<span :class="$style.muted"><i class="ti ti-plug-connected-x"></i> {{ L.notPaired }}</span>
			<MkButton small rounded @click="goSettings">{{ L.goConnect }}</MkButton>
		</template>
		<template v-else-if="!paired.cwd">
			<span :class="$style.muted"><i class="ti ti-folder-question"></i> {{ L.noFolder }}</span>
			<MkButton small rounded @click="goSettings">{{ L.goChoose }}</MkButton>
		</template>
		<template v-else>
			<button class="_button" :class="$style.target" :title="paired.cwd" @click="goSettings">
				<i class="ti ti-folder"></i><span>{{ folderName(paired.cwd) }}</span><span :class="[$style.dot, $style.wide]">·</span><span :class="$style.wide">{{ agentName(paired.config) }}</span>
			</button>
			<MkButton primary rounded small :class="$style.sendButton" :disabled="sending || editing" data-agent-draft-send @click="go"><i class="ti ti-send"></i> {{ sending ? L.sending : L.send }}</MkButton>
		</template>
	</footer>

	<!-- Sent: live progress, then the result -->
	<section v-else :class="$style.live" data-agent-draft-live>
		<div :class="$style.status" data-agent-draft-status>
			<i :class="[statusIcon, $style.statusIcon, { [$style.spin]: sent.status === 'running' && !(unknown && live?.offline) }]"></i>
			<span :class="$style.statusText">{{ statusText }}</span>
			<span :class="$style.meta">{{ metaText }}</span>
			<button v-if="working && canFollow && !unknown" class="_button" :class="$style.ghost" data-agent-draft-stop @click="stop"><i class="ti ti-player-stop"></i> {{ L.stop }}</button>
		</div>

		<div v-if="!canFollow && working" :class="$style.hint">{{ L.elsewhere }}</div>
		<div v-else-if="live?.offline && working" :class="$style.hint">{{ L.offline }}</div>

		<!-- It asks: allow or deny right here -->
		<div v-if="live?.permission" :class="$style.ask" data-agent-draft-permission>
			<div :class="$style.askHead"><i class="ti ti-shield-half"></i> {{ L.wants }}{{ live.permission.title }}</div>
			<pre v-if="live.permission.command" :class="$style.askCode">{{ live.permission.command }}</pre>
			<div :class="$style.askButtons">
				<MkButton
					v-for="(a, i) in live.permission.actions" :key="i"
					small rounded :primary="a.behavior === 'allow' && i === firstAllow" :danger="a.behavior === 'deny'" :disabled="answering"
					:data-agent-draft-answer="a.behavior"
					@click="answer(a)"
				>{{ actionLabel(a) }}</MkButton>
			</div>
		</div>

		<!-- What it is thinking now -->
		<div v-if="working && live?.thinking" :class="$style.thinking"><i class="ti ti-sparkles"></i><span>{{ live.thinking }}</span></div>

		<!-- The steps: the latest few while it works; folded once it is done -->
		<div v-if="steps.length > 0" :class="$style.steps" data-agent-draft-steps>
			<button v-if="hiddenCount > 0" class="_button" :class="$style.stepsToggle" @click="allSteps = !allSteps">
				<i :class="allSteps ? 'ti ti-chevron-up' : 'ti ti-chevron-right'"></i>
				{{ allSteps ? L.fold : (working ? L.earlier(hiddenCount) : L.process) }}
			</button>
			<div v-for="(s, i) in shownSteps" :key="steps.length - shownSteps.length + i" :class="[$style.step, $style['step_' + s.state]]">
				<button class="_button" :class="$style.stepRow" :disabled="!s.items?.length" @click="toggleStep(i)">
					<i :class="[stepIcon(s), $style.stepIcon]"></i>
					<span :class="[$style.stepLabel, { [$style.mono]: s.kind === 'shell' && !s.items }]">{{ s.label }}</span>
					<i v-if="s.state === 'running'" class="ti ti-loader-2" :class="$style.spin"></i>
					<i v-else-if="s.items?.length" :class="[openSteps.has(stepKey(i)) ? 'ti ti-chevron-up' : 'ti ti-chevron-down', $style.chev]"></i>
				</button>
				<ul v-if="s.items?.length && openSteps.has(stepKey(i))" :class="$style.items">
					<li v-for="(it, j) in s.items" :key="j">{{ it }}</li>
				</ul>
			</div>
		</div>

		<!-- The result -->
		<template v-if="finished">
			<div v-if="files.length > 0" :class="$style.files">
				<span :class="$style.filesHead"><i class="ti ti-file-diff"></i> {{ L.changed(files.length) }}</span>
				<span v-for="f in files.slice(0, 6)" :key="f" :class="$style.file" :title="f">{{ folderName(f) }}</span>
				<span v-if="files.length > 6" :class="$style.file">+{{ files.length - 6 }}</span>
			</div>
			<div v-if="answerText" :class="$style.answer" data-agent-draft-result>
				<div :class="[$style.answerBody, { [$style.answerClamp]: !answerOpen && answerLong }]">
					<XAgentText :text="answerText"/>
				</div>
				<button v-if="answerLong" class="_button" :class="$style.more" @click="answerOpen = !answerOpen">{{ answerOpen ? L.showLess : L.showAll }}</button>
			</div>
			<div v-else-if="sent.status === 'done'" :class="$style.hint">{{ L.noAnswer }}</div>

			<div v-if="sent.handedBack" :class="$style.handed"><i class="ti ti-check"></i> {{ L.handedBack(myTutorName) }}</div>
			<div v-else-if="answerText" :class="$style.handRow">
				<MkButton rounded small primary :disabled="handing" data-agent-draft-handback @click="handBack"><i class="ti ti-sparkles"></i> {{ L.handBack(myTutorName) }}</MkButton>
				<span :class="$style.handHint">{{ L.handBackHint(myTutorName) }}</span>
			</div>
		</template>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import XAgentText from './AgentText.vue';
import { draftLabels as L } from './draftCard.js';
import { myTutorName } from '@/lojo/tutor/persona.js';
import { agentName, answerPermission, handBackText, paired, send, sentState, setSentState, stopTask, watch } from './bridge.js';
import { elapsed } from './worklog.js';
import type { Live, Permission, SentState } from './bridge.js';
import type { Step } from './worklog.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router.js';
import * as os from '@/os.js';

const props = defineProps<{
	draftId: string;
	text: string;
	tutorId: string;
}>();

const router = useRouter();
const editEl = useTemplateRef('editEl');

const text = ref(props.text);
const editing = ref(false);
const textOpen = ref(false);
const sending = ref(false);
const sent = ref<SentState | null>(sentState(props.draftId));
const live = ref<Live | null>(null);
const allSteps = ref(false);
const openSteps = ref(new Set<string>());
const answerOpen = ref(false);
const answering = ref(false);
const handing = ref(false);
const now = ref(Date.now());

const long = computed(() => text.value.length > 280 || text.value.split('\n').length > 6);
const working = computed(() => sent.value?.status === 'running' || sent.value?.status === 'permission');
const finished = computed(() => sent.value != null && !working.value);
// The pairing lives in one browser; a card sent from another one cannot be followed here.
const canFollow = computed(() => paired.value != null);
// "Working" is only what we saw last. Until the computer answers (the card may be opened hours later, when the task
// has long finished), say so instead of a timer that keeps counting.
const unknown = computed(() => working.value && canFollow.value && (live.value == null || live.value.offline));

const steps = computed<Step[]>(() => live.value?.steps ?? sent.value?.steps ?? []);
const files = computed(() => live.value?.files ?? sent.value?.files ?? []);
const answerText = computed(() => ((finished.value ? sent.value?.answer : '') || (sent.value?.status === 'error' ? sent.value?.error : '') || '').trim());
const answerLong = computed(() => answerText.value.length > 420 || answerText.value.split('\n').length > 8);

const VISIBLE = 5;
const hiddenCount = computed(() => (working.value ? Math.max(0, steps.value.length - VISIBLE) : steps.value.length));
const shownSteps = computed(() => (allSteps.value ? steps.value : working.value ? steps.value.slice(-VISIBLE) : []));
const firstAllow = computed(() => live.value?.permission?.actions.findIndex(a => a.behavior === 'allow') ?? -1);

const statusIcon = computed(() => {
	if (unknown.value && live.value?.offline) return 'ti ti-wifi-off';
	switch (sent.value?.status) {
		case 'running': return 'ti ti-loader-2';
		case 'permission': return 'ti ti-shield-half';
		case 'done': return 'ti ti-circle-check';
		case 'error': return 'ti ti-circle-x';
		case 'stopped': return 'ti ti-player-stop';
		default: return 'ti ti-help-circle';
	}
});

const statusText = computed(() => {
	if (unknown.value) return live.value?.offline ? L.unreachable : L.checking;
	switch (sent.value?.status) {
		case 'running': return L.working;
		case 'permission': return L.asking;
		case 'done': return L.done;
		case 'error': return L.error;
		case 'stopped': return L.stopped;
		default: return L.lost;
	}
});

const metaText = computed(() => {
	const st = sent.value;
	if (!st || unknown.value) return '';
	const end = st.endedAt ? Date.parse(st.endedAt) : now.value;
	const parts = [working.value ? elapsed(end - Date.parse(st.at)) : L.took(elapsed(end - Date.parse(st.at)))];
	const n = live.value?.count ?? st.count ?? 0;
	if (n > 0) parts.push(L.steps(n));
	return parts.join(' · ');
});

function folderName(path: string): string {
	return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

function stepIcon(s: Step): string {
	if (s.state === 'failed') return 'ti ti-alert-triangle';
	switch (s.kind) {
		case 'read': return 'ti ti-file-text';
		case 'edit': return 'ti ti-pencil';
		case 'shell': return 'ti ti-terminal';
		case 'search': return 'ti ti-search';
		case 'web': return 'ti ti-world';
		case 'agent': return 'ti ti-users';
		case 'plan': return 'ti ti-list-check';
		case 'note': return 'ti ti-message-dots';
		case 'error': return 'ti ti-alert-triangle';
		default: return 'ti ti-tool';
	}
}

function stepKey(i: number): string {
	return `${steps.value.length - shownSteps.value.length + i}`;
}

function toggleStep(i: number) {
	const k = stepKey(i);
	const next = new Set(openSteps.value);
	if (next.has(k)) next.delete(k);
	else next.add(k);
	openSteps.value = next;
}

// Paseo's own action labels are English; the usual ones in plain Chinese.
function actionLabel(a: Permission['actions'][number]): string {
	const l = a.label.toLowerCase();
	if (a.behavior === 'deny') return /deny|reject|no|拒绝/.test(l) || l === '' ? '拒绝' : a.label;
	if (/always|don't ask|dont ask|session/.test(l)) return '这次任务都允许';
	if (/^(allow|yes|approve|accept|allow once|ok)$/.test(l) || l === '') return '允许';
	return a.label;
}

function startEdit() {
	editing.value = true;
	void nextTick(() => {
		fit();
		editEl.value?.focus();
	});
}

function fit() {
	const el = editEl.value;
	if (!el) return;
	el.style.height = 'auto';
	el.style.height = `${Math.min(el.scrollHeight + 2, 360)}px`;
}

function goSettings() {
	router.push('/settings/agent');
}

let stopWatch: (() => void) | null = null;
let ticker: number | null = null;

function follow() {
	stopWatch?.();
	stopWatch = null;
	if (!working.value || !canFollow.value) return;
	stopWatch = watch(props.draftId, l => {
		live.value = l;
		sent.value = l.st;
		if (!working.value) {
			stopWatch = null;
			// The answer is what matters now; the steps fold away (they stay one tap away).
			allSteps.value = false;
		}
	});
}

async function go() {
	if (text.value.trim() === '') return os.toast(L.needText);
	sending.value = true;
	try {
		sent.value = await send(props.draftId, text.value.trim());
		follow();
	} catch (err) {
		const m = err instanceof Error ? err.message : String(err);
		os.alert({ type: 'error', text: L.sendFailed + (m === 'no-folder' ? L.noFolder : `${m}。请确认电脑开着、Paseo 在运行。`) });
	} finally {
		sending.value = false;
	}
}

async function answer(a: Permission['actions'][number]) {
	const p = live.value?.permission;
	if (!p) return;
	answering.value = true;
	try {
		await answerPermission(props.draftId, p, a);
		if (live.value) live.value = { ...live.value, permission: null };
	} catch (err) {
		os.toast(err instanceof Error ? err.message : String(err));
	} finally {
		answering.value = false;
	}
}

async function stop() {
	const { canceled } = await os.confirm({ type: 'warning', text: L.stopConfirm, okText: L.stop });
	if (canceled) return;
	try {
		await stopTask(props.draftId);
	} catch (err) {
		os.toast(err instanceof Error ? err.message : String(err));
	}
}

async function handBack() {
	if (!sent.value) return;
	handing.value = true;
	try {
		await misskeyApi('chat/messages/create-to-user', { toUserId: props.tutorId, text: handBackText(props.draftId, sent.value) });
		sent.value = { ...sent.value, handedBack: true };
		setSentState(props.draftId, sent.value);
	} catch (err) {
		os.toast(err instanceof Error ? err.message : String(err));
	} finally {
		handing.value = false;
	}
}

onMounted(() => {
	ticker = window.setInterval(() => { if (working.value) now.value = Date.now(); }, 1000);
	follow();
});

onBeforeUnmount(() => {
	stopWatch?.();
	if (ticker != null) window.clearInterval(ticker);
});
</script>

<style lang="scss" module>
.card {
	--card-pad: 14px;
	// A fixed width, not min(440px, 100%): the size container below would otherwise let the message shrink around nothing.
	container-type: inline-size;
	display: flex;
	flex-direction: column;
	width: 440px;
	max-width: 100%;
	border-radius: 14px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	font-size: 0.9em;
	line-height: 1.55;
	overflow: hidden;
}

.head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px var(--card-pad) 0;
}

.badge {
	flex: none;
	display: grid;
	place-items: center;
	width: 24px;
	height: 24px;
	border-radius: 7px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 14px;
}

.title {
	font-weight: bold;
	margin-right: auto;
}

.ghost {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 8px;
	border-radius: 8px;
	font-size: 0.9em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
		color: var(--MI_THEME-fg);
	}
}

.body {
	padding: 8px var(--card-pad) 10px;
}

.text {
	white-space: pre-wrap;
	word-break: break-word;
}

.clamp {
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	overflow: hidden;
}

.textarea {
	display: block;
	width: 100%;
	box-sizing: border-box;
	padding: 8px 10px;
	border-radius: 10px;
	border: 1px solid var(--MI_THEME-accent);
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
	font: inherit;
	resize: none;
	outline: none;
}

.editBar {
	display: flex;
	justify-content: flex-end;
	margin-top: 6px;
}

.more {
	margin-top: 2px;
	font-size: 0.9em;
	color: var(--MI_THEME-accent);
}

.foot {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px var(--card-pad);
	border-top: 1px solid var(--MI_THEME-divider);
	justify-content: space-between;
}

.muted {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	font-size: 0.92em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
}

.target {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	min-width: 0;
	padding: 4px 8px;
	margin-left: -8px;
	border-radius: 8px;
	font-size: 0.92em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 75%, transparent);

	> span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.dot {
	opacity: 0.5;
}

// On a phone the folder name is what matters; which agent runs it is in settings.
@container (max-width: 340px) {
	.wide {
		display: none;
	}
}

.sendButton {
	flex: none;
	white-space: nowrap;
}

.live {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 10px var(--card-pad) 12px;
	border-top: 1px solid var(--MI_THEME-divider);
}

.status {
	display: flex;
	align-items: center;
	gap: 6px;
	min-height: 26px;
}

.statusIcon {
	font-size: 17px;
}

.statusText {
	font-weight: bold;
}

.meta {
	margin-right: auto;
	font-size: 0.9em;
	font-variant-numeric: tabular-nums;
	color: color-mix(in srgb, var(--MI_THEME-fg) 60%, transparent);
}

.is_running .statusIcon {
	color: var(--MI_THEME-accent);
}

.is_permission .statusIcon {
	color: var(--MI_THEME-warn);
}

.is_done .statusIcon {
	color: var(--MI_THEME-success);
}

.is_error .statusIcon {
	color: var(--MI_THEME-error);
}

.is_stopped .statusIcon, .is_lost .statusIcon {
	opacity: 0.6;
}

.spin {
	animation: spin 0.9s linear infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.hint {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.9em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
}

.ask {
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 10px 12px;
	border-radius: 10px;
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-infoWarnFg);
}

.askHead {
	display: flex;
	align-items: center;
	gap: 6px;
	font-weight: bold;
}

.askCode {
	margin: 0;
	padding: 6px 8px;
	border-radius: 6px;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
	font-size: 0.88em;
	white-space: pre-wrap;
	word-break: break-all;
	max-height: 120px;
	overflow: auto;
}

.askButtons {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.thinking {
	display: flex;
	align-items: baseline;
	gap: 6px;
	font-size: 0.92em;
	font-style: italic;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);

	> i {
		font-style: normal;
		color: var(--MI_THEME-accent);
	}
}

.steps {
	display: flex;
	flex-direction: column;
	gap: 1px;
}

.stepsToggle {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	align-self: flex-start;
	padding: 2px 0;
	font-size: 0.88em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 60%, transparent);

	&:hover {
		color: var(--MI_THEME-fg);
	}
}

.stepRow {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	min-height: 26px;
	padding: 2px 4px;
	margin: 0 -4px;
	border-radius: 6px;
	text-align: left;
	color: color-mix(in srgb, var(--MI_THEME-fg) 78%, transparent);

	&:not(:disabled):hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:disabled {
		cursor: default;
	}
}

.stepIcon {
	flex: none;
	width: 16px;
	text-align: center;
	opacity: 0.7;
}

.stepLabel {
	flex: 1;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.mono {
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.92em;
}

.step_running .stepRow {
	color: var(--MI_THEME-fg);
}

.step_failed .stepRow {
	color: var(--MI_THEME-error);
}

.chev {
	flex: none;
	opacity: 0.5;
	font-size: 0.9em;
}

.items {
	margin: 0 0 4px 24px;
	padding: 0;
	list-style: none;
	font-size: 0.88em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);

	> li {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
}

.files {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
}

.filesHead {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 0.9em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
}

.file {
	max-width: 160px;
	padding: 1px 8px;
	border-radius: 999px;
	background: var(--MI_THEME-bg);
	font-size: 0.85em;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.answer {
	padding: 10px 12px;
	border-radius: 10px;
	background: color-mix(in srgb, var(--MI_THEME-bg) 70%, transparent);
}

.answerBody {
	position: relative;
}

.answerClamp {
	max-height: 11em;
	overflow: hidden;
	mask-image: linear-gradient(to bottom, black 70%, transparent);
}

.handRow {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
}

.handHint {
	font-size: 0.82em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);
}

.handed {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.9em;
	color: var(--MI_THEME-success);
}
</style>
