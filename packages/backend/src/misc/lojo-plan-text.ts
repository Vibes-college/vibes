/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The words of the task plan the server writes itself: why a change could not be made (shown as a toast on the 任务
// page and told to Momo), and the one-line summary of a change (the task-change card in the chat, the change list).
// Chinese or English by the learner's interface language (misc/lojo-ui-lang.ts, 界面语言第②批 2026-11-18). Task names,
// stage names and the exam checklist are course content and stay as written.
// No imports from lojo-plan.ts (it imports this file).

import type { UiLang } from '@/misc/lojo-ui-lang.js';

const weekdayOf = (d: string) => new Date(`${d}T00:00:00Z`).getUTCDay();
const WEEK_ZH = '日一二三四五六';
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type PlanText = {
	lang: UiLang;
	/** how the learner reads a date: 「11 月 20 日（周五）」 / "Fri, Nov 20" (never 2026-11-20) */
	date: (d: string) => string;
	/** 「周五」 / "Fri" */
	day: (d: string) => string;
	reason: {
		missing: (fields: string[]) => string;
		noList: string;
		examDateFormat: string;
		dailyMinutes: string;
		restDay: string;
		examPast: string;
		examFar: string;
		noTitle: string;
		minutes: string;
		noApp: (app: string) => string;
		noPlanYet: string;
		noPlan: string;
		dateFormat: (example: string) => string;
		noTask: string;
		checkinNoMove: string;
		taskDone: string;
		alreadyOn: (date: string) => string;
		status: string;
		checkinPast: string;
		noCheckinOn: (date: string) => string;
		sameStatus: string;
		weekPast: string;
		onlyPlacement: string;
		nothingThisWeek: string;
		noChange: string;
		alreadyUndone: string;
		tooOld: (days: number) => string;
		timezone: string;
		// dayProblem (misc/lojo-plan.ts)
		dayPast: string;
		afterExam: (date: string) => string;
		restDayOn: (day: string) => string;
		checkinsFull: (max: number) => string;
		dayFull: (date: string, max: number) => string;
		overMinutes: (used: number, daily: number) => string;
	};
	summary: {
		exam: (date: string, tentative: boolean) => string;
		saved: (exam: string) => string;
		placement: (start: string, end: string, exam: string) => string;
		full: (stages: { name: string; start: string }[], exam: string) => string;
		addCheckin: (title: string, date: string) => string;
		addTask: (title: string, date: string) => string;
		move: (title: string, date: string) => string;
		checkin: (title: string, done: boolean) => string;
		status: (status: 'todo' | 'doing' | 'done' | 'removed', title: string, checkin: boolean) => string;
		week: (weekStart: string, n: number) => string;
		replanStage: (stage: string, date: string) => string;
		replanSprint: string;
		replan: (n: number, where: string) => string;
		undo: (summary: string) => string;
	};
};

const zh: PlanText = {
	lang: 'zh',
	date: d => `${Number(d.slice(5, 7))} 月 ${Number(d.slice(8, 10))} 日（周${WEEK_ZH[weekdayOf(d)]}）`,
	day: d => `周${WEEK_ZH[weekdayOf(d)]}`,
	reason: {
		missing: fields => `还缺：${fields.join('、')}。四个都要有才能排`,
		noList: '备考清单还没导入这个站，排不了',
		examDateFormat: '考试日要写成 2026-12-14，没报名可以写 2026-12',
		dailyMinutes: '每天能学多久要在 15 到 600 分钟之间',
		restDay: '休息日要写 0 到 6（0 是周日）',
		examPast: '考试日要在今天以后',
		examFar: '考试日太远了，两年以内才排',
		noTitle: '要有事名',
		minutes: '分钟数要在 1 到 600 之间',
		noApp: app => `没有叫 ${app} 的小程序`,
		noPlanYet: '还没有计划，先排一个',
		noPlan: '还没有计划',
		dateFormat: example => `日子要写成 ${example}`,
		noTask: '找不到这件事',
		checkinNoMove: '打卡每天都有，不用挪',
		taskDone: '这件已经做完了',
		alreadyOn: date => `这件本来就在${date}`,
		status: '状态只能是 todo、doing、done、removed',
		checkinPast: '只能勾今天和以前的打卡',
		noCheckinOn: date => `${date}没有这项打卡`,
		sameStatus: '已经是这个状态了',
		weekPast: '那一周已经过去了',
		onlyPlacement: '摸底期之外先不排，等分数出来再排全程',
		nothingThisWeek: '这一周没有可以排的',
		noChange: '找不到这次改动',
		alreadyUndone: '这次改动已经撤销过了',
		tooOld: days => `超过 ${days} 天的改动不能撤销`,
		timezone: '认不得这个时区',
		dayPast: '不能排到已经过去的日子',
		afterExam: date => `${date}已经过了考试日`,
		restDayOn: day => `${day}是休息日`,
		checkinsFull: max => `打卡最多 ${max} 项，已经有 ${max} 项了`,
		dayFull: (date, max) => `${date}已经排满 ${max} 件了`,
		overMinutes: (used, daily) => `这天已经 ${used} 分钟，超出你每天的 ${daily} 分钟`,
	},
	summary: {
		exam: (date, tentative) => `考试 ${date}${tentative ? '（暂定）' : ''}`,
		saved: exam => `计划存好了；${exam}`,
		placement: (start, end, exam) => `排好了摸底期：${start}到${end}，先摸个底，分数出来再排全程；${exam}`,
		full: (stages, exam) => `排好了全程：${stages.map(s => `${s.name}段 ${s.start}起`).join('，')}；${exam}`,
		addCheckin: (title, date) => `加了 1 项打卡：${title}，${date}起每天`,
		addTask: (title, date) => `加了 1 件：${title} → ${date}`,
		move: (title, date) => `挪了 1 件：${title} → ${date}`,
		checkin: (title, done) => (done ? `打卡：${title}` : `取消打卡：${title}`),
		status: (status, title, checkin) => ({ done: `勾上了：${title}`, todo: `改回没做：${title}`, doing: `开始做：${title}`, removed: checkin ? `删掉了打卡：${title}` : `删掉了：${title}` })[status],
		week: (weekStart, n) => `排好了 ${weekStart}起这一周：${n} 件`,
		replanStage: (stage, date) => `，${stage}段从${date}开始`,
		replanSprint: '，离考试不到 3 周，只排冲刺',
		replan: (n, where) => `从今天起重排了 ${n} 件${where}`,
		undo: summary => `撤销了：${summary}`,
	},
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const en: PlanText = {
	lang: 'en',
	date: d => `${WEEK_EN[weekdayOf(d)]}, ${MONTH_EN[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}`,
	day: d => `${WEEK_EN[weekdayOf(d)]}`,
	reason: {
		missing: fields => `Still missing: ${fields.join(', ')}. All four are needed to make a plan`,
		noList: 'The exam checklist is not on this site yet, so no plan can be made',
		examDateFormat: 'Write the exam date like 2026-12-14, or 2026-12 if you have not booked it',
		dailyMinutes: 'Minutes a day must be between 15 and 600',
		restDay: 'Rest day must be 0 to 6 (0 is Sunday)',
		examPast: 'The exam date must be after today',
		examFar: 'The exam is too far away: plans cover up to two years',
		noTitle: 'The task needs a name',
		minutes: 'Minutes must be between 1 and 600',
		noApp: app => `There is no mini app called ${app}`,
		noPlanYet: 'There is no plan yet. Make one first',
		noPlan: 'There is no plan yet',
		dateFormat: example => `Write the date like ${example}`,
		noTask: 'That task could not be found',
		checkinNoMove: 'Check-ins are every day, so there is nothing to move',
		taskDone: 'That task is already done',
		alreadyOn: date => `That task is already on ${date}`,
		status: 'Status can only be todo, doing, done or removed',
		checkinPast: 'You can only tick check-ins for today or earlier',
		noCheckinOn: date => `There is no such check-in on ${date}`,
		sameStatus: 'It is already in that state',
		weekPast: 'That week is already over',
		onlyPlacement: 'Only the placement period is planned for now. The full plan comes once your score is in',
		nothingThisWeek: 'There is nothing to plan for this week',
		noChange: 'That change could not be found',
		alreadyUndone: 'That change was already undone',
		tooOld: days => `Changes older than ${days} days cannot be undone`,
		timezone: 'That time zone is not recognised',
		dayPast: 'You cannot plan for a day that has passed',
		afterExam: date => `${date} is after the exam`,
		restDayOn: day => `${day} is your rest day`,
		checkinsFull: max => `At most ${max} check-ins a day, and there are already ${max}`,
		dayFull: (date, max) => `${date} already has ${max} tasks`,
		overMinutes: (used, daily) => `That day would come to ${used} minutes, more than your ${daily} a day`,
	},
	summary: {
		exam: (date, tentative) => `exam ${date}${tentative ? ' (tentative)' : ''}`,
		saved: exam => `Plan saved; ${exam}`,
		placement: (start, end, exam) => `Placement period planned: ${start} to ${end}. Find your level first; the full plan comes once your score is in; ${exam}`,
		full: (stages, exam) => `Full plan made: ${stages.map(s => `${s.name} from ${s.start}`).join(', ')}; ${exam}`,
		addCheckin: (title, date) => `Added 1 check-in: ${title}, every day from ${date}`,
		addTask: (title, date) => `Added 1 task: ${title} → ${date}`,
		move: (title, date) => `Moved 1 task: ${title} → ${date}`,
		checkin: (title, done) => (done ? `Checked in: ${title}` : `Check-in undone: ${title}`),
		status: (status, title, checkin) => ({ done: `Ticked: ${title}`, todo: `Back to not done: ${title}`, doing: `Started: ${title}`, removed: checkin ? `Removed check-in: ${title}` : `Removed: ${title}` })[status],
		week: (weekStart, n) => `Planned the week from ${weekStart}: ${plural(n, 'task', 'tasks')}`,
		replanStage: (stage, date) => `; ${stage} starts ${date}`,
		replanSprint: '; less than 3 weeks to the exam, so only the final sprint',
		replan: (n, where) => `Replanned ${plural(n, 'task', 'tasks')} from today${where}`,
		undo: summary => `Undone: ${summary}`,
	},
};

export function planText(lang: UiLang): PlanText {
	return lang === 'en' ? en : zh;
}
