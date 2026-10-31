<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
"召唤 Agent": the user's own coding agent (Claude Code, Codex) in the bottom-right corner, through Paseo.
Mounted by ui/_common_/common.vue only after the user summons it in settings, so the site loads none of this
by default. Paseo runs in an iframe from agent.vibes.college (our build with a small bridge, repo
Vibes-college/agent); its pills above Paseo's input ask this page to open a tool (speak, polish, prompt), and the
result goes back into Paseo's own input box. Nothing is sent to the agent from here: the user presses Paseo's send.
-->

<template>
<div :class="$style.root">
	<button
		v-show="!panelOpen"
		ref="fabEl"
		class="_button"
		:class="[$style.fab, { [$style.arrive]: arriving }]"
		:title="agentName"
		:aria-label="agentLabels.open(agentName)"
		aria-haspopup="dialog"
		@click="openPanel"
		@animationend="arriving = false"
	>
		<svg :class="$style.buddy" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="21" r="13" fill="#FFFDF8"/><circle cx="15.5" cy="20" r="2.2" fill="#14204F"/><circle cx="24.5" cy="20" r="2.2" fill="#14204F"/><path d="M16.5 25.5q3.5 2.6 7 0" stroke="#14204F" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="29" cy="9" r="3.2" fill="#FF5A3C"/></svg>
	</button>
	<div v-if="bubble && !panelOpen" :class="$style.bubble" role="status">{{ bubble }}</div>

	<section
		v-show="panelOpen"
		:class="[$style.panel, { [$style.big]: big }]"
		:style="viewportStyle"
		role="dialog"
		:aria-label="agentName"
		@keydown.esc.stop="onEscape"
	>
		<header :class="$style.bar">
			<div :class="$style.who">
				<svg :class="$style.whoBuddy" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="21" r="13" fill="#FFFDF8"/><circle cx="15.5" cy="20" r="2.2" fill="#14204F"/><circle cx="24.5" cy="20" r="2.2" fill="#14204F"/><path d="M16.5 25.5q3.5 2.6 7 0" stroke="#14204F" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="29" cy="9" r="3.2" fill="#FF5A3C"/></svg>
				<span>{{ agentName }}</span>
			</div>
			<button v-if="!isPhone" class="_button" :class="$style.iconButton" :title="big ? agentLabels.smaller : agentLabels.bigger" :aria-label="big ? agentLabels.smaller : agentLabels.bigger" @click="big = !big">
				<i :class="big ? 'ti ti-arrows-minimize' : 'ti ti-arrows-maximize'"></i>
			</button>
			<button ref="minimizeEl" class="_button" :class="$style.iconButton" :title="agentLabels.minimize" :aria-label="agentLabels.minimize" @click="minimize">
				<i class="ti ti-minus"></i>
			</button>
			<button class="_button" :class="$style.iconButton" :title="agentLabels.more" :aria-label="agentLabels.more" aria-haspopup="menu" @click="showMenu">
				<i class="ti ti-dots"></i>
			</button>
		</header>
		<div :class="$style.body">
			<!-- Under the iframe: Paseo covers it once it has drawn, so this needs no load event. -->
			<div :class="$style.loading"><b>{{ agentLabels.loading }}</b><span>{{ agentLabels.loadingNote }}</span></div>
			<!-- No allow-top-navigation: Paseo cannot navigate the whole page away. -->
			<iframe
				v-if="frameCreated"
				ref="frameEl"
				:class="$style.frame"
				:src="AGENT_URL"
				title="Paseo"
				allow="microphone; clipboard-read; clipboard-write; local-network-access"
				sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
				referrerpolicy="no-referrer"
			></iframe>
			<div v-if="guideShowing" :class="$style.guide">
				<h3 :class="$style.guideTitle">{{ agentLabels.guideTitle }}</h3>
				<ol :class="$style.guideSteps">
					<li>{{ agentLabels.guide1 }}</li>
					<li>{{ agentLabels.guide2 }}</li>
					<li>{{ agentLabels.guide3 }}</li>
				</ol>
				<p :class="$style.note">{{ agentLabels.guideNote }}</p>
				<MkButton primary rounded :class="$style.guideGo" @click="closeGuide">{{ agentLabels.guideGo }}</MkButton>
			</div>
			<XSheet v-if="sheet" :key="sheet.key" :tool="sheet.tool" :text="sheet.text" @close="sheet = null" @use="useText"/>
		</div>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import XSheet from './LojoAgentSheet.vue';
