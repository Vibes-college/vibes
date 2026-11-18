<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 连接我的电脑 (2026-11-15, redone 11-16): pair this browser with Paseo on the learner's own computer, then pick the
folder tasks run in, so the learner's Momo's draft cards can be sent with one tap. Three numbered steps the first time (like Raft's
"Add computer"); once done, one card for the computer (like Raft's and Multica's machine card): name, online or not,
which agent, which folder. The small print is folded away. Shown only to accounts it is switched on for. -->
<template>
<FormSection v-if="enabled">
	<template #label>{{ S.connectTitle }}</template>
	<div class="_gaps_m" data-agent-connect>
		<p :class="$style.lead">{{ S.connectLead(myTutorName) }}</p>

		<!-- Connected and ready: the computer card -->
		<div v-if="paired && paired.cwd && !picking" :class="$style.machine" data-agent-connected>
			<div :class="$style.machineHead">
				<span :class="$style.machineIcon"><i class="ti ti-device-laptop"></i></span>
				<div :class="$style.machineText">
					<div :class="$style.machineName">{{ hostName }}</div>
					<div :class="$style.machineSub">
						<span :class="[$style.state, $style['state_' + online]]" data-agent-online><span :class="$style.stateDot"></span>{{ onlineText }}</span>
						<span>·</span>
						<span>{{ agentName(computer?.config ?? paired.config) }}</span>
					</div>
				</div>
				<button class="_button" :class="$style.iconButton" :title="S.more" data-agent-menu @click="menu"><i class="ti ti-dots"></i></button>
			</div>
			<div :class="$style.machineRow">
				<i class="ti ti-folder" :class="$style.rowIcon"></i>
				<div :class="$style.rowText">
					<div :class="$style.rowLabel">{{ S.folder }}</div>
					<div :class="$style.rowValue" :title="paired.cwd">{{ nameOf(paired.cwd) }}<span :class="$style.path">{{ shortPath(paired.cwd) }}</span></div>
				</div>
				<MkButton small rounded data-agent-change-folder @click="startPicking">{{ S.change }}</MkButton>
			</div>
			<div v-if="online === 'off'" :class="$style.offlineNote">
				<i class="ti ti-info-circle"></i> {{ S.offlineNote }}
			</div>
		</div>

		<!-- First time: three steps -->
		<ol v-else :class="$style.steps">
			<li :class="[$style.step, paired ? $style.done : $style.active]">
				<span :class="$style.dot"><i v-if="paired" class="ti ti-check"></i><template v-else>1</template></span>
				<div :class="$style.stepBody">
					<div :class="$style.stepTitle">{{ S.step1 }}</div>
					<div v-if="!paired" :class="$style.stepSub">{{ S.step1Sub.before }}<a href="https://paseo.sh" target="_blank" rel="noopener noreferrer" class="_link">paseo.sh</a>{{ S.step1Sub.after }}</div>
				</div>
			</li>

			<li :class="[$style.step, paired ? $style.done : $style.active]">
				<span :class="$style.dot"><i v-if="paired" class="ti ti-check"></i><template v-else>2</template></span>
				<div :class="$style.stepBody">
					<div :class="$style.stepTitle">{{ paired ? S.connectedTo(hostName) : S.step2 }}</div>
					<template v-if="!paired">
						<div :class="$style.crumbs">
							<span>Paseo</span><template v-for="c in S.crumbs" :key="c"><i class="ti ti-chevron-right"></i><span>{{ c }}</span></template>
						</div>
						<div :class="$style.linkRow">
							<input
								v-model="link"
								:class="[$style.input, { [$style.inputBad]: linkError }]"
								type="url" inputmode="url" autocomplete="off" spellcheck="false"
								placeholder="https://app.paseo.sh/#offer=…"
								:disabled="busy"
								data-agent-connect-link
								@keydown.enter.prevent="go"
							>
							<MkButton primary rounded :disabled="busy || link.trim() === ''" data-agent-connect-go @click="go">{{ busy ? S.connecting : S.connect }}</MkButton>
						</div>
						<div v-if="linkError" :class="$style.error" data-agent-connect-error><i class="ti ti-alert-circle"></i> {{ linkError }}</div>
					</template>
				</div>
			</li>

			<li :class="[$style.step, paired ? $style.active : $style.upcoming]">
				<span :class="$style.dot">3</span>
				<div :class="$style.stepBody">
					<div :class="$style.stepTitle">{{ S.step3 }}</div>
					<div v-if="!paired" :class="$style.stepSub">{{ S.step3Sub }}</div>
					<template v-else>
						<div :class="$style.stepSub">{{ S.step3SubLater }}</div>
						<div v-if="loadingFolders" :class="$style.loading"><MkLoading :em="true"/> {{ S.readingFolders }}</div>
						<div v-else :class="$style.folders" role="radiogroup" data-agent-folders>
							<button
								v-for="f in folders" :key="f.path"
								class="_button" :class="[$style.folder, { [$style.folderOn]: chosen === f.path }]"
								role="radio" :aria-checked="chosen === f.path"
								@click="chosen = f.path; custom = ''"
							>
								<i :class="chosen === f.path ? 'ti ti-circle-dot' : 'ti ti-circle'"></i>
								<span :class="$style.folderName">{{ f.name }}</span>
								<span :class="$style.folderPath"><bdi dir="ltr">{{ shortPath(f.path) }}</bdi></span>
							</button>
							<div :class="[$style.folder, $style.folderCustom, { [$style.folderOn]: chosen === CUSTOM }]">
								<i :class="chosen === CUSTOM ? 'ti ti-circle-dot' : 'ti ti-circle'"></i>
								<input
									v-model="custom"
									:class="$style.customInput"
									:placeholder="folders.length ? S.otherFolder : S.folderPath"
									spellcheck="false" autocomplete="off"
									data-agent-folder-custom
									@focus="chosen = CUSTOM"
									@keydown.enter.prevent="saveFolder"
								>
							</div>
						</div>
						<div :class="$style.actions">
							<MkButton primary rounded :disabled="!folderValue" data-agent-folder-save @click="saveFolder">{{ S.done }}</MkButton>
							<MkButton v-if="picking" rounded @click="picking = false">{{ S.cancel }}</MkButton>
						</div>
					</template>
				</div>
			</li>
		</ol>

		<details :class="$style.how">
			<summary>{{ S.howTitle }}</summary>
			<ul>
				<li>{{ S.how1 }}</li>
				<li>{{ S.how2 }}</li>
				<li>{{ S.how3(myTutorName) }}</li>
				<li>{{ S.how4 }}</li>
			</ul>
		</details>
	</div>
