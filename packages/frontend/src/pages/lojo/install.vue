<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 添加到主屏幕: the steps for this device and browser, picked by itself and changeable. The card at boot links here; in
Vibes opened from the home screen, this page turns on notifications instead. -->
<template>
<div :class="$style.root">
	<MkPageHeader :canOmitTitle="false"/>
	<div :class="$style.body">
		<header :class="$style.hero">
			<img :class="$style.appIcon" src="/static-assets/vibes-brand/app-192.png" alt="" width="60" height="60">
			<div>
				<h1 :class="$style.heading">{{ standalone ? installLabels.standaloneTitle : installLabels.heading }}</h1>
				<p :class="$style.lede">{{ standalone ? installLabels.standaloneLede : installLabels.lede }}</p>
			</div>
		</header>

		<section v-if="standalone" class="_panel" :class="$style.card" :aria-labelledby="`${uid}-notify`">
			<h2 :id="`${uid}-notify`" :class="$style.cardTitle"><i class="ti ti-bell-ringing" aria-hidden="true"></i> {{ installLabels.notifyTitle }}</h2>
			<p :class="$style.note">{{ installLabels.notifyText }}</p>
			<MkPushNotificationAllowButton v-if="$i" showOnlyToRegister rounded/>
			<p v-else :class="$style.note">{{ installLabels.notifyLogin }}</p>
		</section>

		<template v-else>
			<p v-if="device.guide === 'app'" :class="$style.inApp" role="note">
				<i class="ti ti-alert-circle" aria-hidden="true"></i>
				<span>{{ device.app ? installLabels.inApp(installLabels.apps[device.app]) : installLabels.inAppUnknown }}</span>
			</p>

			<div :class="$style.choose">
				<div role="group" :aria-label="installLabels.platformsLabel" :class="$style.platforms">
					<button
						v-for="p in platforms"
						:key="p"
						class="_button"
						:aria-pressed="platform === p"
						:class="[$style.platform, { [$style.on]: platform === p }]"
						@click="choosePlatform(p)"
					>
						<i :class="platformIcons[p]" aria-hidden="true"></i> {{ installLabels.platforms[p] }}
					</button>
				</div>
				<div role="group" :aria-label="installLabels.guidesLabel" :class="$style.guides">
					<button
						v-for="g in installGuides[platform]"
						:key="g"
						class="_button"
						:aria-pressed="guide === g"
						:class="[$style.guide, { [$style.on]: guide === g }]"
						@click="guide = g"
					>
						{{ installLabels.guides[g] }}
					</button>
				</div>
				<p v-if="platform === device.platform && guide === device.guide" :class="$style.detected">{{ installLabels.detected }}</p>
			</div>

			<section class="_panel" :class="$style.card">
				<div v-if="oneTap" :class="$style.oneTap">
					<span>{{ installLabels.oneTap }}</span>
					<MkButton primary rounded inline @click="addNow"><i class="ti ti-square-plus"></i> {{ installLabels.addNow }}</MkButton>
				</div>
				<ol role="list" :class="$style.steps">
					<li v-for="(step, i) in installLabels.steps[guide]" :key="`${guide}-${i}`" :class="$style.step">
						<span :class="$style.num" aria-hidden="true">{{ i + 1 }}</span>
						<p :class="$style.stepText">
							<template v-for="(part, k) in stepParts(step.text)" :key="k">
								<span v-if="'key' in part" :class="$style.key" role="img" :aria-label="installLabels.keys[part.key]"><i :class="installKeys[part.key]" aria-hidden="true"></i></span>
								<template v-else>{{ part.text }}</template>
							</template>
						</p>
						<span v-if="step.at" :class="[$style.frame, platform === 'desktop' ? $style.screen : $style.phone, $style[`at_${step.at}`]]" aria-hidden="true">
							<img v-if="step.at === 'home'" :class="$style.frameIcon" src="/static-assets/vibes-brand/app-192.png" alt="">
							<span v-else :class="$style.spot"></span>
						</span>
					</li>
				</ol>
				<div v-if="copyGuides.includes(guide)" :class="$style.copy">
					<MkButton rounded inline @click="copyLink"><i class="ti ti-copy"></i> {{ installLabels.copyLink }}</MkButton>
					<span class="_selectable" :class="$style.link">{{ installUrl }}</span>
				</div>
			</section>

			<p v-if="platform === 'ios'" :class="$style.note"><i class="ti ti-bell-ringing" aria-hidden="true"></i> {{ installLabels.iosNotifications }}</p>
			<MkButton rounded inline :class="$style.done" @click="done"><i class="ti ti-check"></i> {{ installLabels.done }}</MkButton>
		</template>

		<p :class="$style.source">
			{{ installLabels.sourceBefore }}<MkA to="/about-misskey" class="_link">{{ installLabels.sourceLink }}</MkA>{{ installLabels.sourceAfter }}
		</p>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, useId } from 'vue';