import { agentLabels } from './labels.js';
import { AGENT_ORIGIN, AGENT_URL, agentName, agentState, dismissAgent, forgetPanelOpen, justSummoned, markGuideSeen, rememberPanelOpen, shouldReopenPanel } from './state.js';
import type { AgentTool } from './LojoAgentSheet.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';

const fabEl = useTemplateRef('fabEl');
const frameEl = useTemplateRef('frameEl');
const minimizeEl = useTemplateRef('minimizeEl');

const panelOpen = ref(false);
const frameCreated = ref(false);
const big = ref(false);
const guideShowing = ref(false);
const arriving = ref(false);
const bubble = ref('');
const sheet = ref<{ key: number; tool: AgentTool; text: string } | null>(null);
let sheetKey = 0;
let bubbleTimer: number | null = null;

const phoneQuery = window.matchMedia('(max-width: 640px)');
const isPhone = ref(phoneQuery.matches);
const onPhoneChange = () => { isPhone.value = phoneQuery.matches; };

// On a phone the panel fills the visible area. When the keyboard opens, the visible area shrinks and the panel
// (and the iframe in it) shrinks with it, so Paseo's input box stays right above the keyboard.
const viewport = ref<{ top: number; height: number } | null>(null);

function fitViewport() {
	const vv = window.visualViewport;
	viewport.value = vv && panelOpen.value ? { top: vv.offsetTop, height: vv.height } : null;
}

const viewportStyle = computed(() => (isPhone.value && viewport.value
	? { top: `${viewport.value.top}px`, height: `${viewport.value.height}px` }
	: {}));

function say(text: string) {
	bubble.value = text;
	if (bubbleTimer != null) window.clearTimeout(bubbleTimer);
	bubbleTimer = window.setTimeout(() => { bubble.value = ''; }, 4000);
}

// The iframe is created on first open: only then does the browser start downloading Paseo.
function openPanel() {
	bubble.value = '';
	if (!frameCreated.value) {
		frameCreated.value = true;
		void nextTick(helloUntilAnswered);
	}
	guideShowing.value = !agentState.value.guideSeen;
	panelOpen.value = true;
	fitViewport();
	void nextTick(() => minimizeEl.value?.focus({ preventScroll: true }));
}

// Minimizing only hides the panel; the iframe stays, and so does whatever the agent is doing.
function minimize() {
	forgetPanelOpen();
	sheet.value = null;
	panelOpen.value = false;
	viewport.value = null;
	void nextTick(() => fabEl.value?.focus({ preventScroll: true }));
}

function closeGuide() {
	guideShowing.value = false;
	markGuideSeen();
}

function onEscape() {
	if (sheet.value) sheet.value = null;
	else minimize();
}

async function dismiss() {
	const { canceled } = await os.confirm({ type: 'question', text: agentLabels.dismissConfirm(agentName.value), okText: agentLabels.dismiss });
	if (canceled) return;
	// Unmounts this component (common.vue renders it only while summoned), which removes the iframe.
	dismissAgent();
}

function showMenu(ev: MouseEvent) {
	os.popupMenu([{
		text: agentLabels.howToConnect,
		icon: 'ti ti-help-circle',
		action: () => { guideShowing.value = true; },
	}, {
		text: agentLabels.openInTab,
		icon: 'ti ti-external-link',
		action: () => { window.open(AGENT_URL, '_blank', 'noopener'); },
	}, { type: 'divider' }, {
		text: agentLabels.dismiss,
		icon: 'ti ti-logout',
		danger: true,
		action: dismiss,
	}], (ev.currentTarget ?? ev.target) as HTMLElement);
}