</FormSection>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch as vueWatch } from 'vue';
import { agentName, bridgeState, check, connect, disconnect, paired, parseOfferLink, setFolder } from './bridge.js';
import type { Computer, Folder } from './bridge.js';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import * as os from '@/os.js';
import { myTutorName } from '@/lojo/tutor/persona.js';
import { settingsText as S } from '@/lojo/locales/settings.js';

const CUSTOM = '\u0000custom';

const enabled = ref(false);
const link = ref('');
const linkError = ref('');
const busy = ref(false);
const computer = ref<(Computer & { ms?: number }) | null>(null);
const online = ref<'checking' | 'on' | 'off'>('checking');
const loadingFolders = ref(false);
const picking = ref(false);
const chosen = ref('');
const custom = ref('');

const hostName = computed(() => computer.value?.host ?? paired.value?.host ?? S.myComputer);
const onlineText = computed(() => online.value === 'on' ? (computer.value?.ms != null ? S.onlineMs((computer.value.ms / 1000).toFixed(1)) : S.online) : online.value === 'off' ? S.offline : S.checking);
const folders = computed<Folder[]>(() => computer.value?.folders ?? []);
const folderValue = computed(() => (chosen.value === CUSTOM ? custom.value.trim() : chosen.value));

function nameOf(path: string): string {
	return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

// /Users/name/Desktop/x → ~/Desktop/x, so the line stays short.
function shortPath(path: string): string {
	return path.replace(/^\/(?:Users|home)\/[^/]+/, '~');
}

function explain(err: unknown): string {
	const m = err instanceof Error ? err.message : String(err);
	if (m === 'bad-link') return S.badLink;
	return S.connectFailed;
}

async function refresh() {
	if (!paired.value) return;
	online.value = 'checking';
	try {
		computer.value = await check();
		online.value = 'on';
	} catch {
		online.value = 'off';
	}
}

onMounted(async () => {
	try {
		const st = await bridgeState();
		enabled.value = st.enabled;
		// The server's yes/no follows this browser: if this browser is paired, say so.
		if (st.enabled && paired.value && !st.connected) await bridgeState(true);
	} catch { /* stays hidden */ }
	if (enabled.value && paired.value) {
		if (!paired.value.cwd) loadingFolders.value = true;
		await refresh();
		loadingFolders.value = false;
		preselect();
	}
});

function preselect() {
	const cwd = paired.value?.cwd;
	if (cwd && folders.value.some(f => f.path === cwd)) chosen.value = cwd;
	else if (cwd) {
		chosen.value = CUSTOM;
		custom.value = cwd;
	} else chosen.value = folders.value[0]?.path ?? CUSTOM;
}

async function go() {
	if (busy.value) return;
	linkError.value = '';
	busy.value = true;
	try {
		computer.value = await connect(link.value);
		online.value = 'on';
		link.value = '';
		preselect();
	} catch (err) {
		linkError.value = explain(err);
	} finally {
		busy.value = false;
	}
}

// A whole pairing link pasted in connects by itself.
vueWatch(link, v => {
	linkError.value = '';
	if (!paired.value && !busy.value && parseOfferLink(v)) void go();
});

function saveFolder() {
	const v = folderValue.value;
	if (!v) return;
	setFolder(v);
	picking.value = false;
	os.toast(S.folderSaved(myTutorName.value));
}

async function startPicking() {
	picking.value = true;
	preselect();
	if (online.value !== 'on') {
		loadingFolders.value = true;
		await refresh();
		loadingFolders.value = false;
		preselect();
	}
}

function menu(ev: MouseEvent) {
	os.popupMenu([{
		text: S.checkConnection,
		icon: 'ti ti-refresh',
		action: () => { void refresh(); },
	}, { type: 'divider' }, {
		text: S.disconnect,
		icon: 'ti ti-plug-connected-x',
		danger: true,
		action: async () => {
			const { canceled } = await os.confirm({ type: 'warning', text: S.disconnectConfirm(myTutorName.value), okText: S.disconnectOk });
			if (canceled) return;
			await disconnect();
			computer.value = null;
			chosen.value = '';
			custom.value = '';
		},
	}], ev.currentTarget as HTMLElement);
}
</script>

<style lang="scss" module>
.lead {
	margin: 0;
	line-height: 1.6;
	color: color-mix(in srgb, var(--MI_THEME-fg) 80%, transparent);
}

// ----- the three steps -----
.steps {
	margin: 0;
	padding: 0;
	list-style: none;
}

.step {
	position: relative;
	display: grid;
	grid-template-columns: 28px 1fr;
	column-gap: 14px;
	padding-bottom: 22px;

	&:last-child {
		padding-bottom: 0;
	}

	// The line that strings the steps together.
	&:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 13px;
		top: 32px;
		bottom: 4px;
		width: 2px;
		border-radius: 1px;
		background: var(--MI_THEME-divider);
	}

	&.done:not(:last-child)::before {
		background: var(--MI_THEME-accent);
	}
}

