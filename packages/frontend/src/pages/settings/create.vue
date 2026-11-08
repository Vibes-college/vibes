<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 生产者视角: one switch, kept in the account registry (lojo/create/state.ts), so it follows the account. -->
<template>
<SearchMarker path="/settings/create" label="生产者视角" :keywords="['creator', 'create', 'marketing', '创作', '生产者', '创作讲解']" icon="ti ti-bulb">
	<div class="_gaps_m">
		<MkSwitch :modelValue="creatorView" :disabled="saving" @update:modelValue="toggle">
			<template #label>{{ createLabels.settingsTitle }}</template>
			<template #caption>{{ createLabels.settingsCaption }}</template>
		</MkSwitch>

		<div :class="$style.swap" aria-hidden="true">
			<span :class="[$style.side, { [$style.current]: !creatorView }]">
				<small>{{ createLabels.swapOff }}</small>
				<span :class="$style.pill"><i class="ti ti-language"></i>{{ createLabels.explain }}</span>
			</span>
			<i class="ti ti-arrow-right" :class="$style.arrow"></i>
			<span :class="[$style.side, { [$style.current]: creatorView }]">
				<small>{{ createLabels.swapOn }}</small>
				<span :class="[$style.pill, $style.hot]"><i class="ti ti-bulb"></i>{{ createLabels.button }}</span>
			</span>
		</div>

		<p :class="$style.note">{{ createLabels.settingsSources }}</p>

		<div v-if="creatorView">
			<MkButton rounded inline to="/create"><i class="ti ti-layout-dashboard"></i> {{ createLabels.openStudio }}</MkButton>
		</div>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { createLabels } from '@/lojo/create/labels.js';
import { creatorView, loadCreateState, setCreatorView } from '@/lojo/create/state.js';
import { definePage } from '@/page.js';
import * as os from '@/os.js';

const saving = ref(false);

loadCreateState();

async function toggle(on: boolean) {
	saving.value = true;
	try {
		await setCreatorView(on);
	} catch {
		os.toast(createLabels.saveFailed);
	} finally {
		saving.value = false;
	}
}

definePage(() => ({
	title: createLabels.settingsTitle,
	icon: 'ti ti-bulb',
}));
</script>

<style lang="scss" module>
.swap {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 16px 12px;
	border-radius: var(--MI-radius);
	background: color-mix(in srgb, var(--MI_THEME-fg) 5%, var(--MI_THEME-panel));
}

.side {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	opacity: 0.5;
	transition: opacity 0.15s;

	> small {
		font-size: 0.8em;
		color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
	}
}

.current {
	opacity: 1;
}

.arrow {
	color: color-mix(in srgb, var(--MI_THEME-fg) 40%, transparent);
}

.pill {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 0.85em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-buttonBg);
}

.hot {
	color: #fff;
	background: var(--MI_THEME-cta);
}

.note {
	margin: 0;
	font-size: 0.85em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 70%, transparent);
}
</style>
