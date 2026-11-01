/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Copy for 0 号线 · 机考打字 (/typing), kept apart from upstream Crowdin translations. Chinese first, short sentences.
// Never promise a score: it is about getting used to the computer test. Facts carry their source and date.
import { learnLang } from '@/lojo/learn-lang.js';
import { mockPlan, sentencesOf, wordCount } from './score.js';
import type { Device, Goal, Stop } from './content.js';
import type { StopState } from './record.js';

function minSec(seconds: number): { m: number; s: number } {
	const t = Math.max(0, Math.round(seconds));
	return { m: Math.floor(t / 60), s: t % 60 };
}

// What a stop's intro says it is, and its tips; null tips are left out.
type IntroArgs = { n: number; need: number; phone: boolean; touch: boolean; goal: Goal; words: number; part: string };
type Intro = { what: string; tips: (string | null)[] };

const zh = {
	lineName: (n: number, name: string) => `${n} 号线 · ${name}`,
	progressFailed: '进度没读出来，先按没练过显示。练完一站会再试着存。',
	saveFailed: '刚才的成绩还没存上，练完下一站会一起存。',
	savedNote: '进度存在你的账号里，换设备也在。',
	toMap: '雅思线路图',

	// time
	limit: (seconds: number) => {
		const { m, s } = minSec(seconds);
		return s > 0 ? `${m} 分 ${s} 秒` : `${m} 分钟`;
	},
	duration: (ms: number) => {
		const { m, s } = minSec(ms / 1000);
		return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
	},

	// the line
	eyebrow: '雅思 · 新手第一条线',
	lede: (stops: number, minutes: number) => `${stops} 站，大约 ${minutes} 分钟。大陆的 BC 雅思全部机考：听力、阅读、写作都在电脑上答。先把手练熟。`,
	deviceChip: { desktop: '按电脑的目标', phone: '按手机的目标' } as Record<Device, string>,
	deviceSwitch: { desktop: '换成手机的目标', phone: '换成电脑的目标' } as Record<Device, string>,
	deviceSwitched: { desktop: '换成了电脑的目标。', phone: '换成了手机的目标。' } as Record<Device, string>,
	phoneNote: '机考在电脑上考，有电脑最好在电脑上练。',
	lineSub: '过一站，亮一站',
	lineLit: '全线点亮',
	stopMeta: (k: number, minutes: number) => `第 ${k} 站 · 约 ${minutes} 分钟`,
	states: { passed: '已过关', ready: '可以挑战', locked: '还没解锁' } as Record<StopState, string>,
	statesLong: { passed: '已过关', ready: '可以挑战', locked: '还没解锁，也可以越级挑战' } as Record<StopState, string>,
	byPhone: '按手机目标',
	stopAria: (k: number, name: string, state: string) => `第 ${k} 站，${name}，${state}`,
	terminal: '终点：全线点亮',
	terminalGo: '全线点亮',
	nextFirst: '从这里开始',
	nextLabel: '下一站',
	nextTitle: (k: number, name: string) => `第 ${k} 站 · ${name}`,
	nextBody: (blurb: string, minutes: number) => `${blurb}。约 ${minutes} 分钟。`,
	rule: '过关',
	startAt: (k: number) => `开始：第 ${k} 站`,
	continueAt: (k: number) => `继续：第 ${k} 站`,
	allTitle: (n: number) => `${n} 站都过了`,
	allBody: (time: string) => `一共练了 ${time}。`,
	seeLine: '看看整条线',
	whyTitle: '为什么要练打字',
	why: [
		['大陆全部机考。', 'BC 在大陆的雅思，听力、阅读、写作都在电脑上答。'],
		['听力要边听边打。', '机考没有 10 分钟誊写时间，最后只有 2 分钟检查。'],
		['写作全部打字。', '两篇至少 150 词和 250 词，一共 60 分钟。屏幕左下角显示字数。'],
		['拼写检查：', '有没有，说法不一。按没有来练。'],
		['打字快慢不算分。', '但打得慢会挤掉想的时间；错一个字母，这题就没分。'],
	] as [string, string][],
	whySource: '来源：BC 中国雅思官网“考试模式”（2026-10-25 查）；IDP“机考是怎么考的”、IELTS 官网学术类写作（2026-10-29 查）。',

	// pass rules
	ruleCount: (n: number, need: number) => `${n} 条里至少 ${need} 条全对`,
	ruleSpell: (n: number, need: number) => `盖住以后，${n} 个里至少打对 ${need} 个`,
	ruleListen: (n: number, need: number) => `${n} 个空里至少填对 ${need} 个`,
	ruleSpeed: (wpm: number, acc: number) => `速度 ${wpm} 词/分钟以上，准确率 ${acc}% 以上`,
	ruleSpeedPhone: (acc: number) => `准确率 ${acc}% 以上（手机上不看速度）`,
	ruleMock: (time: string, part: string, acc: number) => `${time}内打完${part}，准确率 ${acc}% 以上`,
	mockPart: (phone: boolean, sentences: number) => (!phone ? '全段' : sentences === 2 ? '前两句' : `前 ${sentences} 句`),

	// a stop's intro
	back: '回到线路',
	intros: {
		numbers: (a: IntroArgs): Intro => ({
			what: `照着打 ${a.n} 条：日期、时间、价格、电话、邮编。打对的字母变绿，打错的变红，打完自动下一条。`,
			tips: [
				'听力填空里，数字错一位，这题就没分。',
				'红了就退格改掉。改对了，不算错。',
				'有一条的 £ 已经印在题上，只打后面的数字。',
				a.touch ? '数字和符号在键盘的“123”那一页。' : null,
			],
		}),
		spelling: (a: IntroArgs): Intro => ({
			what: `${a.n} 个常拼错的词。每个词先照着打一遍，再盖住，看着中文凭记忆打一遍。`,
			tips: [
				'考场上没有自动纠正。有没有拼写检查，说法不一，按没有来练。',
				'第一遍里，黄线标的是最容易错的字母。',
				a.touch ? '盖住以后，打完点“确定”。大小写不要紧。' : '盖住以后，打完按回车。大小写不要紧。',
				a.touch ? '这一页请手机键盘别自动纠正、别自动大写。要是还在自动改，到键盘设置里关掉。' : null,
			],
		}),
		listening: (a: IntroArgs): Intro => ({
			what: `听一段录音，填 ${a.n} 个空，每空一个词或一个数字。录音不停：下一句开始，上一空就锁住。`,
			tips: [
				'机考听力没有 10 分钟誊写时间，最后只有 2 分钟检查。录音放着，答案就得打进去。',
				'能写数字就写数字，比如 7:15、42。拼错不算对，大小写不要紧。',
				'真考可以回头改前面的空。这里锁住，是为了练跟上录音。',
				'录音只放一遍。先调好音量。',
			],
		}),
		sentences: (a: IntroArgs): Intro => ({
			what: `照着打 ${a.n} 句写作里常见的句子。打对变绿，打错变红，打完自动下一句。`,
			tips: [
				'写作两篇，至少 150 词和 250 词，一共 60 分钟，全部打字。',
				`按 ${a.goal.wpm} 词/分钟算，光打 400 词就要 ${Math.round(400 / a.goal.wpm)} 分钟。`,
				'速度按打对的字符算，5 个字符算 1 个词。',
				a.phone ? '手机上只看准确率，不看速度。' : '打字快慢本身不算分，但打得慢，会挤掉想的时间。',
			],
		}),
		mock: (a: IntroArgs): Intro => ({
			what: `照着原文打${a.part === '全段' ? '一段话' : a.part}，约 ${a.words} 词。像真考：只显示剩余时间和字数，打的时候不告诉你对错，交卷后再看。`,
			tips: [
				'没有拼写检查，也不能粘贴。',
				'真考写作框的左下角会显示字数，这里也一样。',
				'打第一个字开始计时。打完可以先检查，再交卷；时间到会自动交卷。',
				a.phone ? `手机上只打${a.part}。在电脑上打全段，更像考场。` : null,
			],
		}),
	} as Record<string, (a: IntroArgs) => Intro>,
	lockedNote: (k: number) => `前面还有 ${k} 站没过。也可以先挑战这一站。`,
	passedNote: ['这一站已经过了。', '可以再打一次，刷新最好成绩。'] as [string, string],
	start: '开始',
	again: '再打一次',
	skipAhead: '越级挑战',
	enterKey: '回车',
	tried: (k: number) => `闯过 ${k} 次`,
	best: (text: string) => `最好成绩：${text}`,
	bestCount: (kind: 'copy' | 'spell' | 'listen', score: number, total: number) => `${{ copy: '全对', spell: '打对', listen: '填对' }[kind]} ${score}/${total}`,
	bestSpeed: (wpm: number, acc: number) => `${wpm} 词/分钟 · 准确率 ${acc}%`,
	voiceLine: (voice: string, accent: string) => `录音：${voice}（${accent}）`,
	accents: { us: '美音', uk: '英音', au: '澳音' } as Record<string, string>,
	changeVoice: '换音色',
	soundCheck: '试听一句',
	speechOff: '录音服务暂时用不了。这一站会用字幕代替录音。',

	// playing a stop
	exit: '退出这一站，这次不记成绩',
	barRule: (k: number, rule: string) => `第 ${k} 站 · 过关：${rule}`,
	tileAcc: '准确率',
	tileWpm: '速度 · 词/分',
	tileProgress: '进度',
	goalAllRight: (k: number) => `要全对 ${k} 条`,
	goalRight: (k: number) => `要打对 ${k} 个`,
	goalAcc: (a: number) => `要 ${a}% 以上`,
	goalWpm: (w: number) => `要 ${w} 以上`,
	goalPhoneWpm: '手机上不看',
	coveredRight: '盖住以后打对的',
	typeHere: '在这里打',
	clickToType: '点这里，接着打',
	copyAria: (target: string) => `照着打：${target}`,
	underNumbers: '打对变绿，打错变红。红了就退格改，改对了不算错。',
	underSentences: '打完一句自动下一句。红了就退格改，改对了不算错。',
	printed: '题上已经印好',
	ime: '现在是中文输入法。按 Shift 切到英文：考场上只有英文键盘。',
	fullWidth: '打出了中文标点，已经换成英文标点。考场上是英文键盘。',
	marksLabel: '每一条的对错',
	mark: (k: number, state: 'ok' | 'bad' | 'now' | null) => `第 ${k} 条${state === 'ok' ? '，对了' : state === 'bad' ? '，错了' : state === 'now' ? '，正在打' : ''}`,
	sentenceNo: (k: number) => `第 ${k} 句`,

	// stop 2
	phaseLook: '1 看一遍',
	phaseCover: '2 盖住再打',
	underLook: '照着打一遍。黄线标的是最容易错的字母。',
	cover: '盖住了，凭记忆再打一遍',
	underCover: '打完按回车。大小写不要紧。',
	underCoverTouch: '打完点“确定”。大小写不要紧。',
	coverAria: (meaning: string) => `凭记忆打出“${meaning}”的英文`,
	confirm: '确定',
	next: '下一个',
	right: '对了',
	youTyped: '你打的',
	youTypedLine: '你打的：',
	shouldBe: '应该是',
	memo: '记法',
	underWrong: '看一眼，按回车到下一个。',
	underWrongTouch: '看一眼，再点“下一个”。',
	typeFirst: '先打出来，再确定。',
	hear: '听发音',
	missing: (ch: string) => `漏了 ${ch}`,

	// stop 3
	preparing: (done: number, total: number) => `正在准备录音… ${done}/${total}`,
	captionsInstead: '录音没准备好，这次用字幕代替。',
	lookFirst: '先看题',
	playingRow: (k: number) => `正在放第 ${k} 句`,
	nextSoon: '马上放下一句',
	lastGap: '最后一空',
	startIn: (s: number) => `${s} 秒后开始`,
	nextIn: (s: number) => `下一句 ${s} 秒后开始`,
	endIn: (s: number) => `${s} 秒后结束`,
	filled: '填好了，等下一句',
	caption: '字幕：',
	audioLost: '没能放出声音，改用字幕。',
	notesLabel: '题目',

	// stop 5
	timeLeft: '剩余时间',
	wordsTile: '字数',
	submit: '交卷',
	submitArmed: '还没打完，再点交卷',
	source: '原文 · 照着打',
	topic: (t: string) => `题目：${t}`,
	answerLabel: '你的答案 · 打第一个字开始计时',
	// as the test's writing screen shows it, in English
	wordsFoot: 'Words',
	noSpellcheck: '没有拼写检查',
	typedAll: '打完了。检查一下，然后交卷。',
	noPaste: '这里不能粘贴，要自己打。',
	timeUp: '时间到，自动交卷。',

	// the result
	resultAll: (n: number) => `${n} 站全过了！`,
	resultLit: (k: number) => `第 ${k} 站亮了`,
	resultAgain: '又过了一次',
	resultFail: '还差一点',
	reasonCount: (kind: 'copy' | 'spell' | 'listen', score: number, need: number) => ({
		copy: `全对 ${score} 条，要 ${need} 条`, spell: `盖住以后打对 ${score} 个，要 ${need} 个`, listen: `填对 ${score} 个，要 ${need} 个`,
	}[kind]),
	reasonAcc: (a: number, need: number) => `准确率 ${a}%，要 ${need}%`,
	reasonWpm: (w: number, need: number) => `速度 ${w} 词/分钟，要 ${need}`,
	reasonWpmPhone: (w: number) => `速度 ${w} 词/分钟（手机上不看）`,
	reasonCovered: (time: string, limit: string) => `${time}打完，限时 ${limit}`,
	reasonLeft: (k: number) => `没打完：还差 ${k} 个词`,
	tileCount: { copy: '全对', spell: '盖住打对', listen: '填对' } as Record<'copy' | 'spell' | 'listen', string>,
	tileSpeed: '速度',
	tileTime: '用时',
	tileTypedTime: '打字用时',
	wpmUnit: ' 词/分',
	goalNeed: (x: string) => `要 ${x}`,
	phonePass: '这次是按手机的目标过的。有电脑的话，在电脑上再打一遍，更像考场。',
	level: '练的是机考的手感，不是分数。',
	streak: (k: number) => `已经连着 ${k} 次没过。可以先去下一站，回头再来；也可以放慢一点，先求打对。`,
	lightLine: '点亮整条线',
	nextStop: (stopName: string) => `下一站：${stopName}`,
	retry: '再试一次',
	skipTo: (k: number) => `先去第 ${k} 站`,
	backToLine: '回到线路',
	reviewCopy: '逐条看',
	reviewSpell: '盖住以后打的',
	reviewListen: '逐题看',
	reviewSentences: '逐句看',
	wrongPlace: '红色是打错的位置',
	wrongChars: (k: number) => `错了 ${k} 个字符，红色是打错的位置`,
	youFilled: '你填的：',
	blankGap: '没填',
	overLimit: '超了字数',
	recording: '录音：',
	captionsUsed: '这次用的是字幕。',
	spellTitle: '拼错的词',
	punctTitle: '标点或大小写',
	missedTitle: '漏打的词',
	extraTitle: '多打的词',
	noneMisspelt: '一个都没拼错。',
	srRight: '对。',
	srWrong: '错。',
	miniLine: (k: number, total: number) => `已过关 ${k} / ${total} 站`,

	// the whole line lit
	doneEyebrow: (line: string, k: number, total: number) => `${line} · ${k}/${total}`,
	doneTitle: '第一条线，全线点亮',
	doneBody: (n: number, time: string) => `${n} 站都过了，一共练了 ${time}。`,
	doneWalk: '机考要打的字，你都走了一遍：数字、拼写、边听边打、限时写。',
	tileMockWpm: '模拟速度',
	tileMockAcc: '模拟准确率',
	tileTries: '闯关次数',
	timesUnit: ' 次',
	donePhone: (k: number) => `有 ${k} 站是按手机的目标过的。有电脑的话，在电脑上再打一遍，更像考场。`,
	nextStep: '下一步',
	goListening: '去听力线',
	placementBody: '第一次去，先做约 10 分钟的定级测试。做完直接放到适合你的站，前面的站都会点亮。',
	placement: '做定级测试',
	backListening: '回听力线',
	placedBody: '你已经在听力线上了：回线路图，从你那一站接着走。',
	placeAgain: '再做一次定级测试',
	toListeningMap: '回线路图',
	alsoLabel: '也可以：',
	alsoBody: '这条线上打错的词和数字，拿去听写练习里再练几遍。',
	toDictation: '去听写',
	terminalShort: '终点',
};

