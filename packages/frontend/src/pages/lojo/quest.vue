<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 闯关: the chapter map game. The game itself is a static page (backend/assets/lojo/quest/) shown in a frame; this page
lends it the community login (api) and the community router (go) through window.__vibesQuest. -->
<template>
<div ref="root" :class="$style.root" :style="{ '--quest-bottom': bottom }">
	<iframe v-if="$i" ref="frame" :class="$style.frame" :src="src" title="闯关" allow="autoplay"></iframe>
	<!-- Not signed in: the game needs an account (hearts, stars, progress are saved per person), so a door instead of 「未找到」. -->
	<div v-else :class="$style.door">
		<!-- 门面上方露一小截纸上地图（只是装饰，不能点） -->
		<svg :class="$style.peek" viewBox="0 0 390 150" aria-hidden="true">
			<path d="M195 150 Q150 125 120 100 Q100 80 150 60 Q200 40 195 15" fill="none" stroke="#141E52" stroke-width="2.4" stroke-dasharray="1 7" stroke-linecap="round"/>
			<path d="M150 60 Q230 70 300 45" fill="none" stroke="#c9bda4" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round"/>
			<path d="M0 95 Q100 80 200 98 T390 88" fill="none" stroke="#d6e0e6" stroke-width="10" stroke-linecap="round"/>
			<g font-family="sans-serif" font-size="11" font-weight="800" text-anchor="middle" fill="#141E52">
				<circle cx="120" cy="100" r="14" fill="#FFFDF8" stroke="#141E52" stroke-width="1.8"/><text x="120" y="104">1-1</text>
				<circle cx="150" cy="60" r="14" fill="#F6F1E7" stroke="#141E52" stroke-width="1.8" stroke-dasharray="3 3"/><text x="150" y="64">1-2</text>
				<circle cx="300" cy="45" r="14" fill="#F6F1E7" stroke="#141E52" stroke-width="1.8" stroke-dasharray="3 3"/><text x="300" y="49">1-7</text>
				<path d="M195 4 l-7 7 h4 v8 h6 v-8 h4z" fill="#E8603F"/>
			</g>
		</svg>
		<div :class="$style.card">
			<div :class="$style.kicker">闯关 · 雅思第一章</div>
			<h1 :class="$style.title">用闯关的方式，让你沉迷学习</h1>
			<p :class="$style.text">一张纸上地图，一关一关往前走。卡住了，走进锦囊书屋挑本书；答错了，问 AI 英语助教 Mia。</p>
			<p :class="$style.text">进度、星星和心都记在你的账号上，所以要先登录。</p>
			<div :class="$style.actions">
				<button :class="[$style.btn, $style.primary]" type="button" :disabled="opening != null" @click="signup()">{{ opening === 'signup' ? '正在打开…' : '注册，开始闯关' }}</button>
				<button :class="$style.btn" type="button" :disabled="opening != null" @click="signin()">{{ opening === 'signin' ? '正在打开…' : '已有账号，登录' }}</button>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onActivated, onBeforeUnmount, onMounted, ref } from 'vue';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router.js';
import { markFromQuest } from '@/lojo/quest-refill.js';

const props = defineProps<{
	book?: string;
	level?: string;
}>();

const router = useRouter();

// 不登录时的门面：登录、注册都用社区自己的弹窗，登录成功后整页刷新，回到这一页就是游戏
// 弹窗的代码要现下载（正式站第一次约 2.3 秒）：门面一出来就先下着，点的时候按钮显示「正在打开…」，免得连点
const loadSignin = () => import('@/components/MkSigninDialog.vue');
const loadSignup = () => import('@/components/MkSignupDialog.vue');
if ($i == null) { loadSignin(); loadSignup(); }
const opening = ref<'signin' | 'signup' | null>(null);
async function openDialog(which: 'signin' | 'signup') {
	if (opening.value != null) return;
	opening.value = which;
	try {
		const c = (await (which === 'signin' ? loadSignin() : loadSignup())).default;
		const { dispose } = os.popup(c, { autoSet: true }, { closed: () => dispose() });
	} finally {
		opening.value = null;
	}
}
const signin = () => openDialog('signin');
const signup = () => openDialog('signup');
const frame = ref<HTMLIFrameElement | null>(null);

