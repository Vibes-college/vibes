<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Vibes: the private-message 「任务」 tab, only in the chat with Vibi (2026-11-15). The plan is made and changed by
Vibi's tools and by the learner here; both go through LojoPlanService, so the rules are the same. Looks like the quest
map's notebook (the old route map's colours): paper, dot grid, white cards, coral only for the one main button.
Design: 冲刺1111/社区工程/私信任务标签/需求-社区工程.md §九 (Vibes workspace). -->
<template>
<div ref="rootEl" :class="$style.root" data-plan-tab>
	<div :class="$style.inner">
		<MkLoading v-if="loading && data == null"/>

		<div v-else-if="failed && data == null" :class="$style.empty">
			<div :class="$style.emptyLine">{{ S.loadFailed }}</div>
			<button :class="$style.ghost" @click="load()">{{ S.retry }}</button>
		</div>

		<!-- no plan yet -->
		<div v-else-if="data && data.plan == null" :class="$style.empty" data-plan-empty>
			<XMomoHead :size="80" :class="$style.emptyMascot"/>
			<div :class="$style.emptyLine">{{ S.emptyLine(myTutorName) }}</div>
			<button :class="$style.cta" @click="emit('talk', S.emptyPrefill)">{{ S.emptyButton(myTutorName) }}</button>
			<div :class="$style.privacy"><i class="ti ti-lock"></i> {{ S.privacy(myTutorName) }}</div>
		</div>

		<template v-else-if="data && data.plan">
			<header :class="$style.head">
				<div>
					<div :class="$style.date">{{ S.dateLong(data.today) }}</div>
					<div :class="$style.sub">
						<span>{{ S.daysToExam(data.daysToExam) }}<template v-if="data.plan.examTentative">（{{ S.tentative }}）</template></span>
						<template v-if="stageNow">
							<span :class="$style.dot">·</span>
							<span :style="{ color: lineColor(stageNow.no) }">{{ S.stage(stageNow.name) }}</span>
						</template>
					</div>
				</div>
				<button :class="$style.more" :aria-label="S.replan" @click="showMenu"><i class="ti ti-dots"></i></button>
			</header>

			<div :class="$style.seg" role="tablist">
				<button v-for="v in views" :key="v.key" role="tab" :aria-selected="view === v.key" :class="{ [$style.on]: view === v.key }" @click="view = v.key">{{ v.label }}</button>
			</div>

			<div v-if="data.diagnostic" :class="$style.note">{{ S.diagnostic }}</div>

			<!-- 本周: the 7 circles -->
			<div v-if="view === 'week'" :class="$style.weekBar">
				<button :class="$style.arrow" :aria-label="S.prevWeek" @click="shiftWeek(-7)"><i class="ti ti-chevron-left"></i></button>
				<div :class="$style.circles">
					<button
						v-for="d in data.days" :key="d.date"
						:class="[$style.circle, { [$style.sel]: d.date === selDate, [$style.isToday]: d.date === data.today }]"
						:aria-label="S.dateLong(d.date)" :aria-pressed="d.date === selDate"
						@click="selDate = d.date"
					>
						<span :class="$style.wd">{{ S.weekdayLetter(d.date) }}</span>
						<span :class="[$style.ring, ringClass(d)]" :style="{ '--p': d.total ? d.done / d.total : 0 }"></span>
						<span :class="$style.rest">{{ d.rest ? S.rest : '' }}</span>
					</button>
				</div>
				<button :class="$style.arrow" :aria-label="S.nextWeek" @click="shiftWeek(7)"><i class="ti ti-chevron-right"></i></button>
			</div>

			<template v-if="day">
				<!-- check-ins -->
				<section v-if="day.checkins.length" :class="$style.checkins">
					<div :class="$style.cTitle">
						<span>{{ S.checkins }}</span>
						<span v-if="data.streak > 0" :class="$style.streak">{{ S.streak(data.streak) }}</span>
					</div>
					<div :class="$style.pills">
						<!-- a round check on the left, ticked green; the words stay as they are (design: 攻略 草图.html) -->
						<button
							v-for="c in day.checkins" :key="c.id"
							:class="[$style.pill, { [$style.pillDone]: c.done }]"
							role="checkbox" :aria-checked="c.done"
							:disabled="day.date > data.today || busy.has(c.id)"
							data-plan-checkin
							@click="toggleCheckin(c)"
						>
							<span :class="$style.pillCheck"><i class="ti ti-check"></i></span>
							<span :class="$style.pillName">{{ c.appName ? appName(c.app) : c.title }}</span>
							<span :class="$style.pillMeta">{{ !c.done && progress[c.id]?.answered && day.date === data.today ? `${progress[c.id].answered} / ${progress[c.id].need}` : S.minutes(c.minutes) }}</span>
						</button>
					</div>
				</section>

				<!-- all done: one line and the learner's Momo -->
				<div v-if="allDone" :class="$style.doneCard" data-plan-all-done>
					<div :class="$style.doneLine"><i class="ti ti-circle-check"></i> {{ S.allDone }}</div>
					<div :class="$style.vibi">
						<XMomoHead :size="44"/>
						<div :class="$style.bubble">{{ S.allDoneVibi }}</div>
					</div>
				</div>

				<section v-else-if="day.tasks.length" :class="$style.card">
					<!-- 「勾上这件吗？」: only when what was practised can't be matched to one task -->
					<div v-if="ask && view === 'today'" :class="$style.ask" data-plan-ask>
						<div :class="$style.askBody">
							<div :class="$style.askLine">{{ S.askLine(appName(ask.app)) }}</div>
							<div :class="$style.askTask">{{ ask.task.title }}</div>
						</div>
						<button :class="$style.askYes" :disabled="busy.has(ask.task.id)" @click="askYes"><i class="ti ti-check"></i> {{ S.askYes }}</button>
						<button :class="$style.askNo" @click="askNo">{{ S.askNo }}</button>
					</div>
					<div
						v-for="t in day.tasks" :key="t.id"
						:class="[$style.row, { [$style.rowDone]: t.status === 'done' }]"
						data-plan-task
						@pointerdown="pressStart(t, $event)" @pointerup="pressEnd" @pointerleave="pressEnd" @pointercancel="pressEnd"
						@contextmenu.prevent.stop="openMove(t)"
					>
						<button
							:class="[$style.check, { [$style.checked]: t.status === 'done' }]"
							role="checkbox" :aria-checked="t.status === 'done'" :aria-label="t.title"
							:disabled="day.date > data.today || busy.has(t.id)"
							@click.stop="toggleTask(t)"
						><i class="ti ti-check"></i></button>
						<div :class="$style.body">
							<div :class="$style.title">
								<span :class="$style.stageDot" :style="{ background: lineColor(t.stage) }"></span>
								<span :class="$style.titleText">{{ t.title }}</span>
							</div>
							<div :class="$style.meta">
								<template v-if="t.status === 'done' && t.doneBy === 'auto'">{{ S.autoDone }}</template>
								<template v-else-if="t.status === 'done' && t.doneBy === 'vibi'">{{ S.doneByVibi(myTutorName) }}</template>
								<template v-else-if="t.status === 'done' && t.doneBy === 'ask'">{{ S.doneByAsk }}</template>
								<template v-else>
									<template v-if="t.status !== 'done' && progress[t.id]?.answered">{{ S.answered(progress[t.id].answered, progress[t.id].need) }}</template>
									<template v-else>{{ S.minutes(t.minutes) }}</template>
									<template v-if="t.app">
										· <a :href="appHref(t.app, t.ref)" :class="$style.app" @click.stop>{{ appName(t.app) }}{{ t.ref && t.app === 'vocab' ? ` ${t.ref}` : '' }}</a>
									</template>
								</template>
							</div>
						</div>
						<span v-if="t.delayDays > 0 && t.status !== 'done'" :class="$style.late">{{ S.delayed(t.delayDays) }}</span>
					</div>
					<button v-if="overCount > 0 && day.date === data.today" :class="$style.over" @click="openMove(lastOpen)">{{ S.over(overCount) }}</button>
				</section>

				<div v-else-if="(!day.checkins.length || day.rest) && vibiSays == null" :class="$style.quiet">{{ day.rest ? S.restDay : S.nothingToday }}</div>
			</template>

			<!-- 全程: one line from top to bottom, a station per stage in its line color, ending at the exam (design: 攻略
			草图.html, founder 11-16). Tapping a stage opens what comes next in it and what was just done. -->
			<section v-if="view === 'all'" :class="$style.line" data-plan-all>
				<div
					v-for="st in data.plan.stages" :key="st.no"
					:class="[$style.st, { [$style.stNow]: st.no === data.stageNow, [$style.stOpen]: openStage === st.no }]"
					:style="{ '--c': lineColor(st.no) }"
					data-plan-stage
				>
					<span :class="$style.stStation" aria-hidden="true"></span>
					<button :class="$style.stHead" :aria-expanded="openStage === st.no" @click="toggleStage(st.no)">
						<span :class="$style.stTitle">
							<span :class="$style.stName">{{ S.stage(st.name) }}</span>
							<span v-if="st.no === data.stageNow" :class="$style.hereChip">{{ S.here }}</span>
							<i class="ti ti-chevron-down" :class="$style.stChevron"></i>
						</span>
						<span :class="$style.stRange">{{ S.range(st.start, st.end) }}</span>
						<span v-if="st.goal" :class="$style.stGoal">{{ st.goal }}</span>
						<span :class="$style.stBar"><i :style="{ width: `${st.total ? Math.round(st.done / st.total * 100) : 0}%` }"></i></span>
						<span :class="$style.stCount">{{ st.total > 0 ? S.stageDone(st.done, st.total) : S.stageLater }}</span>
					</button>
					<div v-if="openStage === st.no" :class="$style.stDetail" data-plan-stage-detail>
						<MkLoading v-if="board == null" :em="true"/>
						<template v-else-if="stageLists[st.no]">
							<template v-if="stageLists[st.no].next.length">
								<div :class="$style.stSub">{{ S.upNext }}</div>
								<button v-for="t in stageLists[st.no].next" :key="t.id" :class="$style.stItem" @click="boardMenu(t, $event)">
									<span :class="$style.stItemTitle">{{ t.title }}</span>
									<span :class="$style.stItemDate">{{ S.dateShort(t.date) }}</span>
								</button>
								<div v-if="stageLists[st.no].more > 0" :class="$style.stMore">{{ S.andMore(stageLists[st.no].more) }}</div>
							</template>
							<template v-if="stageLists[st.no].done.length">
								<div :class="$style.stSub">{{ S.recentDone }}</div>
								<button v-for="t in stageLists[st.no].done" :key="t.id" :class="[$style.stItem, $style.stItemDone]" @click="boardMenu(t, $event)">
									<span :class="$style.stItemTitle">{{ t.title }}</span>
									<span :class="$style.stItemDate">{{ S.dateShort(t.date) }}</span>
								</button>
							</template>
							<div v-if="!stageLists[st.no].next.length && !stageLists[st.no].done.length" :class="$style.stMore">{{ S.stageLater }}</div>
						</template>
					</div>
				</div>
				<div :class="$style.stEnd">
					<span :class="$style.stStation" aria-hidden="true"></span>
					<span :class="$style.stName">{{ S.examNode }}</span>
					<span :class="$style.stRange">{{ S.dateShort(data.plan.examDate) }}<template v-if="data.plan.examTentative">（{{ S.tentative }}）</template></span>
				</div>
			</section>

			<!-- 看板: to do / doing / done; side by side on a wide screen, one at a time (swipe) on a phone -->
			<template v-if="view === 'board'">
				<div :class="$style.boardDots" aria-hidden="true">
					<span v-for="(c, i) in boardCols" :key="c.key" :class="{ [$style.on]: i === boardAt }"></span>
				</div>
				<div ref="boardEl" :class="$style.board" data-plan-board @scroll.passive="onBoardScroll">
					<section v-for="c in boardCols" :key="c.key" :class="$style.col">
						<div :class="$style.colHead"><span>{{ c.label }}</span><span>{{ board?.[c.key].length ?? '' }}</span></div>
						<MkLoading v-if="board == null" :em="true"/>
						<div v-else-if="board[c.key].length === 0" :class="$style.colEmpty">{{ S.boardEmpty }}</div>
						<button
							v-for="t in board?.[c.key] ?? []" :key="t.id"
							:class="[$style.bItem, { [$style.bDone]: t.status === 'done' }]"
							@click="boardMenu(t, $event)"
						>
							<span :class="$style.stageDot" :style="{ background: lineColor(t.stage) }"></span>
							<span :class="$style.bTitle">{{ t.title }}</span>
							<span :class="$style.bDate">{{ S.dateShort(t.date) }}</span>
						</button>
					</section>
				</div>
			</template>

			<!-- Vibi: a line on what to do next, from the plan and what is done (rules here, no AI call). Chips are beige;
			only the main one is coral. -->
			<div v-if="vibiSays" :key="vibiSays.id" :class="$style.vibiCard" data-plan-vibi>
				<XMomoHead :size="44"/>
				<div :class="$style.vibiBody">
					<div :class="$style.vibiText">{{ vibiSays.text }}<b v-if="vibiSays.strong">{{ vibiSays.strong }}</b></div>
					<div v-if="vibiSays.chips.length" :class="$style.chips">
						<template v-for="c in vibiSays.chips" :key="c.label">
							<a v-if="c.href" :href="c.href" :class="[$style.chip, { [$style.chipMain]: c.main }]">{{ c.label }}</a>
							<button v-else :class="[$style.chip, { [$style.chipMain]: c.main }]" @click="c.action?.()">{{ c.label }}</button>
						</template>
					</div>
				</div>
			</div>

			<div :class="$style.foot">
				<button v-if="view === 'today' || view === 'all'" :class="$style.ghost" :disabled="replanning" @click="replan">{{ view === 'all' ? S.replanBehind : S.replan }}</button>
				<div v-else-if="view === 'week'" :class="$style.hint">{{ S.moveHint }}</div>
				<div :class="$style.privacy"><i class="ti ti-lock"></i> {{ S.privacy(myTutorName) }}</div>
			</div>
		</template>
	</div>

	<!-- 挪到哪天: from the bottom, the next 7 days in a row; full days and the rest day can't be picked -->
	<Transition :enterActiveClass="$style.sheetIn" :leaveActiveClass="$style.sheetOut" :enterFromClass="$style.sheetFrom" :leaveToClass="$style.sheetFrom">
		<div v-if="moving" :class="$style.scrim" @click.self="moving = null">
			<div :class="$style.sheet" role="dialog" :aria-label="S.moveTitle">
				<div :class="$style.sheetTitle">{{ S.moveTitle }}</div>
				<div :class="$style.sheetSub">{{ moving.title }}</div>
				<div :class="$style.days">
					<button
						v-for="o in moveOptions" :key="o.date"
						:class="[$style.dayBtn, { [$style.dayCur]: o.date === moving.date }]"
						:disabled="!o.ok || o.date === moving.date"
						@click="doMove(o.date)"
					>
						<span :class="$style.dayWd">{{ S.weekday(o.date) }}</span>
						<span :class="$style.dayNum">{{ Number(o.date.slice(8, 10)) }}</span>
						<span :class="$style.dayNote">{{ o.rest ? S.rest : o.full ? S.full : '' }}</span>
					</button>
				</div>
			</div>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { scrollToTop } from '@@/js/scroll.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import * as os from '@/os.js';
