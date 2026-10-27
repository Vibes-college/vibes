/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import { Inject, Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { DriveFilesRepository, MiDriveFile, UsersRepository } from '@/models/_.js';
import { MiLojoGateAttempt, MiLojoGateCourse } from '@/models/LojoGate.js';
import { IdService } from '@/core/IdService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { DriveService } from '@/core/DriveService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { InternalStorageService } from '@/core/InternalStorageService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LojoSpeechService } from '@/core/LojoSpeechService.js';
import { createTemp } from '@/misc/create-temp.js';
import { gateOf, gateProfileText, gateProgress, lineOf, markSet, paperOf, pickSet, placedStation, placementOf, publicGroups, setsFor, weakTags } from '@/misc/lojo-gates.js';
import type { GateAttemptFact, GateCourse, GatePlacementPath, GateSet } from '@/misc/lojo-gates.js';
import { lojoTutorIds } from '@/misc/lojo-tutor.js';
import { ApiError } from '@/server/api/error.js';
import { lojoEnglishErrors, lojoGateErrors } from '@/server/api/lojo-schemas.js';
import type Logger from '@/logger.js';

const run = promisify(execFile);
// The imported question sets change only on an import, which clears this cache on the process that took it.
const COURSE_TTL = 60 * 1000;
// Silence around the lines of a recording, in seconds.
const LEAD = 0.6, SAME_SPEAKER = 0.35, NEW_SPEAKER = 0.7, BEFORE_PAUSE = 0.4, TAIL = 1.2;

export type GateAudio = { url: string; duration: number; pauses: { at: number; length: number }[] };

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const out: R[] = new Array(items.length);
	let next = 0;
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			const i = next++;
			out[i] = await fn(items[i]);
		}
	}));
	return out;
}