// 手机底栏在的时候（它会在 body 上写 --MI-minBottomSpacing），闯关页停在底栏和发帖按钮上方；电脑上没有底栏就铺满。
// 底栏（排在页面下面，不是 fixed）比那个变量高（实测 133px 对 84px），所以量贴着窗口底边、在下半屏的东西从哪儿开始
const bottom = ref('0px');
const root = ref<HTMLElement | null>(null);
const measureBottom = () => {
	if (window.document.body.style.getPropertyValue('--MI-minBottomSpacing') === '') {
		bottom.value = '0px';
		return;
	}
	const h = window.innerHeight;
	let top = h;
	for (const el of window.document.body.querySelectorAll<HTMLElement>('*')) {
		if (root.value?.contains(el)) continue;
		const r = el.getBoundingClientRect();
		if (r.height > 0 && r.width > 0 && r.bottom >= h - 1 && r.top > h / 2) top = Math.min(top, r.top);
	}
	bottom.value = top < h ? `${Math.ceil(h - top)}px` : 'var(--MI-minBottomSpacing)';
};
onMounted(() => {
	measureBottom();
	// 底栏和发帖按钮可能晚一点才画出来
	window.setTimeout(measureBottom, 500);
	window.addEventListener('resize', measureBottom);
});
onBeforeUnmount(() => window.removeEventListener('resize', measureBottom));
// ?from=<app> (back from a mini app) and ?s=<screen> (preview, ignored on app.vibes.college) come straight from the address bar.
const here = new URLSearchParams(window.location.search);
const from = here.get('from') ?? undefined;
const screen = here.get('s');
const src = '/lojo-assets/quest/index.html?v=3' + (screen != null ? '&s=' + encodeURIComponent(screen) : '');

type Bridge = {
	api: (endpoint: string, params?: Record<string, unknown>) => Promise<unknown>;
	go: (path: string) => void;
	query: { book?: string; level?: string; from?: string };
};

const bridge: Bridge = {
	api(endpoint, params = {}) {
		// Only the game's own endpoints go through the frame.
		if (!/^lojo\/quest\/[a-z-]+$/.test(endpoint)) return Promise.reject({ code: 'NOT_ALLOWED', message: endpoint });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return misskeyApi(endpoint as any, { ...params } as any);
	},
	go(path) {
		if (/^https?:\/\//.test(path)) {
			window.open(path, '_blank', 'noopener');
			return;
		}
		if (!path.startsWith('/')) return;
		if (!path.startsWith('/quest')) markFromQuest();
		router.pushByPath(path);
	},
	query: { book: props.book, level: props.level, from },
};

// The bridge goes on this page's own frame: the community keeps visited pages alive, and when it brings one back its
// frame reloads; on window it might by then be another 闯关 page's bridge (the plain map, without ?book=), and the
// game would show the map instead of the book (bug 2026-11-10). window.__vibesQuest stays for an older game script.
(window as unknown as { __vibesQuest?: Bridge }).__vibesQuest = bridge;
onMounted(() => {
	if (frame.value != null) (frame.value as unknown as { __vibesQuest?: Bridge }).__vibesQuest = bridge;
});
onActivated(() => {
	(window as unknown as { __vibesQuest?: Bridge }).__vibesQuest = bridge;
});

onBeforeUnmount(() => {
	const w = window as unknown as { __vibesQuest?: Bridge };
	if (w.__vibesQuest === bridge) delete w.__vibesQuest;
});

definePage(() => ({ title: '闯关', icon: 'ti ti-flag-3' }));
</script>

<style lang="scss" module>
.root {
	// 手机上底栏盖在页面上面，闯关页要停在它上方，不然底部按钮点不到（--quest-bottom 见上面 measureBottom）
	height: calc(100dvh - var(--MI-stickyTop, 0px) - var(--MI-stickyBottom, 0px) - var(--quest-bottom, 0px));
	display: flex;
}

.frame {
	flex: 1;
	width: 100%;
	min-height: inherit;
	border: 0;
	display: block;
	background: #f6efe0;
}

.door {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24px 16px;
	background: #f6efe0;
	overflow: auto;
}

.peek {
	width: 100%;
	max-width: 420px;
	margin-bottom: -18px;
	opacity: 0.85;
}

.card {
	position: relative;
	max-width: 420px;
	box-sizing: border-box;
	width: 100%;
	padding: 28px 22px;
	border: 2px solid #3b3127;
	border-radius: 14px;
	background: #fffaf0;
	color: #3b3127;
	box-shadow: 4px 4px 0 #3b3127;
}

.kicker {
	font-size: 0.85em;
	letter-spacing: 0.08em;
	opacity: 0.7;
}

.title {
	margin: 8px 0 12px;
	font-size: 1.4em;
	line-height: 1.35;
}

.text {
	margin: 0 0 10px;
	line-height: 1.7;
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 18px;
}

.btn {
	padding: 12px 16px;
	border: 2px solid #3b3127;
	border-radius: 999px;
	background: transparent;
	color: inherit;
	font: inherit;
	font-weight: bold;
	cursor: pointer;

	&:disabled {
		cursor: progress;
		opacity: 0.75;
	}
}

.primary {
	background: #3b3127;
	color: #fffaf0;
}
</style>
