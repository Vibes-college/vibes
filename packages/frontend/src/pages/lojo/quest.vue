<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- 闯关: the chapter map game. The game itself is a static page (backend/assets/lojo/quest/) shown in a frame; this page
lends it the community login (api) and the community router (go) through window.__vibesQuest. -->
<template>
<div ref="root" :class="$style.root" :style="{ '--quest-bottom': bottom }">
	<!-- 页面一打开就已经在跑的那个闯关框（服务器那边 LojoQuestInstant.ts）：不再新开一个，把它摆到这里来 -->
	<div v-if="$i && instant != null" ref="slot" :class="$style.frame" data-vibes-quest-hole></div>
	<!-- 刚注册完或在试玩（$i 还是空的）：挂到 body 上，社区外壳的层叠上下文盖不住它。试玩中存档不换框，接着玩 -->
	<Teleport v-else-if="$i || fresh != null || trial" to="body" :disabled="$i != null">
		<iframe ref="frame" :class="[$style.frame, { [$style.alone]: $i == null }]" :src="src" title="闯关" allow="autoplay"></iframe>
	</Teleport>
	<!-- Not signed in: the door. 先打一关 opens the first level without an account (冲刺1111 新人前三分钟 第 2 条); 存档 inside the game makes one. -->
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
			<p :class="$style.text">一关一关，打到考场。第一关：听人报名字、地址，一个字母一个字母拼出来。</p>
			<div :class="$style.actions">
				<button :class="[$style.btn, $style.primary]" type="button" :disabled="opening != null" @click="startTrial()">先打一关，不用注册</button>
				<button :class="$style.btn" type="button" :disabled="opening != null" @click="signin()">{{ opening === 'signin' ? '正在打开…' : '已有账号？登录' }}</button>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { inject, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';
import * as config from '@@/js/config.js';
import * as os from '@/os.js';
import { instance } from '@/instance.js';
import { saveLogin } from '@/accounts.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router.js';
import { markFromQuest } from '@/lojo/quest-refill.js';
import { DI } from '@/di.js';

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
		// 注册：不让弹窗自己登录（那会整页刷新，新人要白等十几秒），拿到凭证存下来，闯关原地接着玩
		const { dispose } = which === 'signup'
			? os.popup(c, { autoSet: false }, {
				done: async (res: { token?: string } | undefined) => {
					if (res?.token == null) return;
					await saveLogin(res.token);
					markQuestSignup();
					fresh.value = res.token;
				},
				closed: () => dispose(),
			})
			: os.popup(c, { autoSet: true }, { closed: () => dispose() });
	} finally {
		opening.value = null;
	}
}

// 刚在这一页注册完的凭证（社区还没按登录状态启动）：闯关框直接用它，离开闯关页时整页打开一次
const fresh = ref<string | null>(null);
// 先打一关（游客试玩）：框带 ?trial=1，游戏只叫 trial-* 接口；在游戏里存档（save）后拿到 fresh，同一个框接着玩
const trial = ref(false);
// 存档后社区第一次按登录状态打开时，不弹「初始设定」、当天不弹「装到桌面」（方案第 5 条：第一天只有存档卡一个弹窗；boot/main-boot.ts 读）
const QUEST_SIGNUP_KEY = 'vibesQuestSignup';

function markQuestSignup() {
	try {
		window.localStorage.setItem(QUEST_SIGNUP_KEY, JSON.stringify({ at: Date.now() }));
	} catch { /* 隐私模式：照常弹 */ }
}

function startTrial() {
	trial.value = true;
}

const signin = () => openDialog('signin');
const signup = () => openDialog('signup');
const frame = ref<HTMLIFrameElement | null>(null);

