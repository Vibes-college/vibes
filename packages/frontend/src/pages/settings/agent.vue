<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- AI tutor (2026-11-16, was 「召唤 Agent」): connect the learner's own computer so the AI tutor's draft cards can be sent
there. The 「在首页显示 Momo」 switch moved to the ⋯ menu of the chat with Momo (founder 11-17 01:29 PT); this page only says
where it is now. -->
<template>
<SearchMarker path="/settings/agent" :label="vibiLabels.settingsTitle" :keywords="['momo', 'vibi', 'tutor', 'agent', 'paseo', 'claude', 'codex']" icon="ti ti-sparkles">
	<div class="_gaps_m">
		<FormSection first>
			<template #label>{{ myTutorName }}</template>
			<MkInfo data-vibi-where>{{ vibiLabels.showOnHomeWhere(myTutorName) }}</MkInfo>
		</FormSection>

		<XConnect/>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import FormSection from '@/components/form/section.vue';
import MkInfo from '@/components/MkInfo.vue';
import { vibiLabels } from '@/lojo/agent/labels.js';
import XConnect from '@/lojo/agent/ConnectSection.vue';
import { myTutorName } from '@/lojo/tutor/persona.js';
import { definePage } from '@/page.js';

definePage(() => ({
	title: vibiLabels.settingsTitle,
	icon: 'ti ti-sparkles',
}));
</script>