import { planStrings as S } from '@/lojo/plan/strings.js';
import { addDays, appHref, appName, lineColor, planAsk, planMoveOptions, planOverCount, planStageLists, ringClass, vibiAll, vibiToday, vibiWeek } from '@/lojo/plan/planView.js';
import type { PBoard, PCheckin, PDay, PShow, PSync, PTask, PView, VibiHooks, VibiSay } from '@/lojo/plan/planView.js';
import { refreshMiniApps } from '@/lojo/miniapps/roster.js';
import XMomoHead from '@/lojo/tutor/MomoHead.vue';
import { myTutorName } from '@/lojo/tutor/persona.js';

// The calculations (types, dates, Vibi's line, the move sheet's days) are in planView.ts; this file keeps the page.

defineProps<{ tutor: Misskey.entities.UserDetailed }>();
const emit = defineEmits<{ (ev: 'talk', text: string): void }>();

const views = [{ key: 'today', label: S.today }, { key: 'week', label: S.week }, { key: 'all', label: S.all }, { key: 'board', label: S.board }] as const;
const view = ref<PView>('today');
const data = ref<PShow | null>(null);
const loading = ref(false);
const failed = ref(false);
const weekOf = ref<string | null>(null);
const selDate = ref<string | null>(null);
const busy = ref(new Set<string>());
const replanning = ref(false);
const moving = ref<PTask | null>(null);
const nextWeek = ref<PDay[]>([]);
const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })();

