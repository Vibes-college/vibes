<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 私信任务标签: a change Vibi made to the plan, under her reply, with 「撤销」 (需求-社区工程 第九节「改动卡片」). -->
<template>
<div :class="[$style.card, { [$style.undone]: undone }]" :style="{ '--c': color }" data-plan-change>
	<i class="ti ti-calendar-event" :class="$style.icon"></i>
	<div :class="$style.text">{{ summary }}</div>
	<span v-if="undone" :class="$style.state">{{ S.undone }}</span>
	<button v-else-if="!mine" class="_button" :class="$style.undo" :disabled="busy" data-plan-change-undo @click="undo">{{ S.undo }}</button>
</div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { planStrings as S } from './strings.js';
import { recentPlanChanges } from './changeCard.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';

const props = defineProps<{
	summary: string;
	changeId: string;
	mine?: boolean;
}>();

const undone = ref(false);
const busy = ref(false);
const stage = ref<number | null>(null);
const color = computed(() => (stage.value == null || stage.value === 0 ? 'var(--MI_THEME-accent)' : ['#E8603F', '#2340A3', '#B8871B'][stage.value - 1] ?? 'var(--MI_THEME-accent)'));

onMounted(async () => {
	const r = await recentPlanChanges();
	stage.value = r.stageNow;
	if (r.changes.find(c => c.id === props.changeId)?.undone) undone.value = true;
});

async function undo() {
	busy.value = true;
	try {
		const r = await misskeyApi('lojo/plan/undo', { changeId: props.changeId }) as unknown as { ok: boolean; reason?: string; code?: string };
		// the reason is in the learner's interface language (界面语言第②批), so "already undone" is told by its code
		if (r.ok || r.code === 'alreadyUndone') {
			undone.value = true;
			recentPlanChanges(true);
		} else {
			os.toast(r.reason ?? S.loadFailed);
		}
	} catch {
		os.toast(S.loadFailed);
	} finally {
		busy.value = false;
	}
}
</script>

<style lang="scss" module>
.card {
	display: flex;
	align-items: center;
	gap: 10px;
	max-width: 340px;
	padding: 10px 12px 10px 14px;
	border-radius: 12px;
	background: var(--MI_THEME-panel);
	border: 1px solid var(--MI_THEME-divider);
	box-shadow: inset 3px 0 0 var(--c);
	font-size: 0.9em;
	line-height: 1.5;
	transition: opacity 0.2s ease;
}

.icon {
	flex: none;
	color: var(--c);
	opacity: 0.9;
}

.text {
	flex: 1;
	min-width: 0;
	color: var(--MI_THEME-fg);
}

.undo {
	flex: none;
	padding: 4px 2px;
	color: var(--MI_THEME-accent);
	font-weight: bold;

	&:disabled {
		opacity: 0.5;
	}
}

.state {
	flex: none;
	font-size: 0.9em;
	opacity: 0.7;
}

.undone {
	opacity: 0.55;
	box-shadow: inset 3px 0 0 var(--MI_THEME-divider);

	.icon {
		color: inherit;
	}

	.text {
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
	}
}
</style>