.dot {
	display: grid;
	place-items: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	font-size: 0.9em;
	font-weight: bold;
	box-sizing: border-box;
	border: 2px solid var(--MI_THEME-divider);
	color: color-mix(in srgb, var(--MI_THEME-fg) 50%, transparent);
	background: var(--MI_THEME-panel);

	.active & {
		border-color: var(--MI_THEME-accent);
		color: var(--MI_THEME-accent);
	}

	.done & {
		border-color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-fgOnAccent);
	}
}

.stepBody {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 0;
	padding-top: 3px;
}

.stepTitle {
	font-weight: bold;
	line-height: 1.5;

	.upcoming & {
		color: color-mix(in srgb, var(--MI_THEME-fg) 50%, transparent);
	}
}

.stepSub {
	margin-top: -4px;
	font-size: 0.9em;
	line-height: 1.6;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);

	.upcoming & {
		color: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	}
}

.crumbs {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
	font-size: 0.85em;

	> span {
		padding: 2px 8px;
		border-radius: 6px;
		background: var(--MI_THEME-bg);
		border: 1px solid var(--MI_THEME-divider);
	}

	> i {
		opacity: 0.45;
		font-size: 0.9em;
	}
}

.linkRow {
	display: flex;
	gap: 8px;
	align-items: center;
}

