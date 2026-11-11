<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- The card at boot that asks to add Vibes to the home screen, or, in Vibes opened from there, to turn on notifications.
It takes the place of upstream's donation popup and source-code popup. The source-code line (AGPL §13) lives in Settings → 关于,
the visitor header and the /install page, so the card stays short. -->
<template>
<section class="_panel _shadow" :class="$style.root" :aria-labelledby="titleId">
	<div :class="$style.head">
		<img :class="$style.icon" src="/static-assets/vibes-brand/app-192.png" alt="" width="44" height="44">
		<div>
			<h2 :id="titleId" :class="$style.title">{{ mode === 'install' ? installLabels.cardTitle : installLabels.welcomeTitle }}</h2>
			<p :class="$style.text">{{ mode === 'install' ? installLabels.cardText : installLabels.welcomeText }}</p>
		</div>
	</div>
	<div :class="$style.buttons">
		<template v-if="mode === 'install'">
			<MkButton v-if="installPrompt" primary rounded small @click="addNow">{{ installLabels.addNow }}</MkButton>
			<MkButton v-else primary rounded small @click="howTo">{{ installLabels.howTo }}</MkButton>
			<MkButton rounded small @click="close()">{{ installLabels.later }}</MkButton>
			<button class="_button" :class="$style.never" @click="close('never')">{{ installLabels.never }}</button>
		</template>
		<template v-else>
			<MkButton primary rounded small @click="howTo">{{ installLabels.turnOnNotifications }}</MkButton>
			<MkButton rounded small @click="close()">{{ installLabels.gotIt }}</MkButton>
		</template>
	</div>
	<button class="_button" :class="$style.close" :aria-label="installLabels.close" @click="close()"><i class="ti ti-x"></i></button>
</section>
</template>

<script lang="ts" setup>
import { useId } from 'vue';
import type { InstallOffer } from '@/lojo/install/guide.js';
import MkButton from '@/components/MkButton.vue';
import { installLabels } from '@/lojo/install/labels.js';
import { install, installPrompt } from '@/lojo/install/prompt.js';
import { miLocalStorage } from '@/local-storage.js';
import { mainRouter } from '@/router.js';
import * as os from '@/os.js';

const props = defineProps<{
	mode: InstallOffer;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const titleId = useId();
const zIndex = os.claimZIndex('low');

// Closing it in any way also retires upstream's source-code popup; the line stays in Settings → 关于.
//   prompt: what the install card leaves in vibesInstallPrompt; by default when it showed, so it comes back in a week
function close(prompt = new Date().toISOString()) {
	miLocalStorage.setItem('modifiedVersionMustProminentlyOfferInAgplV3Section13Read', 'true');
	if (props.mode === 'install') miLocalStorage.setItem('vibesInstallPrompt', prompt);
	else miLocalStorage.setItem('vibesInstalledWelcomed', 'true');
	emit('closed');
}

function howTo() {
	close();
	mainRouter.push('/install');
}

async function addNow() {
	if (!await install()) return;
	os.toast(installLabels.added);
	close('installed');
}
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	// above the phone's bottom bar, like the connection indicator
	bottom: calc(var(--MI-minBottomSpacing) + var(--MI-margin));
	left: 0;
	right: 0;
	margin: auto;
	box-sizing: border-box;
	width: calc(100% - (var(--MI-margin) * 2));
	max-width: 480px;
	padding: 16px 16px 12px;
}

.head {
	display: flex;
	gap: 12px;
}

.icon {
	flex-shrink: 0;
	width: 44px;
	height: 44px;
	border-radius: 11px;
}

.title {
	margin: 2px 28px 0 0;
	font-size: 1em;
	font-weight: bold;
}

.text {
	margin: 4px 0 0;
	font-size: 0.9em;
	line-height: 1.6;
}

.buttons {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	margin-top: 12px;
}

.never {
	margin-left: auto;
	padding: 4px 2px;
	font-size: 0.8em;
	text-decoration: underline;
	opacity: 0.85;

	&:hover {
		opacity: 1;
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.close {
	position: absolute;
	top: 6px;
	right: 6px;
	padding: 8px;
}
</style>
