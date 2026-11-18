/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it, vi } from 'vitest';
import { buildWorkLog, elapsed, stepsSummary, thoughtLine } from '@/lojo/agent/worklog.js';
import type { TimelineItem } from '@/lojo/agent/worklog.js';

vi.mock('@/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
// These lines are checked in Chinese (zh-CN UI); the English ones are in vibes-i18n.test.ts.
vi.mock('@@/js/config.js', async (orig) => ({ ...(await orig<typeof import('@@/js/config.js')>()), lang: 'zh-CN' }));

const CWD = '/Users/me/app';
const read = (f: string): TimelineItem => ({ type: 'tool_call', name: 'Read', status: 'completed', detail: { type: 'read', filePath: `${CWD}/${f}` } });
const edit = (f: string, status: 'running' | 'completed' | 'failed' = 'completed'): TimelineItem => ({ type: 'tool_call', name: 'Edit', status, detail: { type: 'edit', filePath: `${CWD}/${f}` } });
const shell = (command: string): TimelineItem => ({ type: 'tool_call', name: 'Bash', status: 'completed', detail: { type: 'shell', command } });

describe('agent work log', () => {
	it('folds runs of the same kind and keeps the answer apart', () => {
		const log = buildWorkLog([
			{ type: 'user_message', text: 'fix it' },
			{ type: 'assistant_message', text: 'Looking at the code first.' },
			read('a.ts'), read('b.ts'), read('a.ts'),
			edit('src/a.ts'),
			shell('pnpm test'),
			{ type: 'assistant_message', text: '**Done.** Tests pass.' },
		], CWD, false);
		expect(log.steps.map(s => s.label)).toEqual(['Looking at the code first.', '读了 2 个文件', '改 a.ts', '运行 pnpm test']);
		expect(log.steps[1].items).toEqual(['a.ts', 'b.ts']);
		expect(log.answer).toBe('**Done.** Tests pass.');
		expect(log.files).toEqual(['src/a.ts']);
		expect(log.count).toBe(5);
		expect(log.thinking).toBeNull();
	});

	it('does not count a file whose change was refused', () => {
		// 11-16 real run: both writes to note.txt were refused, the card still said 改了 1 个文件.
		const log = buildWorkLog([edit('note.txt', 'failed'), edit('note.txt', 'failed'), { type: 'assistant_message', text: 'Not changed.' }], CWD, false);
		expect(log.files).toEqual([]);
	});

	it('shows what it is doing while it works', () => {
		const log = buildWorkLog([
			{ type: 'reasoning', text: '**Checking the router**\nmore text' },
			edit('x.ts', 'running'),
			{ type: 'reasoning', text: 'Now I will run the tests. Then more.' },
		], CWD, true);
		expect(log.steps[0].state).toBe('running');
		expect(log.thinking).toBe('Now I will run the tests.');
		const ended = buildWorkLog([edit('x.ts', 'running')], CWD, false);
		expect(ended.steps[0].state).toBe('done');
	});

	it('keeps only the latest plan', () => {
		const log = buildWorkLog([
			{ type: 'todo', items: [{ text: 'one', completed: false }, { text: 'two', completed: false }] },
			read('a.ts'),
			{ type: 'todo', items: [{ text: 'one', completed: true }, { text: 'two', completed: false }] },
		], CWD, true);
		expect(log.steps.filter(s => s.kind === 'plan').map(s => s.label)).toEqual(['计划 1/2']);
	});

	it('summarises and times', () => {
		expect(stepsSummary({ steps: [{ kind: 'read', label: '', items: ['a', 'b'], state: 'done' }, { kind: 'shell', label: '', state: 'done' }], files: ['a.ts'] }))
			.toBe('读了 2 个文件；运行了 1 条命令；改动的文件：a.ts');
		expect(elapsed(12_400)).toBe('12 秒');
		expect(elapsed(185_000)).toBe('3 分 5 秒');
		expect(thoughtLine('')).toBeNull();
	});
});

describe('hand-back to Vibi', () => {
	it('fits one chat message and keeps both ends of a long answer', async () => {
		const { handBackText } = await import('@/lojo/agent/bridge.js');
		const { parseAgentResult } = await import('@/lojo/agent/draftCard.js');
		const st = { agentId: 'a', at: '2026-11-16T00:00:00Z', endedAt: '2026-11-16T00:01:00Z', status: 'done' as const, answer: 'START ' + 'x'.repeat(5000) + ' END', steps: [{ kind: 'edit' as const, label: '', state: 'done' as const }], files: ['a.ts'] };
		const text = handBackText('abc', st);
		expect(text.length).toBeLessThanOrEqual(2000);
		expect(text).toContain('cut short');
		expect(text).toContain('START');
		expect(text).toContain('END');
		const parsed = parseAgentResult(text);
		expect(parsed?.did).toBe('改了 1 个文件；改动的文件：a.ts');
		expect(parsed?.body.startsWith('START')).toBe(true);
		const short = handBackText('abc', { ...st, answer: 'All good.' });
		expect(short).not.toContain('cut short');
		expect(parseAgentResult(short)?.body).toBe('All good.');
	});
});
