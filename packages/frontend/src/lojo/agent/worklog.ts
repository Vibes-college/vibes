/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 发到我的电脑 (2026-11-16): turn the agent's timeline (Paseo, projected view) into the few lines the draft card shows
// while it works, the way T3 Code's work log does (github.com/pingdotgg/t3code, MIT: apps/web/src/components/chat/
// WorkLog.tsx and packages/client-runtime/src/work-log/presentation.ts): one line per step, runs of the same kind
// folded into one ("读了 3 个文件"), a live line for what it is thinking now, and the final answer kept apart.
// Everything here is plain text from the learner's own computer; it is only ever shown as text, never as HTML.

import { agentText as L } from '@/lojo/locales/agent.js';

export type StepKind = 'read' | 'edit' | 'shell' | 'search' | 'web' | 'agent' | 'plan' | 'tool' | 'note' | 'error';

export type Step = {
	kind: StepKind;
	label: string;
	// The names folded into this line (files, commands), shown when the line is opened.
	items?: string[];
	state: 'running' | 'done' | 'failed';
};

export type WorkLog = {
	steps: Step[];
	// What it is thinking right now (the first heading or sentence of its latest thought), only while it works.
	thinking: string | null;
	// Its last message after the last step: the answer.
	answer: string;
	// Files it changed or created, relative to the folder when they are inside it.
	files: string[];
	// Number of tool steps (reads, edits, commands, searches…).
	count: number;
};

// The parts of a Paseo timeline entry this needs (@getpaseo/protocol AgentTimelineItem; checked against 0.15.4).
export type TimelineItem =
	| { type: 'user_message'; text: string }
	| { type: 'assistant_message'; text: string }
	| { type: 'reasoning'; text: string }
	| { type: 'tool_call'; name: string; status: 'running' | 'completed' | 'failed' | 'canceled'; detail?: ToolDetail }
	| { type: 'todo'; items: { text: string; completed: boolean }[] }
	| { type: 'error'; message: string }
	| { type: 'notification'; level: 'info' | 'warning' | 'error'; message: string }
	| { type: string; [key: string]: unknown };

type ToolDetail = {
	type: string;
	command?: string;
	filePath?: string;
	query?: string;
	toolName?: string;
	url?: string;
	description?: string;
	label?: string;
	text?: string;
};

const MAX_LINE = 90;

function short(s: string, n = MAX_LINE): string {
	const one = s.replace(/\s+/g, ' ').trim();
	return one.length > n ? one.slice(0, n - 1) + '…' : one;
}

export function relPath(path: string, cwd?: string | null): string {
	if (cwd && path.startsWith(cwd.replace(/\/+$/, '') + '/')) return path.slice(cwd.replace(/\/+$/, '').length + 1);
	return path;
}