// 提速（2026-11-10）：直接打开 /quest 时，网页一到就先把闯关框（没登录是门面）摆上了，社区的代码等地图画好才开始下。
// 这一页是那次打开的第一个闯关页（地址的 ?book= ?level= 一样）就接手那个框：摆到自己的位置上，api 和 go 换成社区的。
type InstantBridge = Bridge & { via: Bridge | null; ready?: () => void };
type Instant = { frame: HTMLIFrameElement; bridge: InstantBridge; search: string; taken: boolean };
const w = window as unknown as { vibesQuestInstant?: Instant; vibesQuestDoor?: { el: HTMLElement; pending: 'signin' | 'signup' | 'trial' | null }; vibesQuestFrame?: string };
const instant: Instant | null = (() => {
	const it = w.vibesQuestInstant;
	if (it == null || it.taken || !it.frame.isConnected || window.location.pathname !== '/quest') return null;
	const q = new URLSearchParams(it.search);
	if ((q.get('book') ?? undefined) !== props.book || (q.get('level') ?? undefined) !== props.level) return null;
	it.taken = true;
	return it;
})();
const slot = ref<HTMLElement | null>(null);
let shown = true;
// 那个框不在社区的页面里面（挪进来会重新加载），而社区整个界面（连同弹窗、提示）是一层。框放在这一层下面，
// 从这一页到最外层，一路的背景变透明、点击穿过去（data-vibes-quest-hole），像在页面上开了个窗；
// 同一层里别的东西（侧栏、底栏、弹窗）照常盖在上面、照常能点。
const HOLE = 'data-vibes-quest-hole';
const HOLE_STYLE = `[${HOLE}]{background:transparent!important;pointer-events:none!important}[${HOLE}]>:not([${HOLE}]){pointer-events:auto}`;
const punch = (on: boolean) => {
	if (on && window.document.getElementById('vibesQuestHoleStyle') == null) {
		const style = window.document.createElement('style');
		style.id = 'vibesQuestHoleStyle';
		style.textContent = HOLE_STYLE;
		window.document.head.appendChild(style);
	}
	for (let el = slot.value?.parentElement; el != null && el !== window.document.documentElement; el = el.parentElement) {
		if (on) el.setAttribute(HOLE, '');
		else el.removeAttribute(HOLE);
	}
};
const place = () => {
	if (instant == null || slot.value == null) return;
	const r = slot.value.getBoundingClientRect();
	const st = instant.frame.style;
	st.left = `${r.left}px`;
	st.top = `${r.top}px`;
	st.width = `${r.width}px`;
	st.height = `${r.height}px`;
	st.zIndex = '-1';
	st.visibility = shown && r.width > 0 ? 'visible' : 'hidden';
	if (shown) punch(true);
};
let placeTimer: number | null = null;
let resizeObserver: ResizeObserver | null = null;