import { url } from '@@/js/config.js';
import type { InstallGuide, InstallPlatform } from '@/lojo/install/guide.js';
import MkButton from '@/components/MkButton.vue';
import MkPushNotificationAllowButton from '@/components/MkPushNotificationAllowButton.vue';
import { installGuides, installKeys, stepParts } from '@/lojo/install/guide.js';
import { installLabels } from '@/lojo/install/labels.js';
import { device, install, installPrompt, standalone } from '@/lojo/install/prompt.js';
import { $i } from '@/i.js';
import { miLocalStorage } from '@/local-storage.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';

const uid = useId();
const platforms: InstallPlatform[] = ['ios', 'android', 'desktop'];
const platformIcons: Record<InstallPlatform, string> = { ios: 'ti ti-brand-apple', android: 'ti ti-brand-android', desktop: 'ti ti-device-desktop' };
// the guides that end in opening the page in another browser
const copyGuides: InstallGuide[] = ['ios-browser', 'android-browser', 'app', 'desktop-firefox'];

const installUrl = `${url}/install`;

const platform = ref<InstallPlatform>(device.platform);
const guide = ref<InstallGuide>(device.guide);
// Chrome's and Edge's own install dialog, shown with the steps for the device it was offered on
const oneTap = computed(() => installPrompt.value != null && platform.value === device.platform && guide.value !== 'app');

function choosePlatform(p: InstallPlatform) {
	platform.value = p;
	guide.value = p === device.platform ? device.guide : installGuides[p][0];
}

async function addNow() {
	if (!await install()) return;
	miLocalStorage.setItem('vibesInstallPrompt', 'installed');
	os.toast(installLabels.added);
}

// Some apps' web views have no clipboard; the link is on the page to copy by hand.
async function copyLink() {
	try {
		if (navigator.clipboard == null || !window.isSecureContext) throw new Error('no clipboard');
		await navigator.clipboard.writeText(installUrl);
		os.toast(installLabels.copied);
	} catch {
		os.toast(installLabels.copyByHand);
	}
}

function done() {
	miLocalStorage.setItem('vibesInstallPrompt', 'installed');
	os.toast(installLabels.doneToast);
}

definePage(() => ({ title: installLabels.pageTitle, icon: 'ti ti-device-mobile-plus' }));
</script>

<style lang="scss" module>
.root {
	min-height: 100%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
}

.body {
	max-width: 640px;
	margin: 0 auto;
	padding: 20px 20px 48px;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 16px;

	> * {
		align-self: stretch;
	}

	> .done {
		align-self: flex-start;
	}
}

.hero {
	display: flex;
	align-items: center;
	gap: 14px;
}

.appIcon {
	flex-shrink: 0;
	width: 60px;
	height: 60px;
	border-radius: 14px;
}

.heading {
	margin: 0;
	font-size: 1.3em;
	color: var(--MI_THEME-fgHighlighted);
}

.lede {
	margin: 6px 0 0;
	line-height: 1.6;
}

.inApp {
	display: flex;
	gap: 8px;
	margin: 0;
	padding: 12px 14px;
	border-radius: var(--MI-radius);
	line-height: 1.6;
	color: var(--MI_THEME-infoWarnFg);
	background: var(--MI_THEME-infoWarnBg);

	> i {
		margin-top: 0.25em;
	}
}