function baseName(path: string): string {
	return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

// T3 Code's liveThoughtLine: the first bold heading, else the first sentence.
export function thoughtLine(text: string): string | null {
	const t = text.trim();
	if (t === '') return null;
	const bold = /\*\*(.+?)\*\*/.exec(t);
	if (bold) return short(bold[1], 80);
	const first = /^[^\n]*?[.!?。！？](?=\s|$)/.exec(t);
	return short(first ? first[0] : t.split('\n')[0], 80);
}

type One = { kind: StepKind; name: string; created?: boolean; state: Step['state'] };

function toolStep(item: { name: string; status: string; detail?: ToolDetail }, cwd?: string | null): One {
	const d = item.detail;
	const state: Step['state'] = item.status === 'running' ? 'running' : item.status === 'failed' ? 'failed' : 'done';
	switch (d?.type) {
		case 'read': return { kind: 'read', name: relPath(d.filePath ?? '', cwd), state };
		case 'edit': return { kind: 'edit', name: relPath(d.filePath ?? '', cwd), state };
		case 'write': return { kind: 'edit', name: relPath(d.filePath ?? '', cwd), created: true, state };
		case 'shell': return { kind: 'shell', name: short(d.command ?? '', 70), state };
		case 'search': return { kind: d.toolName === 'web_search' ? 'web' : 'search', name: short(d.query ?? '', 50), state };
		case 'fetch': {
			let host = d.url ?? '';
			try { host = new URL(host).host; } catch { /* keep as is */ }
			return { kind: 'web', name: host, state };
		}
		case 'sub_agent': return { kind: 'agent', name: short(d.description ?? '', 60), state };
		case 'plan': return { kind: 'plan', name: '', state };
		case 'plain_text': return { kind: 'tool', name: short(d.label ?? d.text ?? item.name, 60), state };
		default: return { kind: 'tool', name: item.name, state };
	}
}

function oneLabel(s: One): string {
	switch (s.kind) {
		case 'read': return L.stepRead(baseName(s.name));
		case 'edit': return s.created ? L.stepCreate(baseName(s.name)) : L.stepEdit(baseName(s.name));
		case 'shell': return L.stepShell(s.name);
		case 'search': return L.stepSearch(s.name);
		case 'web': return L.stepWeb(s.name);
		case 'agent': return L.stepAgent(s.name);
		case 'plan': return L.stepPlan;
		default: return L.stepTool(s.name);
	}
}

function groupLabel(kind: StepKind, n: number): string {
	switch (kind) {
		case 'read': return L.groupRead(n);
		case 'edit': return L.groupEdit(n);
		case 'shell': return L.groupShell(n);
		case 'search': return L.groupSearch(n);
		case 'web': return L.groupWeb(n);
		case 'agent': return L.groupAgent(n);
		default: return L.groupTool(n);
	}
}

const FOLDABLE: StepKind[] = ['read', 'edit', 'shell', 'search', 'web', 'agent', 'tool'];

export function buildWorkLog(items: TimelineItem[], cwd?: string | null, working = false): WorkLog {
	const steps: Step[] = [];
	const files: string[] = [];
	let run: One[] = [];
	let count = 0;
	let thinking: string | null = null;
	let answer = '';
	let todoAt = -1;

	const flush = () => {
		if (run.length === 0) return;
		const state: Step['state'] = run.some(s => s.state === 'running') ? 'running' : run.some(s => s.state === 'failed') ? 'failed' : 'done';
		// The same file read or edited twice in a row is one file.
		const names = run[0].kind === 'read' || run[0].kind === 'edit' ? [...new Set(run.map(s => s.name))] : run.map(s => s.name);
		const first = run.find(s => s.name === names[0]) ?? run[0];
		steps.push(names.length === 1
			? { kind: first.kind, label: oneLabel(first), state }
			: { kind: first.kind, label: groupLabel(first.kind, names.length), items: names.filter(n => n !== ''), state });
		run = [];
	};

	// The answer is the assistant's text after the last step; text before a step is a note on the way.
	let lastStep = -1;
	items.forEach((it, i) => { if (it.type === 'tool_call' || it.type === 'error') lastStep = i; });

	items.forEach((it, i) => {
		switch (it.type) {
			case 'tool_call': {
				const t = it as Extract<TimelineItem, { type: 'tool_call' }>;
				if (t.status === 'canceled') return;
				const s = toolStep(t, cwd);
				count++;
				// Only a change that went through: a write the learner refused (or that failed) left the file as it was.
				if (s.kind === 'edit' && s.state === 'done' && s.name !== '' && !files.includes(s.name)) files.push(s.name);
				if (run.length > 0 && (run[0].kind !== s.kind || !FOLDABLE.includes(s.kind))) flush();
				run.push(s);
				thinking = null;
				return;
			}
			case 'reasoning':
				thinking = thoughtLine((it as { text: string }).text);
				return;
			case 'assistant_message': {
				const text = (it as { text: string }).text.trim();
				if (text === '') return;
				if (i > lastStep) {
					answer = answer === '' ? text : answer + '\n\n' + text;
					thinking = null;
				} else {
					flush();
					steps.push({ kind: 'note', label: thoughtLine(text) ?? short(text), state: 'done' });
				}
				return;
			}
			case 'todo': {
				flush();
				const todo = (it as { items: { text: string; completed: boolean }[] }).items;
				const done = todo.filter(t => t.completed).length;
				const step: Step = { kind: 'plan', label: L.plan(done, todo.length), items: todo.map(t => `${t.completed ? '✓' : '·'} ${short(t.text, 70)}`), state: done === todo.length ? 'done' : 'running' };
				// Only the latest plan stays, where it was last updated.
				if (todoAt >= 0) steps.splice(todoAt, 1);
				todoAt = steps.length;
				steps.push(step);
				return;
			}
			case 'error':
				flush();
				steps.push({ kind: 'error', label: short((it as { message: string }).message), state: 'failed' });
				return;
			case 'notification': {
				const n = it as { level: string; message: string };
				if (n.level === 'info') return;
				flush();
				steps.push({ kind: 'error', label: short(n.message), state: n.level === 'error' ? 'failed' : 'done' });
				return;
			}
			default:
				return;
		}
	});
	flush();

	// A finished step cannot still be running once the agent has stopped.
	if (!working) {
		for (const s of steps) if (s.state === 'running') s.state = 'done';
		thinking = null;
	}
	return { steps, thinking, answer, files, count };
}

// Ticking time, compact as in T3 Code (AgentElapsed.tsx): 12 秒, 3 分 5 秒, 1.5 小时.
export function elapsed(ms: number): string {
	const s = Math.max(0, Math.floor(ms / 1000));
	if (s < 60) return L.seconds(s);
	const m = Math.floor(s / 60);
	if (m < 60) return s % 60 === 0 ? L.minutes(m) : L.minutesSeconds(m, s % 60);
	return L.hours((m / 60).toFixed(1));
}

// What the learner hands back to Vibi: the agent's whole answer (up to a cap) and a one-line list of what it did,
// so Vibi can pick out what matters. Marked as outside content; it never becomes the learner's own words.
export function stepsSummary(log: Pick<WorkLog, 'steps' | 'files'>): string {
	const by = new Map<StepKind, number>();
	for (const s of log.steps) {
		if (s.kind === 'note' || s.kind === 'plan' || s.kind === 'error') continue;
		by.set(s.kind, (by.get(s.kind) ?? 0) + (s.items?.length || 1));
	}
	const parts = [...by.entries()].map(([k, n]) => groupLabel(k, n));
	if (log.files.length > 0) parts.push(L.filesChanged(log.files.slice(0, 12), log.files.length));
	return parts.join(L.partsJoin);
}
