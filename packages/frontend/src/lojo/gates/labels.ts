/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Copy for the gate player (闯关答题页), kept apart from upstream Crowdin translations. Chinese first, short sentences.
// Never promise a score: every band here is a practice level.
import { lang } from '@@/js/config.js';
import { durationParts } from './player.js';
import type { GateLimit, GateReason } from './player.js';

const zh = {
	pageTitle: '闯关',
	gate: '闯关',
	stationTitle: (line: string, band: string) => `${line} · ${band}`,
	practiceLevel: '这是练习难度，不是官方分数',
	loadFailed: '这一站没加载出来。',
	noStation: '没有找到这一站。',
	notOpen: (line: string) => `${line}线还没开放，先去闯别的线吧。`,
	backToMap: '回线路图',
	retry: '重试',

	// intro
	part: '像真考的',
	focus: '考什么',
	types: '题型',
	pace: '语速和口音',
	interchange: (name: string) => `换乘站 · ${name}`,
	interchangeOnly: (tested: string, closed: string) => `${closed}线还没开放，这一关先只考${tested}。`,
	rulesTitle: '规则',
	ruleCount: (total: number, pass: number) => `${total} 题，答对 ${pass} 题过关`,
	ruleOnce: '录音只放一遍，开始后不能暂停或拖动',
	ruleReading: '第一段对话前有看题时间',
	ruleQuiet: '找个安静的地方，最好戴上耳机',
	start: '开始',
	preparing: '正在准备录音…',
	preparingSlow: '第一次生成录音要等一会儿，最多 40 秒左右。',

	// errors
	notReady: '这一站的题还在准备，先去别的站看看。',
	speechUnavailable: '录音服务还没开通，暂时不能闯关。',
	speechFailed: '录音没生成出来，稍后再试。',
	speechQuota: '今天的录音额度用完了，明天再来。',
	rateLimited: '点得太快了，过一会儿再试。',
	attemptGone: '这次闯关已经失效，重新开始吧。',
	networkFailed: '没连上服务器，检查一下网络再试。',

	// the recording
	recording: '录音',
	progress: '录音进度',
	onceNote: '录音只放一遍',
	readingTime: (time: string) => `看题时间 ${time}`,
	loadingAudio: '正在加载录音…',
	buffering: '网络有点慢，正在缓冲…',
	interrupted: '录音停了。',
	resume: '继续播放',
	blocked: '浏览器没让录音自动播放。',
	play: '开始播放',
	audioError: '录音没加载出来。',
	audioRetry: '重试，从停下的地方接着放',
	ended: '录音放完了，检查一下答案再交卷',

	// questions
	setMeta: (set: string, total: number, pass: number) => `第 ${set} 套 · ${total} 题，答对 ${pass} 题过关`,
	questionRange: (from: number, to: number) => from === to ? `第 ${from} 题` : `第 ${from}–${to} 题`,
	question: (n: number) => `第 ${n} 题`,
	limit: (limit: GateLimit): string => {
		if (limit.words <= 0) return limit.number ? '每空只写一个数字' : '';
		if (limit.number) return `每空最多 ${limit.words} 个词，可以加一个数字`;
		return limit.words === 1 ? '每空只写 1 个词' : `每空最多 ${limit.words} 个词`;
	},
	gapLimit: (limit: GateLimit): string => {
		if (limit.words <= 0) return limit.number ? '只写一个数字' : '';
		return `最多 ${limit.words} 个词${limit.number ? '，可以加一个数字' : ''}`;
	},
	choose: (k: number) => `选 ${k} 项`,
	picked: (k: number, max: number) => `已选 ${k}/${max}`,
	optionsBox: '选项',
	mapAlt: '这一组题的地图，图上标着字母',
	zoomIn: '放大看',
	zoomOut: '缩小',
	letterOption: (letter: string, text: string) => `${letter}：${text}`,
	submit: '交卷',
	confirmPlaying: '录音还没放完，确定交卷吗？',
	confirmBlanks: (n: number) => `还有 ${n} 题没填，确定交卷吗？`,
	confirmBoth: (n: number) => `录音还没放完，还有 ${n} 题没填，确定交卷吗？`,
	submitFailed: '没交上。答案还在，再交一次。',

	// result
	score: (score: number, total: number) => `${score} / ${total}`,
	scoreLabel: (score: number, total: number) => `${total} 题答对 ${score} 题`,
	passed: '过关！',
	unlocked: (k: number) => `前面的 ${k} 站也点亮了`,
	next: (title: string) => `挑战下一站 ${title}`,
	missing: (k: number) => `还差 ${k} 题过关`,
	passLine: (pass: number) => `答对 ${pass} 题过关`,
	setName: (set: string) => `第 ${set} 套`,
	timeUsed: (time: string) => `用时 ${time}`,
	duration: (ms: number): string => {
		const { h, m, s } = durationParts(ms);
		if (h > 0) return `${h} 小时 ${m} 分`;
		if (m > 0) return s > 0 ? `${m} 分 ${s} 秒` : `${m} 分钟`;
		return `${s} 秒`;
	},
	streak: (k: number, canGoBack: boolean) => canGoBack
		? `连续 ${k} 次没过这一站：可以先回前一站，或者先去练练。`
		: `连续 ${k} 次没过这一站：可以先去练练。`,
	previous: (title: string) => `回前一站 ${title}`,
	again: '再闯一次（换一套题）',
	practiceTitle: '错得多的题型，去这里练',
	wrongCount: (k: number) => `错了 ${k} 题`,
	guide: '攻略',
	app: '练习',
	topic: '话题',
	askTutor: (name: string) => `问问 ${name}`,
	tutorHint: '把没做对的题发过去，一起看看错在哪。',

	// review
	reviewTitle: '对答案',
	yours: '你的答案',
	answer: '正确答案',
	alsoAccepted: '也算对',
	blank: '（没填）',
	right: '对',
	reasons: { blank: '没填', 'word-limit': '超过字数', wrong: '不对' } as Record<GateReason, string>,
	seeTranscript: '看原文',
	transcriptTitle: '录音原文',
	pause: (s: number) => `（停顿 ${s} 秒）`,
	answerChip: (n: number) => `第 ${n} 题`,
};