async function load(opts: { seen?: boolean } = {}) {
	loading.value = true;
	try {
		const res = await misskeyApi('lojo/plan/show', { tz, weekOf: weekOf.value, seen: opts.seen ?? false }) as unknown as PShow;
		data.value = res;
		failed.value = false;
		if (res.plan && (selDate.value == null || !res.days.some(d => d.date === selDate.value))) {
			selDate.value = res.days.some(d => d.date === res.today) ? res.today : res.days[0].date;
		}
	} catch {
		failed.value = true;
	} finally {
		loading.value = false;
	}
}

const rootEl = ref<HTMLElement | null>(null);

// the messages tab is scrolled to the bottom; start this one at the top, with the page header in view
onMounted(async () => {
	nextTick(() => { if (rootEl.value) scrollToTop(rootEl.value, { behavior: 'instant' }); });
	// the task links open where the 小程序 roster says (appHref); the list on the device is used until the answer comes
	void refreshMiniApps();
	await load({ seen: true });
	sync();
	window.document.addEventListener('visibilitychange', onVisible);
});
onBeforeUnmount(() => window.document.removeEventListener('visibilitychange', onVisible));

// back from a mini app: look at today's answers again
function onVisible() {
	if (window.document.visibilityState === 'visible' && data.value?.plan) sync();
}

