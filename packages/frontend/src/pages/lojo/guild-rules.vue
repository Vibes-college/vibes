<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 《公会守则》：注册弹窗、存档表单和「设置 → 关于」都链到这一页。字在 lojo/guild-rules.ts。 -->
<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 600px;">
		<div :class="$style.card">
			<h1 :class="$style.title">公会守则</h1>
			<ol :class="$style.rules">
				<li v-for="r in GUILD_RULES" :key="r.head"><b>{{ r.head }}</b>{{ r.body }}</li>
			</ol>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { definePage } from '@/page.js';
import { GUILD_RULES } from '@/lojo/guild-rules.js';

definePage(() => ({ title: '公会守则', icon: 'ti ti-shield-check' }));
</script>

<style lang="scss" module>
.card {
	padding: 24px 22px;
	border-radius: 14px;
	background: var(--MI_THEME-panel);
}

.title {
	margin: 0 0 16px;
	font-size: 1.4em;
}

.rules {
	margin: 0;
	padding-left: 1.4em;
	line-height: 1.8;

	> li + li {
		margin-top: 10px;
	}
}
</style>