.input {
	flex: 1;
	min-width: 0;
	height: 38px;
	padding: 0 12px;
	box-sizing: border-box;
	border-radius: 10px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
	font: inherit;
	font-size: 0.92em;
	outline: none;

	&:focus {
		border-color: var(--MI_THEME-accent);
	}
}

.inputBad {
	border-color: var(--MI_THEME-error);
}

.error {
	display: flex;
	align-items: baseline;
	gap: 6px;
	font-size: 0.88em;
	color: var(--MI_THEME-error);
}

.loading {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.9em;
	opacity: 0.75;
}

.folders {
	display: flex;
	flex-direction: column;
	border-radius: 12px;
	border: 1px solid var(--MI_THEME-divider);
	overflow: hidden;
}

.folder {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: 42px;
	padding: 0 12px;
	text-align: left;

	& + & {
		border-top: 1px solid var(--MI_THEME-divider);
	}

	> i {
		flex: none;
		color: color-mix(in srgb, var(--MI_THEME-fg) 45%, transparent);
	}

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.folderOn {
	background: var(--MI_THEME-accentedBg);

	> i {
		color: var(--MI_THEME-accent);
	}

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.folderName {
	flex: none;
	max-width: 45%;
	font-weight: bold;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.folderPath {
	flex: 1;
	min-width: 0;
	font-size: 0.85em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	// Long paths lose their start, not the folder name; the <bdi> keeps "~/" in front.
	direction: rtl;
	text-align: left;
}

.folderCustom:hover {
	background: none;
}

.customInput {
	flex: 1;
	min-width: 0;
	height: 40px;
	border: none;
	background: none;
	color: var(--MI_THEME-fg);
	font: inherit;
	font-size: 0.92em;
	outline: none;
}

.actions {
	display: flex;
	gap: 8px;
}

// ----- the computer card -----
.machine {
	border-radius: 14px;
	border: 1px solid var(--MI_THEME-divider);
	background: var(--MI_THEME-panel);
	overflow: hidden;
}

.machineHead {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 14px 14px 16px;
}

.machineIcon {
	flex: none;
	display: grid;
	place-items: center;
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 22px;
}

.machineText {
	flex: 1;
	min-width: 0;
}

.machineName {
	font-weight: bold;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.machineSub {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
	font-size: 0.88em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);
}

.state {
	display: inline-flex;
	align-items: center;
	gap: 5px;
}

.stateDot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: color-mix(in srgb, var(--MI_THEME-fg) 35%, transparent);

	.state_on & {
		background: var(--MI_THEME-success);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--MI_THEME-success) 25%, transparent);
	}

	.state_off & {
		background: var(--MI_THEME-error);
	}

	.state_checking & {
		animation: blink 1s ease-in-out infinite;

		@media (prefers-reduced-motion: reduce) {
			animation: none;
		}
	}
}

@keyframes blink {
	50% { opacity: 0.3; }
}

.state_on {
	color: var(--MI_THEME-success);
}

.iconButton {
	flex: none;
	display: grid;
	place-items: center;
	width: 34px;
	height: 34px;
	border-radius: 50%;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.machineRow {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 14px 12px 16px;
	border-top: 1px solid var(--MI_THEME-divider);
}

.rowIcon {
	flex: none;
	width: 40px;
	text-align: center;
	font-size: 18px;
	opacity: 0.6;
}

.rowText {
	flex: 1;
	min-width: 0;
}

.rowLabel {
	font-size: 0.82em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 55%, transparent);
}

.rowValue {
	display: flex;
	align-items: baseline;
	gap: 8px;
	font-weight: bold;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.path {
	min-width: 0;
	font-weight: normal;
	font-size: 0.85em;
	color: color-mix(in srgb, var(--MI_THEME-fg) 50%, transparent);
	overflow: hidden;
	text-overflow: ellipsis;
}

.offlineNote {
	padding: 10px 16px;
	border-top: 1px solid var(--MI_THEME-divider);
	font-size: 0.88em;
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-infoWarnFg);
}

// ----- small print, folded -----
.how {
	font-size: 0.9em;

	> summary {
		cursor: pointer;
		width: fit-content;
		color: color-mix(in srgb, var(--MI_THEME-fg) 65%, transparent);

		&:hover {
			color: var(--MI_THEME-fg);
		}
	}

	> ul {
		margin: 8px 0 0;
		padding-left: 20px;
		line-height: 1.7;
		color: color-mix(in srgb, var(--MI_THEME-fg) 75%, transparent);
	}
}
</style>
