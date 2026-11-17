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
	<template #label>连接我的电脑</template>
	<div class="_gaps_m" data-agent-connect>
		<p :class="$style.lead">{{ myTutorName }} 起草的指令，你点一下就能发到自己电脑上的 Claude Code 或 Codex 去做。</p>

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
				<button class="_button" :class="$style.iconButton" :title="'更多'" data-agent-menu @click="menu"><i class="ti ti-dots"></i></button>
			</div>
			<div :class="$style.machineRow">
				<i class="ti ti-folder" :class="$style.rowIcon"></i>
				<div :class="$style.rowText">
					<div :class="$style.rowLabel">工作文件夹</div>
					<div :class="$style.rowValue" :title="paired.cwd">{{ nameOf(paired.cwd) }}<span :class="$style.path">{{ shortPath(paired.cwd) }}</span></div>
				</div>
				<MkButton small rounded data-agent-change-folder @click="startPicking">更换</MkButton>
			</div>
			<div v-if="online === 'off'" :class="$style.offlineNote">
				<i class="ti ti-info-circle"></i> 连不上：确认电脑开着、Paseo 在运行，再点右上角「⋯」里的「检查连接」。
			</div>
		</div>

		<!-- First time: three steps -->
		<ol v-else :class="$style.steps">
			<li :class="[$style.step, paired ? $style.done : $style.active]">
				<span :class="$style.dot"><i v-if="paired" class="ti ti-check"></i><template v-else>1</template></span>
				<div :class="$style.stepBody">
					<div :class="$style.stepTitle">在电脑上打开 Paseo</div>
					<div v-if="!paired" :class="$style.stepSub">还没装？到 <a href="https://paseo.sh" target="_blank" rel="noopener noreferrer" class="_link">paseo.sh</a> 下载，免费、开源。</div>
				</div>
			</li>

			<li :class="[$style.step, paired ? $style.done : $style.active]">
				<span :class="$style.dot"><i v-if="paired" class="ti ti-check"></i><template v-else>2</template></span>
				<div :class="$style.stepBody">
					<div :class="$style.stepTitle">{{ paired ? `已连上 ${hostName}` : '复制配对链接，贴到这里' }}</div>
					<template v-if="!paired">
						<div :class="$style.crumbs">
							<span>Paseo</span><i class="ti ti-chevron-right"></i><span>设置</span><i class="ti ti-chevron-right"></i><span>配对设备</span><i class="ti ti-chevron-right"></i><span>复制链接</span>
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
							<MkButton primary rounded :disabled="busy || link.trim() === ''" data-agent-connect-go @click="go">{{ busy ? '连接中…' : '连接' }}</MkButton>
						</div>
						<div v-if="linkError" :class="$style.error" data-agent-connect-error><i class="ti ti-alert-circle"></i> {{ linkError }}</div>
					</template>
				</div>
			</li>

			<li :class="[$style.step, paired ? $style.active : $style.upcoming]">
				<span :class="$style.dot">3</span>
				<div :class="$style.stepBody">
					<div :class="$style.stepTitle">选一个工作文件夹</div>
					<div v-if="!paired" :class="$style.stepSub">电脑上的 agent 会在这个文件夹里干活。</div>
					<template v-else>
						<div :class="$style.stepSub">电脑上的 agent 会在这个文件夹里干活。以后可以换。</div>
						<div v-if="loadingFolders" :class="$style.loading"><MkLoading :em="true"/> 正在读电脑上的文件夹…</div>
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
									:placeholder="folders.length ? '别的文件夹，比如 ~/Desktop/my-app' : '文件夹路径，比如 ~/Desktop/my-app'"
									spellcheck="false" autocomplete="off"
									data-agent-folder-custom
									@focus="chosen = CUSTOM"
									@keydown.enter.prevent="saveFolder"
								>
							</div>
						</div>
						<div :class="$style.actions">
							<MkButton primary rounded :disabled="!folderValue" data-agent-folder-save @click="saveFolder">完成</MkButton>
							<MkButton v-if="picking" rounded @click="picking = false">取消</MkButton>
						</div>
					</template>
				</div>
			</li>
		</ol>

		<details :class="$style.how">
			<summary>这是怎么工作的？</summary>
			<ul>
				<li>配对链接只存在这个浏览器里，不传到 Vibes 的服务器，也不写进日志。</li>
				<li>消息走 Paseo 的端到端加密中继，中继看不到内容。</li>
				<li>{{ myTutorName }} 只能起草，发不发每次都由你点；agent 要运行命令或改文件时，也会先在卡片上问你。</li>
				<li>换浏览器、换手机要重新连一次。第一次连接要下载约 640 KB 的连接组件。</li>
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

const hostName = computed(() => computer.value?.host ?? paired.value?.host ?? '我的电脑');
const onlineText = computed(() => online.value === 'on' ? (computer.value?.ms != null ? `在线 · ${(computer.value.ms / 1000).toFixed(1)} 秒` : '在线') : online.value === 'off' ? '离线' : '正在检查…');
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
	if (m === 'bad-link') return '这不是 Paseo 的配对链接。它应该以 https://app.paseo.sh/#offer= 开头。';
	return '没连上。确认电脑开着、Paseo 在运行，再试一次。';
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
	os.toast(`好了，${myTutorName.value} 的指令会发到这个文件夹`);
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
		text: '检查连接',
		icon: 'ti ti-refresh',
		action: () => { void refresh(); },
	}, { type: 'divider' }, {
		text: '断开这台电脑',
		icon: 'ti ti-plug-connected-x',
		danger: true,
		action: async () => {
			const { canceled } = await os.confirm({ type: 'warning', text: `断开后，这个浏览器会删掉配对链接，${myTutorName.value} 的指令就发不过去了。要再用得重新贴一次链接。`, okText: '断开' });
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