// ---- ticking by itself: the page shows first, then today's answers are read (at most 1.5 s on the server) ----
const progress = ref<PSync['progress']>({});
const asks = ref<PSync['asks']>([]);
let syncing = false;

async function sync() {
	if (syncing || data.value?.plan == null) return;
	syncing = true;
	try {
		const r = await misskeyApi('lojo/plan/sync', { tz }) as unknown as PSync;
		progress.value = r.progress ?? {};
		asks.value = r.asks ?? [];
		if (r.ticked?.length) await load();
		if (view.value === 'board' && r.ticked?.length) loadBoard();
	} catch { /* the plan is already on the page; ticking by hand still works */ } finally {
		syncing = false;
	}
}

// 「不是这件」: remembered for today on this device
const askOffKey = computed(() => `vibesPlanAskOff:${data.value?.today ?? ''}`);
const askOff = ref<string[]>([]);
watch(askOffKey, k => { try { askOff.value = JSON.parse(localStorage.getItem(k) ?? '[]'); } catch { askOff.value = []; } }, { immediate: true });

const ask = computed(() => {
	const d = data.value;
	const today = d?.days.find(x => x.date === d.today) ?? d?.todayView;
	if (today == null) return null;
	return planAsk(today, asks.value, id => askOff.value.includes(id));
});

async function askYes() {
	const a = ask.value;
	if (a == null) return;
	busy.value.add(a.task.id);
	const ok = await call('lojo/plan/task/status', { taskId: a.task.id, status: 'done', via: 'ask' });
	busy.value.delete(a.task.id);
	if (ok) { asks.value = asks.value.map(x => ({ ...x, taskIds: x.taskIds.filter(id => id !== a.task.id) })); load(); }
}

function askNo() {
	const a = ask.value;
	if (a == null) return;
	askOff.value = [...askOff.value, a.task.id];
	try { localStorage.setItem(askOffKey.value, JSON.stringify(askOff.value)); } catch { /* private mode */ }
}

// ---- 全程 ----
const openStage = ref<number | null>(null);

function toggleStage(no: number) {
	openStage.value = openStage.value === no ? null : no;
	if (board.value == null) loadBoard();
}

// per stage: what comes next (by date) and what was done last, from the board's lists
const stageLists = computed(() => {
	const b = board.value;
	if (b == null) return {} as ReturnType<typeof planStageLists>;
	return planStageLists(b, data.value?.plan?.stages ?? []);
});

// ---- 看板 ----
const board = ref<PBoard | null>(null);
const boardEl = ref<HTMLElement | null>(null);
const boardAt = ref(0);
const boardCols = [{ key: 'todo', label: S.todo }, { key: 'doing', label: S.doing }, { key: 'done', label: S.done }] as const;

async function loadBoard() {
	try {
		const r = await misskeyApi('lojo/plan/show', { tz, board: true }) as unknown as PShow;
		board.value = r.board;
	} catch {
		os.toast(S.loadFailed);
	}
}

watch(view, v => { if (v === 'board' || (v === 'all' && openStage.value != null)) loadBoard(); });

function onBoardScroll() {
	const el = boardEl.value;
	if (el) boardAt.value = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
}

function boardMenu(t: PTask, ev: MouseEvent) {
	const to = (status: 'todo' | 'doing' | 'done') => async () => {
		if (status === t.status) return;
		if (await call('lojo/plan/task/status', { taskId: t.id, status })) { loadBoard(); load(); }
	};
	os.popupMenu([
		{ type: 'label', text: t.title },
		{ text: S.todo, icon: t.status === 'todo' ? 'ti ti-point-filled' : 'ti ti-point', action: to('todo') },
		{ text: S.doing, icon: t.status === 'doing' ? 'ti ti-point-filled' : 'ti ti-point', action: to('doing') },
		{ text: S.done, icon: t.status === 'done' ? 'ti ti-point-filled' : 'ti ti-point', action: to('done') },
	], (ev.currentTarget ?? ev.target) as HTMLElement);
}