.choose {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.platforms {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

// as wide as their names, so "iPhone / iPad" stays on one line; on a narrow phone the last one moves down
.platform {
	flex: 1 1 auto;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	height: 40px;
	padding: 0 10px;
	white-space: nowrap;
	border-radius: 999px;
	font-weight: bold;
	color: var(--MI_THEME-fg);
	background: var(--MI_THEME-panelHighlight);

	&.on {
		color: var(--MI_THEME-fgOnAccent);
		background: var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.guides {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.guide {
	padding: 6px 12px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 999px;
	font-size: 0.9em;

	&.on {
		border-color: var(--MI_THEME-accent);
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
	}
}

.detected {
	margin: 0;
	font-size: 0.85em;
	opacity: 0.85;
}

.card {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 14px;
	padding: 18px;
}

.cardTitle {
	margin: 0;
	font-size: 1.05em;
}

.oneTap {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
	align-self: stretch;
	padding-bottom: 14px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.steps {
	display: flex;
	flex-direction: column;
	gap: 16px;
	align-self: stretch;
	margin: 0;
	padding: 0;
	list-style: none;
}

.step {
	display: flex;
	align-items: flex-start;
	gap: 12px;
}

.num {
	display: grid;
	place-items: center;
	flex-shrink: 0;
	width: 26px;
	height: 26px;
	border-radius: 50%;
	font-weight: bold;
	font-size: 0.9em;
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
}

.stepText {
	flex: 1;
	min-width: 0;
	margin: 2px 0 0;
	line-height: 1.7;
}

.key {
	display: inline-grid;
	place-items: center;
	min-width: 1.8em;
	height: 1.7em;
	margin: 0 2px;
	padding: 0 3px;
	box-sizing: border-box;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 6px;
	vertical-align: -0.35em;
	color: var(--MI_THEME-accent);
	background: var(--MI_THEME-panelHighlight);
}

// a little phone or window, with where to tap
.frame {
	position: relative;
	flex-shrink: 0;
	box-sizing: border-box;
	border: 2px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);
	overflow: clip;
	--x: 50%;
	--y: 50%;
}

.phone {
	width: 38px;
	height: 66px;
	border-radius: 8px;
}

.screen {
	width: 64px;
	height: 44px;
	border-top-width: 7px;
	border-radius: 4px;
}

.spot {
	position: absolute;
	top: var(--y);
	left: var(--x);
	width: 9px;
	height: 9px;
	border-radius: 50%;
	transform: translate(-50%, -50%);
	background: var(--MI_THEME-accent);
	box-shadow: 0 0 0 4px var(--MI_THEME-accentedBg);
	animation: spot 1.6s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
}

@keyframes spot {
	50% {
		box-shadow: 0 0 0 1px var(--MI_THEME-accentedBg);
	}
}

.at_bottom {
	--y: 86%;
}

.at_top-right {
	--x: 76%;
	--y: 13%;
}

.at_top-left {
	--x: 22%;
	--y: 13%;
}

// a menu or share sheet come up from the bottom
.at_sheet {
	--y: 72%;

	&::before {
		content: '';
		position: absolute;
		inset: 45% 0 0;
		border-radius: 5px 5px 0 0;
		background: var(--MI_THEME-panelHighlight);
	}
}

// a dialog in the middle
.at_center {
	--y: 58%;

	&::before {
		content: '';
		position: absolute;
		inset: 32% 12%;
		border-radius: 4px;
		background: var(--MI_THEME-panelHighlight);
	}
}

.at_home {
	display: grid;
	place-items: center;
}

.frameIcon {
	width: 18px;
	height: 18px;
	border-radius: 5px;
}

.copy {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px 12px;
}

.link {
	font-size: 0.9em;
	word-break: break-all;
}

.note {
	margin: 0;
	line-height: 1.6;
	opacity: 0.85;
}

.source {
	margin: 8px 0 0;
	font-size: 0.8em;
	line-height: 1.5;
}
</style>
