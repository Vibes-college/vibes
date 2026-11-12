<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!--
Vibes admin → Vibi 用量和宝石: look up any learner's Vibi allowance (5 hours + week), their recent charged calls and
their gem ledger; add or take gems by hand, start their windows over, or give an invite reward. Admins only, like
the APIs behind it (lojo/gems/*). Amounts in the API are thousandths of a gem and millionths of a yuan.
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 860px;">
		<div class="_gaps">
			<div :class="$style.row">
				<MkInput v-model="query" :class="$style.grow" data-testid="gems-user" @enter="lookUp">
					<template #label>{{ t.user }}</template>
				</MkInput>
				<MkButton primary data-testid="gems-look" @click="lookUp">{{ t.look }}</MkButton>
			</div>
			<p v-if="error" :class="$style.bad" role="alert">{{ error }}</p>

			<template v-if="data">
				<section :class="$style.card" data-testid="gems-status">
					<b>@{{ data.user.username }}</b> <span :class="$style.muted">{{ data.user.id }}</span>
					<p :class="$style.line">{{ usageLine }}</p>
					<dl :class="$style.rows">
						<dt>{{ t.five }}</dt><dd>{{ data.status.fivePct }}%<template v-if="data.status.fiveResetAt"> · {{ t.resets }} {{ when(data.status.fiveResetAt) }}</template></dd>
						<dt>{{ t.week }}</dt><dd>{{ data.status.weekPct }}%<template v-if="data.status.weekResetAt"> · {{ t.resets }} {{ when(data.status.weekResetAt) }}</template></dd>
						<dt>{{ t.gems }}</dt><dd data-testid="gems-balance">{{ gem(data.status.gems) }}</dd>
						<dt>{{ t.state }}</dt><dd>{{ t.states[data.status.state] }}</dd>
					</dl>
				</section>

				<section :class="$style.card">
					<div :class="$style.row">
						<MkInput v-model="amount" type="number" :class="$style.grow" data-testid="gems-amount">
							<template #label>{{ t.amount }}</template>
						</MkInput>
						<MkInput v-model="minutes" type="number" :class="$style.grow">
							<template #label>{{ t.minutes }}</template>
						</MkInput>
						<MkInput v-model="note" :class="$style.grow">
							<template #label>{{ t.note }}</template>
						</MkInput>
					</div>
					<label :class="$style.check"><input v-model="paid" type="checkbox"> {{ t.paid }}</label>
					<div :class="$style.row">
						<MkButton primary data-testid="gems-adjust" @click="adjust">{{ t.adjust }}</MkButton>
						<MkButton data-testid="gems-reset" @click="resetUsage">{{ t.reset }}</MkButton>
					</div>
				</section>

				<section :class="$style.card">
					<div :class="$style.row">
						<MkInput v-model="inviter" :class="$style.grow">
							<template #label>{{ t.inviter }}</template>
						</MkInput>
						<MkButton @click="invite">{{ t.invite }}</MkButton>
					</div>
				</section>

				<p :class="$style.sub">{{ t.ledger }}</p>
				<div :class="$style.scroll">
					<table :class="$style.table" data-testid="gems-ledger">
						<thead><tr><th>{{ t.time }}</th><th>{{ t.kind }}</th><th>{{ t.amountCol }}</th><th>{{ t.expires }}</th><th>{{ t.noteCol }}</th></tr></thead>
						<tbody>
							<tr v-for="r in data.ledger" :key="r.id">
								<td>{{ when(r.createdAt) }}</td>
								<td>{{ t.kinds[r.kind] ?? r.kind }}<template v-if="r.lotId == null"> · {{ r.paid ? t.bought : t.gifted }}</template></td>
								<td :class="r.amount < 0 ? $style.bad : $style.good">{{ r.amount > 0 ? '+' : '' }}{{ gem(r.amount) }}</td>
								<td>{{ r.lotId == null ? (r.expiresAt ? when(r.expiresAt) : t.never) : '' }}</td>
								<td>{{ r.note ?? '' }}</td>
							</tr>
							<tr v-if="data.ledger.length === 0"><td colspan="5" :class="$style.muted">{{ t.empty }}</td></tr>
						</tbody>
					</table>
				</div>

				<p :class="$style.sub">{{ t.calls }}</p>
				<div :class="$style.scroll">
					<table :class="$style.table" data-testid="gems-calls">
						<thead><tr><th>{{ t.time }}</th><th>{{ t.source }}</th><th>hit / miss / out</th><th>{{ t.cost }}</th><th>{{ t.fromQuota }}</th><th>{{ t.fromGems }}</th></tr></thead>
						<tbody>
							<tr v-for="c in data.calls" :key="c.id">
								<td>{{ when(c.createdAt) }}</td>
								<td>{{ c.source }}</td>
								<td>{{ c.hit }} / {{ c.miss }} / {{ c.out }}</td>
								<td>¥{{ (c.cost / 1e6).toFixed(4) }}</td>
								<td>¥{{ (c.quota / 1e6).toFixed(4) }}</td>
								<td>{{ gem(c.gems) }}</td>
							</tr>
							<tr v-if="data.calls.length === 0"><td colspan="6" :class="$style.muted">{{ t.empty }}</td></tr>
						</tbody>
					</table>
				</div>

				<p :class="$style.muted">{{ t.config }}: {{ configLine }}</p>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { lang } from '@@/js/config.js';
import { definePage } from '@/page.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { gemsText, usageText, whenText } from '@/lojo/tutor/usage-text.js';
import type { VibiUsage } from '@/lojo/tutor/usage-text.js';

const zh = lang.startsWith('zh');
const TEXT = {
	zh: {
		title: 'Vibi 用量和宝石', user: '用户名或 id', look: '查看', five: '5 小时额度', week: '周额度', resets: '恢复于', gems: '宝石',
		state: '状态', states: { ok: '额度内', gems: '额度用完，在用宝石', out: '额度用完，没有宝石' },
		amount: '宝石数（负数是扣）', minutes: '多少分钟后过期（测试用，留空 = 6 个月）', note: '备注', paid: '算作买的宝石（永不过期）',
		adjust: '加 / 扣宝石', reset: '额度从头算', inviter: '邀请人（用户名或 id），给他和上面这位各发邀请奖励', invite: '发邀请奖励',
		ledger: '宝石流水', calls: '最近扣费的调用', time: '时间', kind: '类型', amountCol: '宝石', expires: '过期', noteCol: '备注',
		source: '来源', cost: '成本', fromQuota: '从额度扣', fromGems: '从宝石扣', never: '不过期', empty: '还没有', config: '当前设置',
		gifted: '送的', bought: '买的', notFound: '找不到这个用户', done: '好了',
		kinds: { invite: '邀请赠送', contribution: '贡献赠送', purchase: '购买', spend: '消费', expire: '过期', refund: '退款', admin: '管理员调整' } as Record<string, string>,
	},
	en: {
		title: 'Vibi usage & gems', user: 'Username or id', look: 'Look up', five: '5-hour allowance', week: 'Weekly allowance', resets: 'resets', gems: 'Gems',
		state: 'State', states: { ok: 'Within allowance', gems: 'Allowance used up, using gems', out: 'Allowance used up, no gems' },
		amount: 'Gems (negative takes)', minutes: 'Expires in minutes (testing; empty = 6 months)', note: 'Note', paid: 'Count as bought (never expires)',
		adjust: 'Add / take gems', reset: 'Restart allowance', inviter: 'Inviter (username or id): invite reward to them and the user above', invite: 'Give invite reward',
		ledger: 'Gem ledger', calls: 'Recent charged calls', time: 'Time', kind: 'Kind', amountCol: 'Gems', expires: 'Expires', noteCol: 'Note',
		source: 'Source', cost: 'Cost', fromQuota: 'From allowance', fromGems: 'From gems', never: 'never', empty: 'None yet', config: 'Settings',
		gifted: 'gifted', bought: 'bought', notFound: 'No such user', done: 'Done',
		kinds: { invite: 'Invite reward', contribution: 'Contribution reward', purchase: 'Purchase', spend: 'Spent', expire: 'Expired', refund: 'Refund', admin: 'Admin adjustment' } as Record<string, string>,
	},
};
const t = zh ? TEXT.zh : TEXT.en;

type Shown = {
	user: { id: string; username: string; name: string | null };
	status: VibiUsage;
	calls: { id: string; source: string; hit: number; miss: number; out: number; cost: number; quota: number; gems: number; createdAt: string }[];
	ledger: { id: string; kind: string; amount: number; lotId: string | null; paid: boolean; expiresAt: string | null; note: string | null; createdAt: string }[];
	config: Record<string, number>;
};

const query = ref('');
const data = ref<Shown | null>(null);
const error = ref('');
const amount = ref<number | null>(null);
const minutes = ref<number | null>(null);
const note = ref('');
const paid = ref(false);
const inviter = ref('');

const usageLine = computed(() => data.value ? usageText(data.value.status, new Date(), zh) : '');
const configLine = computed(() => {
	const c = data.value?.config;
	if (!c) return '';
	return zh
		? `5 小时 ¥${(c.fiveHour / 1e6).toFixed(3)}，一周 ¥${(c.week / 1e6).toFixed(3)}，1 宝石抵 ¥${(c.perGem / 1e6).toFixed(4)} 成本，送的宝石 ${c.giftMonths} 个月过期，邀请各得 ${c.inviteGems}`
		: `5 hours ¥${(c.fiveHour / 1e6).toFixed(3)}, week ¥${(c.week / 1e6).toFixed(3)}, 1 gem covers ¥${(c.perGem / 1e6).toFixed(4)} of cost, gifted gems expire after ${c.giftMonths} months, invite ${c.inviteGems} each`;
});

function when(iso: string): string {
	return whenText(iso, new Date(), zh);
}

function gem(milli: number): string {
	return milli < 0 ? `-${gemsText(-milli)}` : gemsText(milli);
}

function who(q: string): { userId?: string; username?: string } {
	const s = q.trim();
	return /^[0-9a-z]{10,}$/.test(s) && !s.startsWith('@') ? { userId: s } : { username: s.replace(/^@/, '') };
}

async function show(params: { userId?: string; username?: string }) {
	error.value = '';
	try {
		data.value = await misskeyApi('lojo/gems/admin-show', params) as unknown as Shown;
	} catch {
		// an id-looking username: try it as a username too
		if (params.userId) return show({ username: params.userId });
		data.value = null;
		error.value = t.notFound;
	}
}

function lookUp() {
	return show(who(query.value));
}

async function adjust() {
	if (!data.value) return;
	const n = Number(amount.value);
	if (amount.value == null || !Number.isFinite(n) || n === 0) return;
	const m = minutes.value == null ? null : Number(minutes.value);
	await misskeyApi('lojo/gems/admin-adjust', { userId: data.value.user.id, gems: n, paid: paid.value, note: note.value || null, expiresInMinutes: m });
	amount.value = null;
	await show({ userId: data.value.user.id });
}

async function resetUsage() {
	if (!data.value) return;
	await misskeyApi('lojo/gems/admin-adjust', { userId: data.value.user.id, resetUsage: true });
	await show({ userId: data.value.user.id });
}

async function invite() {
	if (!data.value || inviter.value.trim() === '') return;
	const other = await misskeyApi('lojo/gems/admin-show', who(inviter.value)).catch(() => null) as unknown as Shown | null;
	if (other == null) {
		error.value = t.notFound;
		return;
	}
	await misskeyApi('lojo/gems/grant-invite', { inviterId: other.user.id, inviteeId: data.value.user.id });
	await show({ userId: data.value.user.id });
}

definePage(() => ({
	title: t.title,
	icon: 'ti ti-diamond',
}));
</script>

<style lang="scss" module>
.row {
	display: flex;
	gap: 8px;
	align-items: flex-end;
	flex-wrap: wrap;
}

.grow {
	flex: 1;
	min-width: 160px;
}

.card {
	padding: 12px 16px;
	border-radius: 10px;
	background: var(--MI_THEME-panel);
}

.line {
	margin: 6px 0;
}

.rows {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 4px 16px;
	margin: 0;

	dd {
		margin: 0;
	}
}

.check {
	display: block;
	margin: 8px 0;
}

.sub {
	margin: 8px 0 0;
	font-weight: bold;
}

.scroll {
	overflow-x: auto;
}

.table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.85em;

	th, td {
		text-align: left;
		padding: 4px 8px;
		border-bottom: solid 0.5px var(--MI_THEME-divider);
		white-space: nowrap;
	}
}

.muted {
	opacity: 0.7;
}

.bad {
	color: var(--MI_THEME-error);
}

.good {
	color: var(--MI_THEME-success);
}
</style>
