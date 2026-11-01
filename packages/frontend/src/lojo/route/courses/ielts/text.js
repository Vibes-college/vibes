/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* 雅思线路图：这门课特有的文字（闯关地图的通用界面文字在社区代码里，lojo/route/gate-strings.js）
   lineRule：闯关规则后面，这条线多说的一句（按线的编号）。听力的录音只放一遍，和真考一样。 */
export const TEXT = {
 zh: {
  eyebrow: 'Vibes · 雅思 · 线路图',
  title: '雅思',
  lede: '听说读写四条线，加上词汇、语法两条打底的线，每条 9 站，从 4.0 到 8.0。每一站是一道关：过了，才能挑战下一站；也可以越级挑战。',
  legal: '每一站标的是练习难度，不是官方分数。题目和录音都是原创的，和剑桥、British Council、IDP 没有关系。',
  lineRule: { 1: '录音只放一遍', 5: '每个词最多听 3 遍', 6: '交卷后一起对答案' },
 },
 en: {
  eyebrow: 'VIBES · IELTS · ROUTE MAP',
  title: 'IELTS',
  lede: 'Listening, reading, writing and speaking, plus two foundation lines for vocabulary and grammar: nine stops each, from 4.0 to 8.0. Every stop is a gate: pass it to take on the next, or jump ahead and try a harder one.',
  legal: 'Each stop shows a practice level, not an official score. Our questions and recordings are original and not affiliated with Cambridge, the British Council or IDP.',
  lineRule: { 1: 'the recording plays only once', 5: 'each word plays up to 3 times', 6: 'answers come after you hand in' },
 },
};

/* 第一次打开地图：先看整张图，一列小火车沿线开，底下一行字幕，从整体讲到每条线，最后说先做什么（创始人 2026-11-01，照原来 AP 线路图的导览）。
   字幕一句一屏，越短越好；线名带英文，学英语的人顺便认词。end 有三种：新来的、该做定级测试的、回来接着闯的；endNew 的分钟数照 0 号线自己的（content.js 的 WARMUP）。
   steps 是导览的顺序，地图照着演（lojo/route/gate-map.js）：all 看整张图；ride 小火车沿这条线从 4.0 开到 8.0；
   interchanges 四个换乘站依次亮；lines 这几条线依次亮（别的线变淡）；jump 演示越级：跳到第 5 站，前面的站跟着亮。 */
export const TOUR = {
 steps: [
  { do: 'all', say: 'intro' },
  { do: 'ride', say: 'l1', line: 1 },
  { do: 'interchanges', say: 'ix' },
  { do: 'lines', say: 'l2', lines: [2] },
  { do: 'lines', say: 'l34', lines: [3, 4] },
  { do: 'lines', say: 'l56', lines: [5, 6] },
  { do: 'jump', say: 'jump', line: 1 },
 ],
 zh: {
  wEye: '欢迎来到 Vibes · 雅思',
  wTitle: '30 秒看懂这张线路图',
  wText: '有哪几条线、怎么闯关、你先做什么，跟着小火车走一遍。',
  wGo: '开始',
  wSkip: '跳过，自己看',
  btn: '30 秒看懂这张线路图',
  btnS: '有哪几条线、怎么闯关、先做什么',
  intro: '这是雅思线路图：6 条线，每条 9 站，从 4.0 走到 8.0。',
  l1: '1 号线 · 听力 Listening。一站一道关：过了，下一站才亮。',
  ix: '两条线交叉的地方是换乘站：一道关，过了两条线一起亮。',
  l2: '2 号线 · 阅读 Reading：从通知、广告读到学术长文。',
  l34: '3 号线 · 写作 Writing、4 号线 · 口语 Speaking：题还在写，快开放了。',
  l56: '下面两条打底：5 号线 · 词汇 Vocabulary、6 号线 · 语法 Grammar。先看词表和讲解，再闯关。',
  jump: '觉得简单就越级挑战：过了，前面的站全部点亮。',
  endNew: (min, place) => `第一次来：先走 0 号线 · 机考打字，热身约 ${min} 分钟；${place ? '再做定级测试，直接放到适合你的站' : '再从第一站开始闯'}。`,
  endPlace: '下一步：做定级测试，直接放到适合你的站。',
  endBack: '从你在的这一站接着闯。',
  warm: '先走 0 号线',
  place: '做定级测试',
  go: s => `去 ${s}`,
  look: '自己看看',
  again: '再看一遍',
  skip: '跳过',
 },
 en: {
  wEye: 'Welcome to Vibes · IELTS',
  wTitle: 'The route map in 30 seconds',
  wText: 'Which lines there are, how the gates work and what to do first: ride along with the little train.',
  wGo: 'Start',
  wSkip: "Skip, I'll look around",
  btn: 'The route map in 30 seconds',
  btnS: 'The lines, the gates, what to do first',
  intro: 'This is the IELTS route map: 6 lines, 9 stops each, from 4.0 to 8.0.',
  l1: 'Line 1 · Listening. Every stop is a gate: pass it and the next one lights up.',
  ix: 'Where two lines cross is an interchange: one gate lights up both lines.',
  l2: 'Line 2 · Reading: from notices and adverts to long academic texts.',
  l34: 'Line 3 · Writing and line 4 · Speaking: questions on the way.',
  l56: 'Two foundation lines below: line 5 · Vocabulary and line 6 · Grammar. Study the words and lessons, then take the gate.',
  jump: 'Too easy? Jump ahead: pass a gate and every stop before it lights up.',
  endNew: (min, place) => `New here? Warm up on line 0, typing for the computer test, about ${min} minutes; ${place ? 'then the placement test puts you at the right stop' : 'then start from the first stop'}.`,
  endPlace: 'Next: the placement test puts you at the stop that suits you.',
  endBack: 'Carry on from your stop.',
  warm: 'Start with line 0',
  place: 'Take the placement test',
  go: s => `Go to ${s}`,
  look: "I'll look around",
  again: 'Watch again',
  skip: 'Skip',
 },
};
