<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.banner">
		<i class="ti ti-checklist"></i>
	</div>
	<div class="_spacer" style="--MI_SPACER-min: 20px; --MI_SPACER-max: 28px;">
		<div class="_gaps_m">
			<!-- Vibes（新手前三分钟，2026-11-11）：去掉「此服务器已禁用联邦功能」「请好好阅读」和 Misskey 的「基本注意事项」链接，
			换成我们自己的《公会守则》；「同意」整行能点，不再二次确认。字见 冲刺1111/新手前三分钟/文案.md B 节 -->
			<MkInfo v-if="instance.disableRegistration" warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>

			<div style="text-align: center;">开打之前，看一眼公会守则。</div>

			<MkFolder v-if="availableServerRules" :defaultOpen="true">
				<template #label>{{ i18n.ts.serverRules }}</template>
				<template #suffix><i v-if="agreeServerRules" class="ti ti-check" style="color: var(--MI_THEME-success)"></i></template>

				<ol class="_gaps_s" :class="$style.rules">
					<li v-for="item in instance.serverRules" :class="$style.rule"><div :class="$style.ruleText" v-html="item"></div></li>
				</ol>

				<button type="button" class="_button" :class="[$style.agree, { [$style.on]: agreeServerRules }]" @click="agreeServerRules = !agreeServerRules"><i :class="agreeServerRules ? 'ti ti-square-check-filled' : 'ti ti-square'"></i>我看过了，同意</button>
			</MkFolder>

			<MkFolder v-if="availableTos || availablePrivacyPolicy" :defaultOpen="true">
				<template #label>{{ tosPrivacyPolicyLabel }}</template>
				<template #suffix><i v-if="agreeTosAndPrivacyPolicy" class="ti ti-check" style="color: var(--MI_THEME-success)"></i></template>
				<div class="_gaps_s">
					<div v-if="availableTos"><a :href="instance.tosUrl ?? undefined" class="_link" target="_blank">{{ i18n.ts.termsOfService }} <i class="ti ti-external-link"></i></a></div>
					<div v-if="availablePrivacyPolicy"><a :href="instance.privacyPolicyUrl ?? undefined" class="_link" target="_blank">{{ i18n.ts.privacyPolicy }} <i class="ti ti-external-link"></i></a></div>
				</div>

				<button type="button" class="_button" :class="[$style.agree, { [$style.on]: agreeTosAndPrivacyPolicy }]" @click="agreeTosAndPrivacyPolicy = !agreeTosAndPrivacyPolicy"><i :class="agreeTosAndPrivacyPolicy ? 'ti ti-square-check-filled' : 'ti ti-square'"></i>我看过了，同意</button>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #label>公会守则</template>
				<template #suffix><i v-if="agreeNote" class="ti ti-check" style="color: var(--MI_THEME-success)"></i></template>

				<ol class="_gaps_s" :class="$style.guild">
					<li v-for="r in GUILD_RULES" :key="r.head"><b>{{ r.head }}</b>{{ r.body }}</li>
				</ol>

				<button type="button" class="_button" :class="[$style.agree, { [$style.on]: agreeNote }]" data-testid="signup-rules-notes-agree" @click="agreeNote = !agreeNote"><i :class="agreeNote ? 'ti ti-square-check-filled' : 'ti ti-square'"></i>我看过了，同意</button>
			</MkFolder>

			<div class="_buttonsCenter">
				<MkButton inline rounded @click="emit('cancel')">算了</MkButton>
				<MkButton inline primary rounded gradate :disabled="!agreed" data-testid="signup-rules-continue" @click="emit('done')">下一步 <i class="ti ti-arrow-right"></i></MkButton>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInfo from '@/components/MkInfo.vue';
import { GUILD_RULES } from '@/lojo/guild-rules.js';

const availableServerRules = instance.serverRules.length > 0;
const availableTos = instance.tosUrl != null && instance.tosUrl !== '';
const availablePrivacyPolicy = instance.privacyPolicyUrl != null && instance.privacyPolicyUrl !== '';

const agreeServerRules = ref(false);
const agreeTosAndPrivacyPolicy = ref(false);
const agreeNote = ref(false);

const agreed = computed(() => {
	return (!availableServerRules || agreeServerRules.value) && ((!availableTos && !availablePrivacyPolicy) || agreeTosAndPrivacyPolicy.value) && agreeNote.value;
});

const emit = defineEmits<{
	(ev: 'cancel'): void;
	(ev: 'done'): void;
}>();

const tosPrivacyPolicyLabel = computed(() => {
	if (availableTos && availablePrivacyPolicy) {
		return i18n.ts.tosAndPrivacyPolicy;
	} else if (availableTos) {
		return i18n.ts.termsOfService;
	} else if (availablePrivacyPolicy) {
		return i18n.ts.privacyPolicy;
	} else {
		return '';
	}
});
</script>

<style lang="scss" module>
.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.guild {
	margin: 0;
	padding-left: 1.4em;
	line-height: 1.7;
}

.agree {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	margin-top: 16px;
	padding: 10px 12px;
	border-radius: 8px;
	background: var(--MI_THEME-buttonBg);
	font-weight: bold;
	text-align: left;

	> i {
		font-size: 1.3em;
	}

	&.on {
		color: var(--MI_THEME-accent);
	}
}

.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	gap: 8px;
	word-break: break-word;

	&::before {
		flex-shrink: 0;
		display: flex;
		position: sticky;
		top: calc(var(--MI-stickyTop, 0px) + 8px);
		counter-increment: item;
		content: counter(item);
		width: 32px;
		height: 32px;
		line-height: 32px;
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		font-size: 13px;
		font-weight: bold;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
	}
}

.ruleText {
	padding-top: 6px;
}
</style>
