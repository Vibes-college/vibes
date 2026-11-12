/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// The English-learning pages (the IELTS gates, 词汇站, 语法讲解, 0 号线, 听写, 生词本) speak Chinese whatever language the rest
// of the app is in: the learners are Chinese speakers learning English, and a page all in English loses them (founder,
// 2026-11-01; the route map does the same for English courses, pages/lojo/route.vue). Each page keeps its English copy.
export const learnLang: 'zh' | 'en' = 'zh';