const en: typeof zh = {
	lineName: (n, name) => `Line ${n} · ${name}`,
	progressFailed: 'Your progress didn’t load, so the line shows as new. It will be saved again after your next stop.',
	saveFailed: 'Your last result isn’t saved yet. It goes with the next stop you finish.',
	savedNote: 'Your progress is saved to your account, on every device.',
	toMap: 'IELTS route map',

	limit: seconds => {
		const { m, s } = minSec(seconds);
		return s > 0 ? `${m} min ${s} s` : `${m} min`;
	},
	duration: ms => {
		const { m, s } = minSec(ms / 1000);
		return m > 0 ? `${m} min ${s} s` : `${s} s`;
	},

	eyebrow: 'IELTS · YOUR FIRST LINE',
	lede: (stops, minutes) => `${stops} stops, about ${minutes} minutes. In mainland China, the British Council IELTS is all on computer: listening, reading and writing. Get your hands ready first.`,
	deviceChip: { desktop: 'Computer targets', phone: 'Phone targets' },
	deviceSwitch: { desktop: 'Use phone targets', phone: 'Use computer targets' },
	deviceSwitched: { desktop: 'Now using computer targets.', phone: 'Now using phone targets.' },
	phoneNote: 'The test is on a computer. If you have one, practise on it.',
	lineSub: 'Pass a stop, light it up',
	lineLit: 'The whole line is lit',
	stopMeta: (k, minutes) => `Stop ${k} · about ${minutes} min`,
	states: { passed: 'Passed', ready: 'Ready to try', locked: 'Locked' },
	statesLong: { passed: 'Passed', ready: 'Ready to try', locked: 'Locked; you can still try it' },
	byPhone: 'Phone targets',
	stopAria: (k, stopName, state) => `Stop ${k}, ${stopName}, ${state}`,
	terminal: 'End: the whole line lit',
	terminalGo: 'Whole line lit',
	nextFirst: 'Start here',
	nextLabel: 'Next stop',
	nextTitle: (k, stopName) => `Stop ${k} · ${stopName}`,
	nextBody: (blurb, minutes) => `${blurb}. About ${minutes} minutes.`,
	rule: 'To pass',
	startAt: k => `Start: stop ${k}`,
	continueAt: k => `Continue: stop ${k}`,
	allTitle: n => `All ${n} stops passed`,
	allBody: time => `You practised for ${time} in all.`,
	seeLine: 'See the whole line',
	whyTitle: 'Why practise typing',
	why: [
		['All on computer in mainland China. ', 'British Council IELTS there is answered on a computer: listening, reading and writing.'],
		['Listening means typing while you listen. ', 'There are no 10 minutes to copy answers over; only 2 minutes to check at the end.'],
		['Writing is all typed. ', 'Two tasks of at least 150 and 250 words in 60 minutes. A word count shows at the bottom left.'],
		['Spellcheck: ', 'accounts differ on whether there is one. Practise as if there isn’t.'],
		['Typing speed isn’t marked. ', 'But slow typing eats into thinking time, and one wrong letter loses the answer.'],
	],
	whySource: 'Sources: British Council China IELTS, “Test format” (checked 2026-10-25); IDP, “How the computer test works”, and IELTS, Academic Writing (checked 2026-10-29).',

	ruleCount: (n, need) => `At least ${need} of ${n} exactly right`,
	ruleSpell: (n, need) => `With the word covered, at least ${need} of ${n} right`,
	ruleListen: (n, need) => `At least ${need} of ${n} gaps right`,
	ruleSpeed: (wpm, acc) => `At least ${wpm} words a minute and ${acc}% accuracy`,
	ruleSpeedPhone: acc => `At least ${acc}% accuracy (speed doesn’t count on a phone)`,
	ruleMock: (time, part, acc) => `${part} within ${time}, at least ${acc}% accuracy`,
	mockPart: (phone, sentences) => (!phone ? 'The whole paragraph' : `The first ${sentences} sentences`),

	back: 'Back to the line',
	intros: {
		numbers: a => ({
			what: `Copy ${a.n} items: dates, times, prices, phone numbers, postcodes. Right letters turn green, wrong ones red; a finished item moves on by itself.`,
			tips: [
				'In a listening gap, one wrong digit loses the mark.',
				'Red? Delete it and fix it. Fixed in time is not a mistake.',
				'One price has the £ printed already: type only the number.',
				a.touch ? 'Numbers and signs are on the keyboard’s “123” page.' : null,
			],
		}),
		spelling: a => ({
			what: `${a.n} words people often misspell. Copy each one, then type it again from memory with it covered.`,
			tips: [
				'There is no autocorrect in the test, and accounts differ on a spellcheck. Practise as if there isn’t one.',
				'The first time, the letters people get wrong are underlined in yellow.',
				a.touch ? 'Covered: type it, then press “OK”. Capitals don’t matter.' : 'Covered: type it, then press Enter. Capitals don’t matter.',
				a.touch ? 'This page asks your keyboard not to autocorrect or capitalise. If it still does, turn autocorrect off in the keyboard settings.' : null,
			],
		}),
		listening: a => ({
			what: `Listen and fill ${a.n} gaps, one word or one number each. The recording doesn’t stop: when the next sentence starts, the last gap locks.`,
			tips: [
				'The computer test has no 10 minutes to copy answers over, only 2 minutes to check. Type as it plays.',
				'Write numbers as digits, like 7:15 or 42. Misspelt is wrong; capitals don’t matter.',
				'In the test you can go back to a gap. Here it locks, to practise keeping up.',
				'It plays once. Set your volume first.',
			],
		}),
		sentences: a => ({
			what: `Copy ${a.n} sentences of the kind you write in the test. Right letters turn green, wrong ones red; each moves on by itself.`,
			tips: [
				'Writing is two tasks, at least 150 and 250 words, in 60 minutes, all typed.',
				`At ${a.goal.wpm} words a minute, typing 400 words alone takes ${Math.round(400 / a.goal.wpm)} minutes.`,
				'Speed counts correct characters: 5 make a word.',
				a.phone ? 'On a phone only accuracy counts.' : 'Speed isn’t marked, but slow typing eats into thinking time.',
			],
		}),
		mock: a => ({
			what: `Copy ${a.part === 'The whole paragraph' ? 'a paragraph' : a.part.toLowerCase()}, about ${a.words} words, as in the test: only the time left and a word count show. You see what was wrong after you hand in.`,
			tips: [
				'No spellcheck, and no pasting.',
				'In the test the word count is at the bottom left of the box; here too.',
				'The clock starts at your first key. Check, then hand in; at the end of the time it hands in by itself.',
				a.phone ? `On a phone, just ${a.part.toLowerCase()}. On a computer you type all of it, closer to the test.` : null,
			],
		}),
	},
	lockedNote: k => `${k} stop${k === 1 ? '' : 's'} before this one not passed yet. You can still try this one first.`,
	passedNote: ['Passed already. ', 'Try again to beat your best.'],
	start: 'Start',
	again: 'Try again',
	skipAhead: 'Try it anyway',
	enterKey: 'Enter',
	tried: k => `${k} tr${k === 1 ? 'y' : 'ies'}`,
	best: text => `Best: ${text}`,
	bestCount: (_kind, score, total) => `${score}/${total} right`,
	bestSpeed: (wpm, acc) => `${wpm} words a minute · ${acc}% accuracy`,
	voiceLine: (voice, accent) => `Voice: ${voice} (${accent})`,
	accents: { us: 'American', uk: 'British', au: 'Australian' },
	changeVoice: 'Change',
	soundCheck: 'Sound check',
	speechOff: 'Recordings aren’t available right now. This stop will show captions instead.',

	exit: 'Leave this stop; this try isn’t counted',
	barRule: (k, rule) => `Stop ${k} · To pass: ${rule}`,
	tileAcc: 'Accuracy',
	tileWpm: 'Speed · wpm',
	tileProgress: 'Progress',
	goalAllRight: k => `${k} exactly right to pass`,
	goalRight: k => `${k} right to pass`,
	goalAcc: a => `${a}% or more`,
	goalWpm: w => `${w} or more`,
	goalPhoneWpm: 'Not counted on a phone',
	coveredRight: 'Right when covered',
	typeHere: 'Type here',
	clickToType: 'Click here to keep typing',
	copyAria: target => `Copy: ${target}`,
	underNumbers: 'Green is right, red is wrong. Red? Delete and fix it; fixed in time is not a mistake.',
	underSentences: 'Each sentence moves on when it’s typed. Red? Delete and fix it; fixed in time is not a mistake.',
	printed: 'Printed on the paper',
	ime: 'A Chinese keyboard is on. Press Shift for English: the test centre only has an English keyboard.',
	fullWidth: 'Chinese punctuation was typed and changed to English. The test centre has an English keyboard.',
	marksLabel: 'Each item, right or wrong',
	mark: (k, state) => `Item ${k}${state === 'ok' ? ', right' : state === 'bad' ? ', wrong' : state === 'now' ? ', current' : ''}`,
	sentenceNo: k => `Sentence ${k}`,

	phaseLook: '1 Copy',
	phaseCover: '2 Covered',
	underLook: 'Copy it once. The letters underlined in yellow are the ones people get wrong.',
	cover: 'Covered: type it from memory',
	underCover: 'Press Enter when done. Capitals don’t matter.',
	underCoverTouch: 'Press “OK” when done. Capitals don’t matter.',
	coverAria: meaning => `Type the English for “${meaning}” from memory`,
	confirm: 'OK',
	next: 'Next',
	right: 'Right',
	youTyped: 'You typed',
	youTypedLine: 'You typed: ',
	shouldBe: 'Spelling',
	memo: 'Remember',
	underWrong: 'Have a look, then press Enter for the next one.',
	underWrongTouch: 'Have a look, then press “Next”.',
	typeFirst: 'Type it first, then press OK.',
	hear: 'Hear it',
	missing: ch => `missing ${ch}`,

	preparing: (done, total) => `Getting the recording ready… ${done}/${total}`,
	captionsInstead: 'The recording isn’t ready, so this time it shows captions instead.',
	lookFirst: 'Look at the notes',
	playingRow: k => `Playing sentence ${k}`,
	nextSoon: 'Next sentence coming',
	lastGap: 'Last gap',
	startIn: s => `Starts in ${s} s`,
	nextIn: s => `Next sentence in ${s} s`,
	endIn: s => `Ends in ${s} s`,
	filled: 'Got it. Wait for the next sentence',
	caption: 'Caption: ',
	audioLost: 'The sound didn’t play, so captions take over.',
	notesLabel: 'Notes',

	timeLeft: 'Time left',
	wordsTile: 'Words',
	submit: 'Hand in',
	submitArmed: 'Not finished. Press again to hand in',
	source: 'The text · copy it',
	topic: t => `Topic: ${t}`,
	answerLabel: 'Your answer · the clock starts at your first key',
	wordsFoot: 'Words',
	noSpellcheck: 'No spellcheck',
	typedAll: 'All typed. Check it, then hand in.',
	noPaste: 'No pasting here: type it yourself.',
	timeUp: 'Time’s up: handed in.',

	resultAll: n => `All ${n} stops passed!`,
	resultLit: k => `Stop ${k} is lit`,
	resultAgain: 'Passed again',
	resultFail: 'Not quite',
	reasonCount: (kind, score, need) => ({
		copy: `${score} exactly right; ${need} needed`, spell: `${score} right when covered; ${need} needed`, listen: `${score} gaps right; ${need} needed`,
	}[kind]),
	reasonAcc: (a, need) => `Accuracy ${a}%; ${need}% needed`,
	reasonWpm: (w, need) => `Speed ${w} words a minute; ${need} needed`,
	reasonWpmPhone: w => `Speed ${w} words a minute (not counted on a phone)`,
	reasonCovered: (time, limit) => `Typed in ${time}; the limit is ${limit}`,
	reasonLeft: k => `Not finished: ${k} word${k === 1 ? '' : 's'} to go`,
	tileCount: { copy: 'Exactly right', spell: 'Right covered', listen: 'Gaps right' },
	tileSpeed: 'Speed',
	tileTime: 'Time',
	tileTypedTime: 'Typing time',
	wpmUnit: ' wpm',
	goalNeed: x => `${x} needed`,
	phonePass: 'Passed with phone targets. If you have a computer, try it there too: closer to the test.',
	level: 'This is practice for the computer test, not a score.',
	streak: k => `${k} tries in a row without passing. You can go on to the next stop and come back, or slow down and aim for accuracy first.`,
	lightLine: 'Light up the whole line',
	nextStop: stopName => `Next: ${stopName}`,
	retry: 'Try again',
	skipTo: k => `Go to stop ${k} first`,
	backToLine: 'Back to the line',
	reviewCopy: 'Item by item',
	reviewSpell: 'Typed with the word covered',
	reviewListen: 'Gap by gap',
	reviewSentences: 'Sentence by sentence',
	wrongPlace: 'Red marks the wrong place',
	wrongChars: k => `${k} wrong character${k === 1 ? '' : 's'}, in red`,
	youFilled: 'You wrote: ',
	blankGap: 'nothing',
	overLimit: 'over the word limit',
	recording: 'Recording: ',
	captionsUsed: 'This time it used captions.',
	spellTitle: 'Misspelt words',
	punctTitle: 'Punctuation or capitals',
	missedTitle: 'Words left out',
	extraTitle: 'Extra words',
	noneMisspelt: 'Nothing misspelt.',
	srRight: 'Right. ',
	srWrong: 'Wrong. ',
	miniLine: (k, total) => `${k} of ${total} stops passed`,

	doneEyebrow: (line, k, total) => `${line} · ${k}/${total}`,
	doneTitle: 'Your first line, all lit up',
	doneBody: (n, time) => `All ${n} stops passed, in ${time} of practice.`,
	doneWalk: 'You’ve typed everything the computer test asks for: numbers, spelling, typing as you listen, writing on the clock.',
	tileMockWpm: 'Mock speed',
	tileMockAcc: 'Mock accuracy',
	tileTries: 'Tries',
	timesUnit: '',
	donePhone: k => `${k} stop${k === 1 ? ' was' : 's were'} passed with phone targets. If you have a computer, try them there too: closer to the test.`,
	nextStep: 'NEXT',
	goListening: 'On to the listening line',
	placementBody: 'The first time, take the placement test, about 10 minutes. It puts you at the stop that suits you, and the ones before it light up.',
	placement: 'Take the placement test',
	backListening: 'Back to the listening line',
	placedBody: 'You’re already on the listening line: back to the map, and on from your stop.',
	placeAgain: 'Take the placement test again',
	toListeningMap: 'Back to the map',
	alsoLabel: 'Or: ',
	alsoBody: 'take the words and numbers you got wrong here to dictation practice.',
	toDictation: 'Dictation',
	terminalShort: 'End',
};