// ---------- The bridge inside our Paseo build ----------
// Only messages from that iframe and that origin count. The official app.paseo.sh has no bridge.
const bridge = { present: false, seq: 0, pending: new Map<string, (reply: BridgeReply) => void>() };
type BridgeReply = { ok?: boolean; error?: string };

function onMessage(ev: MessageEvent) {
	const frame = frameEl.value;
	if (frame == null || ev.source !== frame.contentWindow || ev.origin !== AGENT_ORIGIN) return;
	const data = ev.data as { vibes?: number; type?: string; tool?: string; text?: unknown; id?: string } | null;
	if (data == null || data.vibes !== 1) return;
	bridge.present = true;
	if (data.type === 'tool' && (data.tool === 'voice' || data.tool === 'english' || data.tool === 'prompt')) {
		openTool(data.tool, typeof data.text === 'string' ? data.text : '');
	} else if ((data.type === 'text-set' || data.type === 'sent') && data.id != null && bridge.pending.has(data.id)) {
		bridge.pending.get(data.id)!(data as BridgeReply);
		bridge.pending.delete(data.id);
	}
}

// The bridge starts listening once Paseo's code has loaded, so ask once a second until it answers (up to two minutes).
function helloUntilAnswered() {
	let tries = 0;
	const timer = window.setInterval(() => {
		const target = frameEl.value?.contentWindow;
		if (target == null || bridge.present || ++tries > 120) {
			window.clearInterval(timer);
			return;
		}
		target.postMessage({ vibes: 1, type: 'hello' }, AGENT_ORIGIN);
	}, 1000);
}

function ask(type: 'set-text', text: string): Promise<BridgeReply> {
	return new Promise(resolve => {
		const target = frameEl.value?.contentWindow;
		if (target == null) {
			resolve({ ok: false, error: 'no-frame' });
			return;
		}
		const id = String(++bridge.seq);
		bridge.pending.set(id, resolve);
		target.postMessage({ vibes: 1, type, id, text }, AGENT_ORIGIN);
		window.setTimeout(() => {
			if (bridge.pending.delete(id)) resolve({ ok: false, error: 'timeout' });
		}, 5000);
	});
}

function openTool(tool: AgentTool, text: string) {
	if (!panelOpen.value) openPanel();
	sheet.value = { key: ++sheetKey, tool, text };
}

// The result replaces the text in Paseo's input box; sending stays on Paseo's own send button.
async function useText(text: string) {
	const reply = await ask('set-text', text);
	if (reply.ok) {
		sheet.value = null;
		os.toast(agentLabels.replaced);
		return;
	}
	os.toast(reply.error === 'no-composer' ? agentLabels.noComposer : agentLabels.notReplaced);
}

function onVisibilityChange() {
	if (window.document.visibilityState === 'hidden') {
		if (panelOpen.value) rememberPanelOpen();
	} else {
		forgetPanelOpen();
	}
}