// 手机底栏在的时候（它会在 body 上写 --MI-minBottomSpacing），闯关页停在底栏和发帖按钮上方；电脑上没有底栏就铺满。
// 底栏（排在页面下面，不是 fixed）比那个变量高（实测 133px 对 84px），所以量贴着窗口底边、在下半屏的东西从哪儿开始
const bottom = ref('0px');
const root = ref<HTMLElement | null>(null);
// 手机底栏玩的时候收起（创始人 11-10）：底栏由 ui/universal.vue 管，跟时间线同一套；游戏通过 bridge.chrome() 收起、叫回
const chrome = inject(DI.mobileTimelineChrome, null);
const measureBottom = () => {
	// 底栏收起了：闯关页铺到底，游戏在最下面画小横条
	if (chrome?.hidden.value === true) {
		bottom.value = '0px';
		return;
	}
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
	if (instant != null && slot.value != null) {
		place();
		resizeObserver = new ResizeObserver(place);
		resizeObserver.observe(slot.value);
		window.addEventListener('scroll', place, true);
		// 侧栏、底栏是慢慢画出来的，位置会变：前几秒勤量，之后每秒看一眼
		placeTimer = window.setInterval(place, 1000);
		for (const ms of [50, 200, 500, 1000, 2000]) window.setTimeout(place, ms);
	}
	// 没登录：页面一打开就摆上的门面换成这一页的；那时已经点了登录 / 注册，就接着打开
	const door = w.vibesQuestDoor;
	if (door != null) {
		door.el.remove();
		delete w.vibesQuestDoor;
		if ($i == null && door.pending === 'trial') startTrial();
		else if ($i == null && door.pending != null) openDialog(door.pending);
	}
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
// 地址带闯关文件的内容版本（服务器给），手机上能长期缓存；老网页里没有就用旧的写法
// 游客也带 ?trial=1：只有点了「先打一关」才会摆出这个框，存档后地址不变（框不重新加载）
const src = (w.vibesQuestFrame ?? '/lojo-assets/quest/index.html?v=3') + (screen != null ? '&s=' + encodeURIComponent(screen) : '') + ($i == null ? '&trial=1' : '');

type Bridge = {
	api: (endpoint: string, params?: Record<string, unknown>) => Promise<unknown>;
	go: (path: string) => void;
	query: { book?: string; level?: string; from?: string };
	ready?: () => void;
	// 收起 / 叫回社区底栏；底栏能收（手机上）才返回 true
	chrome?: (hidden: boolean) => boolean;
	// 游戏放上来：底栏收起或回来（包括社区自己叫回，比如转屏）时告诉它
	onChrome?: (hidden: boolean) => void;
	// 打开「召唤 Agent」的对话面板；没召唤就返回 false
	agent?: () => boolean;
	// 试玩（游客）才有：存档 = 建号并在这一页登录；登录名能不能用；要不要内测码（测试站注册是关的）；改用登录
	save?: (p: SaveParams) => Promise<{ ok: true } | { ok: false; code: string }>;
	available?: (username: string) => Promise<boolean | null>;
	needsInvite?: boolean;
	signin?: () => void;
};
type SaveParams = { name: string; username: string; password: string; invitationCode?: string };

// 试玩的人能叫的接口：只有 trial-* 和埋点（服务器那边这几个本来就不用登录）
const VISITOR_API = /^lojo\/(quest\/trial-(show|start|audio|answer)|funnel)$/;

// 存档：照 MkSignupDialog.form.vue 的注册写法直接调，不弹社区的注册弹窗。要人机验证或邮箱的站（现在两个站都不要）回到社区的注册弹窗
async function save(p: SaveParams): Promise<{ ok: true } | { ok: false; code: string }> {
	if (instance.emailRequiredForSignup || instance.enableHcaptcha || instance.enableMcaptcha || instance.enableRecaptcha || instance.enableTurnstile || instance.enableTestcaptcha) {
		await openDialog('signup');
		return { ok: false, code: 'DIALOG' };
	}
	const res = await window.fetch(`${config.apiUrl}/signup`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username: p.username, password: p.password, invitationCode: p.invitationCode ?? null }),
	}).catch(() => null);
	if (res == null) return { ok: false, code: 'NETWORK' };
	if (!res.ok || res.status === 204) return { ok: false, code: res.status === 429 ? 'RATE_LIMIT_EXCEEDED' : 'SIGNUP_FAILED' };
	const body = await res.json().catch(() => null) as { token?: string } | null;
	if (body?.token == null) return { ok: false, code: 'SIGNUP_FAILED' };
	await saveLogin(body.token);
	markQuestSignup();
	fresh.value = body.token;
	if (p.name.trim() !== '') await misskeyApi('i/update', { name: p.name.trim().slice(0, 50) }, body.token).catch(() => null);
	return { ok: true };
}