watch(view, v => {
	if (v !== 'week' && weekOf.value != null) { weekOf.value = null; load(); }
	if (v === 'today' && data.value) selDate.value = data.value.today;
});

const day = computed<PDay | null>(() => {
	const d = data.value;
	if (d == null || d.plan == null) return null;
	if (view.value === 'today') return d.days.find(x => x.date === d.today) ?? d.todayView;
	if (view.value === 'week') return d.days.find(x => x.date === selDate.value) ?? null;
	return null;
});

const stageNow = computed(() => data.value?.plan?.stages.find(s => s.no === data.value?.stageNow) ?? null);

const allDone = computed(() => {
	const d = day.value;
	return d != null && view.value === 'today' && d.total > 0 && d.done === d.total;
});

// 今天多了 N 件: tasks past the learner's minutes (the program never plans that; it comes from rollover or Vibi).
const overCount = computed(() => {
	const d = day.value; const plan = data.value?.plan;
	if (d == null || plan == null) return 0;
	return planOverCount(d, plan);
});
const lastOpen = computed(() => [...(day.value?.tasks ?? [])].reverse().find(t => t.status !== 'done') ?? null);

function shiftWeek(n: number) {
	const base = data.value?.weekStart ?? data.value?.today;
	if (!base) return;
	const d = new Date(`${base}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n);
	weekOf.value = d.toISOString().slice(0, 10);
	selDate.value = weekOf.value;
	load();
}

// ---- Vibi's line (what she says is in planView.ts: vibiToday, vibiWeek, vibiAll). 「不用」 hides that line on this device. ----

const VIBI_OFF_KEY = 'vibesPlanVibiOff';
const vibiOff = ref<string[]>((() => {
	try { return JSON.parse(localStorage.getItem(VIBI_OFF_KEY) ?? '[]'); } catch { return []; }
})());

function vibiDismiss(id: string) {
	vibiOff.value = [...vibiOff.value, id].slice(-30);
	try { localStorage.setItem(VIBI_OFF_KEY, JSON.stringify(vibiOff.value)); } catch { /* private mode */ }
}

// what her chips do here
const vibiHooks: VibiHooks = { move: t => openMove(t), talk: text => emit('talk', text), dismiss: vibiDismiss };

const vibiSays = computed<VibiSay | null>(() => {
	const d = data.value;
	if (d?.plan == null) return null;
	const say = view.value === 'today' ? vibiToday(d, day.value, allDone.value, vibiHooks) : view.value === 'week' ? vibiWeek(d, vibiHooks) : view.value === 'all' ? vibiAll(d, stageNow.value) : null;
	return say != null && !vibiOff.value.includes(say.id) ? say : null;
});

async function call(endpoint: string, params: Record<string, unknown>): Promise<boolean> {
	try {
		const r = await misskeyApi(endpoint as 'lojo/plan/task/status', params as never) as unknown as { ok: boolean; reason?: string };
		if (!r.ok) { os.toast(r.reason ?? S.loadFailed); return false; }
		return true;
	} catch {
		os.toast(S.loadFailed);
		return false;
	}
}

async function toggleTask(t: PTask) {
	if (busy.value.has(t.id)) return;
	busy.value.add(t.id);
	const prev = t.status;
	const next = prev === 'done' ? 'todo' : 'done';
	t.status = next; t.doneBy = next === 'done' ? 'self' : null; // shown at once; the page reloads after
	const d = day.value; if (d) d.done += next === 'done' ? 1 : -1;
	const ok = await call('lojo/plan/task/status', { taskId: t.id, status: next });
	if (!ok) { t.status = prev; if (d) d.done += next === 'done' ? -1 : 1; }
	busy.value.delete(t.id);
	if (ok) load();
}

async function toggleCheckin(c: PCheckin) {
	const d = day.value;
	if (d == null || busy.value.has(c.id)) return;
	busy.value.add(c.id);
	const was = c.done;
	c.done = !was; d.done += was ? -1 : 1;
	const ok = await call('lojo/plan/task/status', { taskId: c.id, status: was ? 'todo' : 'done', date: d.date });
	if (!ok) { c.done = was; d.done += was ? 1 : -1; }
	busy.value.delete(c.id);
	if (ok) load();
}

async function replan() {
	const { canceled } = await os.confirm({ type: 'question', text: S.replanAsk });
	if (canceled) return;
	replanning.value = true;
	const ok = await call('lojo/plan/replan', {});
	replanning.value = false;
	if (ok) load();
}

function showMenu(ev: MouseEvent) {
	const plan = data.value?.plan;
	if (plan == null) return;
	os.popupMenu([{
		text: S.replan, icon: 'ti ti-refresh', action: () => { replan(); },
	}, {
		type: 'switch', text: S.notifyWeekly, ref: notify,
	}, { type: 'divider' }, {
		type: 'label', text: S.privacy(myTutorName.value),
	}], (ev.currentTarget ?? ev.target) as HTMLElement);
}

const notify = ref(true);
watch(() => data.value?.plan?.notifyWeekly, v => { if (v != null) notify.value = v; }, { immediate: true });
watch(notify, v => {
	if (data.value?.plan && v !== data.value.plan.notifyWeekly) {
		data.value.plan.notifyWeekly = v;
		call('lojo/plan/settings', { notifyWeekly: v });
	}
});

// ---- 挪到哪天 (press and hold; right click on a computer) ----
let pressTimer: number | null = null;

function pressStart(t: PTask, ev: PointerEvent) {
	if (t.status === 'done' || ev.button !== 0) return;
	pressEnd();
	pressTimer = window.setTimeout(() => { pressTimer = null; openMove(t); }, 480);
}

function pressEnd() {
	if (pressTimer != null) { window.clearTimeout(pressTimer); pressTimer = null; }
}

async function openMove(t: PTask | null) {
	if (t == null || t.status === 'done' || data.value?.plan == null) return;
	moving.value = t;
	const d = data.value;
	const sunday = d.days[6].date;
	const last = addDays(d.today, 6);
	if (last > sunday && !nextWeek.value.some(x => x.date === last)) {
		try {
			const r = await misskeyApi('lojo/plan/show', { tz, weekOf: addDays(sunday, 1) }) as unknown as PShow;
			nextWeek.value = r.days;
		} catch { /* unknown days stay pickable; the server says no if they are full */ }
	}
}

const moveOptions = computed(() => {
	const d = data.value; const t = moving.value;
	if (d == null || d.plan == null || t == null) return [];
	return planMoveOptions(d, t, nextWeek.value);
});

async function doMove(toDate: string) {
	const t = moving.value;
	if (t == null) return;
	moving.value = null;
	if (await call('lojo/plan/task/move', { taskId: t.id, toDate })) {
		os.toast(`${S.moved}：${S.dateShort(toDate)}`);
		nextWeek.value = [];
		load();
	}
}
</script>

<style lang="scss" module>
.root {
	// the old route map's colours, following the live theme so dark mode is right by itself
	--bg: var(--MI_THEME-bg, #F6F1E7);
	--panel: var(--MI_THEME-panel, #FFFDF8);
	--fg: var(--MI_THEME-fg, #4A4E63);
	--ink: var(--MI_THEME-brandInk, var(--MI_THEME-fgHighlighted, #14204F));
	--line: var(--MI_THEME-divider, #E9E1D2);
	--weak: color-mix(in srgb, var(--fg) 64%, transparent);
	--cta: var(--MI_THEME-cta, #E8603F);
	--btn: var(--MI_THEME-buttonBg, #EFE8DA);
	--btnH: var(--MI_THEME-buttonHoverBg, #E6DDCB);
	--mustard: #F2C14E;
	--ok: #2F7D5B;
	--okBg: color-mix(in srgb, #2F7D5B 16%, var(--panel));
	--goldBg: color-mix(in srgb, #F2C14E 22%, var(--panel));
	--gold: color-mix(in srgb, #B8871B 72%, var(--fg));
	--dotc: color-mix(in srgb, var(--fg) 13%, transparent);
	--l1: #E8603F; --l2: #2340A3; --l3: #B8871B;
	--serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "Noto Serif CJK SC", STSong, serif;
	--sans: -apple-system, "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif;
	--shadow: 0 1px 2px rgba(20, 32, 79, .06), 0 10px 28px -10px rgba(20, 32, 79, .25);

	min-height: 100%;
	background-color: var(--bg);
	background-image: radial-gradient(circle, var(--dotc) 1.6px, transparent 1.9px);
	background-size: 40px 40px;
	font-family: var(--sans);
	color: var(--fg);
	-webkit-tap-highlight-color: transparent;

	:where(button) { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }
	:where(button:disabled) { cursor: default; }
}

// at night the blue line takes the theme's lighter blue (Vibes Dark accent), so it can be seen on the dark paper
:global(html[data-color-scheme=dark]) .root { --l2: #6F8BF2; }

.inner {
	container-type: inline-size;
	max-width: 700px;
	margin: 0 auto;
	padding: 18px 16px calc(32px + env(safe-area-inset-bottom));
	box-sizing: border-box;
}

.head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.date { font-family: var(--serif); font-size: 26px; font-weight: 700; color: var(--ink); letter-spacing: .5px; line-height: 1.25; }
.sub { margin-top: 4px; font-size: 13px; color: var(--weak); }
.dot { margin: 0 6px; }
.more { width: 36px; height: 36px; border-radius: 10px; font-size: 18px; color: var(--weak); &:hover { background: var(--btn); } }

.seg { display: flex; background: var(--btn); border-radius: 12px; padding: 3px; margin-bottom: 14px; }
.seg button { flex: 1; height: 32px; border-radius: 10px; font-size: 13px; color: var(--fg); }
.seg button.on { background: var(--panel); color: var(--cta); font-weight: 700; box-shadow: inset 0 0 0 1.5px var(--cta); }

.note { margin: -4px 0 12px; font-size: 13px; color: var(--weak); }

// 本周
.weekBar { display: flex; align-items: center; gap: 4px; margin-bottom: 14px; }
.arrow { width: 28px; height: 28px; border-radius: 8px; color: var(--weak); flex: none; &:hover { background: var(--btn); } }
.circles { flex: 1; display: flex; justify-content: space-between; }
.circle { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 40px; padding: 4px 0; border-radius: 12px; }
.circle.sel { background: var(--panel); box-shadow: var(--shadow); }
.wd { font-size: 12px; color: var(--weak); }
.ring {
	width: 24px; height: 24px; border-radius: 50%; box-sizing: border-box; border: 2px solid var(--line);
}
.ring:global(.full) { background: var(--ok); border-color: var(--ok); }
.ring:global(.part) { border-color: var(--ok); background: conic-gradient(var(--ok) calc(var(--p) * 360deg), transparent 0); }
.ring:global(.rest) { border-style: dashed; }
.ring:global(.none) { border-color: color-mix(in srgb, var(--line) 60%, transparent); }
.isToday .ring { outline: 2px solid var(--cta); outline-offset: 2px; }
.rest { font-size: 11px; color: var(--weak); height: 14px; }

// 打卡
.checkins { margin-bottom: 12px; }
.cTitle { display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; color: var(--weak); margin: 0 2px 8px; }
.streak { color: var(--gold); font-weight: 700; font-size: 12px; }
.pills { display: flex; flex-wrap: wrap; gap: 8px; }
.pill {
	flex: 1 1 140px; display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 10px 12px; box-sizing: border-box;
	border-radius: 14px; background: var(--panel); box-shadow: 0 1px 2px rgba(20, 32, 79, .06), inset 0 0 0 1px var(--line);
	font-size: 14px; color: var(--ink); text-align: left;
	&:disabled { cursor: default; }
}
.pillCheck {
	flex: none; width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 1.6px var(--line);
	display: grid; place-items: center; font-size: 14px; color: transparent;
	transition: background .16s, box-shadow .16s, color .16s;
}
.pill:not(:disabled):hover .pillCheck { box-shadow: inset 0 0 0 1.6px var(--ok); }
.pillDone .pillCheck { background: var(--ok); box-shadow: none; color: #fff; }
.pillName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pillMeta { flex: none; margin-left: auto; font-size: 12px; color: var(--weak); }

// 勾上这件吗？
.ask { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--okBg); border-bottom: 1px solid var(--line); }
.askBody { flex: 1; min-width: 0; }
.askLine { font-size: 13px; color: var(--ok); }
.askTask { font-size: 15px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.askYes { flex: none; height: 30px; padding: 0 12px; border-radius: 15px; background: var(--ok); color: #fff; font-size: 13px; &:disabled { opacity: .6; } }
.askNo { flex: none; font-size: 13px; color: var(--weak); &:hover { color: var(--ink); } }

// 今天的事
.card { background: var(--panel); border-radius: 16px; box-shadow: var(--shadow); overflow: hidden; }
.row {
	display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 14px; box-sizing: border-box;
	-webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
	transition: transform .16s;
	& + & { border-top: 1px solid var(--line); }
}
.rowDone { transform: translateY(1px); }
.check {
	flex: none; width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--line);
	display: grid; place-items: center; font-size: 14px; color: transparent;
	transition: background .16s, box-shadow .16s, color .16s;
	&:not(:disabled):hover { box-shadow: inset 0 0 0 1.5px var(--ok); }
}
.checked { background: var(--ok); box-shadow: none; color: #fff; }
.body { flex: 1; min-width: 0; }
.title { display: flex; align-items: center; gap: 8px; font-size: 16px; color: var(--ink); line-height: 1.35; }
.titleText { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rowDone .titleText { color: var(--weak); text-decoration: line-through; }
.stageDot { flex: none; width: 6px; height: 6px; border-radius: 50%; }
.meta { margin: 2px 0 0 14px; font-size: 13px; color: var(--weak); }
.app { color: inherit; text-decoration: underline; text-decoration-color: var(--line); text-underline-offset: 3px; &:hover { color: var(--ink); } }
.late { flex: none; font-size: 12px; padding: 2px 8px; border-radius: 10px; background: var(--goldBg); color: var(--gold); }
.over { display: block; width: 100%; padding: 12px 14px; border-top: 1px solid var(--line); font-size: 13px; color: var(--weak); text-align: left; &:hover { color: var(--ink); } }

.quiet { padding: 28px 0; text-align: center; font-size: 14px; color: var(--weak); }

// 全做完
.doneCard { padding: 14px; background: var(--panel); border-radius: 16px; box-shadow: var(--shadow); }
.doneLine { font-size: 15px; color: var(--ink); font-weight: 700; i { color: var(--ok); } }
.vibi { display: flex; align-items: flex-end; gap: 8px; margin-top: 12px; animation: rise .32s ease-out both; }
.bubble { padding: 8px 12px; border-radius: 14px 14px 14px 4px; background: var(--bg); font-size: 14px; color: var(--ink); }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.foot { margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.ghost {
	height: 36px; padding: 0 16px; border-radius: 18px; background: var(--btn); font-size: 14px; color: var(--ink);
	&:hover { background: var(--btnH); }
	&:disabled { opacity: .6; }
}
.hint { font-size: 12px; color: var(--weak); }
.privacy { font-size: 12px; color: var(--weak); }

// 全程: a line from top to bottom; a station per stage, its bar in the line color, the exam at the end
.line { padding: 18px 16px 14px; background: var(--panel); border-radius: 16px; box-shadow: var(--shadow); margin-bottom: 12px; }
.st { position: relative; padding: 0 0 18px 36px; }
.st::before { content: ''; position: absolute; left: 9px; top: 12px; bottom: -12px; width: 6px; border-radius: 3px; background: var(--c); }
.stStation { position: absolute; left: 0; top: 0; width: 24px; height: 24px; box-sizing: border-box; border-radius: 50%; background: var(--panel); border: 5px solid var(--c); z-index: 1; }
.stNow .stStation { box-shadow: 0 0 0 5px color-mix(in srgb, var(--c) 20%, transparent); }
.stHead { display: block; width: 100%; text-align: left; border-radius: 10px; }
.stTitle { display: flex; align-items: center; gap: 6px; min-height: 24px; }
.stName { font-family: var(--serif); font-size: 17px; font-weight: 700; color: var(--ink); line-height: 1.3; }
.hereChip { font-size: 11px; padding: 1px 7px; border-radius: 99px; background: color-mix(in srgb, var(--cta) 14%, var(--panel)); color: var(--cta); }
.stChevron { margin-left: auto; color: var(--weak); transition: transform .18s; }
.stOpen .stChevron { transform: rotate(180deg); }
.stRange { display: block; margin-top: 1px; font-size: 12px; color: var(--weak); }
.stGoal { display: block; margin-top: 4px; font-size: 13.5px; line-height: 1.5; color: var(--fg); }
.stBar { display: block; height: 6px; margin-top: 8px; border-radius: 3px; background: var(--btn); overflow: hidden; i { display: block; height: 100%; border-radius: 3px; background: var(--c); } }
.stCount { display: block; margin-top: 4px; font-size: 12px; color: var(--weak); }
.stDetail { margin-top: 10px; padding: 6px 10px 8px; background: var(--bg); border-radius: 12px; animation: rise .22s ease-out both; }
.stSub { margin: 6px 0 2px; font-size: 12px; color: var(--weak); }
.stItem { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 36px; text-align: left; & + & { border-top: 1px solid var(--line); } }
.stItemTitle { flex: 1; min-width: 0; font-size: 14px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stItemDate { flex: none; font-size: 12px; color: var(--weak); }
.stItemDone .stItemTitle { color: var(--weak); text-decoration: line-through; }
.stMore { padding: 6px 0 2px; font-size: 12px; color: var(--weak); }
.stEnd { position: relative; display: flex; align-items: baseline; gap: 8px; min-height: 24px; padding-left: 36px; }
.stEnd .stStation { border-color: var(--ink); background: var(--mustard); }
.stEnd .stName { line-height: 24px; }

// Vibi's line: the mascot and a bubble; chips are beige, only the main one coral
.vibiCard { display: flex; align-items: flex-start; gap: 10px; margin-top: 12px; padding: 12px 14px; background: var(--panel); border-radius: 16px; box-shadow: var(--shadow); animation: rise .32s ease-out both; }
.vibiBody { flex: 1; min-width: 0; padding-top: 2px; }
.vibiText { font-size: 14px; line-height: 1.6; color: var(--fg); b { color: var(--ink); font-weight: 600; } }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip { display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 15px; background: var(--btn); color: var(--ink); font-size: 13px; text-decoration: none; &:hover { background: var(--btnH); } }
.chipMain { background: var(--cta); color: #fff; &:hover { background: color-mix(in srgb, var(--cta) 88%, #000); } }

// 看板
.boardDots { display: flex; justify-content: center; gap: 6px; margin: -4px 0 10px; span { width: 6px; height: 6px; border-radius: 50%; background: var(--line); } span.on { background: var(--ink); } }
.board { display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; &::-webkit-scrollbar { display: none; } }
.col { flex: 0 0 100%; scroll-snap-align: start; box-sizing: border-box; padding: 10px; background: var(--panel); border-radius: 16px; box-shadow: var(--shadow); min-height: 160px; }
.colHead { display: flex; justify-content: space-between; padding: 2px 4px 8px; font-size: 13px; font-weight: 700; color: var(--ink); span + span { color: var(--weak); font-weight: 400; } }
.colEmpty { padding: 20px 0; text-align: center; font-size: 13px; color: var(--weak); }
.bItem { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 8px; border-radius: 10px; text-align: left; & + & { border-top: 1px solid var(--line); border-radius: 0; } &:hover { background: var(--bg); } }
.bTitle { flex: 1; min-width: 0; font-size: 14px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bDone .bTitle { color: var(--weak); text-decoration: line-through; }
.bDate { flex: none; font-size: 12px; color: var(--weak); }
@container (min-width: 600px) {
	.boardDots { display: none; }
	.board { overflow: visible; }
	.col { flex: 1 1 0; min-width: 0; }
}

// 空的时候
.empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 56px 12px; text-align: center; }
.emptyMascot { margin-bottom: -4px; }
.emptyLine { font-family: var(--serif); font-size: 19px; color: var(--ink); line-height: 1.5; max-width: 15em; }
.cta { height: 40px; padding: 0 22px; border-radius: 20px; background: var(--cta); color: #fff; font-weight: 700; font-size: 15px; }

// 挪到哪天
.scrim { position: fixed; inset: 0; z-index: 1000; background: rgba(20, 32, 79, .22); display: flex; align-items: flex-end; justify-content: center; }
.sheet {
	width: 100%; max-width: 700px; box-sizing: border-box; padding: 18px 16px calc(20px + env(safe-area-inset-bottom));
	background: var(--panel); border-radius: 18px 18px 0 0; box-shadow: var(--shadow);
}
.sheetTitle { font-family: var(--serif); font-size: 18px; font-weight: 700; color: var(--ink); }
.sheetSub { margin-top: 2px; font-size: 13px; color: var(--weak); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 14px; }
.dayBtn {
	display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 0; border-radius: 12px;
	background: var(--bg);
	&:not(:disabled):hover { box-shadow: inset 0 0 0 1.5px var(--ok); }
	&:disabled { opacity: .4; }
}
.dayCur { box-shadow: inset 0 0 0 1.5px var(--line); }
.dayWd { font-size: 12px; color: var(--weak); }
.dayNum { font-size: 17px; font-weight: 700; color: var(--ink); }
.dayNote { font-size: 11px; color: var(--weak); height: 14px; }
.sheetIn, .sheetOut { transition: opacity .2s; .sheet { transition: transform .2s ease-out; } }
.sheetFrom { opacity: 0; .sheet { transform: translateY(24px); } }
</style>