@Injectable()
export class LojoGateService {
	private logger: Logger;
	private courses = new Map<string, { at: number; course: GateCourse | null }>();
	private renders = new Map<string, Promise<GateAudio | null>>();

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.db)
		private db: DataSource,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		private idService: IdService,
		private loggerService: LoggerService,
		private driveService: DriveService,
		private driveFileEntityService: DriveFileEntityService,
		private internalStorageService: InternalStorageService,
		private httpRequestService: HttpRequestService,
		private lojoSpeechService: LojoSpeechService,
	) {
		this.logger = this.loggerService.getLogger('lojo-gates');
	}

	/* ---------- the question sets ---------- */

	public async course(id: string): Promise<GateCourse | null> {
		const hit = this.courses.get(id);
		if (hit && Date.now() - hit.at < COURSE_TTL) return hit.course;
		const row = await this.db.getRepository(MiLojoGateCourse).findOneBy({ id });
		this.courses.set(id, { at: Date.now(), course: row?.data ?? null });
		return row?.data ?? null;
	}

	public async import(course: GateCourse): Promise<{ sets: number }> {
		await this.db.getRepository(MiLojoGateCourse).upsert({ id: course.id, data: course, updatedAt: new Date() }, ['id']);
		this.courses.delete(course.id);
		return { sets: course.sets.length };
	}

	/* ---------- a learner's attempts ---------- */

	private attempts(userId: string, courseId: string): Promise<MiLojoGateAttempt[]> {
		return this.db.getRepository(MiLojoGateAttempt).find({ where: { userId, course: courseId }, order: { id: 'ASC' } });
	}

	private fact(a: MiLojoGateAttempt): GateAttemptFact {
		return {
			kind: a.kind, station: a.station, setId: a.setId, lines: a.data.lines, score: a.score, total: a.total, passed: a.passed,
			startedAt: a.startedAt, submittedAt: a.submittedAt, weak: a.data.weak ?? [], placedAt: a.data.placedAt ?? null,
		};
	}

	private async progressOf(userId: string, course: GateCourse) {
		return gateProgress(course, (await this.attempts(userId, course.id)).map(a => this.fact(a)));
	}

	public async progress(userId: string, courseId: string) {
		const course = await this.course(courseId);
		// Not imported yet: the map shows every station as coming soon.
		if (course == null) return { course: courseId, lines: [], stations: [], last: null };
		const p = await this.progressOf(userId, course);
		return {
			course: courseId,
			lines: p.lines.map(l => ({ ...l, placement: { ...l.placement, at: l.placement.at?.toISOString() ?? null } })),
			stations: p.stations.map(s => ({ ...s, passedAt: s.passedAt?.toISOString() ?? null })),
			last: p.last ? { station: p.last.station, at: p.last.at.toISOString() } : null,
		};
	}

	/* ---------- one try at a gate ---------- */

	public async start(userId: string, courseId: string, station: string) {
		const course = await this.course(courseId);
		if (course == null) throw new ApiError(lojoGateErrors.noSuchCourse);
		const line = course.lines.find(l => l.n === lineOf(course, station));
		if (line == null) throw new ApiError(lojoGateErrors.noSuchStation);
		const sets = line.live ? setsFor(course, station) : [];
		if (sets.length === 0) throw new ApiError(lojoGateErrors.notReady);

		const gate = gateOf(course, station);
		const heard = (await this.attempts(userId, courseId)).filter(a => a.station === gate);
		const set = pickSet(sets, heard.map(a => ({ setId: a.setId, startedAt: a.startedAt })))!;
		return this.hand(userId, courseId, 'gate', set, {});
	}

	// A placement test: without `after` its first part; with the handed-in first part, the second part it leads to.
	public async placement(userId: string, courseId: string, line: number, after: string | undefined) {
		const course = await this.course(courseId);
		if (course == null) throw new ApiError(lojoGateErrors.noSuchCourse);
		const placement = placementOf(course, line);
		if (placement == null || !course.lines.find(l => l.n === line)?.live) throw new ApiError(lojoGateErrors.notReady);
		if (after == null) return this.hand(userId, courseId, 'placement', placement.stages.first, { stage: 'first' });
		const first = await this.db.getRepository(MiLojoGateAttempt).findOneBy({ id: after, userId, kind: 'placement', setId: placement.stages.first.id });
		if (first == null || first.submittedAt == null) throw new ApiError(lojoGateErrors.noSuchAttempt);
		const path: GatePlacementPath = (first.score ?? 0) >= placement.next ? 'high' : 'low';
		return this.hand(userId, courseId, 'placement', placement.stages[path], { stage: path, after: first.id });
	}

	// Hands out one paper: makes its recording first (a failed synthesis costs the learner nothing), then writes the attempt.
	private async hand(userId: string, courseId: string, kind: 'gate' | 'placement', set: GateSet, data: { stage?: string; after?: string }) {
		const audio = await this.audioFor(set);
		const startedAt = new Date();
		const id = this.idService.gen(startedAt.getTime());
		await this.db.getRepository(MiLojoGateAttempt).insert({
			id, userId, course: courseId, kind, station: set.station, setId: set.id, score: null, total: set.total,
			passed: null, startedAt, submittedAt: null, data: { lines: set.lines, ...data },
		});
		return {
			attemptId: id, course: courseId, station: set.station, set: set.set, band: set.band, part: set.part,
			pass: set.pass, total: set.total, startedAt: startedAt.toISOString(), audio,
			groups: publicGroups(set, name => name),
			stage: (data.stage ?? null) as 'first' | 'high' | 'low' | null,
		};
	}

	public async submit(userId: string, attemptId: string, answers: { n: number; value: string }[]) {
		const repo = this.db.getRepository(MiLojoGateAttempt);
		const attempt = await repo.findOneBy({ id: attemptId, userId });
		if (attempt == null) throw new ApiError(lojoGateErrors.noSuchAttempt);
		const course = await this.course(attempt.course);
		const set = course ? paperOf(course, attempt.setId) : null;
		// The set was taken out by a later import: there is nothing left to mark it against.
		if (course == null || set == null) throw new ApiError(lojoGateErrors.noSuchAttempt);
		if (attempt.submittedAt != null) return this.result(userId, course, set, attempt, []);

		const before = await this.progressOf(userId, course);
		const marked = markSet(set, new Map(answers.map(a => [a.n, a.value.slice(0, 200)])));
		// A placement test is not passed or failed; its second part decides where the learner starts.
		const passed = attempt.kind === 'gate' ? marked.score >= set.pass : null;
		const placed: { placedAt?: string; firstScore?: number; firstTotal?: number } = {};
		if (attempt.kind === 'placement' && attempt.data.after != null) {
			const placement = placementOf(course, attempt.data.lines[0]);
			const first = await repo.findOneBy({ id: attempt.data.after, userId });
			if (placement != null && first != null) {
				placed.firstScore = first.score ?? 0;
				placed.firstTotal = first.total;
				placed.placedAt = placedStation(course, placement, attempt.data.stage as GatePlacementPath, placed.firstScore + marked.score);
			}
		}
		const done = await repo.update({ id: attempt.id, submittedAt: IsNull() }, {
			score: marked.score, passed, submittedAt: new Date(),
			data: { ...attempt.data, ...placed, answers, items: marked.items, weak: weakTags(marked.items) },
		});
		const saved = await repo.findOneByOrFail({ id: attempt.id });
		// Handed in twice at the same moment: the other request marked it.
		if (!done.affected) return this.result(userId, course, set, saved, []);

		const lit = new Set(before.stations.filter(s => s.state === 'passed').map(s => s.id));
		const after = await this.progressOf(userId, course);
		const own = course.interchanges.find(pair => pair.includes(attempt.station)) ?? [attempt.station];
		const unlocked = after.stations.filter(s => s.state === 'passed' && !lit.has(s.id) && !own.includes(s.id)).map(s => s.id);
		return this.result(userId, course, set, saved, unlocked);
	}

	private async result(userId: string, course: GateCourse, set: GateSet, attempt: MiLojoGateAttempt, unlocked: string[]) {
		const progress = await this.progressOf(userId, course);
		const line = attempt.kind === 'placement' ? attempt.data.lines[0] : lineOf(course, attempt.station);
		const here = progress.stations.find(s => s.id === attempt.station);
		const next = progress.lines.find(l => l.line === line)?.current ?? null;
		const score = attempt.score ?? 0;
		const d = attempt.data;
		const placement = attempt.kind !== 'placement' ? null : d.after == null
			? { stage: 'first' as const, next: (score >= (placementOf(course, d.lines[0])?.next ?? Infinity) ? 'high' : 'low') as GatePlacementPath, placedAt: null, score, total: attempt.total }
			: { stage: d.stage as GatePlacementPath, next: null, placedAt: d.placedAt ?? null, score: (d.firstScore ?? 0) + score, total: (d.firstTotal ?? 0) + attempt.total };
		return {
			attemptId: attempt.id, course: course.id, station: attempt.station, set: set.set, band: set.band,
			score, total: attempt.total, pass: set.pass, passed: !!attempt.passed,
			missing: attempt.kind === 'gate' ? Math.max(0, set.pass - score) : 0,
			durationMs: attempt.submittedAt ? attempt.submittedAt.getTime() - attempt.startedAt.getTime() : 0,
			items: d.items ?? [], weak: d.weak ?? [], script: set.script,
			failStreak: here?.failStreak ?? 0, unlocked, next: next === attempt.station ? null : next,
			placement,
			tutor: await this.tutor(),
		};
	}

	private async tutor() {
		const id = lojoTutorIds()[0];
		const user = id ? await this.usersRepository.findOneBy({ id }) : null;
		return user ? { id: user.id, username: user.username, name: user.name } : null;
	}

	/* ---------- what the AI tutor knows ---------- */

	// Where the learner is on each route map with gates, for the tutor's system prompt; null if they never tried one.
	public async profileText(userId: string): Promise<string | null> {
		const rows = await this.db.getRepository(MiLojoGateAttempt).find({ where: { userId }, order: { id: 'ASC' } });
		const out: string[] = [];
		for (const courseId of [...new Set(rows.map(r => r.course))]) {
			const course = await this.course(courseId);
			if (course == null) continue;
			const text = gateProfileText(course, rows.filter(r => r.course === courseId).map(r => this.fact(r)));
			if (text) out.push(`${course.title} route map (practice levels, not official scores):\n${text}`);
		}
		return out.length > 0 ? out.join('\n') : null;
	}

	/* ---------- the recording ---------- */

	// Every line read in its speaker's voice, joined with short silences and the reading-time pauses, as one mp3.
	// Made once per script and shared by every learner; lines are cached one by one, so editing a line redoes only it.
	public async audioFor(set: GateSet): Promise<GateAudio | null> {
		if (!set.script.some(l => l.text != null)) return null;
		// What the listener hears, line by line: the voice itself rather than the speaker's letter, so the key doesn't
		// change when the database hands the voices object back with its keys in another order.
		const heard = set.script.map(l => [l.who == null ? null : set.voices[l.who], l.text, l.pause]);
		const hash = createHash('sha256').update(JSON.stringify([set.rate, heard])).digest('hex');
		const key = `lojoGate:audio:2:${hash}`;
		const cached = await this.cachedAudio(key);
		if (cached) return cached;
		let pending = this.renders.get(key);
		if (pending == null) {
			pending = this.render(set, hash, key).finally(() => this.renders.delete(key));
			this.renders.set(key, pending);
		}
		return pending;
	}

	private async cachedAudio(key: string): Promise<GateAudio | null> {
		const raw = await this.redisClient.get(key).catch(() => null);
		if (raw == null) return null;
		const known = JSON.parse(raw) as { fileId: string; duration: number; pauses: GateAudio['pauses'] };
		const file = await this.driveFilesRepository.findOneBy({ id: known.fileId });
		return file ? { url: this.driveFileEntityService.getPublicUrl(file), duration: known.duration, pauses: known.pauses } : null;
	}

	private async render(set: GateSet, hash: string, key: string): Promise<GateAudio> {
		const spoken = set.script.filter(l => l.text != null);
		const files = await mapLimit(spoken, 4, l => this.lojoSpeechService.speakFile(l.text!, set.voices[l.who!], { speed: set.rate }));
		const cleanups: (() => void)[] = [];
		try {
			const paths = await Promise.all(files.map(f => this.localPath(f, cleanups)));
			const lengths = await Promise.all(paths.map(p => this.probe(p)));

			// The timeline: which input or silence comes next, and where the reading-time pauses start.
			const parts: ({ input: number } | { silence: number })[] = [{ silence: LEAD }];
			const pauses: GateAudio['pauses'] = [];
			let t = LEAD, k = 0;
			set.script.forEach((l, i) => {
				if (l.pause != null) {
					pauses.push({ at: Math.round(t * 10) / 10, length: l.pause });
					parts.push({ silence: l.pause });
					t += l.pause;
					return;
				}
				parts.push({ input: k });
				t += lengths[k++];
				const next = set.script[i + 1];
				const gap = next == null ? TAIL : next.pause != null ? BEFORE_PAUSE : next.who === l.who ? SAME_SPEAKER : NEW_SPEAKER;
				parts.push({ silence: gap });
				t += gap;
			});
			const filters = parts.map((p, i) => ('input' in p
				? `[${p.input}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono[p${i}]`
				: `anullsrc=r=44100:cl=mono,atrim=duration=${p.silence}[p${i}]`));
			const graph = `${filters.join(';')};${parts.map((_, i) => `[p${i}]`).join('')}concat=n=${parts.length}:v=0:a=1[out]`;
			const [out, cleanupOut] = await createTemp();
			cleanups.push(cleanupOut);
			await run('ffmpeg', ['-v', 'error', '-y', ...paths.flatMap(p => ['-i', p]), '-filter_complex', graph, '-map', '[out]',
				'-c:a', 'libmp3lame', '-b:a', '64k', '-ar', '44100', '-ac', '1', '-f', 'mp3', out], { timeout: 180 * 1000, maxBuffer: 4 * 1024 * 1024 });
			const duration = Math.round(await this.probe(out) * 10) / 10;
			const file = await this.driveService.addFile({ user: null, path: out, name: `vibes-gate-${set.id}-${hash.slice(0, 12)}.mp3`, ext: 'mp3' });
			await this.redisClient.set(key, JSON.stringify({ fileId: file.id, duration, pauses })).catch(err => this.logger.warn(`cache write failed: ${err}`));
			this.logger.info(`recorded ${set.id}: ${spoken.length} lines, ${duration} s`);
			return { url: this.driveFileEntityService.getPublicUrl(file), duration, pauses };
		} catch (err) {
			if (err instanceof ApiError) throw err;
			this.logger.warn(`recording ${set.id} failed: ${err instanceof Error ? err.message : String(err)}`);
			throw new ApiError(lojoEnglishErrors.failed);
		} finally {
			for (const c of cleanups) c();
		}
	}

	private async localPath(file: MiDriveFile, cleanups: (() => void)[]): Promise<string> {
		if (file.storedInternal && file.accessKey) return this.internalStorageService.resolvePath(file.accessKey);
		const res = await this.httpRequestService.send(file.url, { method: 'GET', timeout: 60 * 1000 });
		const [path, cleanup] = await createTemp();
		cleanups.push(cleanup);
		await fs.writeFile(path, Buffer.from(await res.arrayBuffer()));
		return path;
	}

	private async probe(path: string): Promise<number> {
		const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], { timeout: 30 * 1000 });
		const seconds = Number(stdout.trim());
		if (!Number.isFinite(seconds)) throw new Error(`no duration for ${path}`);
		return seconds;
	}
}
