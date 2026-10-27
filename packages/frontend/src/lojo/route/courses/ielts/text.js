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
  lede: '四条线，每条 9 站，从 4.0 到 8.0。每一站是一道关：过了，才能挑战下一站；也可以越级挑战。',
  legal: '每一站标的是练习难度，不是官方分数。题目和录音都是原创的，和剑桥、British Council、IDP 没有关系。',
  lineRule: { 1: '录音只放一遍' },
 },
 en: {
  eyebrow: 'VIBES · IELTS · ROUTE MAP',
  title: 'IELTS',
  lede: 'Four lines, nine stops each, from 4.0 to 8.0. Every stop is a gate: pass it to take on the next, or jump ahead and try a harder one.',
  legal: 'Each stop shows a practice level, not an official score. Our questions and recordings are original and not affiliated with Cambridge, the British Council or IDP.',
  lineRule: { 1: 'the recording plays only once' },
 },
};