const bridge: Bridge = {
	api(endpoint, params = {}) {
		// Only the game's own endpoints go through the frame; a visitor (no account yet) only the trial ones.
		const token = $i == null ? fresh.value : undefined;
		if (!/^lojo\/(quest\/[a-z-]+|funnel)$/.test(endpoint)) return Promise.reject({ code: 'NOT_ALLOWED', message: endpoint });
		if ($i == null && token == null && !VISITOR_API.test(endpoint)) return Promise.reject({ code: 'NOT_SIGNED_IN', message: endpoint });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return misskeyApi(endpoint as any, { ...params } as any, token);
	},
	go(path) {
		if (/^https?:\/\//.test(path)) {
			window.open(path, '_blank', 'noopener');
			return;
		}
		if (!path.startsWith('/')) return;
		if (!path.startsWith('/quest')) markFromQuest();
		if ($i == null && fresh.value != null) {
			window.location.href = path;
			return;
		}
		router.pushByPath(path);
	},
	query: { book: props.book, level: props.level, from },
	// 地图第一次画好（社区预取别的页面要等它，见 lojo/prefetch.ts）
	ready() {
		if ((window as unknown as { vibesQuestReady?: boolean }).vibesQuestReady) return;
		(window as unknown as { vibesQuestReady?: boolean }).vibesQuestReady = true;
		window.dispatchEvent(new Event('vibes:quest-ready'));
	},
	chrome(hidden) {
		if (chrome == null || !chrome.enabled.value || chrome.blocked.value) return false;
		chrome.hidden.value = hidden;
		return true;
	},
	agent() {
		const ev = new CustomEvent('vibes:agent-open', { cancelable: true });
		// lojo/agent/LojoAgent.vue 在的时候会接住（preventDefault）
		return !window.dispatchEvent(ev);
	},
	...($i == null ? {
		save,
		available: (username: string) => misskeyApi('username/available', { username }).then(r => r.available, () => null),
		needsInvite: instance.disableRegistration,
		signin: () => { openDialog('signin'); },
	} : {}),
};
if (chrome != null) {
	watch(() => chrome.hidden.value === true && chrome.enabled.value, hidden => {
		for (const b of [bridge, instant?.bridge]) b?.onChrome?.(hidden);
		measureBottom();
		// 底栏滑回来要 0.2 秒，滑完再量一次
		if (!hidden) window.setTimeout(measureBottom, 250);
	});
}
if (instant != null) instant.bridge.via = bridge;

// The bridge goes on this page's own frame: the community keeps visited pages alive, and when it brings one back its
// frame reloads; on window it might by then be another 闯关 page's bridge (the plain map, without ?book=), and the
// game would show the map instead of the book (bug 2026-11-10). window.__vibesQuest stays for an older game script.
(window as unknown as { __vibesQuest?: Bridge }).__vibesQuest = bridge;
watch(frame, f => {
	if (f != null) (f as unknown as { __vibesQuest?: Bridge }).__vibesQuest = bridge;
}, { immediate: true });
onActivated(() => {
	(window as unknown as { __vibesQuest?: Bridge }).__vibesQuest = bridge;
	shown = true;
	place();
});

// 刚注册完、社区还是没登录的样子：去了别的板块就整页打开那一页，社区按登录状态启动
function reopenSignedIn() {
	if ($i == null && fresh.value != null) window.setTimeout(() => window.location.reload(), 0);
}

onDeactivated(() => {
	reopenSignedIn();
	// 去了社区别的页面：框留着（回来不用重新加载），先藏起来
	shown = false;
	if (instant != null) {
		instant.frame.style.visibility = 'hidden';
		punch(false);
	}
});

onBeforeUnmount(() => {
	reopenSignedIn();
	if (instant != null) {
		resizeObserver?.disconnect();
		window.removeEventListener('scroll', place, true);
		if (placeTimer != null) window.clearInterval(placeTimer);
		punch(false);
		instant.frame.remove();
		delete w.vibesQuestInstant;
	}
	const win = window as unknown as { __vibesQuest?: Bridge };
	if (win.__vibesQuest === bridge) delete win.__vibesQuest;
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

.alone {
	// 刚注册完：社区还是游客的样子（顶上有「注册」），闯关铺满整屏把它盖住
	position: fixed;
	inset: 0;
	z-index: 1000;
	height: 100dvh;
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
