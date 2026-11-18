<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 发到我的电脑: what the learner handed back to Vibi from their computer, shown as outside content, not as their words.
Folded to a few lines: Vibi's summary right below is what the learner reads. -->
<template>
<div :class="$style.card" data-agent-result>
	<button class="_button" :class="$style.head" @click="open = !open">
		<i class="ti ti-device-laptop"></i>
		<span :class="$style.title">{{ L.resultCardTitle }}</span>
		<span :class="$style.note">{{ L.resultCardNote(myTutorName) }}</span>
		<i :class="open ? 'ti ti-chevron-up' : 'ti ti-chevron-down'"></i>
	</button>
	<div v-if="did" :class="$style.did">{{ did }}</div>
	<div v-if="open" :class="$style.body"><XAgentText :text="body"/></div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XAgentText from './AgentText.vue';
import { agentText as L } from '@/lojo/locales/agent.js';
import { myTutorName } from '@/lojo/tutor/persona.js';

defineProps<{ did: string; body: string }>();
const open = ref(false);
</script>

<style lang="scss" module>
.card {
	display: flex;
	flex-direction: column;
	gap: 6px;
	width: min(420px, 100%);
	margin-left: auto;
	padding: 10px 12px;
	border-radius: 12px;
	border: 1px dashed var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	font-size: 0.85em;
}

.head {
	display: flex;
	align-items: center;
	gap: 6px;
	width: 100%;
	text-align: left;
	color: color-mix(in srgb, var(--MI_THEME-fg) 80%, transparent);
}

.title {
	font-weight: bold;
}

.note {
	margin-right: auto;
	font-size: 0.9em;
	opacity: 0.65;
}

.did {
	line-height: 1.5;
	color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
}

.body {
	padding-top: 6px;
	border-top: 1px solid var(--MI_THEME-divider);
}
</style>
