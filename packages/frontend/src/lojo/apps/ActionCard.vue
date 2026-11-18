<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 第 6 步 (2026-11-17): a change Vibi asked for in a mini app (add a word to the wordbook…), under her reply. Nothing is
written until the learner taps 确认; 取消 writes nothing. The card reads its state from the server, so it shows the same
in every tab and after a reload. -->
<template>
<div :class="[$style.card, $style[state]]" data-app-action :data-app-action-state="state">
	<div :class="$style.head">
		<i :class="[$style.icon, icon]"></i>
		<span :class="$style.title">{{ state === 'done' ? (view?.appName ?? S.done) : S.title }}</span>
		<span v-if="view?.appName && state !== 'done'" :class="$style.app">{{ view.appName }}</span>
	</div>
	<div :class="$style.text">{{ state === 'done' ? doneText : sentence }}</div>

	<template v-if="state === 'pending'">
		<div :class="$style.hint">{{ S.hint }}</div>
		<div :class="$style.buttons">
			<button class="_button" :class="$style.cancel" :disabled="busy" data-app-action-cancel @click="decide('cancel')">{{ S.cancel }}</button>
			<button class="_button" :class="$style.confirm" :disabled="busy" data-app-action-confirm @click="decide('confirm')">{{ S.confirm }}</button>
		</div>
	</template>
	<div v-else-if="state === 'running'" :class="$style.note"><MkLoading :em="true"/> {{ S.running }}</div>
	<template v-else-if="state === 'failed'">
		<div :class="$style.note">{{ S.failed }}: {{ why }}</div>
		<div :class="$style.buttons">
			<button class="_button" :class="$style.cancel" :disabled="busy" data-app-action-cancel @click="decide('cancel')">{{ S.cancel }}</button>
			<button class="_button" :class="$style.confirm" :disabled="busy" data-app-action-confirm @click="decide('confirm')">{{ S.retry }}</button>
		</div>
	</template>
	<a v-else-if="state === 'done' && view?.appUrl" :href="view.appUrl" :class="$style.open" data-app-action-open>{{ S.open(view.appName) }} <i class="ti ti-chevron-right"></i></a>
	<div v-else-if="state === 'cancelled'" :class="$style.note">{{ S.cancelled }}</div>
	<div v-else-if="state === 'expired'" :class="$style.note">{{ S.expired }}</div>
	<div v-else-if="state === 'gone'" :class="$style.note">{{ S.gone }}</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { appActionErrorKind, decideAppAction, showAppAction } from './actionCard.js';
import type { AppActionView } from './actionCard.js';
import { vt, vibesLang } from '@/lojo/locales/index.js';
import * as os from '@/os.js';

const S = vt.appAction;

const props = defineProps<{
	/** the sentence in the message (Chinese), shown until the card's state has loaded */
	sentence: string;
	actionId: string;
}>();

const view = ref<AppActionView | null>(null);
/** the server has no such card for this learner (gone after 30 days, or not theirs) */
const gone = ref(false);
const busy = ref(false);

const state = computed(() => (gone.value ? 'gone' : view.value?.status ?? 'pending'));
const sentence = computed(() => view.value?.text[vibesLang] || props.sentence);
const doneText = computed(() => view.value?.done[vibesLang] ?? S.done);
const icon = computed(() => ({
	pending: 'ti ti-hand-finger',
	running: 'ti ti-loader-2',
	done: 'ti ti-circle-check',
	failed: 'ti ti-alert-circle',
	cancelled: 'ti ti-circle-x',
	expired: 'ti ti-clock-x',
	gone: 'ti ti-clock-x',
})[state.value]);
const why = computed(() => {
	const kind = appActionErrorKind(view.value?.error ?? null);
	return kind === 'down' ? S.down : kind === 'refused' ? S.refused : (view.value?.error ?? '');
});

onMounted(async () => {
	const v = await showAppAction(props.actionId);
	if (v === null) gone.value = true;
	else if (v !== undefined) view.value = v;
});

async function decide(decision: 'confirm' | 'cancel') {
	if (busy.value) return;
	busy.value = true;
	if (decision === 'confirm' && view.value) view.value = { ...view.value, status: 'running' };
	try {
		const v = await decideAppAction(props.actionId, decision);
		if (v === null) gone.value = true;
		else if (v === undefined) {
			os.toast(S.loadFailed);
			view.value = (await showAppAction(props.actionId)) ?? view.value;
		} else view.value = v;
	} finally {
		busy.value = false;
	}
}
</script>

<style lang="scss" module>
.card {
	--c: var(--MI_THEME-accent);
	max-width: 340px;
	padding: 12px 14px;
	border-radius: 12px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	box-shadow: inset 3px 0 0 var(--c);
	font-size: 0.9em;
	line-height: 1.5;
}

.head {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
}

.icon {
	flex: none;
	color: var(--c);
}

.title {
	font-weight: bold;
}

.app {
	margin-left: auto;
	font-size: 0.85em;
	opacity: 0.65;
}

.text {
	color: var(--MI_THEME-fg);
	overflow-wrap: anywhere;
}

.hint,
.note {
	margin-top: 6px;
	font-size: 0.85em;
	opacity: 0.7;
}

.buttons {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 10px;
}

.confirm,
.cancel {
	min-height: 36px;
	padding: 0 16px;
	border-radius: 999px;
	font-weight: bold;

	&:disabled {
		opacity: 0.5;
	}
}

.confirm {
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
}

.cancel {
	background: var(--MI_THEME-buttonBg);
	color: var(--MI_THEME-fg);
}

.open {
	display: inline-flex;
	align-items: center;
	gap: 2px;
	margin-top: 8px;
	color: var(--MI_THEME-accent);
	font-weight: bold;
}

.done {
	--c: var(--MI_THEME-success);
}

.failed {
	--c: var(--MI_THEME-error);
}

.cancelled,
.expired,
.gone {
	--c: var(--MI_THEME-divider);
	opacity: 0.7;

	.text {
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
	}
}
</style>
