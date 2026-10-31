<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/agent" label="召唤 Agent" :keywords="['agent', 'paseo', 'claude', 'codex', 'prompt']" icon="ti ti-robot">
	<div class="_gaps_m">
		<div :class="$style.intro">
			<p>{{ agentLabels.intro }}</p>
		</div>

		<FormSection first>
			<template #label>{{ agentLabels.needTitle }}</template>
			<ul :class="$style.needs">
				<li>{{ agentLabels.needPaseo }}（<a href="https://paseo.sh" target="_blank" rel="noopener noreferrer" class="_link">paseo.sh</a>）</li>
				<li>{{ agentLabels.needAgent }}</li>
			</ul>
		</FormSection>

		<div v-if="!agentState.summoned" class="_gaps_s">
			<MkInput v-model="name" :placeholder="agentLabels.namePlaceholder" @enter="summon">
				<template #label>{{ agentLabels.name }}</template>
			</MkInput>
			<MkButton primary rounded @click="summon">{{ agentLabels.summon }}</MkButton>
			<div :class="$style.note">{{ agentLabels.offNote }}</div>
		</div>
		<div v-else :class="$style.done">
			<span>{{ agentLabels.summoned(agentName) }}</span>
			<MkButton rounded @click="dismiss">{{ agentLabels.dismiss }}</MkButton>
		</div>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import { agentLabels } from '@/lojo/agent/labels.js';
import { agentName, agentState, dismissAgent, summonAgent } from '@/lojo/agent/state.js';
import { definePage } from '@/page.js';
import * as os from '@/os.js';

const name = ref('');

function summon() {
	summonAgent(name.value);
}

async function dismiss() {
	const { canceled } = await os.confirm({ type: 'question', text: agentLabels.dismissConfirm(agentName.value), okText: agentLabels.dismiss });
	if (canceled) return;
	dismissAgent();
}

definePage(() => ({
	title: agentLabels.settingsTitle,
	icon: 'ti ti-robot',
}));
</script>

<style lang="scss" module>
.intro > p {
	margin: 0;
	line-height: 1.6;
}

.needs {
	margin: 0;
	padding-left: 20px;

	> li {
		margin: 2px 0;
	}
}

.note {
	font-size: 0.85em;
	opacity: 0.75;
}

.done {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;
}
</style>