const en: typeof zh = {
	pageTitle: 'Gate',
	gate: 'Gate',
	stationTitle: (line, band) => `${line} · ${band}`,
	practiceLevel: 'A practice level, not an official score',
	loadFailed: 'This stop didn’t load.',
	noStation: 'We couldn’t find this stop.',
	notOpen: line => `The ${line} line isn’t open yet. Try another line for now.`,
	backToMap: 'Back to the map',
	retry: 'Try again',

	part: 'Like the real test',
	focus: 'What it tests',
	types: 'Question types',
	pace: 'Speed and accents',
	interchange: name => `Interchange · ${name}`,
	interchangeOnly: (tested, closed) => `The ${closed} line isn’t open yet, so this gate tests ${tested} only for now.`,
	rulesTitle: 'Rules',
	ruleCount: (total, pass) => `${total} questions; get ${pass} right to pass`,
	ruleOnce: 'The recording plays once. You can’t pause or skip once it starts.',
	ruleReading: 'You get time to read the questions before the first part.',
	ruleQuiet: 'Find a quiet place; headphones help.',
	start: 'Start',
	preparing: 'Preparing the recording…',
	preparingSlow: 'The first time, making the recording can take up to about 40 seconds.',

	notReady: 'The questions for this stop are still being written. Try another stop for now.',
	speechUnavailable: 'Recordings aren’t switched on yet, so this gate can’t open for now.',
	speechFailed: 'The recording couldn’t be made. Try again later.',
	speechQuota: 'Today’s recording quota is used up. Come back tomorrow.',
	rateLimited: 'That was a lot of tries. Wait a moment and try again.',
	attemptGone: 'This attempt has expired. Start again.',
	networkFailed: 'Couldn’t reach the server. Check your connection and try again.',

	recording: 'Recording',
	progress: 'Recording progress',
	onceNote: 'Plays once',
	readingTime: time => `Reading time ${time}`,
	loadingAudio: 'Loading the recording…',
	buffering: 'Slow connection, buffering…',
	interrupted: 'The recording stopped.',
	resume: 'Resume',
	blocked: 'The browser didn’t let the recording start by itself.',
	play: 'Play',
	audioError: 'The recording didn’t load.',
	audioRetry: 'Try again from where it stopped',
	ended: 'The recording has finished. Check your answers, then hand in.',

	setMeta: (set, total, pass) => `Set ${set} · ${total} questions, ${pass} to pass`,
	questionRange: (from, to) => from === to ? `Question ${from}` : `Questions ${from}–${to}`,
	question: n => `Question ${n}`,
	limit: limit => {
		if (limit.words <= 0) return limit.number ? 'A number only for each gap' : '';
		if (limit.number) return limit.words === 1 ? 'One word and/or a number for each gap' : `Up to ${limit.words} words and/or a number for each gap`;
		return limit.words === 1 ? 'One word only for each gap' : `Up to ${limit.words} words for each gap`;
	},
	gapLimit: limit => {
		if (limit.words <= 0) return limit.number ? 'a number only' : '';
		return `up to ${limit.words} ${limit.words === 1 ? 'word' : 'words'}${limit.number ? ' and/or a number' : ''}`;
	},
	choose: k => `Choose ${k}`,
	picked: (k, max) => `${k}/${max} chosen`,
	optionsBox: 'Options',
	mapAlt: 'The map for these questions, with letters on it',
	zoomIn: 'Zoom in',
	zoomOut: 'Zoom out',
	letterOption: (letter, text) => `${letter}: ${text}`,
	submit: 'Hand in',
	confirmPlaying: 'The recording is still playing. Hand in now?',
	confirmBlanks: n => `${n} ${n === 1 ? 'question is' : 'questions are'} still blank. Hand in now?`,
	confirmBoth: n => `The recording is still playing and ${n} ${n === 1 ? 'question is' : 'questions are'} blank. Hand in now?`,
	submitFailed: 'That didn’t go through. Your answers are kept; hand in again.',

	score: (score, total) => `${score} / ${total}`,
	scoreLabel: (score, total) => `${score} of ${total} right`,
	passed: 'Passed!',
	unlocked: k => `The ${k} ${k === 1 ? 'stop' : 'stops'} before it lit up too`,
	next: title => `Try the next stop: ${title}`,
	missing: k => `${k} more to pass`,
	passLine: pass => `${pass} to pass`,
	setName: set => `Set ${set}`,
	timeUsed: time => `Time ${time}`,
	duration: ms => {
		const { h, m, s } = durationParts(ms);
		if (h > 0) return `${h} h ${m} min`;
		if (m > 0) return s > 0 ? `${m} min ${s} s` : `${m} min`;
		return `${s} s`;
	},
	streak: (k, canGoBack) => canGoBack
		? `${k} tries in a row without passing: go back a stop, or practise first.`
		: `${k} tries in a row without passing: practise a little first.`,
	previous: title => `Back a stop: ${title}`,
	again: 'Try again (new questions)',
	practiceTitle: 'Practise what you missed most',
	wrongCount: k => `${k} wrong`,
	guide: 'Guide',
	app: 'Practice',
	topic: 'Topics',
	askTutor: name => `Ask ${name}`,
	tutorHint: 'Send over what you missed and go through it together.',

	reviewTitle: 'Answers',
	yours: 'Yours',
	answer: 'Answer',
	alsoAccepted: 'Also accepted',
	blank: '(blank)',
	right: 'Right',
	reasons: { blank: 'Blank', 'word-limit': 'Over the word limit', wrong: 'Wrong' },
	seeTranscript: 'See the transcript',
	transcriptTitle: 'Transcript',
	pause: s => `(${s}-second pause)`,
	answerChip: n => `Q${n}`,
};

export const GATE_TEXT = { zh, en };
export const gateLang: 'zh' | 'en' = lang.startsWith('zh') ? 'zh' : 'en';
export const gateLabels = GATE_TEXT[gateLang];