onMounted(() => {
	window.addEventListener('message', onMessage);
	window.document.addEventListener('visibilitychange', onVisibilityChange);
	window.visualViewport?.addEventListener('resize', fitViewport);
	window.visualViewport?.addEventListener('scroll', fitViewport);
	phoneQuery.addEventListener('change', onPhoneChange);
	if (justSummoned.value) {
		justSummoned.value = false;
		arriving.value = true;
		say(agentLabels.arrived(agentName.value));
	} else if (shouldReopenPanel()) {
		forgetPanelOpen();
		openPanel();
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('message', onMessage);
	window.document.removeEventListener('visibilitychange', onVisibilityChange);
	window.visualViewport?.removeEventListener('resize', fitViewport);
	window.visualViewport?.removeEventListener('scroll', fitViewport);
	phoneQuery.removeEventListener('change', onPhoneChange);
	if (bubbleTimer != null) window.clearTimeout(bubbleTimer);
});
</script>

<style lang="scss" module>
.root {
	display: contents;
}

// Above the page and the phone's bottom bar, below the drawer menu (1001) and Misskey's popups (claimZIndex).
.fab {
	position: fixed;
	right: 16px;
	bottom: calc(var(--MI-minBottomSpacing, 0px) + 16px);
	z-index: 1000;
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: var(--MI_THEME-accent);
	box-shadow: 0 1px 2px var(--MI_THEME-shadow), 0 12px 28px -10px var(--MI_THEME-shadow);
	display: grid;
	place-items: center;
	transition: transform 0.15s;

	&:hover {
		transform: scale(1.06);
	}
}

.buddy {
	width: 34px;
	height: 34px;
}

.arrive {
	animation: arrive 0.7s cubic-bezier(0.2, 1.6, 0.4, 1);
}

@keyframes arrive {
	from { transform: scale(0) rotate(-30deg); }
	to { transform: scale(1); }
}

.bubble {
	position: fixed;
	right: 16px;
	bottom: calc(var(--MI-minBottomSpacing, 0px) + 84px);
	z-index: 1000;
	max-width: 230px;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 14px 14px 4px 14px;
	padding: 8px 12px;
	font-size: 0.9em;
	box-shadow: 0 12px 28px -10px var(--MI_THEME-shadow);
}

.panel {
	box-sizing: border-box;
	position: fixed;
	right: 16px;
	bottom: 16px;
	z-index: 1002;
	width: 420px;
	height: min(700px, calc(100dvh - 32px));
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 18px;
	box-shadow: 0 1px 2px var(--MI_THEME-shadow), 0 18px 40px -12px var(--MI_THEME-shadow);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	overscroll-behavior: contain;

	&.big {
		width: min(1000px, calc(100vw - 32px));
		height: calc(100dvh - 32px);
	}
}

.bar {
	flex: none;
	height: 46px;
	display: flex;
	align-items: center;
	gap: 2px;
	padding: 0 6px 0 12px;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.who {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	margin-right: auto;
	font-weight: bold;

	> span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.whoBuddy {
	flex: none;
	width: 24px;
	height: 24px;
	padding: 2px;
	border-radius: 50%;
	background: var(--MI_THEME-accent);
}

.iconButton {
	width: 38px;
	height: 38px;
	border-radius: 10px;
	display: grid;
	place-items: center;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.body {
	position: relative;
	flex: 1;
	min-height: 0;
}

.loading {
	position: absolute;
	inset: 0;
	display: grid;
	place-content: center;
	gap: 6px;
	padding: 24px;
	text-align: center;
	font-size: 0.9em;
	opacity: 0.8;
}

.frame {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	border: 0;
	background: transparent;
}

.guide {
	position: absolute;
	inset: 0;
	z-index: 2;
	overflow: auto;
	padding: 20px;
	background: var(--MI_THEME-panel);
}

.guideTitle {
	margin: 0 0 10px;
	font-size: 1.1em;
}

.guideSteps {
	margin: 0 0 14px;
	padding-left: 20px;

	> li {
		margin: 6px 0;
	}
}

.note {
	margin: 0 0 14px;
	font-size: 0.85em;
	opacity: 0.75;
}

.guideGo {
	width: 100%;
}

// Phones: fill the visible area. top and height come from visualViewport (see fitViewport).
@media (max-width: 640px) {
	.panel, .panel.big {
		top: 0;
		left: 0;
		right: 0;
		bottom: auto;
		width: auto;
		height: 100dvh;
		border: 0;
		border-radius: 0;
		box-shadow: none;
	}

	.bar {
		height: calc(46px + env(safe-area-inset-top));
		padding-top: env(safe-area-inset-top);
	}
}
</style>