export const TYPING_TEXT = { zh, en };
export const typingLang: 'zh' | 'en' = learnLang;
export const typingLabels = TYPING_TEXT[typingLang];

// How a stop is passed, as its intro and its bar say it.
export function ruleText(stop: Stop, device: Device, goal: Goal): string {
	const L = typingLabels;
	if (stop.kind === 'copy') return stop.need != null ? L.ruleCount(stop.items.length, stop.need) : device === 'phone' ? L.ruleSpeedPhone(goal.acc) : L.ruleSpeed(goal.wpm, goal.acc);
	if (stop.kind === 'spell') return L.ruleSpell(stop.items.length, stop.need);
	if (stop.kind === 'listen') return L.ruleListen(stop.rows.length, stop.need);
	const plan = mockPlan(stop, device);
	return L.ruleMock(L.limit(plan.seconds), L.mockPart(device === 'phone', stop.phone.sentences), goal.acc);
}

// About how many minutes a stop takes on this device (the mock: its time limit).
export function stopMinutes(stop: Stop, device: Device): number {
	return stop.kind === 'mock' ? Math.max(1, Math.round(mockPlan(stop, device).seconds / 60)) : stop.minutes;
}

// A stop's intro: what it is and its tips.
export function introOf(stop: Stop, device: Device, touch: boolean, goal: Goal): { what: string; tips: string[] } {
	const L = typingLabels;
	const n = stop.kind === 'listen' ? stop.rows.length : stop.kind === 'mock' ? 0 : stop.items.length;
	const need = stop.kind === 'mock' || (stop.kind === 'copy' && stop.need == null) ? 0 : stop.need ?? 0;
	const phone = device === 'phone';
	const words = stop.kind === 'mock' ? Math.round(wordCount(mockPlan(stop, device).text) / 10) * 10 : 0;
	const part = stop.kind === 'mock' ? L.mockPart(phone, Math.min(stop.phone.sentences, sentencesOf(stop.text).length)) : '';
	const make = L.intros[stop.id] as ((a: IntroArgs) => Intro) | undefined;
	if (make == null) return { what: stop.blurb[typingLang], tips: [] };
	const intro = make({ n, need, phone, touch, goal, words, part });
	return { what: intro.what, tips: intro.tips.filter((t): t is string => t != null) };
}
